import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';

console.log('public url: ', process.env.PUBLIC_URL);

if (process.env.REACT_APP_GAME_SERVER_URI !== undefined) {
  window.FBInstant.initializeAsync()
    .then(() => {
      window.FBInstant.startGameAsync()
        .then(() => {
          // const contextId = window.FBInstant.context.getID();
          // const contextType = window.FBInstant.context.getType();
          //
          // const playerName = window.FBInstant.player.getName();
          // const playerPic = window.FBInstant.player.getPhoto();
          // const playerId = window.FBInstant.player.getID();

          ReactDOM.render(<App />, document.getElementById('root'));
      });
    })
    .catch(e => {
      console.error(e);
    });
} else {
  ReactDOM.render(<App />, document.getElementById('root'));
}
