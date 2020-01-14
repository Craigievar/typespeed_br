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

const MIN_PLAYERS = 2;

app.use(express.json());
app.use(cors());

// Port is passed in by heroku
const port = process.env.PORT || 8081;
console.log("[Matchmaker] Connecting people to " + process.env.GAME_INSTANCE_MANAGER_SERVICE)

const rooms = [];
let waitingPlayers = [];
let flushPlayerTimeoutID = null;
let currentMatchID = uuid();

io.on('connection', function(socket) {
  console.log('[matchmaker][player connected]');
  const player = { ready: false, socket_id: socket.id, match_id: null };
  const joinedMatchID = currentMatchID;
  waitingPlayers.push(player);

  socket.on('disconnect', function() {
    waitingPlayers = waitingPlayers.filter(p => p !== player);

    // If a player leaving the queue makes it ineligible to request a match,
    // then cancel the countdown for match requesting.
    const readyPlayers = waitingPlayers.filter(p => p.ready);
    if (readyPlayers.length < MIN_PLAYERS) {
      clearTimeout(flushPlayerTimeoutID);

      if (player.match_ids) {
        io.in(player.match_id).emit('game_creation_cancelled');
      }
    }
  });

  socket.on('name', function(name) {
    // Join the match room for the socket, now that they are readied up
    socket.join(currentMatchID);
    player.match_id = currentMatchID;
    player.name = name;
    player.ready = true;

    console.log('[matchmaker] Player join request: ', player);

    const readyPlayers = waitingPlayers.filter(p => p.ready);
    if (readyPlayers.length >= MIN_PLAYERS) {
      io.in(player.match_id).emit('requesting_game');

      flushPlayerTimeoutID =
        flushPlayerTimeoutID ||
        setTimeout(async () => {
          const playersToJoin = waitingPlayers.filter(p => p.ready);

          // Reset the matchmaking state
          currentMatchID = uuid();
          waitingPlayers = waitingPlayers.filter(p => !p.ready);
          flushPlayerTimeoutID = null;

          console.log('[matchmaker] Requesting game creation from ', `http://${process.env.GAME_INSTANCE_MANAGER_SERVICE_HOST}:${process.env.GAME_INSTANCE_MANAGER_SERVICE_PORT}/create_game`);
          const serverUrl = await superagent
            .post(`${process.env.GAME_INSTANCE_MANAGER_SERVICE}/create_game`)
            .send({ num_players: playersToJoin.length });

          // Notify everyone that a match has been succesfully created
          io.in(player.match_id).emit('game_created', { server_url: serverUrl.body.server_url });
        }, 100);
    }

    // Inform all the waiting players that this person has joined the lobby
    io.in(player.match_id).emit('player_joined', {
      player_name: player.name,
      player_count: waitingPlayers.length,
      players_needed: MIN_PLAYERS,
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
