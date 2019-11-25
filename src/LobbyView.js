// @flow

import type GameNetwork from './network/GameNetwork';
import GameState from './network/GameState';

import React from 'react';
import AnimatedText from './animations/AnimatedText';
import './LobbyView.css';

const { useState } = React;

type Props = {
  gameServer: GameNetwork,
  gameState: GameState,
};

function LobbyView({ gameServer, gameState }: Props) {
  const [playerName, setPlayerName] = useState('');

  const [isWaiting, setIsWaiting] = useState(false);

  function handleSubmit(e) {
    gameServer.joinGame(playerName);
    e.preventDefault();

    setIsWaiting(true);
  }

  return (
    <div className="LobbyView-Container">
      {!isWaiting && (
        <>
          <div className="LobbyView-Header">Enter Your Nickname</div>
          <form onSubmit={handleSubmit}>
            <input
              className="App-Input"
              value={playerName}
              onChange={e => setPlayerName(e.target.value)}
            />
          </form>
        </>
      )}
      {isWaiting && (
        <div className="LobbyView-Waiting">
          <AnimatedText animation="pulse">
            Waiting for {gameState.playersNeeded} more players
          </AnimatedText>
        </div>
      )}
    </div>
  );
}

export default LobbyView;
