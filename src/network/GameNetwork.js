// @flow

import type {GameState, PlayerID} from '../gameTypes';

import io from 'socket.io-client';
import uuid from 'tiny-uuid';

type Socket = {
  emit: (string, Object) => void,
  on: (string, (any) => void) => void,
  io: {engine: {id: PlayerID}}
};

function nullthrows<T>(obj: ?T): T {
  if (obj === null || obj === undefined) {
    throw 'Expected to not be null';
  }

  return obj;
}

class GameNetwork {
  _socket: ?Socket;
  _listeners: {[string]: Function} = {};

  _onChange = (gameState: GameState) => {
    Object.values(this._listeners).forEach(listener => listener(gameState));
  }

  isConnected(): boolean {
    return this._socket !== undefined;
  }

  getSocketID(): PlayerID {
    return nullthrows(this._socket).io.engine.id;
  }

  connectToAddress(address: string) {
    if (this._socket) {
      return;
    }

    const socket: ?Socket = io(address);
    if (socket) {
      this._socket = socket;
      socket.emit('new player');
      socket.on('state', this._onChange);
    }
  }

  startGame() {
    nullthrows(this._socket).emit('start', {});
  }

  joinGame(name: string) {
    nullthrows(this._socket).emit('name', { word: name });
  }

  sendWord(word: string) {
    nullthrows(this._socket).emit('input', {word});
  }

  onStateUpdate(onChange: (gameState: GameState) => void) {
    const id = uuid();
    this._listeners[id] = onChange;

    return () => {
      delete this._listeners[id];
    };
  }
}

export default GameNetwork;
