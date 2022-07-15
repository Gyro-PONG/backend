require('dotenv').config();

const http = require('http');
const express = require('express');
const createError = require('http-errors');
const logger = require('morgan');

const socketModule = require('./socket/index');

const app = express();
const port = process.env.PORT || 8000;

app.set('port', port);

const server = http.createServer(app);

server.listen(port, () => {
  console.log('server has been successfully created');
});

socketModule(server);

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get('/', (req, res, next) => {
  res.json('server_status_ok');
});

app.use((req, res, next) => {
  next(createError(404));
});

app.use((err, req, res, next) => {
  res.json({ code: err.status, message: err.message });
});

module.exports = app;
