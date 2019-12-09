// @flow

import React from 'react';

import GameNetwork from './GameNetwork';

const {useEffect, useState} = React;

const gameNetwork = new GameNetwork();

function useGameServer(): GameNetwork {
  useEffect(() => {
    // For IG builds expose a complete URI
    if (process.env.REACT_APP_GAME_SERVER_URI !== undefined) {
      gameNetwork.connectToAddress(process.env.REACT_APP_GAME_SERVER_URI);
    }

    // For local builds, the game server runs on a different port
    if (process.env.REACT_APP_GAME_SERVER_PORT !== undefined) {
      const url = new URL(window.location.origin);
      url.port = process.env.REACT_APP_GAME_SERVER_PORT;
      gameNetwork.connectToAddress(url.href);
    } else {
      // For prod deploys, the game server deploys assets and no url mapping
      // is needed
      gameNetwork.connectToAddress();
    }

  }, []);

  return gameNetwork;
}

export default useGameServer;
