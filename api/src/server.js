// @flow

const express = require('express');
const path = require('path');
const app = express();
const k8s = require('@kubernetes/client-node');
const request = require('request');
const kc = new k8s.KubeConfig();
kc.loadFromDefault();
const k8sApi = kc.makeApiClient(k8s.CoreV1Api);
// const utils = require('./utils');

// Port is passed in by heroku
const port = process.env.PORT || 8084;

const maxRetries = 5;
const retryBackOffRate = 2;

function sleep (time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

async function getNodeName(name){
  const podData = await k8sApi.readNamespacedPod(name, 'default');
  console.log('[API][Node Name] ' + podData.body.spec.nodeName);
  return podData.body.spec.nodeName;
}

function incr(n){
  return (n + 1);
}

async function getNodeInfo(name){
  let currentRetry = 0;

  var currentRetryFn = function(){
    console.log('[API][Retry Count][Increment]');
    currentRetry++;
  };

  console.log('[API][Retry Count] ' + currentRetry);
  let node = null;
  do {
    node = await getNodeName(name);
    console.log('[API][Node Name]' + node);
    sleep(1000).then(
      currentRetryFn
    );
    console.log('[API][Retry Count] ' + currentRetry);
  }
  while(!node && currentRetry < maxRetries);

  return node;
}


function makePod(thisPort) {
  var pod = {
    apiVersion: 'v1',
    kind: 'Pod',
    metadata: {
      generateName: 'game-server-' + thisPort.toString() + '-'
    },
    spec: {
      hostNetwork: true,
      restartPolicy: 'Never',
      nodeSelector: {'role': 'game-server'},
      containers: [
        {
          name: 'game-server',
          image: 'gcr.io/tsbr-cluster-demo/game-server:v0',
          imagePullPolicy: 'Always',
          env:
            [
              {
                name: 'SESSION_NAME',
                value: 'game-server-' + thisPort.toString()
              },
              {
                name: 'PORT',
                value: thisPort.toString()
              }
            ],
          ports:
            [
              {
                containerPort: thisPort,
                hostPort: thisPort,
              }
            ],
        }
      ]
    },
    status: {
    }
  };

  return(pod);
}

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
    nodes = res2.response.body.items;
    let tmpstr = '';
    nodes.forEach((node) => {
      tmpstr = tmpstr + node.metadata.name + ' has role ' + node.metadata.labels.role + '     ';
    });
    res.send(tmpstr);
  })
  .catch((err) => {
    console.log('[API][ERROR]: ' + err.message);
  });
});

app.get('/getPods/', function(req, res) {
  console.log("[API][Status] Getting and sending pod info");
  k8sApi.listPodForAllNamespaces().then((res2) => {
    pods = res2.response.body.items;
    let tmpstr = '';
    pods.forEach((pod) => {
      if(pod.spec.nodeSelector){
        tmpstr = tmpstr + pod.metadata.name + ' has role ' + pod.spec.nodeSelector.role + '     ';
      }
    });
    res.send(tmpstr);
  })
  .catch((err) => {
    console.log('[API][ERROR]: ' + JSON.stringify(err) + err.message);
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

app.get('/makePodAtPort/', function(req, res) {
  console.log("[API][makePod] Making a Pod");
  const thisPort = parseInt(req.query.port) || 8080;
  console.log("[API][makePod] Pod will be at port " + thisPort);

  var pod = makePod(thisPort);

  k8sApi.createNamespacedPod(
    'default',
    pod,
  ).then((res2) => {
    console.log('[API][Pod Sent. Crossing Fingers!]');
    //res.send('Attempted to create pod on port ' + thisPort);
    try{
      res.send(res2.response.body.metadata.name);
    }
    catch{
      res.send('err');
    }

  })
  .catch((err) => {
    console.log('[API][ERROR]: ' + JSON.stringify(err));
  });
});

app.post('/makeAndFetchGameServer/', function(req, res) {
  console.log("[API][makePod] Setting up a new game server");
  const thisPort = 7000 + Math.floor(Math.random() * 999);
  // TODO: check port isn't taken
  console.log("[API][makePod] Pod will be at port " + thisPort);

  var pod = makePod(thisPort);

  k8sApi.createNamespacedPod(
    'default',
    pod,
  ).then((createRes) => {
    console.log('[API][Pod Requested]');
    return(createRes.response.body.metadata.name);
  })
  .catch((err) => {
    console.log('[API][ERROR[makePod]: ' + JSON.stringify(err) + err.message);
  })
  .then((name) => {
    console.log('[API][Listing Pods] ' + name);

    getNodeInfo(name)
    .then((node) => {
      console.log('[API][Listing Nodes] ' + node);
      k8sApi.readNode(node)
      .then((readNodeRes) => {
        const thisIP = readNodeRes.response.body.status.addresses[1].address;
        console.log('[API][Send Address] ' + thisIP + ':' + thisPort);
        res.json({
          server_url: thisIP + ':' + thisPort,
        });
        //res.send(readNodeRes.status.addresses[1]);
      })
      .catch((err) => {
        console.log('[API][ERROR][readNode]: ' + JSON.stringify(err) + err.message);
      });
    })
    .catch((err) => {
      console.log('[API][ERROR]: ' + JSON.stringify(err) + err.message);
    });
  })
  .catch((err) => {
    console.log('[API][ERROR]: ' + JSON.stringify(err) + err.message);
  });
});




app.listen(port, () => console.log('[API]] listening on port ' + process.env.PORT || 8084 + '!'));


// <p>getGameServer: get game servers</p>
// <p>makeGameServer: makes a game server, and reports back on its info</p>
// <p>getMMServer</p>
// <p>getGIMServer</p>

// createNamespacedPod