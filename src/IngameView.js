// @flow

import type GameNetwork from './network/GameNetwork';
import GameState from './network/GameState';
import AnimatedText from './animations/AnimatedText';

import React, { useState, useEffect, useCallback } from 'react';
import './LobbyView.css';
import './IngameView.css';

type Props = {
  gameServer: GameNetwork,
  gameState: GameState,
};

const WORDS_TO_LOSE = 20;
const WORDS_TO_SHOW = 13;

function isLetter(str: string): boolean {
  return str.length === 1 && str.match(/[a-z]/i) !== null;
}

function getNumMatchedLetters(s1: string, s2: string): int {
  let matchedLetters = 0;
  while (matchedLetters < s1.length &&
    matchedLetters < s2.length &&
    s1.toLowerCase().charAt(matchedLetters) === s2.toLowerCase().charAt(matchedLetters)){
    matchedLetters++;
  }
  return matchedLetters;
}

function IngameView({ gameServer, gameState }: Props) {
  const player = gameState.getPlayer();
  const [inputValue, setInputValue] = useState('');

  const onKeyDown = useCallback(function (event: KeyboardEvent) {
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
        <div className="IngameView-Countdown">
          <div><AnimatedText animation="pulse">{Math.floor(gameState.loadTime / 1000) + 1}</AnimatedText></div>
        </div>
      )}
      {gameState.loadTime < 0 && (
        <>
          <div className="IngameView-Stat">
            Words in Queue: {player.nextWords.length}/{WORDS_TO_LOSE}
          </div>
          <div className="IngameView-Stat">Players Left: {gameState.playersLeft}</div>
          <div className="IngameView-Stat">KOs: {player.kills}</div>
          <div className="IngameView-Stat">Words: {player.rightAnswers}</div>
          <div className="IngameView-Stat">Mistakes: {player.wrongAnswers}</div>
          <br></br>
          <br></br>
          <div className="IngameView-Queue">
            <span className="IngameView-Letter-Typed-Correct">
              {inputValue.substr(0, getNumMatchedLetters(inputValue, player.nextWords[0]))}
            </span>
            <span className="IngameView-Letter-Typed-Incorrect">
              {inputValue.substr(getNumMatchedLetters(inputValue, player.nextWords[0]), inputValue.length)}
            </span>
            <span className="IngameView-Letter-Untyped">
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
          <div className="IngameView-Queue">
            <span className="IngameView-Letter-Queue">
              {
                player.nextWords.length > 1
                && player.nextWords.slice(1, Math.min(player.nextWords.length, WORDS_TO_SHOW)).
                  map((d) => <p className="IngameView-Queue-Border">{d.toLowerCase()}</p>)
              }
              {
                player.nextWords.length <= 1
                && <br></br>
              }
            </span>
          </div>
          <br/>
        </>
      )}
    </div>
  );
}

export default IngameView;
