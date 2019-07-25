// @flow

import React from 'react';
import io from 'socket.io-client';
import './App.css';

function App() {
  React.useEffect(() => {
    const WORDS_TO_LOSE = 10;
    const canvasWidth = 600;
    const canvasHeight = 600;

    const socket = io('localhost:5000');

    socket.on('message', function(data) {
      console.log(data);
    });

    const input = {
      word: '',
    };

    const local = {
      currString: '',
      gameState: {},
    };

    window.start = function start() {
      socket.emit('start', {});
    };

    function isLetter(str) {
      return str.length === 1 && str.match(/[a-z]/i);
    }

    function renderEndGame(gameState) {
      //console.log('rendering endgame')
      const players = gameState.players;
      const player = players[socket.io.engine.id];
      const canvas = document.getElementById('canvas');
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      ctx.fillStyle = '#D3D3D3';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = '40px sans-serif';
      ctx.textAlign = 'center';
      if (player && !player.inGame) {
        if (gameState.state === 'INGAME') {
          ctx.fillStyle = '#FF0000';
          ctx.textAlign = 'center';
          ctx.fillText(
            'In game with ' + gameState.playersLeft + ' players left',
            canvas.width / 2,
            canvas.height / 2 - 20
          );
        } else {
          ctx.fillText(
            'Next Game Starts In ' + Math.floor(gameState.loadTime / 1000),
            canvas.width / 2,
            canvas.height / 2 + 95
          );
        }
      } else if (player && player.lost) {
        ctx.fillStyle = '#FF0000';
        ctx.textAlign = 'center';
        if (player.lastAttacker && player.lastAttacker.length > 0) {
          ctx.fillText(
            'Killed by ' + gameState.players[player.lastAttacker].name,
            canvas.width / 2,
            canvas.height / 2 - 60
          );
        } else {
          ctx.fillText('You Lose :(', canvas.width / 2, canvas.height / 2 - 60);
        }
        ctx.fillText(
          Math.round(player.rightAnswers / (player.deathTime / 1000.0 / 60)) +
            ' WPM',
          canvas.width / 2,
          canvas.height / 2 - 20
        );
        ctx.fillText(
          'Your accuracy: ' +
            Math.round(
              (player.rightAnswers / (player.rightAnswers + player.wrongAnswers)) *
                100
            ) +
            '%',
          canvas.width / 2,
          canvas.height / 2 + 20
        );
        ctx.fillText(
          "You KO'd " + player.kills + ' players',
          canvas.width / 2,
          canvas.height / 2 + 60
        );
        ctx.fillText(
          'Next Game Starts In ' + Math.floor(gameState.loadTime / 1000),
          canvas.width / 2,
          canvas.height / 2 + 95
        );
      } else if (player && player.won) {
        //console.log("handling won case")
        ctx.fillStyle = '#008B00';
        ctx.textAlign = 'center';
        ctx.fillText('You Won!', canvas.width / 2, canvas.height / 2 - 60);
        ctx.fillText(
          Math.round(player.rightAnswers / (gameState.endTime / 1000.0 / 60)) +
            ' WPM',
          canvas.width / 2,
          canvas.height / 2 - 20
        );
        ctx.fillText(
          'Your accuracy: ' +
            Math.round(
              (player.rightAnswers / (player.rightAnswers + player.wrongAnswers)) *
                100
            ) +
            '%',
          canvas.width / 2,
          canvas.height / 2 + 20
        );
        ctx.fillText(
          "You KO'd " + player.kills + ' players',
          canvas.width / 2,
          canvas.height / 2 + 60
        );
        ctx.fillText(
          'Next Game Starts In ' + Math.floor(gameState.loadTime / 1000),
          canvas.width / 2,
          canvas.height / 2 + 95
        );
      } else {
        //handle new players
        console.log('endgame without win or loss');
      }

      ctx.restore();
    }

    function renderInGame(gameState) {
      //console.log('rendering game')
      //console.log('rendering game')
      const players = gameState.players;
      const canvas = document.getElementById('canvas');
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      //console.log(gameState.loadTime)

      // grey bg
      ctx.fillStyle = '#D3D3D3';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (gameState.loadTime >= 0) {
        ctx.font = '60px sans-serif';
        ctx.fillStyle = '#008B00';
        ctx.textAlign = 'center';
        ctx.fillText(
          Math.floor(gameState.loadTime / 1000) + 1,
          canvas.width / 2,
          canvas.height / 2 - 15
        );
        ctx.restore();
      } else {
        const player = players[socket.io.engine.id];
        if (player) {
          //console.log(player.won)
          ctx.font = '40px sans-serif';

          ctx.fillStyle = '#808080';
          ctx.fillRect(0, canvas.height / 2 - 45, canvas.width, 60);
          ctx.fillStyle = '#E8E8E8';
          ctx.fillRect(0, canvas.height / 2 + 15, canvas.width, 60);

          ctx.font = '40px sans-serif';
          ctx.fillStyle = 'black';
          ctx.lineWidth = 2;
          //ctx.fillText(lastWord, 15, canvas.height / 2);
          ctx.fillText(local.currString, 15, canvas.height / 2 + 55);

          //words to write
          ctx.textAlign = 'left';
          ctx.fillStyle = '#580000';
          ctx.fillText(player.nextWords.join(' '), 15, canvas.height / 2 + 0);

          //queue
          ctx.textAlign = 'right';
          ctx.font = '20px sans-serif';
          if (player.nextWords.length > WORDS_TO_LOSE - 3) {
            ctx.fillStyle = '#CC0000';
          } else if (player.nextWords.length < 3) {
            ctx.fillStyle = '#009933';
          } else {
            ctx.fillStyle = '#000000';
          }
          ctx.fillText(
            'Words in Queue: ' + player.nextWords.length + '/' + WORDS_TO_LOSE,
            canvas.width - 10,
            canvas.height / 2 - 60
          );

          //players left
          ctx.fillStyle = '#000000';
          ctx.font = '30px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(
            'Players Left: ' + gameState.playersLeft,
            canvas.width / 2,
            35
          );

          ctx.fillText('KOs: ' + player.kills, canvas.width / 2, 70);
          ctx.fillStyle = '#009933';
          ctx.fillText('Words: ' + player.rightAnswers, canvas.width / 2, 105);
          ctx.fillStyle = '#CC0000';
          ctx.fillText('Mistakes: ' + player.wrongAnswers, canvas.width / 2, 140);

          ctx.restore();
        }
      }
    }

    function renderGetName(players) {
      //console.log('rendering name')
      const canvas = document.getElementById('canvas');

      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      const ctx = canvas.getContext('2d');

      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      ctx.fillStyle = '#D3D3D3';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const player = players[socket.io.engine.id];
      if (player) {
        ctx.font = '30px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#FF0000';

        ctx.fillText(
          'Enter Your Nickname!',
          canvas.width / 2,
          canvas.height / 2 - 50
        );
        ctx.font = '30px sans-serif';
        ctx.fillStyle = 'black';
        ctx.lineWidth = 2;
        ctx.textAlign = 'center';
        ctx.fillText(local.currString, canvas.width / 2, canvas.height / 2 + 10);
        ctx.restore();
      }
    }

    function renderLobby(gameState) {
      //console.log('rendering lobby')
      const canvas = document.getElementById('canvas');
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      ctx.fillStyle = '#D3D3D3';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#FF0000';
      if (gameState && gameState.state !== 'INGAME') {
        if (gameState.playersNeeded === 1) {
          ctx.fillText(
            'Need ' + gameState.playersNeeded + ' more player',
            canvas.width / 2,
            canvas.height / 2 - 15
          );
        } else {
          ctx.fillText(
            'Need ' + gameState.playersNeeded + ' more players',
            canvas.width / 2,
            canvas.height / 2 - 15
          );
        }
      } else {
        ctx.textAlign = 'center';
        if (gameState.state === 'INGAME' && gameState.playersLeft > 0) {
          ctx.fillText(
            'In game with ' + gameState.playersLeft + ' players left',
            canvas.width / 2,
            canvas.height / 2 - 20
          );
        } else {
          //(gameState.winner.length > 0) {
          //console.log('uhhh')
          if (gameState.winner.length > 0) {
            ctx.fillText(
              'Game Won By ' + gameState.players[gameState.winner].name,
              canvas.width / 2,
              canvas.height / 2 + 20
            );
          } else {
            ctx.fillText(
              'Waiting for Next Game',
              canvas.width / 2,
              canvas.height / 2 + 20
            );
          }
          ctx.fillText(
            'Next Game Starts In ' + Math.floor(gameState.loadTime / 1000),
            canvas.width / 2,
            canvas.height / 2 + 95
          );
        }
      }
      ctx.restore();
    }

    document.addEventListener('keyup', function(event) {
      if (isLetter(String.fromCharCode(event.keyCode))) {
        local.currString += String.fromCharCode(event.keyCode).toLowerCase();
        //console.log(local.currString)
      }
      // backspace
      else if (event.keyCode === 8) {
        if (local.currString.length > 0) {
          local.currString = local.currString.substring(
            0,
            local.currString.length - 1
          );
        }
      }
      // space or enter -- submit!
      else if (event.keyCode === 32) {
        if (
          local.gameState.players[socket.io.engine.id] &&
          !local.gameState.players[socket.io.engine.id].ready
        ) {
          local.currString += ' ';
        } else {
          input.word = local.currString;
          socket.emit('input', input);
          local.currString = '';
        }
      } else if (event.keyCode === 13) {
        if (
          local.gameState.players[socket.io.engine.id] &&
          !local.gameState.players[socket.io.engine.id].ready
        ) {
          socket.emit('name', { word: local.currString });
          local.currString = '';
        } else {
          input.word = local.currString;
          socket.emit('input', input);
          local.currString = '';
        }
      }
      //console.log(String.fromCharCode(event.keyCode))
    });

    socket.emit('new player');

    socket.on('state', function(gameState) {
      //console.log(gameState)
      local.gameState = gameState;
      //console.log(gameState.state)
      // if the player won/lost show their endgame screen
      // if it's postgame it'll count down
      if (
        gameState.players[socket.io.engine.id] &&
        !gameState.players[socket.io.engine.id].inGame &&
        gameState.players[socket.io.engine.id].name.length === 0
      ) {
        renderGetName(gameState.players);
      } else if (
        (gameState.state === 'INGAME' || gameState.state === 'POSTGAME') &&
        gameState.players[socket.io.engine.id] &&
        ((gameState.players[socket.io.engine.id].inGame &&
          (gameState.players[socket.io.engine.id].lost ||
            gameState.players[socket.io.engine.id].won)) ||
          !gameState.players[socket.io.engine.id].inGame)
      ) {
        renderEndGame(gameState);
      }

      // otherwise if it's ingame, show game
      else if (gameState.state === 'INGAME') {
        if (
          gameState.players[socket.io.engine.id] &&
          gameState.players[socket.io.engine.id].inGame
        ) {
          renderInGame(gameState);
        } else {
          renderLobby(gameState);
        }

        // otherwise it should be in lobby so we just show lobby info
      } else if (gameState.state === 'LOBBY' || gameState.state === 'POSTGAME') {
        renderLobby(gameState);
      }
    });
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Typespeed BR</h1>
        <canvas id="canvas" />
      </header>
    </div>
  );
}

export default App;
