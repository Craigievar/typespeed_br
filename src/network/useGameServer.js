// @flow

import React from 'react';

import GameNetwork from './GameNetwork';

const {useEffect, useState} = React;

const gameNetwork = new GameNetwork();

function useGameServer(): GameNetwork {
  useEffect(() => {
    if (process.env.REACT_APP_GAME_SERVER_PORT !== undefined) {
      const url = new URL(window.location.origin);
      url.port = process.env.REACT_APP_GAME_SERVER_PORT;
      gameNetwork.connectToAddress(url.href);
    } else {
      gameNetwork.connectToAddress();
    }

  }, []);

  return gameNetwork;
}

export default useGameServer;
