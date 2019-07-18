/*
  Basically, we want to refactor win checks, etc.
  out of player actions (just update to track state there)
*/

// Unpack config file
const config = require('config');
const WORDS = config.WORDS;
const MS_PER_WORD_BASE = config.MS_PER_WORD_BASE;
const MS_PER_WORD_MIN = config.MS_PER_WORD_MIN;
const MS_PER_WORD_DELTA = config.MS_PER_WORD_DELTA;
const WORDS_TO_LOSE = config.WORDS_TO_LOSE;
const MIN_PLAYERS_TO_START = config.MIN_PLAYERS_TO_START;
const COUNTDOWN_LENGTH = config.COUNTDOWN_LENGTH;
const RESET_LENGTH = config.RESET_LENGTH;
const PLAYERS_TO_WIN = config.PLAYERS_TO_WIN;
console.log(RESET_LENGTH);
console.log(PLAYERS_TO_WIN);

// Dependencies
const express = require('express');
const http = require('http');
const path = require('path');
const socketIO = require('socket.io');
const app = express();
const server = http.Server(app); // eslint-disable-line new-cap
const io = socketIO(server);
app.set('port', 5000);
app.use('/static', express.static(__dirname + '/static'));

// Route requests
app.get('/', function(request, response) {
  response.sendFile(path.join(__dirname, 'index.html'));
});

// Start the server.
server.listen(process.env.PORT || 5000, function() {
  console.log('Starting server on port 5000');
});

// Add the WebSocket handlers
io.on('connection', function(socket) {});

// Initialize the game state when we start the server
const gameState = {
  players: {},
  state: 'LOBBY', // LOBBY, INGAME
  playersLeft: 0,
  loadTime: COUNTDOWN_LENGTH,
  inCountdown: false,
  delay: MS_PER_WORD_BASE,
  playersNeeded: MIN_PLAYERS_TO_START,
  time: 0,
  endTime: 0,
  winner: '',
};

function randomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomWord() {
  return randomElement(WORDS);
}

function checkIfLost(player) {
  if (player && player.nextWords.length >= WORDS_TO_LOSE) {
    return true;
  }
  return false;
}

function newPlayer(socket) {
  return {
    prevWords: [],
    nextWords: [],
    lost: false,
    won: false,
    //target: findTarget(players, socket.id),
    lobbyIndex: gameState.players.length, //TODO; DYNAMICALLY FETCH THIS
    inGame: false,
    ready: false,
    name: '',
    kills: 0,
    wrongAnswers: 0,
    rightAnswers: 0,
    lastAttacker: '',
    winner: '',
    deathTime: 1,
  };
}

function findTarget(players, player) {
  const playerList = Object.keys(players);
  const filtered = playerList.filter(function(value, index, arr) {
    return (
      value !== player &&
      players[value].inGame &&
      !players[value].won &&
      !players[value].lost
    );
  });
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

function checkForWinner(game) {
  if (updatePlayersLeft(game) <= PLAYERS_TO_WIN) {
    console.log('Reset game');
    game.loadTime = RESET_LENGTH;
    console.log('reset length is ' + RESET_LENGTH);
    game.state = 'POSTGAME';
    if (game.endTime === 0) {
      game.endTime = game.time;
    }
    for (const player of game.players) {
      if (player && !player.lost) {
        player.won = true;
        game.winner = player.id;
      }
    }
  }
}

function checkInput(word, player, id) {
  if (!word) {
    return;
  }

  if (word.toLowerCase() === player.nextWords[0].toLowerCase()) {
    player.rightAnswers++;
    player.nextWords.shift();
    const target = findTarget(gameState.players, id);
    if (gameState.players[target]) {
      gameState.players[target].nextWords.push(word);
      gameState.players[target].lastAttacker = id;
    }
  } else {
    player.wrongAnswers++;
    player.nextWords.shift();
    player.nextWords.push(randomWord());
    player.nextWords.push(randomWord());
  }
  player.prevWords.push(word);
}

const generateWords = function() {
  //generate words
  for (const player of gameState.players) {
    if (player && gameState.state === 'INGAME' && !player.won && !player.lost) {
      player.nextWords.push(randomWord());
    }
  }

  if (gameState.delay > MS_PER_WORD_MIN) {
    gameState.delay -= MS_PER_WORD_DELTA;
  }

  if (gameState.state === 'INGAME') {
    setTimeout(generateWords, gameState.delay);
  }
};

function resetGame(game) {
  console.log('Updating game state');
  game.state = 'LOBBY';
  game.playersLeft = 0;
  game.loadTime = COUNTDOWN_LENGTH;
  game.inCountdown = false;
  game.delay = MS_PER_WORD_BASE;
  game.playersNeeded = MIN_PLAYERS_TO_START;

  for (const { name, id } of game.players) {
    game.players[id] = newPlayer();
    game.players[id].name = name;

    if (name.length > 0) {
      game.players[id].ready = true;
    }
  }
}

function updateGameState(game) {
  if (game.state === 'LOBBY') {
    const playersReady = numReadyPlayers(game);
    game.playersNeeded = MIN_PLAYERS_TO_START - playersReady;
    if (playersReady >= MIN_PLAYERS_TO_START) {
      //start game!
      console.log('starting game');
      game.state = 'INGAME';
      game.inCountdown = true;

      for (const player of game.players) {
        player.inGame = true;
      }
    }
  } else if (game.state === 'INGAME') {
    if (game.loadTime >= 0) {
      game.loadTime -= 1000 / 60;
    } else {
      game.time += 1000 / 60;
      if (game.inCountdown) {
        game.inCountdown = false;
        // kick off word generation
        generateWords(game, 0);
      }

      //check if players are dead
      for (const player of game.players) {
        const hadLost = player.lost;
        player.lost = checkIfLost(player);
        if (player.lost) {
          player.deathTime = game.time;
          const killer = player.lastAttacker;
          if (!hadLost && game.players[killer]) {
            game.players[killer].kills++;
          }
        }
      }
      game.playersLeft = updatePlayersLeft(game);
      checkForWinner(game);
    }
  } else if (game.state === 'POSTGAME') {
    if (game.loadTime >= 0) {
      game.loadTime -= 1000 / 60;
    } else {
      console.log(game.state);
      console.log(game.loadTime);
      resetGame(game);
    }
  }
}

// Respond to inputs
io.on('connection', function(socket) {
  socket.on('new player', function() {
    gameState.players[socket.id] = newPlayer(socket);
  });

  socket.on('disconnect', function() {
    console.log('deleting ' + socket.id);
    //let idToDelete = socket.id
    delete gameState.players[socket.id];
  });

  socket.on('name', function(data) {
    console.log('got name! ' + data.word);
    gameState.players[socket.id].name = data.word;
    gameState.players[socket.id].ready = true;
  });

  socket.on('start', function(data) {
    console.log('starting game');
    gameState.state = 'INGAME';
    gameState.inCountdown = true;
    for (const player of gameState.players) {
      player.inGame = true;
    }
  });

  socket.on('input', function(data) {
    if (gameState.state === 'INGAME') {
      const player = gameState.players[socket.id] || {};
      checkInput(data.word, player, socket.id);
    }
  });
});

// Emit gamestate to players
setInterval(function() {
  updateGameState(gameState);
  io.sockets.emit('state', gameState);
}, 1000 / 60);
