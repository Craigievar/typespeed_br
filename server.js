// Config
var config = require('./static/config.js');
let WORDS = config.WORDS
let MS_PER_WORD_BASE = config.MS_PER_WORD_BASE
let WORDS_TO_LOSE = config.WORDS_TO_LOSE

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
      //target: findTarget(players, socket.id),
      ready: false,
      lobbyIndex: 0, //TODO; DYNAMICALLY FETCH THIS
      in_game: false,
      name: '',
    } 
}

function findTarget(players, player) {
  var playerList = Object.keys(players)
  console.log('players' + playerList)
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

var players = {};
var gameState = {
  players : players,
  state : 'LOBBY' // LOBBY, INGAME
};

io.on('connection', function(socket) {
  socket.on('new player', function() {
    players[socket.id] = newPlayer(socket)
    //console.log(players[socket.id].nextWords)
    setInterval(function() {
        if (players[socket.id]) {
        //console.log('in loop');
        players[socket.id].nextWords.push(randomWord());
        //console.log(players[socket.id].nextWords);
        players[socket.id].lost = checkIfLost(players[socket.id])
      }
    }, MS_PER_WORD_BASE);
  }); 

  socket.on('disconnect', function() {
    console.log('deleting '+socket.id)
    var idToDelete = socket.id
    delete players[socket.id]    
  });

  socket.on('input', function(data) {
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
  });
});

setInterval(function() {
  io.sockets.emit('state', gameState);
}, 1000 / 60);

// setInterval(function() {
//   for (var id in players) {
//     console.log('player '+id+' targeting ' + players[id].target)
//   }
// }, 5000);
