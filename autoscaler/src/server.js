// @flow

const path = require('path');
const k8s = require('@kubernetes/client-node');
const request = require('request');
const kc = new k8s.KubeConfig();
kc.loadFromDefault();
const k8sApi = kc.makeApiClient(k8s.CoreV1Api);
// const utils = require('./utils');

// Port is passed in by heroku
const port = process.env.PORT || 8085;

function calculateGap(nodes, pods, buffer){
  let available = nodes.length * process.env.SERVERS_PER_NODE;
  let needed = pods.length + process.env.BUFFER_SIZE;
  return(available - needed);
}

async function getGameServerNodes(){
  k8sApi.listNode().then((res) => {
    console.log('[AutoScaler][Got nodes]' + res);

    let tmp = [];

    nodes = res.response.body.items;
    nodes.forEach((node) => {
      console.log(node.metadata.name + ' has role ' + node.metadata.labels.role)
      if(node.metadata.labels.role === 'game_server'){
        tmp.push(node);
      }
    });
    // filter nodes to game-server-tagged nodes
    return(tmp);
  })
  .catch((err) => {
    console.log('[AutoScaler][Get Nodes][API Error]: ' + JSON.stringify(err) + err.message);
  });
}

function getGameServerPods(){
  k8sApi.listPodForAllNamespaces().then((res) => {
    console.log('[AutoScaler][Got pods]' + res);

    let tmp = [];

    pods = res.response.body.items;
    pods.forEach((pod) => {
      if(pod.spec.nodeSelector){
        console.log(pod.metadata.name + ' has role ' + pod.spec.nodeSelector.role);
        if(pod.spec.nodeSelector.role === 'game_server'){
          tmp.push(pod);
        }
      }
    });
    // filter nodes to game-server-tagged nodes
    return(tmp);
  })
  .catch((err) => {
    console.log('[AutoScaler][Get Pods][API Error]: ' + JSON.stringify(err) + err.message);
  });
}

function makeNodeTemplate(thisPort) {
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

function scaleNodes(){
  console.log('[Autoscaler][Get Nodes and Pods]');
  let nodes = await getGameServerNodes();
  let pods = await getGameServerPods();

  console.log('[Autoscaler][Iteration]');
  //array of cordoned node names
  // let cordonedNodes = calculate_cordoned(nodes) // [nodename]
  // let uncordonedNodes = calculate_uncordoned(nodes) // [nodename]
  let serverGap = calculateGap(nodes, pods, buffer);
  console.log('[AutoScaler][Status] Node count is ' + nodes.length);
  console.log('[AutoScaler][Status] Server count is ' + pods.length);
  console.log('[AutoScaler][Calculating] Server gap is ' + serverGap);
  // delete already-cordoned nodes which have emptied
  // cordonedNodes.forEach(([nodeName, podCount]) => {
  //   if(podCount == 0) {
  //     k8sApi.deleteNode(nodeName).then((res) => {
  //       console.log('[AutoScaler][Deleting Empty Node] ' + nodeName);
  //     })
  //     .catch((err) => {
  //       console.log('[AutoScaler][Deleting Empty Node][Error]: ' + JSON.stringify(err) + err.message);
  //     });
  //   }
  // });
  //TODO: remove them from cordoned node list

  if (serverGap > 0) {
    // let uncordonedSpace = 0;
    //
    // if (cordonedNodes.length > 0) {
    //   //sort nodes
    //   //identify best X to cordon
    //   uncordonTargets = getNFullestNodes(cordonedNodes, serverGap);
    //   uncordonedSpace = getTotalSpace(uncordonTargets);
    //   uncordonTargets.forEach((nodeName) => {
    //     cordonOrUncordonNode(nodeName, true).then((res) => {
    //       console.log('[AutoScaler][Uncordoning Node] ' + nodeName);
    //     })
    //     .catch((err) => {
    //       console.log('[AutoScaler][Uncordoning Node][Error]: ' + JSON.stringify(err) + err.message);
    //     });
    //   });
    // }

    // serverGap = serverGap - uncordonedSpace;

    if (serverGap > 0 || pods.length < process.env.MIN_SERVERS) {
      // no cordoned nodes to uncordon, or it didn't free up enough space
      // make X nodes
      nodeTemplate = makeNodeTemplate();
      for (i = 0; i < serversNeeded; i++) {
        k8sApi.createNode(nodeTemplate).then((res) => {
          console.log('[AutoScaler][Creating Node] ' + res);
        })
        .catch((err) => {
          console.log('[AutoScaler][Creating Node][Error]: ' + JSON.stringify(err) + err.message);
        });
      }
    }
  }
  // else if (serverGap < 0){
  //   if(uncordonedNodes.length > 0 && pods.length > process.env.MIN_SERVERS) {
  //     cordonTargets = getNEmptiestNodes(uncordonedNodes, serverGap);
  //     cordonTargets.forEach((nodeName) => {
  //       cordonOrUncordonNode(nodeName, false).then((res) => {
  //         console.log('[AutoScaler][Cordoning Node] ' + nodeName);
  //       })
  //       .catch((err) => {
  //         console.log('[AutoScaler][Cordoning Node][Error]: ' + JSON.stringify(err) + err.message);
  //       });
  //     });
  //   }
  // }
}

setInterval(function() {
  scaleNodes();
}, process.env.REFRESH_SECONDS/1000.0);
