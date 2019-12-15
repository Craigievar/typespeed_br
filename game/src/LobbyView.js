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
  const [showInstructions, setShowInstructions] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);

  async function handleSubmit(e) {
    // gameServer.joinGame(playerName);
    e.preventDefault();

    const matchmakingUri = new URL(process.env.REACT_APP_MATCHMAKER_SERVICE_HOST);
    matchmakingUri.port = process.env.REACT_APP_MATCHMAKER_SERVICE_PORT;

    // const response = await window.fetch(`${matchmakingUri.href}join`, {
    //   method: 'post',
    //   mode: 'cors',
    //   headers: {
    //     'Access-Control-Allow-Origin':'*'
    //   },
    //   body:
    // });
    const xhr = new XMLHttpRequest();
    xhr.withCredentials = true;
    xhr.open('POST', `${matchmakingUri.href}join`, true);
    xhr.onload = e => console.log(e);
    xhr.send(JSON.stringify({
      name: playerName
    }));

    setIsWaiting(true);
  }

  return (
    <div className="LobbyView-Container">
      {isWaiting && !showInstructions && (
        <div className="LobbyView-Waiting">
          <AnimatedText animation="pulse">
            {gameState.playersNeeded > 0 && (
              <>
                Waiting for {gameState.playersNeeded} more players
              </>
            )}
            {gameState.playersNeeded <= 0 && (
              <>
                Waiting for names!
              </>
            )}
          </AnimatedText>
        </div>
      )}
      {isWaiting && showInstructions && (
        <div className="LobbyView-Waiting-Small">
          <AnimatedText animation="pulse">
            Waiting for {gameState.playersNeeded} more players
          </AnimatedText>
        </div>
      )}
      {!isWaiting && (
        <>
          {!showInstructions && (
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
        </>
      )}
      <div>
        <div
          className="LobbyView-Instructions"
          onClick={(e) => setShowInstructions(!showInstructions)}
        >
          {!showInstructions && "Show Instructions"}
          {showInstructions && "Hide Instructions"}
        </div>
        <div>
          {showInstructions && (
              <>
                <h1>How to Play</h1>
                <p>Type faster than your opponents to survive.</p>
                <p>Every player has a queue of words to type.
                  Every second, we put a new word on the end of your queue.
                  Type the current word, and then hit enter or space to
                  send it to another player!</p>
                <p>Careful! Typos make your queue longer.</p>
                <p>If your queue gets too long, you die! Win by being the
                  last player alive.</p>
              </>
            )
          }
        </div>
      </div>
    </div>
  );
}

export default LobbyView;
