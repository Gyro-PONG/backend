const socketIo = require('socket.io');

const SocketEvent = require('../constants/socket');
const {
  findGameRoom,
  addGameRoom,
  getGameRoomList,
  deleteGameRoom,
  setGameRoom,
} = require('../gameRoom');
const Counter = require('../utils/counter');

const counter = new Counter();

const socketModule = server => {
  const io = socketIo(server, {
    cors: {
      origin: '*',
    },
  });

  io.on('connection', socket => {
    console.log(
      'socket has been successfully connected => User ID:',
      socket.id,
    );

    socket.on('disconnect', () => {
      console.log(socket.id + 'has been disconnected');

      if (socket.userId) {
        io.to(socket.userId).emit(SocketEvent.REMOVE_CONTROLLER);
      }

      if (socket.gameId && !socket.isController) {
        const { gameRoom, gameRoomIndex } = findGameRoom(socket.gameId);

        if (gameRoom && gameRoomIndex !== -1) {
          if (gameRoom.isStarted) {
            deleteGameRoom(gameRoomIndex);

            if (socket.id === gameRoom.hostId) {
              io.to(socket.gameId).emit(SocketEvent.RECEIVE_GUEST_WIN, {
                hostId: gameRoom.hostId,
                forfeit: true,
              });
              io.emit(SocketEvent.RECEIVE_GAME_ROOM_LIST, getGameRoomList());
            } else {
              io.to(socket.gameId).emit(SocketEvent.RECEIVE_HOST_WIN, {
                hostId: gameRoom.hostId,
                forfeit: true,
              });
              io.emit(SocketEvent.RECEIVE_GAME_ROOM_LIST, getGameRoomList());
            }
          } else {
            if (socket.id === gameRoom.hostId) {
              deleteGameRoom(gameRoomIndex);

              io.to(socket.gameId).emit(SocketEvent.RECEIVE_GO_TO_LOBBY);
              io.emit(SocketEvent.RECEIVE_GAME_ROOM_LIST, getGameRoomList());
            } else {
              setGameRoom(
                gameRoomIndex,
                'deleteController',
                socket.controllerId,
              );
              setGameRoom(gameRoomIndex, 'deleteUser', socket.id);

              io.to(socket.gameId).emit(
                SocketEvent.RECEIVE_ROOM_DATA,
                gameRoom,
              );
              io.emit(SocketEvent.RECEIVE_GAME_ROOM_LIST, getGameRoomList());
            }
          }
        }
      }
    });

    socket.on(SocketEvent.SEND_TEST, data => {
      socket.emit(SocketEvent.RECEIVE_TEST, data);
    });

    socket.on(SocketEvent.REQUEST_USER_ID, () => {
      socket.emit(SocketEvent.RECEIVE_USER_ID, socket.id);
    });

    socket.on(SocketEvent.REGISTER_CONTROLLER_ID, userId => {
      socket.userId = userId;
      io.to(userId).emit(SocketEvent.RECEIVE_CONTROLLER_ID, socket.id);
      socket.emit(SocketEvent.LOAD_CONTROLLER_SENSOR_ACTIVATE_PAGE);
    });

    socket.on(SocketEvent.DISCONNECT_CONTROLLER, data => {
      if (data.sender === 'controller') {
        io.to(socket.userId).emit(SocketEvent.REMOVE_CONTROLLER);
      } else if (data.sender === 'settingPage') {
        io.to(data.controllerId).emit(SocketEvent.RECEIVE_EXPIRE_CONTROLLER);
        socket.emit(SocketEvent.REMOVE_CONTROLLER);
        socket.controllerId = '';
      }
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

    socket.on(
      SocketEvent.ENTER_CONTROLLER_MOTION_SETTING_PAGE,
      controllerId => {
        io.to(controllerId).emit(
          SocketEvent.LOAD_CONTROLLER_MOTION_SETTING_PAGE,
        );
      },
    );

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
      if (game.hostId === socket.id) {
        game.registrationOrder = counter.getCountNumber;
        addGameRoom(game);

        io.emit(SocketEvent.RECEIVE_GAME_ROOM_LIST, getGameRoomList());
      }
    });

    socket.on(SocketEvent.REQUEST_GAME_ROOM_LIST, () => {
      socket.emit(SocketEvent.RECEIVE_GAME_ROOM_LIST, getGameRoomList());
    });

    socket.on(SocketEvent.SEND_JOIN_GAME, data => {
      const { gameRoom, gameRoomIndex } = findGameRoom(data.gameId);

      if (!gameRoom || gameRoomIndex === -1) {
        socket.emit(SocketEvent.RECEIVE_JOIN_ERROR);
      } else if (gameRoom.userList.length >= 2) {
        socket.emit(SocketEvent.RECEIVE_JOIN_ERROR);
      } else {
        if (gameRoom.width > data.width) {
          setGameRoom(gameRoomIndex, 'width', data.width);
        }

        if (gameRoom.height > data.height) {
          setGameRoom(gameRoomIndex, 'height', data.height);
        }

        socket.gameId = data.gameId;
        socket.controllerId = data.controllerId;
        setGameRoom(gameRoomIndex, 'addUser', socket.id);

        io.to(data.controllerId).emit(SocketEvent.RECEIVE_GAME_ID, data.gameId);
        socket.join(data.gameId);
        io.to(data.gameId).emit(SocketEvent.RECEIVE_ROOM_DATA, gameRoom);
      }
    });

    socket.on(SocketEvent.SEND_CONTROLLER_JOIN_GAME, gameId => {
      const { gameRoom, gameRoomIndex } = findGameRoom(gameId);
      if (gameRoom && gameRoomIndex !== -1) {
        setGameRoom(gameRoomIndex, 'addController', socket.id);

        socket.gameId = gameId;
        socket.isController = true;
        socket.join(gameId);
        io.to(gameId).emit(SocketEvent.RECEIVE_ROOM_DATA, gameRoom);
      }
    });

    socket.on(SocketEvent.SEND_GAME_START, gameId => {
      const { gameRoomIndex } = findGameRoom(gameId);
      if (gameRoomIndex !== -1) {
        setGameRoom(gameRoomIndex, 'isStarted', true);

        io.to(gameId).emit(SocketEvent.RECEIVE_GAME_START);
        io.emit(SocketEvent.RECEIVE_GAME_ROOM_LIST, getGameRoomList());
      }
    });

    socket.on(SocketEvent.SEND_HOST_WIN, gameId => {
      const { gameRoom, gameRoomIndex } = findGameRoom(gameId);
      if (gameRoom && gameRoomIndex !== -1) {
        setGameRoom(gameRoomIndex, 'isStarted', false);

        io.to(gameId).emit(SocketEvent.RECEIVE_HOST_WIN, {
          hostId: gameRoom.hostId,
          forfeit: false,
        });
      }
    });

    socket.on(SocketEvent.SEND_GUEST_WIN, gameId => {
      const { gameRoom, gameRoomIndex } = findGameRoom(gameId);
      if (gameRoom && gameRoomIndex !== -1) {
        setGameRoom(gameRoomIndex, 'isStarted', false);

        io.to(gameId).emit(SocketEvent.RECEIVE_GUEST_WIN, {
          hostId: gameRoom.hostId,
          forfeit: false,
        });
      }
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
      const { gameRoomIndex } = findGameRoom(gameId);
      if (gameRoomIndex !== -1) {
        setGameRoom(gameRoomIndex, 'isFull', true);

        io.emit(SocketEvent.RECEIVE_GAME_ROOM_LIST, getGameRoomList());
      }
    });

    socket.on(SocketEvent.SEND_ROOM_IS_NOT_FULL, gameId => {
      const { gameRoomIndex } = findGameRoom(gameId);
      if (gameRoomIndex !== -1) {
        setGameRoom(gameRoomIndex, 'isFull', false);

        io.emit(SocketEvent.RECEIVE_GAME_ROOM_LIST, getGameRoomList());
      }
    });

    socket.on(SocketEvent.REQUEST_EXIT_GAME, () => {
      io.to(socket.userId).emit(SocketEvent.RECEIVE_EXIT_GAME);
    });

    socket.on(SocketEvent.USER_EXIT_GAME, gameId => {
      const { gameRoom, gameRoomIndex } = findGameRoom(gameId);

      if (gameRoom && gameRoomIndex !== -1 && socket.gameId === gameId) {
        if (gameRoom.isStarted) {
          deleteGameRoom(gameRoomIndex);

          if (socket.id === gameRoom.hostId) {
            io.to(gameId).emit(SocketEvent.RECEIVE_GUEST_WIN, {
              hostId: gameRoom.hostId,
              forfeit: true,
            });
            io.emit(SocketEvent.RECEIVE_GAME_ROOM_LIST, getGameRoomList());
          } else {
            io.to(gameId).emit(SocketEvent.RECEIVE_HOST_WIN, {
              hostId: gameRoom.hostId,
              forfeit: true,
            });
            io.emit(SocketEvent.RECEIVE_GAME_ROOM_LIST, getGameRoomList());
          }
        } else {
          if (socket.id === gameRoom.hostId) {
            deleteGameRoom(gameRoomIndex);

            io.to(gameId).emit(SocketEvent.RECEIVE_GO_TO_LOBBY);
            io.emit(SocketEvent.RECEIVE_GAME_ROOM_LIST, getGameRoomList());
          } else {
            setGameRoom(gameRoomIndex, 'deleteController', socket.controllerId);
            setGameRoom(gameRoomIndex, 'deleteUser', socket.id);

            io.to(gameId).emit(SocketEvent.RECEIVE_ROOM_DATA, gameRoom);
            io.emit(SocketEvent.RECEIVE_GAME_ROOM_LIST, getGameRoomList());
          }
        }
      }

      socket.gameId = '';
    });

    socket.on(SocketEvent.SEND_RESIZE_EVENT, gameId => {
      const { gameRoom, gameRoomIndex } = findGameRoom(gameId);

      if (gameRoom && gameRoomIndex !== -1) {
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

        deleteGameRoom(gameRoomIndex);
        io.emit(SocketEvent.RECEIVE_GAME_ROOM_LIST, getGameRoomList());
      }
    });

    socket.on(SocketEvent.SEND_HOST_PADDLE_VIBRATION, gameId => {
      const { gameRoom } = findGameRoom(gameId);

      if (gameRoom) {
        if (socket.id === gameRoom.hostId) {
          io.to(socket.controllerId).emit(SocketEvent.RECEIVE_PADDLE_VIBRATION);
        }
      }
    });

    socket.on(SocketEvent.SEND_GUEST_PADDLE_VIBRATION, gameId => {
      const { gameRoom } = findGameRoom(gameId);

      if (gameRoom) {
        if (socket.id !== gameRoom.hostId) {
          io.to(socket.controllerId).emit(SocketEvent.RECEIVE_PADDLE_VIBRATION);
        }
      }
    });

    socket.on(SocketEvent.SEND_GUEST_WIN_VIBRATION, gameId => {
      const { gameRoom } = findGameRoom(gameId);

      if (gameRoom) {
        if (socket.id !== gameRoom.hostId) {
          io.to(socket.controllerId).emit(SocketEvent.RECEIVE_WIN_VIBRATION);
        }
      }
    });

    socket.on(SocketEvent.SEND_GUEST_LOSE_VIBRATION, gameId => {
      const { gameRoom } = findGameRoom(gameId);

      if (gameRoom) {
        if (socket.id !== gameRoom.hostId) {
          io.to(socket.controllerId).emit(SocketEvent.RECEIVE_LOSE_VIBRATION);
        }
      }
    });

    socket.on(SocketEvent.SEND_HOST_WIN_VIBRATION, gameId => {
      const { gameRoom } = findGameRoom(gameId);

      if (gameRoom) {
        if (socket.id === gameRoom.hostId) {
          io.to(socket.controllerId).emit(SocketEvent.RECEIVE_WIN_VIBRATION);
        }
      }
    });

    socket.on(SocketEvent.SEND_HOST_LOSE_VIBRATION, gameId => {
      const { gameRoom } = findGameRoom(gameId);

      if (gameRoom) {
        if (socket.id === gameRoom.hostId) {
          io.to(socket.controllerId).emit(SocketEvent.RECEIVE_LOSE_VIBRATION);
        }
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
};

module.exports = socketModule;
