const express = require('express');
const path = require('path');
const app = express();
const k8s = require('@kubernetes/client-node');
const request = require('request');
const kc = new k8s.KubeConfig();
kc.loadFromDefault();
const k8sApi = kc.makeApiClient(k8s.CoreV1Api);

// Port is passed in by heroku
const port = process.env.PORT || 8084;

//app.use(express.static(path.join(__dirname, 'build')));

app.get('/', function(req, res) {
  console.log("[API][Status] Sending index.html");
  res.send(`<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <link rel="shortcut icon" href="%PUBLIC_URL%/favicon.ico" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="theme-color" content="#000000" />
      <!--
        manifest.json provides metadata used when your web app is installed on a
        user's mobile device or desktop. See https://developers.google.com/web/fundamentals/web-app-manifest/
      -->
      <link rel="manifest" href="%PUBLIC_URL%/manifest.json" />
      <link href="https://fonts.googleapis.com/css?family=Roboto+Mono&display=swap" rel="stylesheet">
      <!--
        Unlike "/favicon.ico" or "favicon.ico", "%PUBLIC_URL%/favicon.ico" will
        work correctly both with client-side routing and a non-root public URL.
        Learn how to configure a non-root public URL by running
      -->
      <title>React App</title>
    </head>
    <body>
      <p>getGameServer: get game servers</p>
      <p>makeGameServer: makes a game server, and reports back on its info</p>
      <p>getMMServer</p>
      <p>getGIMServer</p>
    </body>
  </html>
`);
});

app.get('/getNodes/', function(req, res) {
  console.log("[API][Status] Getting and sending node info");
  k8sApi.listNode().then((res2) => {
    console.log('[API][Got nodes]');
    res.send(res2);
  })
  .catch((err) => {
    console.log('[API][ERROR]: ' + JSON.stringify(err));
  });
});

app.get('/getPods/', function(req, res) {
  console.log("[API][Status] Getting and sending pod info");
  k8sApi.listPodForAllNamespaces().then((res2) => {
    console.log('[API][Got pods]');
    res.send(res2);
  })
  .catch((err) => {
    console.log('[API][ERROR]: ' + JSON.stringify(err));
  });
});

app.get('/getServices/', function(req, res) {
  console.log("[API][Status] Getting and sending pod info");
  k8sApi.listServiceForAllNamespaces().then((res2) => {
    console.log('[API][Got services]');
    res.send(res2);
  })
  .catch((err) => {
    console.log('[API][ERROR]: ' + JSON.stringify(err));
  });
});

app.listen(port, () => console.log('[API]] listening on port ' + process.env.PORT || 8084 + '!'));


// <p>getGameServer: get game servers</p>
// <p>makeGameServer: makes a game server, and reports back on its info</p>
// <p>getMMServer</p>
// <p>getGIMServer</p>
