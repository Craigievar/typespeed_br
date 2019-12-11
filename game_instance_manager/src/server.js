const express = require('express');
const path = require('path');
const superagent = require('superagent');
const app = express();

app.use(express.json());

// Port is passed in by heroku
const port = process.env.PORT || 8082;

app.post('/create_game', function(req, res) {
  console.log('[game_instance_manager] Create game request: ', req.body);

  response.json({
    server_url: 'http://localhost:8083',
  });
  response.set(200);
  response.end();
});

app.listen(port);
