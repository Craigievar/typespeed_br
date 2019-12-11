// @flow
/*
  Basically, we want to refactor win checks, etc.
  out of player actions (just update to track state there)
*/

import type {Player} from '../../game/src/gameTypes';

// Unpack config file
const config = require('./config');
const WORDS = config.WORDS;
const MS_PER_WORD_BASE = config.MS_PER_WORD_BASE;
const MS_PER_WORD_MIN = config.MS_PER_WORD_MIN;
const MS_PER_WORD_DELTA = config.MS_PER_WORD_DELTA;
const WORDS_TO_LOSE = config.WORDS_TO_LOSE;
const MIN_PLAYERS_TO_START = config.MIN_PLAYERS_TO_START;
const COUNTDOWN_LENGTH = config.COUNTDOWN_LENGTH;
const RESET_LENGTH = config.RESET_LENGTH;
const PLAYERS_TO_WIN = config.PLAYERS_TO_WIN;

// Dependencies
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.Server(app); // eslint-disable-line new-cap
const io = socketIO(server);

const path = require('path');

app.get('/ping', function (req, res) {
 return res.send('pong');
});

const port = process.env.PORT || 8083;
app.set('port', port);
// app.listen(port);

// Start the server.
server.listen(port, function() {
  console.log('Starting server on port' + (port));
});

// Map of socket channels to games
const gamesOnServer = {
};

// when users disconnect we lose their socket.
const playerRoomMap = {
};

// Initialize the game state when we start the server
function newGame(room) {
  return {
    players: {},
    state: 'LOBBY', // LOBBY, INGAME
    playersLeft: 0,
    loadTime: COUNTDOWN_LENGTH,
    inCountdown: false,
    delay: MS_PER_WORD_BASE,
    playersNeeded: MIN_PLAYERS_TO_START,
    time: 0,
    endTime: 0,
    lastTickTimeMs: 0,
    winner: '',
    room: room,
  };
}

function randomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomWord() {
  return randomElement(WORDS);
}

function checkIfLost(player: Player) {
  if (player && player.nextWords.length >= WORDS_TO_LOSE) {
    return true;
  }
  return false;
}

function getRoom(socket){
  return Object.keys(socket.rooms)[0];
}

function newPlayer(id, room) {
  return {
    prevWords: [],
    nextWords: [],
    lost: false,
    won: false,
    //target: findTarget(players, socket.id),
    lobbyIndex: numPlayers(gamesOnServer[room]), //TODO; DYNAMICALLY FETCH THIS
    inGame: false,
    id,
    ready: false,
    name: '',
    kills: 0,
    wrongAnswers: 0,
    rightAnswers: 0,
    lastTarget: '',
    lastKilled: '',
    lastAttacker: '',
    winner: '',
    deathTime: 1,
    timesAttacked: 0,
    room: room,
    canShake: true,
    screenShakeUntilMs: 0,
  };
}

function findTarget(players, player) {
  const playerList = Object.keys(players);
  const filtered = playerList.filter(
    value =>
      value !== player &&
      players[value].inGame &&
      !players[value].won &&
      !players[value].lost
  );

  if (filtered.length > 0) {
    const randomId = randomElement(filtered);
    if (randomId) {
      return randomId;
    }
  }

  return '';
}

function updatePlayersLeft(game) {
  game.playersLeft = -1;
  if (game && game.players) {
    game.playersLeft += 1;
    for (const id in game.players) {
      if (!game.players[id].lost && game.players[id].inGame) {
        game.playersLeft += 1;
      }
    }
  }
  return game.playersLeft;
}

function numReadyPlayers(game) {
  let playersReady = -1;
  if (game && game.players) {
    playersReady += 1;
    for (const id in game.players) {
      if (game.players[id].ready) {
        playersReady += 1;
      }
    }
  }
  return playersReady;
}

function numPlayers(game) {
  let players = 0;
  if (game && game.players) {
    for (const id in game.players) {
      if(id) {
        players++;
      }
    }
  }
  return players;
}

function checkForWinner(game) {
  if (updatePlayersLeft(game) <= PLAYERS_TO_WIN) {
    console.log('Reset game');
    game.loadTime = RESET_LENGTH;
    console.log('reset length is ' + RESET_LENGTH);
    game.state = 'POSTGAME';
    if (game.endTime === 0) {
      game.endTime = game.time;
    }
    for (const player of Object.values(game.players)) {
      if (player && (!player.lost) && player.inGame) {
        player.won = true;
        player.deathTime = game.time;
        game.winner = player.id;
      }
    }
  }
}

function checkInput(word, player, id) {
  if (!word) {
    return;
  }
  // console.log(word);
  if (word.toLowerCase() === player.nextWords[0].toLowerCase()) {
    player.rightAnswers++;
    player.nextWords.shift();
    const target = findTarget(gamesOnServer[player.room].players, id);
    if (gamesOnServer[player.room].players[target]) {
      gamesOnServer[player.room].players[target].nextWords.push(word);
      gamesOnServer[player.room].players[target].lastAttacker = id;
      gamesOnServer[player.room].players[target].timesAttacked += 1;
      player.lastTarget = gamesOnServer[player.room].players[target].name;
    }
  } else {
    player.wrongAnswers++;
    player.nextWords.shift();
    player.nextWords.push(randomWord());
    player.nextWords.push(randomWord());
  }
  player.prevWords.push(word);
}

function generateWords(game) {
  //generate words
  if (game && game.state && game.state === 'INGAME') {
    for (const player of Object.values(game.players)) {
      if (player && game.state === 'INGAME' && !player.won && !player.lost) {
        player.nextWords.push(randomWord());
      }
    }

    if (game.delay > MS_PER_WORD_MIN) {
      game.delay -= MS_PER_WORD_DELTA;
    }

    if (game.state === 'INGAME') {
      setTimeout(function() {generateWords(game);}, game.delay);
    }
  }
}

function resetGame(game) {
  game.state = 'LOBBY';
  game.playersLeft = 0;
  game.loadTime = COUNTDOWN_LENGTH;
  game.time = 0;
  game.inCountdown = false;
  game.delay = MS_PER_WORD_BASE;
  game.playersNeeded = MIN_PLAYERS_TO_START;

  for (const { name, id, room } of Object.values(game.players)) {
    game.players[id] = newPlayer(id);
    game.players[id].room = room;
    if(name) {
      game.players[id].name = name;
    }
  }
}

function updateGameState(game) {
  const time = Date.now();
  const deltaTime = time - game.lastTickTimeMs;
  game.lastTickTimeMs = time;

  if (game.state === 'LOBBY') {
    const playersReady = numReadyPlayers(game);
    game.playersNeeded = MIN_PLAYERS_TO_START - playersReady;
    if (playersReady >= MIN_PLAYERS_TO_START &&
        playersReady >= numPlayers(game)) {
      //start game!
      console.log('starting game');
      game.state = 'INGAME';
      game.inCountdown = true;

      for (const player of Object.values(game.players)) {
        if(player.ready) {
          player.inGame = true;
        }
      }
    }
  } else if (game.state === 'INGAME') {
    if (game.loadTime >= 0) {
      game.loadTime -= deltaTime;
    } else {
      game.time += deltaTime;
      if (game.inCountdown) {
        game.inCountdown = false;
        // kick off word generation
        generateWords(game);
      }

      //check if players are dead
      for (const player of Object.values(game.players)) {
        const hadLost = player.lost;
        player.lost = checkIfLost(player);
        if (!hadLost && player.lost) {
          player.deathTime = game.time;
          player.inGame = false;
          player.won = false;
          const killer = player.lastAttacker;
          if (game.players[killer]) {
            game.players[killer].kills++;
            game.players[killer].lastKilled = player.name;
          }
        }
      }
      game.playersLeft = updatePlayersLeft(game);
      checkForWinner(game);
    }
  } else if (game.state === 'POSTGAME') {
    if (game.loadTime >= 0) {
      game.loadTime -= deltaTime;
    } else {
      resetGame(game);
    }
  }
}

// Respond to inputs
io.on('connection', function(socket) {
  socket.on('new player', function() {
    const room = socket.handshake.query.room ?
      socket.handshake.query.room.toString() : '0';
    console.log(room);
    socket.join(room);
    playerRoomMap[socket.id] = room;
    if(!gamesOnServer[room]){
      gamesOnServer[room] = newGame(room);
    }
    gamesOnServer[room].players[socket.id] = newPlayer(socket.id, room);
  });

  socket.on('disconnect', function() {
    console.log('deleting ' + socket.id + ' from room ' + playerRoomMap[socket.id]);
    const room = playerRoomMap[socket.id];
    if (gamesOnServer[room]) {
      delete gamesOnServer[room].players[socket.id];
      delete playerRoomMap[socket.id];
      if (numPlayers(gamesOnServer[room]) <= 0) {
        setTimeout(function() {
          delete gamesOnServer[room];
          console.log('deleting game ' + room);
        }, 3000);
      }
    }
  });

  socket.on('name', function(data) {
    console.log('got name! ' + data.word);
    const room = getRoom(socket);
    gamesOnServer[room].players[socket.id].name = data.word;
    gamesOnServer[room].players[socket.id].ready = true;
  });

  socket.on('start', function(data) {
    console.log('starting game');
    const room = getRoom(socket);
    gamesOnServer[room].state = 'INGAME';
    gamesOnServer[room].inCountdown = true;
    console.log('players: ', gamesOnServer[room].players);
    for (const player of Object.values(gamesOnServer[room].players)) {
      if(player.ready) {
        player.inGame = true;
      }
    }
  });

  socket.on('input', function(data) {
    const room = getRoom(socket);
    if (gamesOnServer[room].state === 'INGAME') {
      const player = gamesOnServer[room].players[socket.id] || {};
      checkInput(data.word, player, socket.id);
    }
  });

  socket.on('screen_shake', data => {
    if (gameState.players[socket.id].canShake) {
      gameState.players[socket.id].canShake = false;

      // CD for the screen shake
      setTimeout(() => {
        gameState.players[socket.id].canShake = true;
      }, 30000);

      // Shake everyone elses screens
      const currentTime = Date.now();
      const otherPlayers = Object.entries(gameState.players).filter(
        ([id, player]) => id !== socket.id
      );
      otherPlayers.forEach(([id, player]) => {
        player.screenShakeUntilMs = currentTime + 5000;
      });
    }
  });
});

// Emit gamestate to players
setInterval(function() {
  for (const game in gamesOnServer){
    if(gamesOnServer[game]){
      // console.log(gamesOnServer[game]);
      if(numPlayers(gamesOnServer[game]) > 0){
        updateGameState(gamesOnServer[game]);
        io.to(game).emit('state', gamesOnServer[game]);
      }
    }
  }
}, 1000 / 60);