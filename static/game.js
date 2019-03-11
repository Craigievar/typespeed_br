var socket = io();

socket.on('message', function(data) {
  console.log(data);
});

var input = {
  word: '',
}

var local = {
  currString: '', 
}

function isLetter(str) {
  return str.length === 1 && str.match(/[a-z]/i);
}

function renderCanvas(players){
  var canvas = document.getElementById('canvas');
  canvas.width = 800;
  canvas.height = 600;
  var ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 800, 600);
  var player = players[socket.io.engine.id];
  if (player) {
    ctx.font = '60px sans-serif';
    if (player.lost) {
      ctx.fillStyle = "#FF0000";
      ctx.fillText("You Lose", 15, canvas.height / 2);
      ctx.restore();
    } else {
      var lastWord = ''
      if (player.prevWords.length > 0) {
        lastWord = player.prevWords[player.prevWords.length-1]
      }
      var text_title = lastWord + ' ' + local.currString;
      ctx.fillText(lastWord, 15, canvas.height / 2);
      ctx.fillText(local.currString, 15, canvas.height / 2 +50);
      ctx.fillStyle = "#FF0000";
      ctx.fillText(player.nextWords.join(' '), 15, canvas.height/2-100)
      ctx.restore();
    }
   // }
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
  else if(event.keyCode === 32 || event.keyCode === 13){
    input.word = local.currString
    socket.emit('input', input);
    local.currString = ''
  }
  //console.log(String.fromCharCode(event.keyCode))
});


socket.emit('new player');

socket.on('state', function(gameState) {
  renderCanvas(gameState['players'])
});

