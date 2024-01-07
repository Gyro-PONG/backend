import { Server } from 'socket.io';

import { CustomSocket } from './index.js';
import { User } from '../class/User.js';
import { EVENT } from '../constants/socket.js';
import { gameList, userList } from '../gameData/index.js';

type Type = 'controller' | 'user';

export const connectionEvent = (io: Server, socket: CustomSocket) => {
  /**
   * 컨트롤러 -> 컨트롤러 || PC -> PC
   *
   * 클라이언트가 소켓 아이디를 요청한 경우 해당 소켓 아이디를 보낸다.
   */
  socket.on(EVENT.SOCKET_ID, (type: Type) => {
    socket.type = type;
    console.log(`REQUEST_SOCKET_ID ${type} ${socket.id}`);
    socket.emit(EVENT.SOCKET_ID, socket.id);
  });

  /**
   * 컨트롤러 -> PC && 컨트롤러 -> 컨트롤러 (유저 id 정상) || 컨트롤러 -> 컨트롤러 (유저 id 불량)
   *
   * 컨트롤러가 유저와의 연결을 요청한 경우, 우선 유저 아이디가 유효한지 확인한다.
   * 유효하지 않다면, 컨트롤러에게 유저 아이디가 유효하지 않다는 응답을 보낸다.
   * 유효하다면, 기존에 유저 객체가 있는지 검사한다. (기존에 생성된 유저가 새롭게 컨트롤러를 등록하고자 할 경우, 유저 객체가 존재할 수 있음)
   * 기존 유저 객체가 있다면, 해당 유저 객체에 컨트롤러 id를 담아 컨트롤러와의 연결이 성공했다는 응답을 보낸다.
   * 기존 유저 객체가 없다면, 유저 객체를 생성하여 userList에 추가한다.
   * 그리고 해당 유저에게 컨트롤러 id를 담아 컨트롤러와의 연결이 성공했다는 응답을 보낸다.
   * 컨트롤러와 유저는 같은 room에 join 해야 한다.
   */
  socket.on(EVENT.CONNECT_CONTROLLER, (userId: string) => {
    const isValidUser = io.sockets.sockets.get(userId);

    if (!isValidUser) {
      socket.emit(EVENT.INVALID_USER_ID);
      return;
    }

    const user = userList.findByUserId(userId);
    const controllerId = socket.id;

    if (user) {
      user.setControllerId(controllerId);
      socket.join(user.getId());
      io.to(userId).emit(EVENT.CONNECT_CONTROLLER_SUCCESS, controllerId);
      socket.emit(EVENT.CONNECT_CONTROLLER_SUCCESS);
    } else {
      const newUser = new User(userId, controllerId);

      userList.add(newUser);
      socket.join(newUser.getId());
      io.to(userId).emit(EVENT.CONNECT_CONTROLLER_SUCCESS, controllerId);
      socket.emit(EVENT.CONNECT_CONTROLLER_SUCCESS);
    }
  });

  /**
   * PC -> null
   *
   * 컨트롤러와 유저는 같은 room에 join 해야 한다.
   * 따라서 유저가 콜백을 보냈을 때, 앞서 등록한 컨트롤러와 같은 room에 join 한다.
   */
  socket.on(EVENT.CONNECT_CONTROLLER_CALLBACK, () => {
    const user = userList.findByUserId(socket.id);

    if (user) {
      socket.join(user.getId());
    }
  });

  /**
   * 컨트롤러 -> PC
   *
   * 컨트롤러가 disconnect 요청을 보낸다면, 컨트롤러 소켓을 disconnect한다.
   * 해당 컨트롤러와 연결되어있는 유저를 찾아서 컨트롤러 id를 제거한다.
   * 그리고 해당 유저에게 컨트롤러와의 연결이 끊어졌다는 응답을 보낸다.
   * 유저의 room을 제거한다.
   */
  socket.on(EVENT.DISCONNECT_BY_CONTROLLER, () => {
    const user = userList.findByControllerId(socket.id);

    if (user) {
      user.reset();
      io.to(user.getUserId()).emit(EVENT.DISCONNECT_BY_CONTROLLER);
      socket.leave(user.getId());
    }
    socket.disconnect();
  });

  /**
   * PC -> null
   *
   * 컨트롤러에 의해 disconnect 이벤트를 수신 받은 유저가 확인 콜백을 보낸 상황이다.
   * 유저는 자신의 room을 제거한다.
   */
  socket.on(EVENT.DISCONNECT_BY_CONTROLLER_CALLBACK, () => {
    const user = userList.findByUserId(socket.id);
    const gameData = gameList.findByUserId(socket.id);

    if (gameData) {
      if (gameData.game.getIsStarted()) {
        gameData.game.getEngine().stopLoop();
      }

      if (gameData.isHost) {
        io.to(gameData.game.getId()).emit(
          EVENT.EXIT_GAME_BY_HOST,
          gameData.game.getId(),
        );
        socket.leave(gameData.game.getId());
        gameList.removeById(gameData.game.getId());
        io.emit(EVENT.LOAD_GAME_ROOM_LIST, gameList.getList());
      } else {
        gameData.game.setGuestId('');
        socket.leave(gameData.game.getId());

        if (gameData.game.getIsStarted()) {
          gameList.removeById(gameData.game.getId());
          io.to(gameData.game.getId()).emit(
            EVENT.EXIT_GAME_BY_GUEST,
            gameData.game.getId(),
          );
        }
        io.emit(EVENT.LOAD_GAME_ROOM_LIST, gameList.getList());
      }
    }

    if (user) {
      socket.leave(user.getId());
    }
  });

  /**
   * PC -> 컨트롤러
   *
   * 유저가 disconnect 요청을 보낸다면, 컨트롤러에게 disconnect 요청을 보낸다.
   * 이후 유저의 컨트롤러 id를 제거한다.
   * 유저의 room을 제거한다.
   */
  socket.on(EVENT.DISCONNECT_BY_USER, () => {
    const user = userList.findByUserId(socket.id);

    if (user) {
      io.to(user.getControllerId()).emit(EVENT.DISCONNECT_BY_USER);
      user.reset();
      socket.leave(user.getId());
    }
  });

  /**
   * 컨트롤러 -> null
   *
   * 유저에 의해 disconnect 이벤트를 수신 받은 컨트롤러가 확인 콜백을 보낸 상황이다.
   * 컨트롤러는 자신의 소켓을 disconnect한다.
   */
  socket.on(EVENT.DISCONNECT_BY_USER_CALLBACK, () => {
    socket.disconnect();
  });
};
