require('dotenv').config();

const http = require('http');
const express = require('express');
const createError = require('http-errors');
const logger = require('morgan');
const SocketEvent = require('./constants/socket');

const app = express();
const port = process.env.PORT || 8000;

app.set('port', port);

const server = http.createServer(app);
const io = require('socket.io')(server, {
  cors: {
    origin: '*',
  },
});

io.on('connection', socket => {
  console.log('socket has been successfully connected => User ID:', socket.id);

  socket.on('disconnect', () => {
    console.log(socket.id + 'has been disconnected');

    if (socket.userId) {
      io.to(socket.userId).emit(SocketEvent.REMOVE_CONTROLLER);
    }
  });

  socket.on(SocketEvent.REQUEST_USER_ID, () => {
    socket.emit(SocketEvent.RECEIVE_USER_ID, socket.id);
  });

  socket.on(SocketEvent.REGISTER_CONTROLLER_ID, userId => {
    socket.userId = userId;
    io.to(userId).emit(SocketEvent.RECEIVE_CONTROLLER_ID, socket.id);
    socket.emit(SocketEvent.LOAD_CONTROLLER_SENSOR_ACTIVATE_PAGE);
  });

  socket.on(SocketEvent.DISCONNECT_CONTROLLER, () => {
    io.to(socket.userId).emit(SocketEvent.REMOVE_CONTROLLER);
  });

  socket.on(SocketEvent.CONTROLLER_COMPATIBILITY_SUCCESS, () => {
    io.to(socket.userId).emit(SocketEvent.CONTROLLER_CONNECTION_SUCCESS);
    socket.emit(SocketEvent.LOAD_CONTROLLER_CONNECTION_SUCCESS_PAGE);
  });

  socket.on(SocketEvent.SWITCH_MOTION_SETTING_PAGE, () => {
    io.to(socket.userId).emit(SocketEvent.RECEIVE_SWITCH_MOTION_SETTING_PAGE);
  });

  socket.on(SocketEvent.CONTROLLER_COMPATIBILITY_FAILURE, () => {
    io.to(socket.userId).emit(SocketEvent.CONTROLLER_CONNECTION_FAILURE);
  });

  socket.on(SocketEvent.ENTER_MOTION_SETTING_PAGE, controllerId => {
    io.to(controllerId).emit(SocketEvent.LOAD_CONTROLLER_MOTION_SETTING_PAGE);
  });

  socket.on(SocketEvent.START_MOTION_SETTING, () => {
    io.to(socket.userId).emit(SocketEvent.RECEIVE_MOTION_SETTING_BEGIN);
    socket.emit(SocketEvent.LOAD_CONTROLLER_LEFT_SETTING_PAGE);
  });

  socket.on(SocketEvent.SEND_SENSOR_DATA, data => {
    if (data.type === 'turnLeft') {
      io.to(socket.userId).emit(SocketEvent.RECEIVE_LEFT_DATA, data.value);
      socket.emit(SocketEvent.LOAD_CONTROLLER_RIGHT_SETTING_PAGE);
    }

    if (data.type === 'turnRight') {
      io.to(socket.userId).emit(SocketEvent.RECEIVE_RIGHT_DATA, data.value);
      socket.emit(SocketEvent.LOAD_CONTROLLER_FORWARD_SETTING_PAGE);
    }

    if (data.type === 'headForward') {
      io.to(socket.userId).emit(SocketEvent.RECEIVE_FORWARD_DATA, data.value);
      socket.emit(SocketEvent.LOAD_CONTROLLER_SETTING_FINISH_PAGE);
    }
  });

  socket.on(SocketEvent.SEND_EXIT, () => {
    io.to(socket.userId).emit(SocketEvent.RECEIVE_EXIT);
  });
});

server.listen(port, () => {
  console.log('server has been successfully created');
});

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
