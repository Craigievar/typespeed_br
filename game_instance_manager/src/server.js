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
  console.log('[game_instance_manager][requesting server]');
  const serverUrl = superagent
    .post(`10.51.240.2/makeAndFetchGameServer`)
    .send({})
    .then((createResponse) => {
      console.log('[game_instance_manager] sending back address: ' + createResponse.body.server_url)
      res.json({
        server_url: createResponse.body.server_url,
      });
    })
    .catch((err) => {
      console.log('[game_instance_manager][Error]:' + JSON.stringify(err) + err.message);
    });
});

app.get('/ping', function(req, res) {
  req.logger.info('test!');
  res.json({
    ping: true,
  });
});

app.listen(port);
