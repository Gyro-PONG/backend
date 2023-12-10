import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';

import { connectionEvent } from './connection.js';
import { gameEvent } from './game.js';
import { sensorEvent } from './sensor.js';
import { soundEvent } from './sound.js';
import { vibrationEvent } from './vibration.js';
import { CLIENT_URL } from '../config/env.js';
import { EVENT } from '../constants/socket.js';
import { gameList, userList } from '../gameData/index.js';

export interface CustomSocket extends Socket {
  type?: 'controller' | 'user';
  leftAngle?: number;
  rightAngle?: number;
}

export const socketServer = (server: HttpServer) => {
  const io = new Server(server, {
    cors: {
      origin: CLIENT_URL,
    },
    transports: ['websocket'],
  });

  io.on('connection', (socket: CustomSocket) => {
    /**
     * disconnect 이벤트가 발생할 경우
     */
    socket.on('disconnect', () => {
      console.log(`disconnect ${socket.type} ${socket.id}`);

      if (socket.type === 'controller') {
        const user = userList.findByControllerId(socket.id);

        if (user) {
          user.reset();
          io.to(user.getUserId()).emit(EVENT.DISCONNECT_BY_CONTROLLER);
        }
      } else if (socket.type === 'user') {
        const user = userList.findByUserId(socket.id);
        const gameData = gameList.findByUserId(socket.id);

        if (gameData) {
          if (gameData.isHost) {
            io.to(gameData.game.getId()).emit(
              EVENT.EXIT_GAME_BY_HOST,
              gameData.game.getId(),
            );
            gameList.removeById(gameData.game.getId());
            io.emit(EVENT.LOAD_GAME_ROOM_LIST, gameList.getList());
          } else {
            gameData.game.setGuestId('');

            if (gameData.game.getIsStarted()) {
              gameList.removeById(gameData.game.getId());
            }

            io.to(gameData.game.getId()).emit(
              EVENT.EXIT_GAME_BY_GUEST,
              gameData.game.getId(),
            );
            io.emit(EVENT.LOAD_GAME_ROOM_LIST, gameList.getList());
          }
        }

        if (user) {
          io.to(user.getControllerId()).emit(EVENT.DISCONNECT_BY_USER);
          userList.removeById(user.getId());
        }
      }
    });

    connectionEvent(io, socket);
    sensorEvent(io, socket);
    gameEvent(io, socket);
    vibrationEvent(io, socket);
    soundEvent(io, socket);
  });
};
