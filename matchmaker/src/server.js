const express = require('express');
const cors = require('cors');
const path = require('path');
const superagent = require('superagent');
const app = express();
const http = require('http');
const socketIO = require('socket.io');

const server = http.Server(app); // eslint-disable-line new-cap
const io = socketIO(server);

app.use(express.json());
app.use(cors());

// Port is passed in by heroku
const port = process.env.PORT || 8081;

const rooms = [];
let waitingPlayers = [];
let flushPlayerTimeoutID = null;

io.on('connection', function(socket) {
  socket.on('new player', function() {
    const room = socket.handshake.query.room ?
      socket.handshake.query.room.toString() : '0';
    console.log(room);
    socket.join(room);
    playerRoomMap[socket.id] = room;
    if(!gamesOnServer[room]){
      gamesOnServer[room] = newGame(room);
    }
    gamesOnServer[room].players[socket.id] = newPlayer(socket.id, room);
  });

  socket.on('disconnect', function() {
    console.log('deleting ' + socket.id + ' from room ' + playerRoomMap[socket.id]);
    const room = playerRoomMap[socket.id];
    if (gamesOnServer[room]) {
      delete gamesOnServer[room].players[socket.id];
      delete playerRoomMap[socket.id];
      if (numPlayers(gamesOnServer[room]) <= 0) {
        setTimeout(function() {
          delete gamesOnServer[room];
          console.log('deleting game ' + room);
        }, 3000);
      }
    }
  });

  socket.on('name', function(data) {
    const player = req.body;
    console.log('[matchmaker] Player join request: ', player);

    waitingPlayers.push({ player, response: res });

    if (waitingPlayers.length >= 2) {
      flushPlayerTimeoutID =
        flushPlayerTimeoutID ||
        setTimeout(async () => {
          const playersToJoin = waitingPlayers.slice();
          waitingPlayers = [];

          const serverUrl = await superagent
            .post(
              `http://${process.env.GAME_INSTANCE_MANAGER_SERVICE_HOST}:${process.env.GAME_INSTANCE_MANAGER_SERVICE_HOST}/create_game`
            )
            .send({ num_players: playersToJoin.length });

          // Write out a successful game_created message to all players that
          // will be joining the game, along with
          playersToJoin.forEach(({ response }) => {
            response.write(JSON.stringify({
              event: 'game_created',
              server_url: 'localhost:8083',
            }));
            response.set(200);
            response.end();
          });
        }, 10000);
    }

    // Inform all the waiting players that this person has joined the lobby
    waitingPlayers.forEach(({ response }) => {
      response.write(JSON.stringify({
        event: 'player_joined',
        player_name: player.name,
        player_count: waitingPlayers.length,
      }));
    });
  });

});

app.get('/ping', function(req, res) {
  res.json({
    ping: true
  });
});

app.listen(port);
