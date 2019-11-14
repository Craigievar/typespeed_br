// @flow

import type {GameState, PlayerID} from '../gameTypes';

import io from 'socket.io-client';

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
  _listeners = {};

  getSocketID(): PlayerID {
    return nullthrows(this._socket).io.engine.id;
  }

  connectToAddress(address: string) {
    if (this._socket) {
      return;
    }

    this._socket = io(address);
    this._socket.emit('new player');
  }

  startGame() {
    nullthrows(this._socket).emit('start', {});
  }

  joinGame(name: string) {
    nullthrows(this._socket).emit('name', { word: name });
  }

  sendWord(input: string) {
    nullthrows(this._socket).emit('input', input);
  }

  onStateUpdate(onChange: (gameState: GameState) => void) {
    return nullthrows(this._socket).on('state', onChange);
  }
}

export default GameNetwork;
