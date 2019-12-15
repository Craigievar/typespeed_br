// @flow

import type { PlayerID, GameStateFromNetwork } from '../gameTypes';
import GameState from './GameState';

import io from 'socket.io-client';
import uuid from 'tiny-uuid';

type Socket = {
  emit: (string, Object) => void,
  on: (string, (any) => void) => void,
  io: { engine: { id: PlayerID } },
};

function nullthrows<T>(obj: ?T): T {
  if (obj === null || obj === undefined) {
    throw 'Expected to not be null';
  }

  return obj;
}

const EVENTS = [
  'game_creation_cancelled',
  'requesting_game',
  'game_created',
  'player_joined',
];

type MatchmakingEvent =
  | {
      type: 'game_creation_cancelled',
    }
  | {
      type: 'requesting_game',
    }
  | {
      type: 'game_created',
      server_url: string,
    }
  | {
      type: 'player_joined',
      player_name: string,
      player_count: number,
      players_needed: number,
    };

class MatchmakingNetwork {
  _socket: ?Socket;
  _listeners: { [string]: (gameState: MatchmakingEvent) => void } = {};

  isConnected(): boolean {
    return this._socket !== undefined;
  }

  getSocketID(): PlayerID {
    return nullthrows(this._socket).io.engine.id;
  }

  connectToAddress(address: string | void) {
    if (this._socket) {
      return;
    }

    const socket: ?Socket = io(address);

    // const socket: ?Socket = io(address, {query:"room=1"});
    if (socket) {
      this._socket = socket;
      EVENTS.forEach(event => {
        socket.on(event, e => {
          Object.values(this._listeners).forEach(listener =>
            listener({
              type: event,
              ...e,
            })
          );
        });
      });
    }
  }

  joinGame(name: string) {
    nullthrows(this._socket).emit('name', name);
  }

  onChange(cb: (gameState: MatchmakingEvent) => void) {
    const id = uuid();
    this._listeners[id] = cb;

    return () => {
      delete this._listeners[id];
    };
  }
}

export default MatchmakingNetwork;
