// @flow

import type GameNetwork from './network/GameNetwork';
import GameState from './network/GameState';
import React from 'react';
import AnimatedText from './animations/AnimatedText';
import './LobbyView.css';
import MatchmakingNetwork from './network/MatchmakingNetwork';

const superagent = require('superagent');
const { useState, useEffect } = React;

type Props = {
  gameServer: GameNetwork,
  gameState: GameState,
};

function LobbyView({ gameServer, gameState }: Props) {
  const [matchmakingServer] = useState(
    new MatchmakingNetwork()
  );

  const [playerName, setPlayerName] = useState('');
  const [showInstructions, setShowInstructions] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const [playerCount, setPlayerCount] = useState(0);
  const [playersNeeded, setPlayersNeeded] = useState(0);

  useEffect(() => {
    //const matchmakingUri = new URL(process.env.REACT_APP_MATCHMAKER_SERVICE);

    const matchmakingUri = new URL("http://34.83.107.182:80");
    matchmakingServer.connectToAddress(matchmakingUri.href);

    if(gameServer.isConnected()){
      gameServer.disconnect();
    }

    console.log(matchmakingUri);
    return matchmakingServer.onChange((e) => {
      console.log(e);
      switch (e.type) {
        case 'game_creation_cancelled':
          break;
        case 'requesting_game':
          break;
        case 'game_created':
          console.log('Trying to connect to game server at ' + e.server_url);
          console.log('Name is ' + playerName);
          gameServer.connectToAddress(e.server_url);
          gameServer.joinGame(playerName);
          break;
        case 'player_joined':
          setPlayerCount(e.player_count);
          setPlayersNeeded(e.players_needed - e.player_count);
          break;
        case 'update_min_players':
          setPlayersNeeded(e.players_needed - e.player_count);
          break;
        default:
          break;
      }
    });
  }, [matchmakingServer, playerName]);

  async function handleSubmit(e) {
    matchmakingServer.joinGame(playerName);
    e.preventDefault();

    setIsWaiting(true);
  }

  return (
    <div className="LobbyView-Container">
      {isWaiting && !showInstructions && (
        <div className="LobbyView-Waiting">
          <AnimatedText animation="pulse">
            {playersNeeded > 0 && (
              <>Waiting for {playersNeeded} more players</>
            )}
            {playersNeeded <= 0 && <>Waiting for names!</>}
          </AnimatedText>
        </div>
      )}
      {isWaiting && showInstructions && (
        <div className="LobbyView-Waiting-Small">
          <AnimatedText animation="pulse">
            Waiting for {playersNeeded} more players
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
          onClick={e => setShowInstructions(!showInstructions)}
        >
          {!showInstructions && 'Show Instructions'}
          {showInstructions && 'Hide Instructions'}
        </div>
        <div>
          {showInstructions && (
            <>
              <h1>How to Play</h1>
              <p>Type faster than your opponents to survive.</p>
              <p>
                Every player has a queue of words to type. Every second, we put
                a new word on the end of your queue. Type the current word, and
                then hit enter or space to send it to another player!
              </p>
              <p>Careful! Typos make your queue longer.</p>
              <p>
                If your queue gets too long, you die! Win by being the last
                player alive.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default LobbyView;
