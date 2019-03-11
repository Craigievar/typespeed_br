var socket = io();

socket.on('message', function(data) {
  console.log(data);
});

var input = {
  word: '',
}

var local = {
  currString: '', 
  gameState: {},
}

function isLetter(str) {
  return str.length === 1 && str.match(/[a-z]/i);
}

function renderInGame(gameState){
  var players = gameState.players
  var canvas = document.getElementById('canvas');
  canvas.width = 800;
  canvas.height = 600;
  var ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 800, 600);

  console.log(gameState.loadTime)
  if(gameState.loadTime >= 0) {
    ctx.font = '60px sans-serif';
    ctx.fillStyle = "#008B00";
    ctx.fillText(Math.floor(gameState.loadTime/1000)+1, canvas.width/2, canvas.height / 2);
    ctx.restore();
  } else { 
    var player = players[socket.io.engine.id];
    if (player) {
      ctx.font = '60px sans-serif';
      if (player.lost) {
        ctx.fillStyle = "#FF0000";
        ctx.fillText("You Lose :(", 15, canvas.height / 2);
        ctx.restore();
      } else if (player.won) {
        ctx.fillStyle = "#008B00";
        ctx.fillText("You Win!!!", 15, canvas.height / 2);
        ctx.restore();
      }
      else {
        var lastWord = ''
        if (player.prevWords.length > 0) {
          lastWord = player.prevWords[player.prevWords.length-1]
        }
        ctx.fillText(lastWord, 15, canvas.height / 2);
        ctx.fillText(local.currString, 15, canvas.height / 2 +50);
        ctx.fillStyle = "#FF0000";
        ctx.fillText(player.nextWords.join(' '), 15, canvas.height/2-100)
        ctx.restore();
      }
    }
   // }
  }
}

function renderGetName(players){
  var canvas = document.getElementById('canvas');
  canvas.width = 800;
  canvas.height = 600;
  var ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 800, 600);
  var player = players[socket.io.engine.id];
  if (player) {
    ctx.font = '60px sans-serif';
    ctx.fillText(local.currString, 15, canvas.height / 2 +50);
    ctx.fillStyle = "#FF0000";
    ctx.fillText('Enter a nickname', 15, canvas.height/2-100);
    ctx.restore();
  }
}

function renderLobby(gameState){
  if(gameState) {
    var canvas = document.getElementById('canvas');
    canvas.width = 800;
    canvas.height = 600;
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 800, 600);
    ctx.font = '60px sans-serif';
    ctx.fillStyle = "#FF0000";
    ctx.fillText('Need ' + gameState.playersNeeded + ' more players to start', 
      15, canvas.height/2-100)
    ctx.restore
  }
}

document.addEventListener('keyup', function(event) {
  if(isLetter(String.fromCharCode(event.keyCode))) {
  	local.currString += String.fromCharCode(event.keyCode).toLowerCase();
  }
  // backspace
  else if(event.keyCode === 8) { 
    if (local.currString.length > 0) {
      local.currString = local.currString.substring(
        0, local.currString.length-1);
    }
  }
  // space or enter -- submit!
  else if(event.keyCode === 32){
    if(local.gameState.players[socket.io.engine.id] && !local.gameState.players[socket.io.engine.id].ready) {
      local.currString += ' '
    } else {
      input.word = local.currString
      socket.emit('input', input);
      local.currString = ''
    }
  }

  else if(event.keyCode === 13){
    if(local.gameState.players[socket.io.engine.id] && !local.gameState.players[socket.io.engine.id].ready) {
      socket.emit('name', {word : local.currString})
      local.currString = ''
    }
    else {
      input.word = local.currString
      socket.emit('input', input);
      local.currString = ''
    }
  }
  //console.log(String.fromCharCode(event.keyCode))
});


socket.emit('new player');

socket.on('state', function(gameState) {
  console.log(gameState)
  local.gameState = gameState
  //console.log(gameState.state)
  if (gameState.state === 'INGAME') {
    renderInGame(gameState)
  } else if (gameState.state === 'LOBBY') {
    if (gameState.players[socket.io.engine.id] && !gameState.players[socket.io.engine.id].ready) {
      renderGetName(gameState['players'])
    } else {
      renderLobby(gameState)
    }
  }
  
});

