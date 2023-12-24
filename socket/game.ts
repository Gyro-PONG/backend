import { Server, Socket } from 'socket.io';

import { Game } from '../class/Game.js';
import { GameEngine } from '../class/GameEngine.js';
import { EVENT } from '../constants/socket.js';
import { gameList, userList } from '../gameData/index.js';

export const gameEvent = (io: Server, socket: Socket) => {
  interface GameInfo {
    level: string;
    targetScore: number;
  }

  /**
   * PC -> PC || PC -> 컨트롤러
   * host 유저가 게임 생성을 요청할 경우, 게임을 생성한다.
   * 게임 생성에 성공하면, 성공 응답을 host 유저 및 host 컨트롤러에게 보낸다.
   * 이후 host 유저는 게임 room에 join한다.
   * 또한 host를 제외한 모든 유저에게 갱신된 gameList를 보낸다.
   */
  socket.on(EVENT.CREATE_GAME, (gameInfo: GameInfo) => {
    const newGame = new Game(socket.id, gameInfo.level, gameInfo.targetScore);
    const user = userList.findByUserId(socket.id);
    const userControllerRoom = [...socket.rooms][1];

    if (user) {
      io.to(userControllerRoom).emit(EVENT.CREATE_GAME_SUCCESS, {
        gameId: newGame.getId(),
        targetScore: gameInfo.targetScore,
        level: gameInfo.level,
        host: { userId: socket.id, controllerId: user.getControllerId() },
      });

      gameList.add(newGame);
      socket.join(newGame.getId());
      socket.broadcast.emit(EVENT.LOAD_GAME_ROOM_LIST, gameList.getList());
    }
  });

  /**
   * 컨트롤러 -> null
   * host 컨트롤러가 새롭게 생성된 게임 room에 join한다.
   */
  socket.on(EVENT.CREATE_GAME_CALLBACK, (gameId: string) => {
    socket.join(gameId);
  });

  /**
   * PC -> PC
   * 유저가 생성되어있는 게임 리스트를 요청할 경우, 이를 보낸다.
   */
  socket.on(EVENT.LOAD_GAME_ROOM_LIST, () => {
    socket.emit(EVENT.LOAD_GAME_ROOM_LIST, gameList.getList());
  });

  /**
   * PC -> PC
   * guest 유저가 생성되어 있는 게임에 참여할 경우, 이를 guest 컨트롤러 및 host에게 전달한다.
   * 또한 갱신된 게임 리스트를 모든 유저에게 보낸다.
   */
  socket.on(EVENT.JOIN_GAME, (gameId: string) => {
    const game = gameList.findById(gameId);
    const userControllerRoom = [...socket.rooms][1];

    if (game) {
      const host = game.getHostId();
      io.to(host).emit(EVENT.JOIN_GAME);
      socket.to(userControllerRoom).emit(EVENT.JOIN_GAME, gameId);
      socket.join(gameId);
      game.setGuestId(socket.id);
      io.emit(EVENT.LOAD_GAME_ROOM_LIST, gameList.getList());
    }
  });

  /**
   * 컨트롤러 -> null
   * guest 컨트롤러가 새롭게 생성된 게임 room에 join한다.
   */
  socket.on(EVENT.JOIN_GAME_CALLBACK, (gameId: string) => {
    socket.join(gameId);
  });

  /**
   * PC -> PC || PC -> 컨트롤러
   * host가 게임을 나갈 경우 게임 리스트에서 게임을 제거한다.
   * 그리고 이를 host 컨트롤러 및 guest에게 전달한다.
   * 또한 host는 게임 room에서 나간다.
   * 갱신된 게임 리스트를 모든 유저에게 보낸다.
   */
  socket.on(EVENT.EXIT_GAME_BY_HOST, () => {
    const user = userList.findByUserId(socket.id);
    const gameRoom = [...socket.rooms][2];

    if (user) {
      const game = gameList.findByHostId(user.getUserId());

      if (game) {
        socket.to(gameRoom).emit(EVENT.EXIT_GAME_BY_HOST, game.getId());
        socket.leave(game.getId());
        gameList.removeById(game.getId());
        io.emit(EVENT.LOAD_GAME_ROOM_LIST, gameList.getList());
      }
    }
  });

  /**
   * PC -> 컨트롤러
   * host가 게임에 나갔다고 전달받은 guest는 게임 room에서 나간다.
   * 또한 이를 guest 컨트롤러에게 전달한다.
   */
  socket.on(EVENT.EXIT_GAME_BY_HOST_CALLBACK, (gameId: string) => {
    const userControllerRoom = [...socket.rooms][1];

    socket.leave(gameId);
    socket.to(userControllerRoom).emit(EVENT.EXIT_GAME_CALLBACK, gameId);
  });

  /**
   * PC -> PC
   * 게스트가 게임을 나갈 경우, 게임 내 게스트 id를 초기화 한다.
   * 그리고 이를 guest 컨트롤러 및 host에게 전달한다.
   * 또한 게스트는 게임 room에서 나간다.
   * 이후 갱신된 게임 리스트를 모든 유저에게 보낸다.
   */
  socket.on(EVENT.EXIT_GAME_BY_GUEST, () => {
    const game = gameList.findByGuestId(socket.id);
    const userControllerRoom = [...socket.rooms][1];

    if (game) {
      game.setGuestId('');
      socket.leave(game.getId());
      io.to(game.getHostId()).emit(EVENT.EXIT_GAME_BY_GUEST);
      socket
        .to(userControllerRoom)
        .emit(EVENT.EXIT_GAME_BY_GUEST, game.getId());
      io.emit(EVENT.LOAD_GAME_ROOM_LIST, gameList.getList());
    }
  });

  /**
   *
   */
  socket.on(EVENT.EXIT_GAME_BY_GUEST_CALLBACK, (gameId: string) => {
    socket.leave(gameId);
  });

  /**
   * 컨트롤러 -> null
   * 컨트롤러는 게임 room에서 나간다.
   */
  socket.on(EVENT.EXIT_GAME_CALLBACK, (gameId: string) => {
    socket.leave(gameId);
  });

  /**
   * PC -> PC || PC -> 컨트롤러
   * host가 게임을 시작할 경우, 게임 room에 있는 모든 유저에게 게임 시작을 알린다.
   * 게임 시작을 알릴 때, 게임 레벨과 목표 점수, host 컨트롤러 id를 전달한다.
   */
  socket.on(EVENT.START_GAME, () => {
    const user = userList.findByUserId(socket.id);
    const game = gameList.findByHostId(socket.id);
    const gameRoom = [...socket.rooms][2];

    if (game && user) {
      game.setStarted(true);
      io.to(gameRoom).emit(EVENT.START_GAME);

      const engine = new GameEngine(
        io,
        gameRoom,
        game.getLevel(),
        game.getTargetScore(),
      );
      game.setEngine(engine);
    }
  });

  socket.on(EVENT.LOAD_GAME_INFO, (type: 'host' | 'guest') => {
    const game = gameList.findByUserId(socket.id);
    const gameRoom = [...socket.rooms][2];

    if (game) {
      game.game.getEngine().addPaddles(type);

      socket.emit(EVENT.LOAD_GAME_INFO, {
        level: game.game.getLevel(),
        targetScore: game.game.getTargetScore(),
      });

      if (game.game.getEngine().checkAllPlayersJoined()) {
        io.to(gameRoom).emit(EVENT.ENGINE_ON);
        const intervalId = game.game.getEngine().startLoop();
        game.game.setIntervalId(intervalId);
      }
    }
  });

  /**
   * PC -> null | 컨트롤러 -> null
   * 게임 종료 후, PC 및 컨트롤러는 게임 room에서 나간다.
   */
  socket.on(EVENT.FINISH_GAME_CALLBACK, (gameId: string) => {
    gameList.removeById(gameId);
    socket.leave(gameId);
  });
};
