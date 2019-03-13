// Config
var config = require('config');
let WORDS = config.WORDS
let MS_PER_WORD_BASE = config.MS_PER_WORD_BASE
let MS_PER_WORD_MIN = config.MS_PER_WORD_MIN
let MS_PER_WORD_DELTA = config.MS_PER_WORD_DELTA
let WORDS_TO_LOSE = config.WORDS_TO_LOSE
let MIN_PLAYERS_TO_START = config.MIN_PLAYERS_TO_START
let COUNTDOWN_LENGTH = config.COUNTDOWN_LENGTH
let PLAYERS_TO_WIN = config.PLAYERS_TO_WIN

// Dependencies
var express = require('express');
var http = require('http');
var path = require('path');
var socketIO = require('socket.io');
var app = express();
var server = http.Server(app);
var io = socketIO(server);
app.set('port', 5000);
app.use('/static', express.static(__dirname + '/static'));
// Routing
app.get('/', function(request, response) {
  response.sendFile(path.join(__dirname, 'index.html'));
});
// Starts the server.
server.listen(5000, function() {
  console.log('Starting server on port 5000');
});

// Add the WebSocket handlers
io.on('connection', function(socket) {
});

function checkIfLost(player) {
  if (player && player.nextWords.length >= WORDS_TO_LOSE) {
    return true; 
  }
  return false;
}

function randomElement(array) {
  return array[Math.floor(Math.random()*array.length)]
}

function randomWord() {
  return randomElement(WORDS)
}

function newPlayer(socket) {
  return {
      x: 300,
      y: 300,
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
    } 
}

function findTarget(players, player) {
  var playerList = Object.keys(players)
  var filtered = playerList.filter(function(value, index, arr){
    return value != player
  });
  if (filtered.length > 0) {
    var randomId = randomElement(filtered)
    if(randomId) {
      return randomId
    }
  }
  return ''
}

function updatePlayersLeft(gameState) {
  playersLeft = -1
  if (gameState && gameState.players) {
    playersLeft += 1
    for (var id in gameState.players) {
      if (!gameState.players[id].lost) {
        playersLeft += 1
      }
    }
  }
  return playersLeft
}

function numReadyPlayers(gameState) {
  playersReady = -1
  if (gameState && gameState.players) {
    playersReady += 1
    for (var id in gameState.players) {
      if (gameState.players[id].ready) {
        playersReady += 1
      }
    }
  }
  return playersReady
}

function checkForWinner(gameState) {
  if(updatePlayersLeft(gameState) === PLAYERS_TO_WIN) {
    for (id in gameState.players) {
      if (gameState.players[id] && !gameState.players[id].lost){
        gameState.players[id].won = true
      }
    }
  }
}

var generateWords  = function (){
  //generate words
  for (var id in gameState.players) {
    if (gameState.players[id] && gameState.state == 'INGAME' && !gameState.players[id].won) {

      gameState.players[id].nextWords.push(randomWord());
      //console.log(players[socket.id].nextWords);
      gameState.players[id].lost = checkIfLost(gameState.players[id])
      if (gameState.players[id].lost) {
        if (gameState.players[gameState.players[id].lastAttacker]) {
          gameState.players[gameState.players[id].lastAttacker].kills++
        }
        checkForWinner(gameState)
      }
    }
  }

  if (gameState.delay > MS_PER_WORD_MIN) {
    gameState.delay -= MS_PER_WORD_DELTA
  }
  
  setTimeout(generateWords, gameState.delay)
}


function updateGameState(gameState) {
  if (gameState.state === 'LOBBY') {
    var playersReady = numReadyPlayers(gameState)
    gameState.playersNeeded = MIN_PLAYERS_TO_START - playersReady
    if (playersReady >= MIN_PLAYERS_TO_START) {
      //start game!
      console.log("starting game")
      gameState.state = 'INGAME'
      gameState.inCountdown = true
  
      for (var id in gameState.players) {
        gameState.players[id].inGame = true
      }
    }
  } else if (gameState.state === 'INGAME') {


    if (gameState.loadTime >= 0) {
      gameState.loadTime -= 1000/60
    } else {
      if (gameState.inCountdown) {
        gameState.inCountdown = false 
        // kick off word generation
        generateWords(gameState, 0)
      }

      gameState.playersLeft = updatePlayersLeft(gameState)
      //console.log(gameState.playersLeft)
      checkForWinner(gameState)
    }
  }
}

var players = {};
var gameState = {
  players : players,
  state : 'LOBBY', // LOBBY, INGAME
  playersLeft : 0,
  loadTime: COUNTDOWN_LENGTH,
  inCountdown: false,
  delay: MS_PER_WORD_BASE,
  playersNeeded: MIN_PLAYERS_TO_START,
};

io.on('connection', function(socket) {
  socket.on('new player', function() {
    players[socket.id] = newPlayer(socket)
  }); 

  socket.on('disconnect', function() {
    console.log('deleting '+socket.id)
    var idToDelete = socket.id
    delete players[socket.id]    
  });

  socket.on('name', function(data) {
    console.log('got name! '+data.word)
    players[socket.id].name = data.word
    players[socket.id].ready = true
  })

  socket.on('start', function(data) {
    console.log("starting game")
    gameState.state = 'INGAME'
    gameState.inCountdown = true

    for (var id in gameState.players) {
      gameState.players[id].inGame = true
    }
  })

  socket.on('input', function(data) {
    if (gameState.state == 'INGAME') {
      var player = players[socket.id] || {};
      player.lost = checkIfLost(player)
      if (data.word) {
        if (data.word.toLowerCase() === player.nextWords[0].toLowerCase()){
          //console.log("Correct")
          player.rightAnswers++
          var word = player.nextWords.shift()

          target = findTarget(players, socket.id)

          if (players[target]) { 
            players[target].nextWords.push(word)
            players[target].lastAttacker = socket.id
            players[target].lost = checkIfLost(player[target])
            if (player.lost && gameState.players[player.lastAttacker]) {
              gameState.players[player.lastAttacker].kills++
            }
            checkForWinner(gameState)
          }
        }
        else {
          //console.log("Incorrect")
          player.wrongAnswers++
          player.nextWords.shift()
          player.nextWords.push(randomWord())
          player.nextWords.push(randomWord())
          player.lost = checkIfLost(player)
          if (player.lost && players[player.lastAttacker]) {
            gameState.players[player.lastAttacker].kills++
          }
        }
        player.prevWords.push(data.word);
      }
    }
  });
});

setInterval(function() {
  //console.log(gameState)
  updateGameState(gameState)
  io.sockets.emit('state', gameState);
  //console.log(gameState.delay)
}, 1000 / 60);

