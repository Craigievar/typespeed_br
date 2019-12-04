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
import classnames from 'classnames';

const { useEffect, useState } = React;

const UNCONNECTED_GAME_STATE: GameState = new GameState(
  {
    players: {},
    playersNeeded: 0,
    state: 'UNCONNECTED',
    playersLeft: 0,
    endTime: 0,
    loadTime: 0,
  },
  window.localStorage.getItem('playerid')
);

function getIngamePlayerView(player: Player): GameView {
  if(player){
    if(player.inGame){
      return IngameView;
    }
    if(player.lost || player.won || player.ready){
      return PostGameView;
    }
    return LobbyView;
  }
  return LobbyView;
}

const GameViewRenderers: { [GameView]: Function } = {
  UNCONNECTED: (player: ?Player) => UnconnectedView,
  POSTGAME: (player: ?Player) => PostGameView,
  LOBBY: (player: ?Player) => LobbyView,
  INGAME: (player: ?Player) => getIngamePlayerView(player),
    // player && ((player.inGame && (player.lost || player.won)) || !player.inGame)
    //   ? PostGameView
    //   : IngameView,
};

let firstPass = true;

function App() {
  const gameServer = useGameServer();

  const [storedGameState, setStoredGameState] = useLocalStorage(
    'state',
    UNCONNECTED_GAME_STATE
  );

  const [playerID, setPlayerID] = useLocalStorage('playerid');
  const [isReceivingGameState, setIsReceivingGameState] = useLocalStorage(
    'isplaying',
    true
  );
  const [gameState, setGameState] = useState(
    new GameState(storedGameState, playerID)
  );

  useEffect(() => {
    const unsub = gameServer.onStateUpdate(updatedGameState => {
      if (isReceivingGameState) {
        setGameState(updatedGameState);
      }
    });

    return () => unsub();
  }, [isReceivingGameState, gameServer]);

  useEffect(() => {
    if (!isReceivingGameState && !firstPass) {
      console.log('setting');
      setStoredGameState(gameState);
      setPlayerID(gameServer.getSocketID());
    }

    firstPass = false;
  }, [isReceivingGameState, gameState]);

  const player = gameState.getPlayer();
  const View = GameViewRenderers[gameState.state](player);
  const [shellClassName, setShellClassName] = useState(null);

  return (
    <div className={classnames('App', shellClassName)}>
      <header className="App-header">
        <h1>Typespeed BR</h1>
      </header>
      <div className="App-GameShell">
        <View
          gameServer={gameServer}
          gameState={gameState}
          setShellClassName={className => setShellClassName(className)}
        />
      </div>
      <canvas id="canvas" />
      {/* <button
        className="App-FreezeStateBtn"
        onClick={() =>
          setIsReceivingGameState(!isReceivingGameState) &&
          console.log('toggled')
        }
      >
        [Debug] {isReceivingGameState ? 'FREEZE' : 'UNFREEZE'}
      </button> */}
    </div>
  );
}

export default App;
