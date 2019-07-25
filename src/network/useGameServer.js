// @flow

import React from 'react';

import GameNetwork from './GameNetwork';

const {useEffect, useState} = React;

const gameNetwork = new GameNetwork();

function useGameServer(address: string): GameNetwork {
  useEffect(() => {
    gameNetwork.connectToAddress(address);
  }, []);

  return gameNetwork;
}

export default useGameServer;
