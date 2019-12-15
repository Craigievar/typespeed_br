const express = require('express');
const cors = require('cors');
const path = require('path');
const superagent = require('superagent');
const app = express();
const http = require('http');
const socketIO = require('socket.io');
const uuid = require('tiny-uuid');

const server = http.Server(app); // eslint-disable-line new-cap
const io = socketIO(server);

app.use(express.json());
app.use(cors());

// Port is passed in by heroku
const port = process.env.PORT || 8081;

const rooms = [];
let waitingPlayers = [];
let flushPlayerTimeoutID = null;
let currentMatchID = uuid();

io.on('connection', function(socket) {
  const player = { ready: false, socket_id: socket.id };
  const joinedMatchID = currentMatchID;
  waitingPlayers.push(player);
  socket.join(joinedMatchID);

  socket.on('disconnect', function() {
    waitingPlayers = waitingPlayers.filter(p => p !== player);

    // If a player leaving the queue makes it ineligible to request a match,
    // then cancel the countdown for match requesting.
    if (waitingPlayers.length < 2) {
      clearTimeout(flushPlayerTimeoutID);
      io.in(joinedMatchID).emit('game_creation_cancelled');
    }
  });

  socket.on('name', function(name) {
    player.name = name;
    player.ready = true;

    console.log('[matchmaker] Player join request: ', player);

    if (waitingPlayers.length >= 2) {
      io.in(joinedMatchID).emit('requesting_game');

      flushPlayerTimeoutID =
        flushPlayerTimeoutID ||
        setTimeout(async () => {
          const playersToJoin = waitingPlayers.slice();

          // Reset the matchmaking state
          currentMatchID = uuid();
          waitingPlayers = [];

          const serverUrl = await superagent
            .post(
              `http://${process.env.GAME_INSTANCE_MANAGER_SERVICE_HOST}:${process.env.GAME_INSTANCE_MANAGER_SERVICE_HOST}/create_game`
            )
            .send({ num_players: playersToJoin.length });

          // Notify everyone that a match has been succesfully created
          io.in(joinedMatchID).emit('game_created', { server_url: serverUrl });
        }, 10000);
    }

    // Inform all the waiting players that this person has joined the lobby
    io.in(joinedMatchID).emit('player_joined', {
      player_name: player.name,
      player_count: waitingPlayers.length,
      players_needed: 2,
    });
  });
});

app.get('/ping', function(req, res) {
  res.json({
    ping: true,
  });
});

// app.listen(port);
server.listen(port, function() {
  console.log('Starting server on port' + (port));
});
