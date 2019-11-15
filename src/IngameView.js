// @flow

import type GameNetwork from './network/GameNetwork';
import GameState from './network/GameState';

import React, { useState, useEffect, useCallback } from 'react';

import './LobbyView.css';
import './IngameView.css';

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

  const onKeyDown = useCallback(function (event: KeyboardEvent) {
    let word = inputValue;
    console.log(word);
    switch (true) {
      case isLetter(String.fromCharCode(event.keyCode)):
        console.log('Pressed ' + String.fromCharCode(event.keyCode));
        word += String.fromCharCode(event.keyCode).toLowerCase();
        console.log('Word is ' + word);
        break;

      // backspace
      case event.keyCode === 8:
        word = word.substring(0, word.length - 1);
        break;

      // space or enter -- submit!
      case event.keyCode === 32:
      case event.keyCode === 13:
      console.log('Sending ' + word);
        gameServer.sendWord(word);
        word = '';
        break;

      default:
        break;
    }

    setInputValue(word);
  }, [inputValue, setInputValue]);

  useEffect(() => {
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onKeyDown]);

  return (
    <div>
      {gameState.loadTime >= 0 && (
        <div class="LobbyView-Header">
          <div>{Math.floor(gameState.loadTime / 1000) + 1}</div>
        </div>
      )}
      {gameState.loadTime < 0 && (
        <>
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
