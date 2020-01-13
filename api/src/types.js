// // @flow
//
// class Node {
//   name: string;
//   externalAddress: string;
//   internalAddress: string;
//
//   constructor(nodeJSON) {
//     this.name = nodeJSON.metadata.name;
//     this.externalAddress = nodeJSON.status.addresses[1].address;
//     this.internalAddress = nodeJSON.status.addresses[0].address;
//   }
//
//   getName(): string {
//     return this.name;
//   }
//
//   print(): string {
//     return this.name + '\r\n' + this.externalAddress + '\r\n' + this.internalAddress;
//   }
// }
//
// class Pod {
//   name: string;
//   externalAddress: string;
//   internalAddress: string;
//
//   constructor(nodeJSON) {
//     this.name = nodeJSON.metadata.name;
//     this.externalAddress = nodeJSON.status.addresses[1].address;
//     this.internalAddress = nodeJSON.status.addresses[0].address;
//   }
//
//   getName(): string {
//     return this.name;
//   }
//
//   print() {
//     return this.name + '\r\n' + this.externalAddress + '\r\n' + this.internalAddress;
//   }
// }
//
// export {
//   Node,
//   Pod,
// };
//
//  // { Node, Service, Pod, GameAddress }
