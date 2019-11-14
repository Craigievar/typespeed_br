// @flow

import type { PlayerID, Player, GameView, GameState } from './gameTypes';

import React from 'react';
import io from 'socket.io-client';
import './App.css';
import UnconnectedView from './UnconnectedView';
import PostGameView from './PostGameView';
import LobbyView from './LobbyView';
import IngameView from './IngameView';
import useGameServer from './network/useGameServer';

const { useEffect, useState } = React;

const UNCONNECTED_GAME_STATE = {
  players: {},
  playersNeeded: 0,
  state: 'UNCONNECTED',
  playersLeft: 0,
  endTime: 0,
  loadTime: 0,
};

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
  const [gameState, setGameState] = useState(UNCONNECTED_GAME_STATE);
  const gameServer = useGameServer('localhost:5000');

  useEffect(() => {
    gameServer.onStateUpdate(updatedGameState => {
      setGameState(updatedGameState);
    });
  }, []);

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
    </div>
  );
}

export default App;