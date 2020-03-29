// @flow

import React from 'react';

import GameNetwork from './GameNetwork';

const {useEffect, useState} = React;

const gameNetwork = new GameNetwork();

function useGameServer(): GameNetwork {
  return gameNetwork;
}

export default useGameServer;
