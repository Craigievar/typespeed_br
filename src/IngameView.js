// @flow

import type GameNetwork from './network/GameNetwork';
import GameState from './network/GameState';
import AnimatedText from './animations/AnimatedText';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import './LobbyView.css';
import './IngameView.css';
import './CorrectAnimation.css';
import './IncorrectAnimation.css';
import './AttackedAnimation.css';
import useAnimation from './hooks/useAnimation';
import isMobile from './isMobile';

type Props = {
  gameServer: GameNetwork,
  gameState: GameState,
  setShellClassName: (?string) => void,
};

const WORDS_TO_LOSE = 20;
const WORDS_TO_SHOW = 13;

function isLetter(str: string): boolean {
  return str.length === 1 && str.match(/[a-z]/i) !== null;
}

function getNumMatchedLetters(s1: string, s2: string): number {
  let matchedLetters = 0;
  while (
    matchedLetters < s1.length &&
    matchedLetters < s2.length &&
    s1.toLowerCase().charAt(matchedLetters) ===
      s2.toLowerCase().charAt(matchedLetters)
  ) {
    matchedLetters++;
  }
  return matchedLetters;
}

function IngameView({ gameServer, gameState, setShellClassName }: Props) {
  const player = gameState.getPlayer();
  const [inputValue, setInputValue] = useState('');
  const [attackedClassname, setAttackedClassname] = useState('');
  const [attackingClassname, setAttackingClassname] = useState('');

  function queueClass(length: int): string {
    console.log(length);
    console.log(WORDS_TO_LOSE);
    if(length <= (WORDS_TO_LOSE / 2)){
      return 'Safe';
    }
    if(length <= (WORDS_TO_LOSE * 4.0 / 5.0)){
      return 'Warning';
    }
    if(length > WORDS_TO_LOSE * 4.0 / 5.0){
      return 'Danger';
    }
    return 'Fallthrough';
  }

  const onKeyDown = useCallback(
    function(event: KeyboardEvent) {
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
    },
    [inputValue, setInputValue]
  );
  const onMobileSubmit = (e) => {
    gameServer.sendWord(inputValue);
    setInputValue('');
    e.preventDefault();
  };

  useEffect(() => {
    if (!isMobile()) {
      window.addEventListener('keydown', onKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onKeyDown]);

  const correctFlash = useAnimation(
    () => {
      return player.rightAnswers > 0 ? 'App-Correct' : null;
    },
    300,
    [player.rightAnswers]
  );
  const incorrectFlash = useAnimation(
    () => {
      return player.wrongAnswers > 0 ? 'App-Incorrect' : null;
    },
    300,
    [player.wrongAnswers]
  );

  const attackingFlash = useAnimation(
    () => {
      return player.rightAnswers > 0 ? 'IngameView-Attacking' : null;
    },
    1000,
    [player.rightAnswers]
  );

  const attackedFlash = useAnimation(
    () => {
      return gameState.players[player.lastAttacker] &&
        gameState.players[player.lastAttacker].name !== null ?
        'IngameView-Attacked' : null;
    },
    1000,
    [player.timesAttacked]
  );

  useEffect(() => setShellClassName(correctFlash || incorrectFlash ), [
    correctFlash,
    incorrectFlash,
  ]);
  useEffect(() => {
    return () => {
      setShellClassName(null);
    };
  }, []);

  useEffect(() => (setAttackingClassname(attackingFlash)), [
    attackingFlash,
  ]);
  useEffect(() => {
    return () => {
      setAttackingClassname(null);
    };
  }, []);

  useEffect(() => (setAttackedClassname(attackedFlash)), [
    attackedFlash,
  ]);
  useEffect(() => {
    return () => {
      setAttackedClassname(null);
    };
  }, []);

  return (
    <div>
      {gameState.loadTime >= 0 && (
        <div className="IngameView-Countdown">
          <div>
            <AnimatedText animation="pulse">
              {Math.floor(gameState.loadTime / 1000) + 1}
            </AnimatedText>
          </div>
        </div>
      )}
      {gameState.loadTime < 0 && (
        <div className="IngameView-Container">
          <div className="IngameView-Stat">
            <span>Words in Queue: </span>
            <span className={"IngameView-QueueLengthDisplay-" + queueClass(player.nextWords.length)}>
              {player.nextWords.length}/{WORDS_TO_LOSE}
            </span>
          </div>
          <div className="IngameView-Stat">
            Players Left: {gameState.playersLeft}
          </div>
          <div className="IngameView-Stat">KOs: {player.kills}</div>
          <div className="IngameView-Stat">
            <span>Words: </span>
            <span className="IngameView-WordCount">
              {player.rightAnswers}
            </span>
          </div>
          <div className="IngameView-Stat">
            <span>Errors: </span>
            <span className="IngameView-ErrorCount">
              {player.wrongAnswers}
            </span>
          </div>
          <div className={attackingClassname}>
            <div className="IngameView-Target">
              Attacked {player.lastTarget !== null && player.lastTarget}
            </div>
          </div>
          <div className={attackedClassname}>
            <div className="IngameView-Targeter">
              Attacked by {gameState.players[player.lastAttacker] &&
                gameState.players[player.lastAttacker].name !== null
                && gameState.players[player.lastAttacker].name}
            </div>
          </div>
          <br></br>
          <br></br>
          {!isMobile() && (
            <div className="IngameView-Queue">
              <span className="IngameView-Letter-Typed-Correct">
                {inputValue.substr(
                  0,
                  getNumMatchedLetters(inputValue, player.nextWords[0])
                )}
              </span>
              <span className="IngameView-Letter-Typed-Incorrect">
                {inputValue.substr(
                  getNumMatchedLetters(inputValue, player.nextWords[0]),
                  inputValue.length
                )}
              </span>
              <span className="IngameView-Letter-Untyped">
                {player.nextWords.length > 0 &&
                  player.nextWords[0]
                    .substr(inputValue.length, player.nextWords[0].length)
                    .toLowerCase()}
                {player.nextWords.length === 0 && <br></br>}
              </span>
            </div>
          )}
          {isMobile() && (
            <form
              onSubmit={onMobileSubmit}
            >
              <input
                type="text"
                autoFocus="true"
                className="App-Input"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
              />
            </form>
          )}
          <div className="IngameView-Queue">
            <span className="IngameView-Letter-Queue">
              {player.nextWords.length > 1 &&
                player.nextWords
                  .slice(isMobile() ? 0 : 1, Math.min(player.nextWords.length, WORDS_TO_SHOW))
                  .map(d => (
                    <p className="IngameView-Queue-Border">{d.toLowerCase()}</p>
                  ))}
              {player.nextWords.length <= 1 && <br></br>}
            </span>
          </div>
          <br />
        </div>
      )}
    </div>
  );
}

export default IngameView;
