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
const server = http.Server(app);
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
io.on('connection', function(socket) {
});


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
      lobbyIndex: players.length, //TODO; DYNAMICALLY FETCH THIS
      inGame: false,
      ready: false,
      name: '',
      kills: 0,
      wrongAnswers: 0,
      rightAnswers: 0,
      lastAttacker: '',
      winner: '',
      deathTime: 1
    };
}

function findTarget(players, player) {
  var playerList = Object.keys(players);
  var filtered = playerList.filter(function(value, index, arr){
    return value != player && players[value].inGame && !players[value].won && !players[value].lost;
  });
  if (filtered.length > 0) {
    var randomId = randomElement(filtered);
    if(randomId) {
      return randomId;
    }
  }
  return '';
}

function updatePlayersLeft(gameState) {
  playersLeft = -1;
  if (gameState && gameState.players) {
    playersLeft += 1;
    for (var id in gameState.players) {
      if (!gameState.players[id].lost && gameState.players[id].inGame) {
        playersLeft += 1;
      }
    }
  }
  return playersLeft;
}

function numReadyPlayers(gameState) {
  playersReady = -1;
  if (gameState && gameState.players) {
    playersReady += 1;
    for (var id in gameState.players) {
      if (gameState.players[id].ready) {
        playersReady += 1;
      }
    }
  }
  return playersReady;
}

function checkForWinner(gameState) {
  if(updatePlayersLeft(gameState) <= PLAYERS_TO_WIN) {
    console.log("Reset game");
    gameState.loadTime = RESET_LENGTH;
    console.log("reset length is " + RESET_LENGTH);
    gameState.state = 'POSTGAME';
    if (gameState.endTime === 0) {
      gameState.endTime = gameState.time;
    }
    for (id in gameState.players) {
      if (gameState.players[id] && !gameState.players[id].lost){
        gameState.players[id].won = true;
        gameState.winner = id;
      }
    }
  }
}

function checkInput(word, player, id){
  if(!word){
    return;
  }

  if(word.toLowerCase() === player.nextWords[0].toLowerCase()){
    player.rightAnswers++;
    player.nextWords.shift();
    target = findTarget(players, id);
    if(players[target]){
      players[target].nextWords.push(word);
      players[target].lastAttacker = id;
    }
  }
  else {
    player.wrongAnswers++;
    player.nextWords.shift();
    player.nextWords.push(randomWord());
    player.nextWords.push(randomWord());
  }
  player.prevWords.push(word);
}

var generateWords = function (){
  //generate words
  for (var id in gameState.players) {
    if (gameState.players[id] && gameState.state == 'INGAME' &&
      !gameState.players[id].won && !gameState.players[id].lost) {
      gameState.players[id].nextWords.push(randomWord());
    }
  }


  if (gameState.delay > MS_PER_WORD_MIN) {
    gameState.delay -= MS_PER_WORD_DELTA;
  }

  if (gameState.state === 'INGAME') {
    setTimeout(generateWords, gameState.delay);
  }
};

function resetGame(gameState) {
  console.log("Updating game state");
  gameState.state = 'LOBBY';
  gameState.playersLeft = 0;
  gameState.loadTime = COUNTDOWN_LENGTH;
  gameState.inCountdown = false;
  gameState.delay = MS_PER_WORD_BASE;
  gameState.playersNeeded = MIN_PLAYERS_TO_START;

  for (var id in gameState.players){
    console.log(id);
    var name = players[id].name;
    console.log(name);
    players[id] = newPlayer();
    players[id].name = name;
    if (name.length > 0 ){
      players[id].ready = true;
    }
  }
}

function updateGameState(gameState) {
  if (gameState.state === 'LOBBY') {
    var playersReady = numReadyPlayers(gameState);
    gameState.playersNeeded = MIN_PLAYERS_TO_START - playersReady;
    if (playersReady >= MIN_PLAYERS_TO_START) {
      //start game!
      console.log("starting game");
      gameState.state = 'INGAME';
      gameState.inCountdown = true;

      for (var id in gameState.players) {
        gameState.players[id].inGame = true;
      }
    }
  }

  else if (gameState.state === 'INGAME') {
    if (gameState.loadTime >= 0) {
      gameState.loadTime -= 1000 / 60;
    } else {
      gameState.time += 1000 / 60;
      if (gameState.inCountdown) {
        gameState.inCountdown = false;
        // kick off word generation
        generateWords(gameState, 0);
      }

      //check if players are dead
      for (var id in gameState.players) {
        var hadLost = gameState.players[id].lost;
        gameState.players[id].lost = checkIfLost(gameState.players[id]);
        if(gameState.players[id].lost){
          gameState.players[id].deathTime = gameState.time;
          var killer = gameState.players[id].lastAttacker;
          if (!hadLost && gameState.players[killer]) {
            gameState.players[killer].kills++;
          }
        }
      }
      gameState.playersLeft = updatePlayersLeft(gameState);
      checkForWinner(gameState);
    }
  }

  else if (gameState.state === 'POSTGAME') {
    if (gameState.loadTime >= 0) {
      gameState.loadTime -= 1000 / 60;
    }
    else {
      console.log(gameState.state);
      console.log(gameState.loadTime);
      resetGame(gameState);
    }
  }
}

// Initialize the variables when we start the server

var gameState = {
  players : {},
  state : 'LOBBY', // LOBBY, INGAME
  playersLeft : 0,
  loadTime: COUNTDOWN_LENGTH,
  inCountdown: false,
  delay: MS_PER_WORD_BASE,
  playersNeeded: MIN_PLAYERS_TO_START,
  time: 0,
  endTime: 0,
  winner: ''
};

players = gameState.players;

// Respond to inputs
io.on('connection', function(socket) {
  socket.on('new player', function() {
    gameState.players[socket.id] = newPlayer(socket);
  });

  socket.on('disconnect', function() {
    console.log('deleting ' + socket.id);
    //var idToDelete = socket.id
    delete gameState.players[socket.id];
  });

  socket.on('name', function(data) {
    console.log('got name! ' + data.word);
    gameState.players[socket.id].name = data.word;
    gameState.players[socket.id].ready = true;
  });

  socket.on('start', function(data) {
    console.log("starting game");
    gameState.state = 'INGAME';
    gameState.inCountdown = true;
    for (var id in gameState.players) {
      gameState.players[id].inGame = true;
    }
  });

  socket.on('input', function(data) {
    if (gameState.state == 'INGAME') {
      var player = gameState.players[socket.id] || {};
      checkInput(data.word, player, socket.id);
      }
  });
});

// Emit gamestate to players
setInterval(function() {
  updateGameState(gameState);
  io.sockets.emit('state', gameState);
}, 1000 / 60);
