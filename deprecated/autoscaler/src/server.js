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

function calculateGap(nodes, pods){
  console.log('[AutoScaler][Calculating Gap]')
  let available = nodes.length * parseInt(process.env.SERVERS_PER_NODE);
  console.log('[AutoScaler][Available] ' + available);
  let needed = pods.length + parseInt(process.env.BUFFER_SIZE);
  console.log('[AutoScaler][Needed] ' + needed);
  console.log('[AutoScaler][Calculated] ' + ((available - needed)));
  return(available - needed);
}

async function getGameServerNodes(){
  k8sApi.listNode().then((res) => {
    console.log('[AutoScaler][Got nodes]' + res);

    let tmp = [];

    nodes = res.response.body.items;
    nodes.forEach((node) => {
      console.log(node.metadata.name + ' has role ' + node.metadata.labels.role)
      if(node.metadata.labels.role === 'game-server'){
        tmp.push(node);
      }
    });
    // filter nodes to game-server-tagged nodes
    console.log('[AutoScaler][Returning Nodes]');
    console.log(tmp);
    return(tmp);
  })
  .catch((err) => {
    console.log('[AutoScaler][Get Nodes][API Error]: ' + JSON.stringify(err) + err.message);
  });
}

async function getGameServerPods(){
  k8sApi.listPodForAllNamespaces().then((res) => {
    console.log('[AutoScaler][Got pods]');

    let tmp = [];

    pods = res.response.body.items;
    pods.forEach((pod) => {
      if(pod.spec.nodeSelector){
        console.log(pod.metadata.name + ' has role ' + pod.spec.nodeSelector.role);
        if(pod.spec.nodeSelector.role === 'game-server'){
          tmp.push(pod);
        }
      }
    });
    // filter nodes to game-server-tagged nodes
    console.log('[AutoScaler][Returning Pods]');
    console.log(tmp);
    return(tmp);
  })
  .catch((err) => {
    console.log('[AutoScaler][Get Pods][API Error]: ' + JSON.stringify(err) + err.message);
  });
}

function makeNodeTemplate(thisPort) {
  var pod = {
    apiVersion: 'v1',
    kind: 'Node',
    metadata: {
      generateName: 'auto-scaled-node-',
      labels: {
        role: 'game-server',
      }
    },
    spec: {
      unschedulable: false,
    },
    status: {
    }
  };

  return(pod);
}

async function scaleNodes(){
  console.log('[Autoscaler][Get Nodes and Pods]');

  // let nodes = await getGameServerNodes();
  // let pods = await getGameServerPods();
  k8sApi.listNode().then((res) => {
    console.log('[AutoScaler][Got nodes]' + res);

    let nodes = [];

    nodeJSON = res.response.body.items;
    nodeJSON.forEach((node) => {
      console.log(node.metadata.name + ' has role ' + node.metadata.labels.role)
      if(node.metadata.labels.role === 'game-server'){
        nodes.push(node);
      }
    });
    // filter nodes to game-server-tagged nodes
    console.log('[AutoScaler][Returning Nodes]');
    console.log(nodes);

    k8sApi.listPodForAllNamespaces().then((res) => {
      console.log('[AutoScaler][Got pods]');

      let pods = [];

      podJSON = res.response.body.items;
      podJSON.forEach((pod) => {
        if(pod.spec.nodeSelector){
          console.log(pod.metadata.name + ' has role ' + pod.spec.nodeSelector.role);
          if(pod.spec.nodeSelector.role === 'game-server'){
            pods.push(pod);
          }
        }
      });
      // filter nodes to game-server-tagged nodes
      console.log('[AutoScaler][Returning Pods]');
      console.log(pods);

      console.log('[Autoscaler][Iteration]');
      let serverGap = calculateGap(nodes, pods);
      console.log('[AutoScaler][Status] Node count is ' + nodes.length);
      console.log('[AutoScaler][Status] Server count is ' + pods.length);
      console.log('[AutoScaler][Calculating] Server gap is ' + serverGap);
      if (serverGap > 0) {
        console.log('[AutoScaler][Calculating] Making a Node')
        nodeTemplate = makeNodeTemplate();
        k8sApi.createNode(nodeTemplate).then((res) => {
          console.log('[AutoScaler][Creating Node] ' + res);
        })
        .catch((err) => {
          console.log('[AutoScaler][Creating Node][Error]: ' + JSON.stringify(err) + err.message);
        });
      }
    })
    .catch((err) => {
      console.log('[AutoScaler][Pods][Error]: ' + JSON.stringify(err) + err.message);
    });
  })
  .catch((err) => {
    console.log('[AutoScaler][Nodes][Error]: ' + JSON.stringify(err) + err.message);
  });

  // getGameServerNodes().then((nodes) => {
  //   getGameServerPods().then((pods) => {
  //     console.log('[Autoscaler][Iteration]');
  //     console.log(pods);
  //     console.log(nodes);
  //     let serverGap = calculateGap(nodes, pods);
  //     console.log('[AutoScaler][Status] Node count is ' + nodes.length);
  //     console.log('[AutoScaler][Status] Server count is ' + pods.length);
  //     console.log('[AutoScaler][Calculating] Server gap is ' + serverGap);
  //     if (serverGap > 0) {
  //       nodeTemplate = makeNodeTemplate();
  //       for (i = 0; i < serversNeeded; i++) {
  //         k8sApi.createNode(nodeTemplate).then((res) => {
  //           console.log('[AutoScaler][Creating Node] ' + res);
  //         })
  //         .catch((err) => {
  //           console.log('[AutoScaler][Creating Node][Error]: ' + JSON.stringify(err) + err.message);
  //         });
  //       }
  //     }
  //   })
  //   .catch((err) => {console.log(err.message)});
  // })
  // .catch((err) => {console.log(err.message)});;


  //array of cordoned node names
  // let cordonedNodes = calculate_cordoned(nodes) // [nodename]
  // let uncordonedNodes = calculate_uncordoned(nodes) // [nodename]
  // let serverGap = await calculateGap(nodes, pods);
  // console.log('[AutoScaler][Status] Node count is ' + nodes.length);
  // console.log('[AutoScaler][Status] Server count is ' + pods.length);
  // console.log('[AutoScaler][Calculating] Server gap is ' + serverGap);
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

  // if (serverGap > 0) {
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
    //
    // if (serverGap > 0 || pods.length < process.env.MIN_SERVERS) {
    //   // no cordoned nodes to uncordon, or it didn't free up enough space
    //   // make X nodes
    //   nodeTemplate = makeNodeTemplate();
    //   for (i = 0; i < serversNeeded; i++) {
    //     k8sApi.createNode(nodeTemplate).then((res) => {
    //       console.log('[AutoScaler][Creating Node] ' + res);
    //     })
    //     .catch((err) => {
    //       console.log('[AutoScaler][Creating Node][Error]: ' + JSON.stringify(err) + err.message);
    //     });
    //   }
    // }
  // }
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
}, parseInt(process.env.REFRESH_SECONDS)*1000.0);
