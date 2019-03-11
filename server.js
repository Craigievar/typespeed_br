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

setInterval(function() {
  io.sockets.emit('message', 'hi!');
}, 1000);

var words = ['Adult',
'Aeroplane',
'Air',
'Aircraft',
'Airforce',
'Airport',
'Album',
'Alphabet',
'Apple',
'Arm',
'Army',
'Baby',
'Baby',
'Backpack',
'Balloon',
'Banana',
'Bank',
'Barbecue',
'Bathroom',
'Bathtub',
'Bed',
'Bed',
'Bee',
'Bible',
'Bible',
'Bird',
'Bomb',
'Book',
'Boss',
'Bottle',
'Bowl',
'Box',
'Boy',
'Brain',
'Bridge',
'Butterfly',
'Button',
'Cappuccino',
'Car',
'Car',
'Carpet',
'Carrot',
'Cave',
'Chair',
'Chess Board',
'Chief',
'Child',
'Chisel',
'Chocolates',
'Church',
'Church',
'Circle',
'Circus',
'Circus',
'Clock',
'Clown',
'Coffee',
'Coffee',
'Comet',
'Compact',
'Compass',
'Computer',
'Crystal',
'Cup',
'Cycle',
'Data',
'Desk',
'Diamond',
'Dress',
'Drill',
'Drink',
'Drum',
'Dung',
'Ears',
'Earth',
'Egg',
'Electricity',
'Elephant',
'Eraser',
'Explosive',
'Eyes',
'Family',
'Fan',
'Feather',
'Festival',
'Film',
'Finger',
'Fire',
'Floodlight',
'Flower',
'Foot',
'Fork',
'Freeway',
'Fruit',
'Fungus',
'Game',
'Garden',
'Gas',
'Gate',
'Gemstone',
'Girl',
'Gloves',
'God',
'Grapes',
'Guitar',
'Hammer',
'Hat',
'Hieroglyph',
'Highway',
'Horoscope',
'Horse',
'Hose',
'Ice',
'Icecream',
'Insect',
'Jet',
'Junk',
'Kaleidoscope',
'Kitchen',
'Knife',
'Leather',
'Leg',
'Library',
'Liquid']

function randomWord() {
  return words[Math.floor(Math.random()*words.length)]
}

function randomWordList() {
  var arr = []
  for(i = 0; i< 5; i++) {
    arr.push(randomWord())
  }
  return arr[0]
}

function checkIfLost(player) {
  if (player.nextWords && player.nextWords.length >= 10) {
    return true; 
  }
  return false;
}

function findTarget(players, player) {
  var playerList = Object.keys(players)
  //console.log(playerList)
  var filtered = playerList.filter(function(value, index, arr){
    return value != player
  });
  //console.log(filtered)
  if (filtered.length > 0) {
    var randomId = filtered[Math.floor(Math.random()*playerList.length)]
    if(randomId) {
      return randomId
    }
  }
  return ''
}

var players = {};
io.on('connection', function(socket) {
  socket.on('new player', function() {
    players[socket.id] = {
      x: 300,
      y: 300,
      prevWords: [],
      nextWords: [randomWordList()],
      lost: false,
      target: findTarget(players, socket.id)
    };
    console.log(players[socket.id].nextWords)
    setInterval(function() {
        if (players[socket.id]) {
        //console.log('in loop');
        players[socket.id].nextWords.push(randomWord());
        //console.log(players[socket.id].nextWords);
        players[socket.id].lost = checkIfLost(players[socket.id])
      }
    }, 3000 );
  }); 

  socket.on('disconnect', function() {
    console.log('deleting '+socket.id)
    var idToDelete = socket.id
    delete players[socket.id]
    for (var id in players) {
      if(players[id].target === idToDelete){ 
        players[id].target = ''
      }
    }
    
  });

  socket.on('input', function(data) {
    var player = players[socket.id] || {};
    player.lost = checkIfLost(player)
    if (data.word) {

      console.log("Word submitted!")
      if (data.word.toLowerCase() === player.nextWords[0].toLowerCase()){
        //console.log("Correct")
        var word = player.nextWords.shift()
        console.log(word)
        if (players[player.target]) { 
          players[player.target].nextWords.push(word)
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
  io.sockets.emit('state', players);
  for (var id in players) {
    if (players[id].target === '') {
      players[id].target = findTarget(players, id)   
    }
  }
}, 1000 / 60);

setInterval(function() {
  for (var id in players) {
    console.log('player '+id+' targeting ' + players[id].target)
  }
}, 5000);
