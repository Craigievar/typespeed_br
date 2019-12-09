const express = require('express');
const path = require('path');
const app = express();

// Port is passed in by heroku
const port = process.env.PORT || 8082;

app.listen(port);
