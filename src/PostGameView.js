// @flow

import type GameNetwork from './network/GameNetwork';
import GameState from './network/GameState';

import React from 'react';

type Props = {
  gameServer: GameNetwork,
  gameState: GameState,
};

function PostGameView({ gameServer, gameState }: Props) {
  const player = gameState.getPlayer();

  return (
    <div>
      {player && !player.inGame && (
        <>
          <div>In game with {gameState.playersLeft} players left}</div>
          <div>Next Game Starts In {Math.floor(gameState.loadTime / 1000)}</div>
        </>
      )}
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
      {player && player.won && <div>You Won!</div>}
      <div>
        {Math.round(player.rightAnswers / (player.deathTime / 1000.0 / 60))} WPM
      </div>
      <div>
        Your accuracy:{' '}
        {Math.round(
          (player.rightAnswers / (player.rightAnswers + player.wrongAnswers)) *
            100
        )}
        %
      </div>
      <div>You KO'd {player.kills} players</div>
      <div>Next Game Starts In {Math.floor(gameState.loadTime / 1000)}</div>
    </div>
  );
}

export default PostGameView;
