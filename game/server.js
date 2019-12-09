const express = require('express');
const path = require('path');
const app = express();

// Port is passed in by heroku
const port = process.env.PORT || 8080;

app.use(express.static(path.join(__dirname, 'build')));
app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});
app.listen(port);
