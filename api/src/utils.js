// // @flow
//
// // import Node from './types';
//
//
// class Node {
//   // name: String;
//   // externalAddress: String;
//   // internalAddress: String;
//
//   constructor(nodeJSON) {
//     this.name = nodeJSON.metadata.name;
//     this.externalAddress = nodeJSON.status.addresses[1].address;
//     this.internalAddress = nodeJSON.status.addresses[0].address;
//   }
//
//   getName() {
//     return this.name;
//   }
//
//   print() {
//     return this.name + '\r\n' + this.externalAddress + '\r\n' + this.internalAddress;
//   }
// }
//
// function parseNodeInfo(response) {
//   console.log('[API][NodeInfo] in function');
//   //const parsed = JSON.parse(response);
//   try {
//     const output = [];
//     console.log('[API][NodeInfo] Parsing');
//     const items = response.response.body.items;
//     console.log('[API][NodeInfo] Looping');
//     items.forEach(function(item){
//       console.log('[API][NodeInfo] Making Item');
//       const tmp = new Node(item);
//       console.log('[API][NodeInfo] Saving Item');
//       output.push(tmp);
//     });
//   }
//   catch(err) {
//     console.log('[API][NodeInfo][ParseError]:' + err.message);
//   }
//   return output;
// }
//
// export default parseNodeInfo;
