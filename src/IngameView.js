// @flow

import type GameNetwork from './network/GameNetwork';
import type {GameState} from './gameTypes';

import React from 'react';

type Props = {
  gameServer: GameNetwork,
  gameState: GameState,
};

function IngameView({gameServer, gameState}: Props) {
  return (
    <div>
      {JSON.stringify(gameState)}
    </div>
  );
}

export default IngameView;
