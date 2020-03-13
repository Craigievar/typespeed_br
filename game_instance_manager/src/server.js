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


// const setupAgones = async () => {
//   await agonesSDK.connect();
//
//   console.log('Marking as ready')
//   let result = await agonesSDK.ready();
// }

app.post('/create_game', function(req, res) {
  console.log('[game_instance_manager][requesting server]');
  const apiAddress = 'http://localhost:8001/apis/allocation.agones.dev/v1/namespaces/default/gameserverallocations';
  const apiVersion = 'allocation.agones.dev/v1';
  const apiKind = 'GameServerAllocation';
  const apiSpec = '{"required":{"matchLabels":{"agones.dev/fleet":"tsbr-fleet"}}}'
  const apiData = '{"apiVersion":"' + apiVersion + '","kind":"' + apiKind + '","spec":' + apiSpec + '}';
  const serverUrl = superagent
    .post(apiAddress)
    .set('Content-Type', 'application/json')
    .send(apiData)
    .then((createResponse) => {
      // console.log(json.stringify(createResponse));
      // console.log(createResponse);
      let address = createResponse.body.status.address + ':' + createResponse.body.status.ports[0].port;
      console.log('[game_instance_manager] sending back address: ' + address);
      res.json({
        server_url: address
      });
    })
    .catch((err) => {
      console.log('[game_instance_manager][Error]:' + JSON.stringify(err) + err.message);
    });


  // const serverUrl = superagent
  //   .post(`10.51.240.2/makeAndFetchGameServer`)
  //   .send({})
  //   .then((createResponse) => {
  //     console.log('[game_instance_manager] sending back address: ' + createResponse.body.server_url)
  //     res.json({
  //       server_url: createResponse.body.server_url,
  //     });
  //   })
    // .catch((err) => {
    //   console.log('[game_instance_manager][Error]:' + JSON.stringify(err) + err.message);
    // });
  // res.json({
  //   server_url: '35.227.152.188:7030'
  // });
});

app.get('/ping', function(req, res) {
  req.logger.info('test!');
  res.json({
    ping: true,
  });
});

app.listen(port);
