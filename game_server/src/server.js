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
const MIN_PLAYERS_FOR_GAME = config.MIN_PLAYERS_FOR_GAME;
const BOT_DIFFICULTY = config.BOT_DIFFICULTY;

// Dependencies
const AgonesSDK = require('@google-cloud/agones-sdk');
let agonesSDK = new AgonesSDK();

const express = require('express');
const http = require('http');
const socketIO = require('socket.io');



const app = express();
const server = http.Server(app); // eslint-disable-line new-cap
//allow game-assets
let gs = process.env.GAME_ASSETS_SERVICE_HOST.replace("tcp://", "") + ':' + process.env.GAME_ASSETS_SERVICE_PORT;;
console.log('GS is at ' + gs)
const io = socketIO(server, {origins: '34.82.175.234:80'});
let gameStarted = false;

const path = require('path');

app.get('/ping', function (req, res) {
 return res.send('pong');
});

// In kubernetes we just leave the container port as 7030,
// for herokuapp/etc. we take their port.
const port = process.env.PORT || 7030;
app.set('port', port);

// Start the server.
server.listen(port, function() {
  console.log('[game_server]', 'Starting server on port ' + (port));
});

console.log('bot edition!')
// Map of the games on this server.
// For use in herokuapp, etc.; you can provide a ?room=x parameter
// To host multiple games on a single server.
// This is irrelevant in kubernetes. (TODO) If it's expensive
// we should un-refactor it
const gamesOnServer = {
};

// I hate that this exists.
// This is a map that keeps track of players' rooms (for referencing
// the players' game in gamesonserver across scopes)
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

// Util function to grab a random element from an arbitrary array
function randomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// This function returns a random word.
// TODO: pull WORDS from an API class so we can filter it/randomize it.
function randomWord() {
  return randomElement(WORDS);
}

// This function checks if a player has lost the game
function checkIfLost(player: Player) {
  if (player && player.nextWords.length >= WORDS_TO_LOSE) {
    return true;
  }
  return false;
}

// Util function to get the room associated with a socket.
function getRoom(socket){
  return Object.keys(socket.rooms)[0];
}

// Set up for my ghetto-ass class
// TODO: actually make a player class so we can have some methods
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
    isBot: false,
    difficulty: null,
  };
}

// Difficulty 1-100
function makeBot(num, difficulty, room) {
  return {
    prevWords: [],
    nextWords: [],
    lost: false,
    won: false,
    //target: findTarget(players, socket.id),
    lobbyIndex: numPlayers(gamesOnServer[room]), //TODO; DYNAMICALLY FETCH THIS
    inGame: true,
    id: 'bot' + num,
    ready: true,
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
    isBot: true,
    difficulty: difficulty,
  };
}

function makeBots(game){
  const room = game.room;
  console.log('Considering making bots');

  if(numReadyPlayers(game) >= MIN_PLAYERS_FOR_GAME){
    console.log('No need to make bots');
    return;
  }

  const gap = (MIN_PLAYERS_FOR_GAME - numReadyPlayers(game));
  console.log('Filling gap');
  for(let i = 0; i < gap; i++){
    console.log('Making bot ' + i);
    game.players[i] = makeBot(i, BOT_DIFFICULTY, game.room);
    console.log('added bot player');
    game.players[i].name = ('bot' + i);
    console.log('named bot');
    setTimeout(function() {
      botWordLoop(i, room);
    }, getBotWordTimeout(game.players[i].difficulty));
  }
}

function botWordLoop(id, game){
  console.log('Bot word loop');

  if(!gamesOnServer[game] || !gamesOnServer[game].players){
    console.log("Can't find game or players!");
    return;
  }
  //
  const player = gamesOnServer[game].players[id];
  if(player && !player.lost && player.inGame) {
    //sendword
    console.log("Bot Attacking");
    player.nextWords.shift();

    const target = findTarget(gamesOnServer[player.room].players, id);
    if (gamesOnServer[player.room].players[target]) {
      gamesOnServer[player.room].players[target].nextWords.push(randomWord());
      gamesOnServer[player.room].players[target].lastAttacker = id;
      gamesOnServer[player.room].players[target].timesAttacked += 1;
      player.lastTarget = gamesOnServer[player.room].players[target].name;
    }

    setTimeout(function() {
      botWordLoop(id, game);
    }, getBotWordTimeout(player.difficulty));
    // setTimeout(
    //     botWordLoop,
    //     getBotWordTimeout(game.players[id].difficulty),
    //     id, //bot id
    //     game
    // )
  }


}

function getBotWordTimeout(difficulty){
  return (3000 - ((100+Math.min(difficulty, 200)) * 10 * Math.random())); //timeout in MS
}

// Picks a random, living other player for the player's attack target
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

// Checks the number of players in the game who are alive
// meaning they have not died yet :^)
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

// Check the number of players in the game who are 'ready',
// which currently just means they have a name.
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

// Check the number of players in the game
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


// This function checks if the game currently has a winner,
// and moves the gamestate to postgame if there is one.
function checkForWinner(game) {
  if (updatePlayersLeft(game) <= PLAYERS_TO_WIN) {
    console.log('[game_server]', 'Reset game');
    game.loadTime = RESET_LENGTH;
    console.log('[game_server]', 'reset length is ' + RESET_LENGTH);
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

// Compare user input to the current word they should be submitting.
// If it's correct, it deletes the word, adds a new one to the end of their
// queue, and then sends that word to a random target as well as handling
// some data around attack history.
// If it's incorrect, it deletes the word and adds two random words
// to the player's queue.
// TODO: use player.prevWords in postgame lobby to show them the words
// they typed!
function checkInput(word, player, id) {
  if (!word) {
    return;
  }
  // console.log('[game_server]', word);
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

// Generate words for the game, which is currently self-triggered by
// on a variable timer which decreases over time (maybe not needed)
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

// This function kills the server, triggered by maybeKillServer();
// The steps are: shutting down and closing the agones SDK, and then
// killing the process itself (which is a bit redundant)
function killServer() {
  console.log('[game_server] Killing Server')
  console.log('[game_server] Agones shutdown: 1s');
  setTimeout(() => {
    agonesSDK.shutdown();
    console.log('...marked for Shutdown');
  }, 1000);

  console.log('[game_server] Agones close: 2s');
  setTimeout(() => {
      agonesSDK.close();
  }, 2000);

  console.log('[game_server] process exit: 3s');
  setTimeout(() => {
    process.exit(0);
  }, 3000);
}

// This function checks if we should kill this server.
// It kills the server if there are no rooms left, or no players left
// On the server (after the game has started; before any players join,
// it's of course safe)
function maybeKillServer() {
  console.log('[MaybeKillServer] Checking if we should kill the server');
  let totalPlayers = 0;
  let gameCount = Object.keys(gamesOnServer).length;
  for (const game in gamesOnServer){
    if(gamesOnServer[game]){
      totalPlayers += numPlayers(gamesOnServer[game]);
    }
  }
  console.log('[MaybeKillServer] ' + gameCount + ' games and ' + totalPlayers + ' players');
  if(gameStarted && (gameCount === 0 || totalPlayers === 0)){
    killServer();
  }
}

// TODO: remove unecessary code. This interacts weirdly with the client code,
// and it going to lobby is part of the trigger for the MM to reconnect
// users to a new game client right now.
// At the end of this process we check if we should kill the server
// (which should always be yes - we punt the users at the end of the
// post-game countdown)
function resetGame(game) {
  // process.exit();
  game.state = 'LOBBY';
  game.loadTime = COUNTDOWN_LENGTH;
  game.time = 0;
  game.inCountdown = false;
  game.playersNeeded = MIN_PLAYERS_TO_START;
  for (const { name, id, room } of Object.values(game.players)) {
    game.players[id] = newPlayer(id);
    game.players[id].room = room;
    if(name) {
      game.players[id].name = name;
    }
    if(game.players[id].bot){
      delete game.players[id];
    }
  }
  setTimeout(() => {
    maybeKillServer();
  }, 15000);
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
      console.log('[game_server]', 'updateGameState starting game', game);
      game.state = 'INGAME';
      gameStarted = true;
      game.inCountdown = true;

      console.log('Making bots!');
      makeBots(game);

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

// Socket code for responding to network events
// Initial setup includes handling rooms, playerids,
// and setting up player objects.
io.on('connection', function(socket) {
  socket.on('new player', function() {
    console.log('New Player!');
    const room = socket.handshake.query.room ?
      socket.handshake.query.room.toString() : '0';
    console.log('[game_server]', room);
    socket.join(room);
    playerRoomMap[socket.id] = room;
    if(!gamesOnServer[room]){
      gamesOnServer[room] = newGame(room);
    }
    gamesOnServer[room].players[socket.id] = newPlayer(socket.id, room);
  });

  // handle disconnects from clients. Note;
  // this has been a bit flaky in the past.
  // Includes a health check to kill empty rooms or servers
  socket.on('disconnect', function() {
    console.log('[game_server]', 'deleting ' + socket.id + ' from room ' + playerRoomMap[socket.id]);
    const room = playerRoomMap[socket.id];
    if (gamesOnServer[room]) {
      delete gamesOnServer[room].players[socket.id];
      delete playerRoomMap[socket.id];
      if (numPlayers(gamesOnServer[room]) <= 0) {
        setTimeout(function() {
          console.log('[game_server]', 'deleting game ' + room);
          delete gamesOnServer[room];
          console.log('[game_server]', 'checking if we should kill server');
          maybeKillServer();
        }, 3000);
      }
    }
  });

  // code to receive players' names. Note this message is now
  // forwarded from the matchmaking progress.
  socket.on('name', function(data) {
    console.log('[game_server]', 'got name! ', data);
    const room = getRoom(socket);
    gamesOnServer[room].players[socket.id].name = data.word;
    gamesOnServer[room].players[socket.id].ready = true;
  });

  // code to set up the server's post-lobby game state
  socket.on('start', function(data) {
    console.log('[game_server]', 'starting game');
    const room = getRoom(socket);
    gamesOnServer[room].state = 'INGAME';
    gameStarted = true;
    gamesOnServer[room].inCountdown = true;
    console.log('[game_server]', 'players: ', gamesOnServer[room].players);
    for (const player of Object.values(gamesOnServer[room].players)) {
      if(player.ready) {
        player.inGame = true;
      }
    }
  });

  // code to handle the user input for the game
  socket.on('input', function(data) {
    const room = getRoom(socket);
    if (gamesOnServer[room].state === 'INGAME') {
      const player = gamesOnServer[room].players[socket.id] || {};
      checkInput(data.word, player, socket.id);
    }
  });

  // code to handle the screen shake triggered by tilde
  socket.on('screen_shake', data => {
    const room = getRoom(socket);
    if(gamesOnServer && gamesOnServer[room] && gamesOnServer[room].state === 'INGAME') {
      const player = gamesOnServer[room].players[socket.id] || {}
      if (player.canShake) {
        player.canShake = false;

        // CD for the screen shake
        setTimeout(() => {
          player.canShake = true;
        }, 30000);

        // Shake everyone elses screens
        const currentTime = Date.now();
        const otherPlayers = Object.entries(gamesOnServer[room].players).filter(
          ([id, player]) => id !== socket.id
        );
        otherPlayers.forEach(([id, player]) => {
          player.screenShakeUntilMs = currentTime + 5000;
        });
      }
    }
  });
});

// This async function connects to the agones SDK,
// And lets agones know the server is ready to be used.
// It also starts a looping health check; if the health check isn't
// received by agones for 4s+, it considers the server unhealthy.
const setupAgones = async () => {
  await agonesSDK.connect();

  setInterval(() => {
    // console.log('send health ping: ' + Date.now().toString());
    agonesSDK.health();
  }, 500);

  console.log('Marking as ready')
  let result = await agonesSDK.ready();
  console.log('Marked as ready');
}

console.log('Setting up Agones')
setupAgones();


console.log('Starting main loop');
// Emit gamestate to players
setInterval(function() {
  for (const game in gamesOnServer){
    if(gamesOnServer[game]){
      if(numPlayers(gamesOnServer[game]) > 0){
        updateGameState(gamesOnServer[game]);
        io.to(game).emit('state', gamesOnServer[game]);
      }
    }
  }
}, 1000 / 30);

// check to kill server in case we miss a disconnect
setInterval(function() {
  console.log('[game_server][health check] check if should kill');
  maybeKillServer();
}, 30000);
