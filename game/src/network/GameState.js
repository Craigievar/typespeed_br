// @flow

import type {GameStateFromNetwork, GameView, Player, PlayerID} from '../gameTypes';

class GameState {
  players: {[PlayerID]: Player};
  playersNeeded: number;
  state: GameView;
  playersLeft: number;
  endTime: number;
  loadTime: number;
  playerID: PlayerID;

  constructor(state: GameStateFromNetwork, playerID: PlayerID) {
    this.players = state.players;
    this.playersNeeded = state.playersNeeded;
    this.state = state.state;
    this.playersLeft = state.playersLeft;
    this.endTime = state.endTime;
    this.loadTime = state.loadTime;
    this.playerID = playerID;
  }

  getPlayer(): Player {
    return this.players[this.playerID];
  }
}

export default GameState;
