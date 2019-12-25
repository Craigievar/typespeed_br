const express = require('express');
const path = require('path');
const app = express();

// Port is passed in by heroku
const port = process.env.PORT || 8080;

app.use(express.static(path.join(__dirname, 'build')));

app.get('/', function(req, res) {
  console.log("[Game-Assets] Sending index.html");
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.get('/matchmaker', function(req, res) {
  res.json({
    server: process.env.REACT_APP_MATCHMAKER_SERVICE,
  });
});

app.listen(port);
