// @flow

import type GameNetwork from './network/GameNetwork';
import type { GameState } from './gameTypes';

import React from 'react';

import './LobbyView.css';
import './IngameView.css';

const { useState } = React;

type Props = {
  gameServer: GameNetwork,
  gameState: GameState,
};

const WORDS_TO_LOSE = 10;

function isLetter(str: string): boolean {
  return str.length === 1 && str.match(/[a-z]/i) !== null;
}

function IngameView({ gameServer, gameState }: Props) {
  const player = gameState.players[gameServer.getSocketID()];
  const [inputValue, setInputValue] = useState('');

  function onKeyDown(event: KeyboardEvent) {
    let word = inputValue;
    switch (true) {
      case isLetter(String.fromCharCode(event.keyCode)):
        word += String.fromCharCode(event.keyCode).toLowerCase();
        break;

      // backspace
      case event.keyCode === 8:
        word = word.substring(0, word.length - 1);
        break;

      // space or enter -- submit!
      case event.keyCode === 32:
      case event.keyCode === 13:
        gameServer.sendWord(word);
        word = '';
        break;

      default:
        break;
    }

    setInputValue(word);
  }

  return (
    <div>
      {gameState.loadTime >= 0 && (
        <div class="LobbyView-Header">
          <div>{Math.floor(gameState.loadTime / 1000) + 1}</div>
        </div>
      )}
      {gameState.loadTime < 0 && (
        <>
          <div>
           <input
             class="LobbyView-Input"
             value={inputValue}
             onKeyDown={onKeyDown}
           />
          </div>
          <div class="IngameView-Queue">
            <span class="IngameView-Letter-Typed">{inputValue}</span>
            <span class="IngameView-Letter-Untyped">
              {
                player.nextWords.length > 0
                && player.nextWords[0].substr(inputValue.length, player.nextWords[0].length).toLowerCase()
              }
              {
                player.nextWords.length === 0
                && <br></br>
              }
            </span>
          </div>
          <div class="IngameView-Queue">
            <span class="IngameView-Letter-Untyped">
              {
                player.nextWords.length > 1
                && player.nextWords.slice(1, player.nextWords.length).join(' ').toLowerCase()
              }
              {
                player.nextWords.length <= 1
                && <br></br>
              }
            </span>
          </div>
          <br/>
          <div>
            Words in Queue: {player.nextWords.length}/{WORDS_TO_LOSE}
          </div>
          <div>Players Left: {gameState.playersLeft}</div>
          <div>KOs: {player.kills}</div>
          <div>Words: {player.rightAnswers}</div>
          <div>Mistakes: {player.wrongAnswers}</div>
        </>
      )}
    </div>
  );
}

export default IngameView;
