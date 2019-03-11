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

var isPressed = false;

function isLetter(str) {
  return str.length === 1 && str.match(/[a-z]/i);
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
  // space -- submit!
  else if(event.keyCode === 32){
    input.word = local.currString
    socket.emit('input', input);
    local.currString = ''
  }
  //console.log(String.fromCharCode(event.keyCode))
 

});


socket.emit('new player');
// setInterval(function() {
//   socket.emit('input', input);
// }, 1000 / 60);

var canvas = document.getElementById('canvas');
canvas.width = 800;
canvas.height = 600;
var ctx = canvas.getContext('2d');
socket.on('state', function(players) {
  
  ctx.clearRect(0, 0, 800, 600);
  ctx.fillStyle = 'green';
  //for (var id in players) {
  //console.log(socket.io.engine.id)
  //console.log(Object.keys(players))
  var player = players[socket.io.engine.id];
  if (player) {
  //console.log(player)
  //context.beginPath();
  //context.arc(player.x, player.y, 10, 0, 2 * Math.PI);
  //context.fill();
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
});