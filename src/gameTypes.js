// @flow

export type PlayerID = string;
export type Player = {
  name: string,
  inGame: boolean,
  lost: boolean,
  lastAttacker: PlayerID,
  lastTarget: string,
  deathTime: number,
  won: boolean,
  nextWords: Array<string>,
  kills: number,
  rightAnswers: number,
  wrongAnswers: number,
  timesAttacked: number,
};
export type GameView = 'INGAME' | 'POSTGAME' | 'LOBBY' | 'UNCONNECTED';

export type GameStateFromNetwork = {
  players: { [PlayerID]: Player },
  playersNeeded: number,
  state: GameView,
  playersLeft: number,
  endTime: number,
  loadTime: number,
};
