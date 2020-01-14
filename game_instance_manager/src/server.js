const express = require('express');
const path = require('path');
const superagent = require('superagent');
const app = express();
const bunyan = require('bunyan');
const request = require('request');

const logger = bunyan.createLogger({
  name: 'game_instance_manager',
});

app.use((req, res, next) => {
  req.logger = logger.child({ request_id: req.req_id });
  req.logger.info(
    `${req.method} ${req.url}: ${JSON.stringify(req.body || {}, null, 2)}`
  );

  next();
});
app.use(express.json());

// Port is passed in by heroku
const port = process.env.PORT || 8082;

app.post('/create_game', function(req, res) {
  // request('10.0.0.1/makeAndFetchGameServer', function (error, response, body) {
  request('10.0.0.1/', function (error, response, body) {
    if (!error && response != 'err') {
      console.log('[game_instance_manager]: Server on ' + response);
      res.json({
        server_url: response,
      });
    }
  })
  // console.log('[game_instance_manager]: Server on ' +
  //   `${process.env.GAME_SERVER_SERVICE_HOST}:${process.env.GAME_SERVER_SERVICE_PORT}`);
  // res.json({
  //   server_url: process.env.GAME_SERVER_SERVICE,
  // });
});

app.get('/ping', function(req, res) {
  req.logger.info('test!');
  res.json({
    ping: true,
  });
});

app.listen(port);
