// @flow

import type GameNetwork from './network/GameNetwork';
import GameState from './network/GameState';
import './PostGameView.css';
import React from 'react';

type Props = {
  gameServer: GameNetwork,
  gameState: GameState,
};

function PostGameView({ gameServer, gameState }: Props) {
  const player = gameState.getPlayer();

  console.log(player.rightAnswers, player.deathTime);

  return (
    <div className="PostGameView-Stats-Container">
      {player && player.lost && (
        <>
          {player.lastAttacker && player.lastAttacker.length > 0 && (
            <div>Killed by {gameState.players[player.lastAttacker].name}</div>
          )}
          {!(player.lastAttacker && player.lastAttacker.length > 0) && (
            <div>You Lose :(</div>
          )}
        </>
      )}
      {player && !player.lost && <br></br>}
      {player && !player.inGame && (
        <>
          <div>In game with {gameState.playersLeft} players left!</div>
          <div>Next Game Starts In {Math.floor(gameState.loadTime / 1000)}</div>
        </>
      )}
      {player && player.won && <h2>You Won!</h2>}
      <br></br>
      <div>
        {player &&
          Math.round(
            player.rightAnswers / (player.deathTime / 1000.0 / 60)
          )}{' '}
        WPM
      </div>
      <div>
        Accuracy:{' '}
        {player &&
          player.rightAnswers + player.wrongAnswers > 0 &&
          Math.round(
            (player.rightAnswers /
              (player.rightAnswers + player.wrongAnswers)) *
              100
          )}
        {player && player.rightAnswers + player.wrongAnswers === 0 && '-'}%
      </div>
      <div>You KO'd {player && player.kills} players</div>
      <div>Next Game Starts In {Math.floor(gameState.loadTime / 1000)}</div>
    </div>
  );
}

export default PostGameView;
