require('dotenv').config();

const http = require('http');
const express = require('express');
const createError = require('http-errors');
const logger = require('morgan');
const SocketEvent = require('./constants/socket');
const Counter = require('./utils/counter');

const app = express();
const port = process.env.PORT || 8000;

app.set('port', port);

const server = http.createServer(app);
const io = require('socket.io')(server, {
  cors: {
    origin: '*',
  },
});

const gameRoomList = [];
const counter = new Counter();

io.on('connection', socket => {
  console.log('socket has been successfully connected => User ID:', socket.id);

  socket.on('disconnect', () => {
    console.log(socket.id + 'has been disconnected');

    if (socket.userId) {
      io.to(socket.userId).emit(SocketEvent.REMOVE_CONTROLLER);
    }

    if (socket.gameId && !socket.isController) {
      let gameRoomIndex = -1;

      const gameRoom = gameRoomList.find((value, index) => {
        if (value.gameId === socket.gameId) {
          gameRoomIndex = index;
          return true;
        } else {
          return false;
        }
      });

      if (gameRoom && gameRoomIndex !== -1) {
        if (gameRoom.isStarted) {
          gameRoomList.splice(gameRoomIndex, 1);

          if (socket.id === gameRoom.hostId) {
            io.to(socket.gameId).emit(SocketEvent.RECEIVE_GUEST_WIN, {
              hostId: gameRoom.hostId,
              forfeit: true,
            });
            io.emit(SocketEvent.RECEIVE_GAME_ROOM_LIST, gameRoomList);
          } else {
            io.to(socket.gameId).emit(SocketEvent.RECEIVE_HOST_WIN, {
              hostId: gameRoom.hostId,
              forfeit: true,
            });
            io.emit(SocketEvent.RECEIVE_GAME_ROOM_LIST, gameRoomList);
          }
        } else {
          if (socket.id === gameRoom.hostId) {
            gameRoomList.splice(gameRoomIndex, 1);

            io.to(socket.gameId).emit(SocketEvent.RECEIVE_GO_TO_LOBBY);
            io.emit(SocketEvent.RECEIVE_GAME_ROOM_LIST, gameRoomList);
          } else {
            const exitedUserIndex = gameRoom.userList.findIndex(
              id => id === socket.id,
            );

            const exitedControllerIndex = gameRoom.controllerList.findIndex(
              id => id === socket.controllerId,
            );

            if (exitedControllerIndex !== -1) {
              gameRoom.controllerList.splice(exitedControllerIndex, 1);
            }

            if (exitedUserIndex !== -1) {
              gameRoom.userList.splice(exitedUserIndex, 1);

              io.to(socket.gameId).emit(
                SocketEvent.RECEIVE_ROOM_DATA,
                gameRoom,
              );
              io.emit(SocketEvent.RECEIVE_GAME_ROOM_LIST, gameRoomList);
            }
          }
        }
      }
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

  socket.on(SocketEvent.ENTER_CONTROLLER_MOTION_SETTING_PAGE, controllerId => {
    io.to(controllerId).emit(SocketEvent.LOAD_CONTROLLER_MOTION_SETTING_PAGE);
  });

  socket.on(SocketEvent.ENTER_CONTROLLER_GAME_PAGE, () => {
    io.to(socket.controllerId).emit(SocketEvent.LOAD_CONTROLLER_GAME_PAGE);
  });

  socket.on(SocketEvent.START_MOTION_SETTING, () => {
    io.to(socket.userId).emit(SocketEvent.RECEIVE_MOTION_SETTING_BEGIN);
    socket.emit(SocketEvent.LOAD_CONTROLLER_LEFT_SETTING_PAGE);
  });

  socket.on(SocketEvent.SEND_SENSOR_DATA, data => {
    if (data.type === 'turnLeft') {
      socket.leftAngle = data.value;

      io.to(socket.userId).emit(SocketEvent.RECEIVE_LEFT_DATA, data.value);
      socket.emit(SocketEvent.LOAD_CONTROLLER_RIGHT_SETTING_PAGE);
    }

    if (data.type === 'turnRight') {
      socket.rightAngle = data.value;

      io.to(socket.userId).emit(SocketEvent.RECEIVE_RIGHT_DATA, data.value);
      socket.emit(SocketEvent.LOAD_CONTROLLER_SETTING_FINISH_PAGE);
    }
  });

  socket.on(SocketEvent.SEND_EXIT, () => {
    io.to(socket.userId).emit(SocketEvent.RECEIVE_EXIT);
  });

  socket.on(SocketEvent.CREATE_GAME, game => {
    game.registrationOrder = counter.getCountNumber();
    gameRoomList.push(game);

    io.emit(SocketEvent.RECEIVE_GAME_ROOM_LIST, gameRoomList);
  });

  socket.on(SocketEvent.REQUEST_GAME_ROOM_LIST, () => {
    socket.emit(SocketEvent.RECEIVE_GAME_ROOM_LIST, gameRoomList);
  });

  socket.on(SocketEvent.SEND_JOIN_GAME, data => {
    const gameRoom = gameRoomList.find(value => value.gameId === data.gameId);

    if (!gameRoom) {
      socket.emit(SocketEvent.RECEIVE_JOIN_ERROR);
    } else if (gameRoom?.userList.length >= 2) {
      socket.emit(SocketEvent.RECEIVE_JOIN_ERROR);
    } else {
      if (gameRoom.width > data.width) {
        gameRoom.width = data.width;
      }

      if (gameRoom.height > data.height) {
        gameRoom.height = data.height;
      }

      socket.gameId = data.gameId;
      socket.controllerId = data.controllerId;
      gameRoom?.userList.push(socket.id);

      io.to(data.controllerId).emit(SocketEvent.RECEIVE_GAME_ID, data.gameId);
      socket.join(data.gameId);
      io.to(data.gameId).emit(SocketEvent.RECEIVE_ROOM_DATA, gameRoom);
    }
  });

  socket.on(SocketEvent.SEND_CONTROLLER_JOIN_GAME, gameId => {
    const gameRoom = gameRoomList.find(value => value.gameId === gameId);
    gameRoom?.controllerList.push(socket.id);

    socket.gameId = gameId;
    socket.isController = true;

    socket.join(gameId);
    io.to(gameId).emit(SocketEvent.RECEIVE_ROOM_DATA, gameRoom);
  });

  socket.on(SocketEvent.SEND_GAME_START, gameId => {
    gameRoomList.find(value => value.gameId === gameId).isStarted = true;

    io.to(gameId).emit(SocketEvent.RECEIVE_GAME_START);
    io.emit(SocketEvent.RECEIVE_GAME_ROOM_LIST, gameRoomList);
  });

  socket.on(SocketEvent.SEND_HOST_WIN, gameId => {
    const gameRoom = gameRoomList.find(value => value.gameId === gameId);
    gameRoom.isStarted = false;

    io.to(gameId).emit(SocketEvent.RECEIVE_HOST_WIN, {
      hostId: gameRoom.hostId,
      forfeit: false,
    });
  });

  socket.on(SocketEvent.SEND_GUEST_WIN, gameId => {
    const gameRoom = gameRoomList.find(value => value.gameId === gameId);
    gameRoom.isStarted = false;

    io.to(gameId).emit(SocketEvent.RECEIVE_GUEST_WIN, {
      hostId: gameRoom.hostId,
      forfeit: false,
    });
  });

  socket.on(SocketEvent.SEND_BETA, beta => {
    io.to(socket.gameId).emit(SocketEvent.RECEIVE_BETA, {
      userId: socket.userId,
      beta,
      leftAngle: socket.leftAngle,
      rightAngle: socket.rightAngle,
    });
  });

  socket.on(SocketEvent.SEND_ROOM_IS_FULL, gameId => {
    gameRoomList.find(value => value.gameId === gameId).isFull = true;

    io.emit(SocketEvent.RECEIVE_GAME_ROOM_LIST, gameRoomList);
  });

  socket.on(SocketEvent.SEND_ROOM_IS_NOT_FULL, gameId => {
    gameRoomList.find(value => value.gameId === gameId).isFull = false;

    io.emit(SocketEvent.RECEIVE_GAME_ROOM_LIST, gameRoomList);
  });

  socket.on(SocketEvent.REQUEST_EXIT_GAME, () => {
    io.to(socket.userId).emit(SocketEvent.RECEIVE_EXIT_GAME);
  });

  socket.on(SocketEvent.USER_EXIT_GAME, gameId => {
    let gameRoomIndex = -1;

    const gameRoom = gameRoomList.find((value, index) => {
      if (value.gameId === gameId) {
        gameRoomIndex = index;
        return true;
      } else {
        return false;
      }
    });

    if (gameRoom && gameRoomIndex !== -1 && socket.gameId === gameId) {
      if (gameRoom.isStarted) {
        gameRoomList.splice(gameRoomIndex, 1);

        if (socket.id === gameRoom.hostId) {
          io.to(gameId).emit(SocketEvent.RECEIVE_GUEST_WIN, {
            hostId: gameRoom.hostId,
            forfeit: true,
          });
          io.emit(SocketEvent.RECEIVE_GAME_ROOM_LIST, gameRoomList);
        } else {
          io.to(gameId).emit(SocketEvent.RECEIVE_HOST_WIN, {
            hostId: gameRoom.hostId,
            forfeit: true,
          });
          io.emit(SocketEvent.RECEIVE_GAME_ROOM_LIST, gameRoomList);
        }
      } else {
        if (socket.id === gameRoom.hostId) {
          gameRoomList.splice(gameRoomIndex, 1);

          io.to(gameId).emit(SocketEvent.RECEIVE_GO_TO_LOBBY);
          io.emit(SocketEvent.RECEIVE_GAME_ROOM_LIST, gameRoomList);
        } else {
          const exitedUserIndex = gameRoom.userList.findIndex(
            id => id === socket.id,
          );

          const exitedControllerIndex = gameRoom.controllerList.findIndex(
            id => id === socket.controllerId,
          );

          if (exitedControllerIndex !== -1) {
            gameRoom.controllerList.splice(exitedControllerIndex, 1);
          }

          if (exitedUserIndex !== -1) {
            gameRoom.userList.splice(exitedUserIndex, 1);

            io.to(gameId).emit(SocketEvent.RECEIVE_ROOM_DATA, gameRoom);
            io.emit(SocketEvent.RECEIVE_GAME_ROOM_LIST, gameRoomList);
          }
        }
      }
    }

    socket.gameId = '';
  });

  socket.on(SocketEvent.SEND_RESIZE_EVENT, gameId => {
    let gameRoomIndex = -1;

    const gameRoom = gameRoomList.find((value, index) => {
      if (value.gameId === gameId) {
        gameRoomIndex = index;
        return true;
      } else {
        return false;
      }
    });

    if (gameRoom.hostId === socket.id) {
      io.to(gameId).emit(SocketEvent.RECEIVE_GUEST_WIN, {
        hostId: gameRoom.hostId,
        forfeit: true,
      });
    } else {
      io.to(gameId).emit(SocketEvent.RECEIVE_HOST_WIN, {
        hostId: gameRoom.hostId,
        forfeit: true,
      });
    }

    gameRoomList.splice(gameRoomIndex, 1);
    io.emit(SocketEvent.RECEIVE_GAME_ROOM_LIST, gameRoomList);
  });

  socket.on(SocketEvent.SEND_HOST_PADDLE_VIBRATION, gameId => {
    const gameRoom = gameRoomList.find(value => value.gameId === gameId);

    if (socket.id === gameRoom.hostId) {
      io.to(socket.controllerId).emit(SocketEvent.RECEIVE_PADDLE_VIBRATION);
    }
  });

  socket.on(SocketEvent.SEND_GUEST_PADDLE_VIBRATION, gameId => {
    const gameRoom = gameRoomList.find(value => value.gameId === gameId);

    if (socket.id !== gameRoom.hostId) {
      io.to(socket.controllerId).emit(SocketEvent.RECEIVE_PADDLE_VIBRATION);
    }
  });

  socket.on(SocketEvent.SEND_GUEST_WIN_VIBRATION, gameId => {
    const gameRoom = gameRoomList.find(value => value.gameId === gameId);

    if (socket.id !== gameRoom.hostId) {
      io.to(socket.controllerId).emit(SocketEvent.RECEIVE_WIN_VIBRATION);
    }
  });

  socket.on(SocketEvent.SEND_GUEST_LOSE_VIBRATION, gameId => {
    const gameRoom = gameRoomList.find(value => value.gameId === gameId);

    if (socket.id !== gameRoom.hostId) {
      io.to(socket.controllerId).emit(SocketEvent.RECEIVE_LOSE_VIBRATION);
    }
  });

  socket.on(SocketEvent.SEND_HOST_WIN_VIBRATION, gameId => {
    const gameRoom = gameRoomList.find(value => value.gameId === gameId);

    if (socket.id === gameRoom.hostId) {
      io.to(socket.controllerId).emit(SocketEvent.RECEIVE_WIN_VIBRATION);
    }
  });

  socket.on(SocketEvent.SEND_HOST_LOSE_VIBRATION, gameId => {
    const gameRoom = gameRoomList.find(value => value.gameId === gameId);

    if (socket.id === gameRoom.hostId) {
      io.to(socket.controllerId).emit(SocketEvent.RECEIVE_LOSE_VIBRATION);
    }
  });

  socket.on(SocketEvent.SEND_MOTION_CHANGING_MODE_STATE, data => {
    io.to(data.controllerId).emit(
      SocketEvent.RECEIVE_MOTION_CHANGING_MODE_STATE,
      data.state,
    );
  });

  socket.on(SocketEvent.SEND_MOVE_UP, () => {
    io.to(socket.userId).emit(SocketEvent.RECEIVE_MOVE_UP);
  });

  socket.on(SocketEvent.SEND_MOVE_DOWN, () => {
    io.to(socket.userId).emit(SocketEvent.RECEIVE_MOVE_DOWN);
  });

  socket.on(SocketEvent.SEND_MOVE_LEFT, () => {
    io.to(socket.userId).emit(SocketEvent.RECEIVE_MOVE_LEFT);
  });

  socket.on(SocketEvent.SEND_MOVE_RIGHT, () => {
    io.to(socket.userId).emit(SocketEvent.RECEIVE_MOVE_RIGHT);
  });

  socket.on(SocketEvent.SEND_STOP_DETECT_MOTION, () => {
    io.to(socket.userId).emit(SocketEvent.RECEIVE_STOP_DETECT_MOTION);
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
