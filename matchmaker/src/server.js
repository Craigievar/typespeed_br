const express = require('express');
const path = require('path');
const superagent = require('superagent');
const app = express();

app.use(express.json());

// Port is passed in by heroku
const port = process.env.PORT || 8081;

const rooms = [];
let waitingPlayers = [];
let flushPlayerTimeoutID = null;

app.post('/join', function(req, res) {
  const player = req.body;
  console.log('[matchmaker] Player join request: ', player);

  waitingPlayers.push({ player: req.body.player, response: res });

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
          response.json({
            event: 'game_created',
            server_url: 'localhost:8083',
          });
          response.set(200);
          response.end();
        });
      }, 10000);
  }

  // Inform all the waiting players that this person has joined the lobby
  waitingPlayers.forEach(({ response }) => {
    response.json({
      event: 'player_joined',
      player_name: player.name,
      player_count: waitingPlayers.length,
    });
  });
});

app.get('/ping', function(req, res) {
  console.log('[matchmaker] ping');

  res.json({
    ping: true
  });
});

app.listen(port);
