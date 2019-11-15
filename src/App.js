// @flow

import type { PlayerID, Player, GameView } from './gameTypes';

import './App.css';
import GameState from './network/GameState';
import IngameView from './IngameView';
import io from 'socket.io-client';
import LobbyView from './LobbyView';
import PostGameView from './PostGameView';
import React from 'react';
import UnconnectedView from './UnconnectedView';
import useGameServer from './network/useGameServer';
import useLocalStorage from './hooks/useLocalStorage';

const { useEffect, useState } = React;

const UNCONNECTED_GAME_STATE: GameState = new GameState({
  players: {},
  playersNeeded: 0,
  state: 'UNCONNECTED',
  playersLeft: 0,
  endTime: 0,
  loadTime: 0,
}, window.localStorage.getItem('playerid'));

const GameViewRenderers: { [GameView]: Function } = {
  UNCONNECTED: (player: ?Player) => UnconnectedView,
  POSTGAME: (player: ?Player) => PostGameView,
  LOBBY: (player: ?Player) => LobbyView,
  INGAME: (player: ?Player) =>
    player && ((player.inGame && (player.lost || player.won)) || !player.inGame)
      ? PostGameView
      : IngameView,
};

function App() {
  const gameServer = useGameServer('localhost:5000');
  const [storedGameState, setStoredGameState] = useLocalStorage('state', UNCONNECTED_GAME_STATE);
  const [playerID, setPlayerID] = useLocalStorage('playerid');
  const [gameState, setGameState] = useState(new GameState(storedGameState, playerID));
  const [isReceivingGameState, setIsReceivingGameState] = useState(storedGameState === UNCONNECTED_GAME_STATE);

  useEffect(() => {
    const unsub = gameServer.onStateUpdate(updatedGameState => {
      if (isReceivingGameState) {
        setGameState(updatedGameState);
      }
    });

    return () => unsub();
  }, [isReceivingGameState, gameServer]);

  useEffect(() => {
    if (isReceivingGameState) {
      setStoredGameState(UNCONNECTED_GAME_STATE);
    } else {
      setStoredGameState(gameState);
    }
  }, [isReceivingGameState, gameState]);

  useEffect(() => {
    if (gameServer.isConnected()) {
      setPlayerID(gameServer.getSocketID());
    }
  }, [gameServer, gameServer.isConnected() && gameServer.getSocketID()]);

  const player = gameServer.isConnected()
    ? gameState.players[gameServer.getSocketID()]
    : null;
  const View = GameViewRenderers[gameState.state](player);

  return (
    <div className="App">
      <header className="App-header">
        <h1 className="">Typespeed BR</h1>
      </header>
      <div className="App-GameShell">
        <View gameServer={gameServer} gameState={gameState} />
      </div>
      <canvas id="canvas" />
      <button
        className="App-FreezeStateBtn"
        onClick={() => setIsReceivingGameState(!isReceivingGameState)}
      >
        [Debug] {isReceivingGameState ? 'FREEZE' : 'UNFREEZE'}
      </button>
    </div>
  );
}

export default App;
