// @flow
/*
  Basically, we want to refactor win checks, etc.
  out of player actions (just update to track state there)
*/

const AgonesSDK = require('@google-cloud/agones-sdk');
let agonesSDK = new AgonesSDK();

const express = require('express');
const http = require('http');

const app = express();
const server = http.Server(app); // eslint-disable-line new-cap

const path = require('path');



const setupAgones = async () => {
  await agonesSDK.connect();

  setInterval(() => {
    console.log('send health ping: ' + Date.now().toString());
    agonesSDK.health();
  }, 2000);

  console.log('Marking as ready')
  let result = await agonesSDK.ready();

  // console.log('Timeout for shutdown')
  // setTimeout(() => {
  //   console.log('Shutting down after 300 seconds...');
  //   agonesSDK.shutdown();
  //   console.log('...marked for Shutdown');
  // }, 300000);
  //
  // console.log('Timeout for close')
  // setTimeout(() => {
  //     agonesSDK.close();
  // }, 390000);
  //
  // console.log('Timeout for exit')
  // setTimeout(() => {
  //   process.exit(0);
  // }, 3100000);
}

console.log('Setting up agones')
setupAgones();
// Emit gamestate to players

app.get('/', function (req, res) {
console.log('got ping');
 return res.send('pong');
});


app.get('/ping', function (req, res) {
console.log('got ping');
 return res.send('pong');
});

const port = process.env.PORT || 7030;
app.set('port', port);
// app.listen(port);

// Start the server.
server.listen(port, function() {
  console.log('[game_server]', 'Starting server on port ' + (port));
});

setInterval(() => {
  console.log('Server chilling');
}, 10000);
