import { Server } from 'socket.io';

import { CustomSocket } from './index.js';
import { EVENT } from '../constants/socket.js';
import { userList } from '../gameData/index.js';
import { getRevisedBeta } from '../utils/beta.js';

export const sensorEvent = (io: Server, socket: CustomSocket) => {
  /**
   * 컨트롤러 => 컨트롤러
   * eventListener로부터 얻은 센서 데이터가 null일 경우 컨트롤러에게 INVALID_SENSOR 응답을 보낸다.
   */
  socket.on(EVENT.INVALID_SENSOR, () => {
    socket.emit(EVENT.INVALID_SENSOR);
  });

  /**
   * 컨트롤러 -> PC || 컨트롤러 -> 컨트롤러
   * eventListener로부터 얻은 센서 데이터(beta)가 유효할 경우, 해당 데이터를 유저 및 컨트롤러에게 보낸다.
   * 이때 컨트롤러가 속해있는 room에 보낸다. (room에는 컨트롤러와 유저가 속해있다)
   */
  socket.on(EVENT.SEND_BETA, (beta: number) => {
    const gameRoom = [...socket.rooms][2];
    const userControllerRoom = [...socket.rooms][1];

    if (gameRoom) {
      // 게임 내에서 beta 전송
      io.to(gameRoom).emit(EVENT.SEND_GAME_BETA, {
        beta: getRevisedBeta(beta, socket),
        controllerId: socket.id,
      });
    } else if (userControllerRoom) {
      // 설정 페이지 내에서 beta 전송
      io.to(userControllerRoom).emit(EVENT.SEND_BETA, beta);
    } else {
      // 컨트롤러 검증 과정에서 beta 전송
      socket.emit(EVENT.SEND_BETA, beta);
    }
  });

  /**
   * 컨트롤러 -> PC
   * 환경설정 내 컨트롤러를 등록하는 과정에서, 유저에게 컨트롤러를 왼쪽으로 기울이라는 응답을 보낸다.
   */
  socket.on(EVENT.CHECK_LEFT, () => {
    const user = userList.findByControllerId(socket.id);

    if (user) {
      io.to(user.getUserId()).emit(EVENT.CHECK_LEFT);
    }
  });

  /**
   * 컨트롤러 -> PC
   * 환경설정 내 컨트롤러를 등록하는 과정에서, 유저에게 컨트롤러를 오른쪽으로 기울이라는 응답을 보낸다.
   */
  socket.on(EVENT.CHECK_RIGHT, (leftBeta: number) => {
    const user = userList.findByControllerId(socket.id);

    if (user) {
      user.setLeftAngle(leftBeta);
      socket.leftAngle = leftBeta;
      io.to(user.getUserId()).emit(EVENT.CHECK_RIGHT);
    }
  });

  /**
   * 컨트롤러 -> PC
   * 환경설정 내 컨트롤러를 등록하는 과정에서, 유저에게 컨트롤러 등록이 완료되었다는 응답을 보낸다.
   */
  socket.on(EVENT.CHECK_FINISH, (rightBeta: number) => {
    const user = userList.findByControllerId(socket.id);

    if (user) {
      user.setRightAngle(rightBeta);
      socket.rightAngle = rightBeta;
      io.to(user.getUserId()).emit(EVENT.CHECK_FINISH, {
        left: user.getLeftAngle(),
        right: user.getRightAngle(),
      });
    }
  });

  socket.on(EVENT.CHECK_CLOSE, () => {
    const userControllerRoom = [...socket.rooms][1];

    io.to(userControllerRoom).emit(EVENT.CHECK_CLOSE);
  });

  socket.on(EVENT.SET_MOTION, (set: boolean) => {
    const userControllerRoom = [...socket.rooms][1];

    io.to(userControllerRoom).emit(EVENT.SET_MOTION, set);
  });

  socket.on(EVENT.RESET_MOTION_DATA, () => {
    const userControllerRoom = [...socket.rooms][1];

    io.to(userControllerRoom).emit(EVENT.RESET_MOTION_DATA);
  });

  socket.on(EVENT.SEND_MOTION_UP, () => {
    const userControllerRoom = [...socket.rooms][1];

    io.to(userControllerRoom).emit(EVENT.SEND_MOTION_UP);
  });

  socket.on(EVENT.SEND_MOTION_DOWN, () => {
    const userControllerRoom = [...socket.rooms][1];

    io.to(userControllerRoom).emit(EVENT.SEND_MOTION_DOWN);
  });

  socket.on(EVENT.SEND_MOTION_LEFT, () => {
    const userControllerRoom = [...socket.rooms][1];

    io.to(userControllerRoom).emit(EVENT.SEND_MOTION_LEFT);
  });

  socket.on(EVENT.SEND_MOTION_RIGHT, () => {
    const userControllerRoom = [...socket.rooms][1];

    io.to(userControllerRoom).emit(EVENT.SEND_MOTION_RIGHT);
  });
};
