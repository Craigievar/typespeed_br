// @flow

import type {PlayerID, GameStateFromNetwork} from '../gameTypes';
import GameState from './GameState';

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

  _onChange = (gameState: GameStateFromNetwork) => {
    Object.values(this._listeners).forEach(listener => listener(new GameState(gameState, this.getSocketID())));
  }

  isConnected(): boolean {
    return this._socket !== undefined;
  }

  getSocketID(): PlayerID {
    return nullthrows(this._socket).io.engine.id;
  }

  disconnect() {
    this._socket.close();
    this._socket = undefined;
  }

  connectToAddress(address: string | void) {
    if (this._socket) {
      console.log('[GameNetwork] Client already connected, skipping connection');
      return;
    }

    let room = null;
    window.location.search
      .substr(1)
      .split("&")
      .forEach(function (item) {
        const tmp = item.split("=");
        if (tmp[0].toLowerCase() === "room") {
          room = tmp[1];
        }
      });

    console.log('[GameNetwork] Connecting to ' + address);
    console.log('[GameNetwork] Room: ' + room);
    const socket: ?Socket = room && /^\d+$/.test(room) ?
      io(address, {query:"room=" + room}) :
      io(address);
    // const socket: ?Socket = io(address, {query:"room=1"});
    if (socket) {
      console.log('[GameNetwork] Passed socket check');
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

  sendShake() {
    nullthrows(this._socket).emit('screen_shake', {});
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
