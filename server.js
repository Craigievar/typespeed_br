// Config
var config = require('config');
let WORDS = config.WORDS
let MS_PER_WORD_BASE = config.MS_PER_WORD_BASE
let WORDS_TO_LOSE = config.WORDS_TO_LOSE
let MIN_PLAYERS_TO_START = config.MIN_PLAYERS_TO_START
let COUNTDOWN_LENGTH = config.COUNTDOWN_LENGTH

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
  if (player.nextWords && player.nextWords.length >= WORDS_TO_LOSE) {
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
      nextWords: [randomWord()],
      lost: false,
      won: false,
      //target: findTarget(players, socket.id),
      lobbyIndex: players.length, //TODO; DYNAMICALLY FETCH THIS
      inGame: false,
      ready: false,
      name: '',
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
  //TODO -- filter to alive players and count. 
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
  //TODO -- filter to alive players and count. 
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

function updateGameState(gameState) {
  if (gameState.state === 'LOBBY') {
    var playersReady = numReadyPlayers(gameState)
    gameState.playersNeeded = MIN_PLAYERS_TO_START - playersReady
    if (playersReady >= MIN_PLAYERS_TO_START) {
      //start game!
      console.log("starting game")
      gameState.state = 'INGAME'
  
      for (var id in gameState.players) {
        gameState.players[id].inGame = true
      }

      setInterval(function() {
        for (var id in gameState.players) {
          if (gameState.players[id] && gameState.state == 'INGAME' && !gameState.players[id].won) {

            gameState.players[id].nextWords.push(randomWord());
            //console.log(players[socket.id].nextWords);
            gameState.players[id].lost = checkIfLost(gameState.players[id])
          }
        }
      }, MS_PER_WORD_BASE);

    }
  } else if (gameState.state === 'INGAME') {
    if (gameState.loadTime >= 0) {
      gameState.loadTime -= 1000/60
    }
    gameState.playersLeft = updatePlayersLeft(gameState)
    console.log(gameState.playersLeft)
    if(gameState.playersLeft === 1){
      gameState.players[Object.keys(gameState.players)[0]].won = true
    }
  }
}

var players = {};
var gameState = {
  players : players,
  state : 'LOBBY', // LOBBY, INGAME
  playersLeft : 0,
  loadTime: COUNTDOWN_LENGTH,
  playersNeeded: MIN_PLAYERS_TO_START,
};

// console.log(COUNTDOWN_LENGTH)
// console.log(gameState.loadTime)

io.on('connection', function(socket) {
  socket.on('new player', function() {
    players[socket.id] = newPlayer(socket)
    //console.log(players[socket.id].nextWords)
    // setInterval(function() {
    //   if (players[socket.id] && gameState.state == 'INGAME') {
    //   //console.log('in loop');
    //     players[socket.id].nextWords.push(randomWord());
    //     //console.log(players[socket.id].nextWords);
    //     players[socket.id].lost = checkIfLost(players[socket.id])
    //   }
    // }, MS_PER_WORD_BASE);
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

  socket.on('input', function(data) {
    if (gameState.state == 'INGAME') {
      var player = players[socket.id] || {};
      player.lost = checkIfLost(player)
      if (data.word) {

        //console.log("Word submitted!")
        if (data.word.toLowerCase() === player.nextWords[0].toLowerCase()){
          //console.log("Correct")
          var word = player.nextWords.shift()

          target = findTarget(players, socket.id)
          // console.log('target: ' + target)
          if (players[target]) { 
            players[target].nextWords.push(word)
          }
        }
        else {
          //console.log("Incorrect")
          player.nextWords.shift()
          player.nextWords.push(randomWord())
          player.nextWords.push(randomWord())
          
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
}, 1000 / 60);

// setInterval(function() {
//   for (var id in players) {
//     console.log('player '+id+' targeting ' + players[id].target)
//   }
// }, 5000);
