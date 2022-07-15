const { expect } = require('chai');
const Client = require('socket.io-client');
const http = require('http');

const socketModule = require('../socket/index');
const SocketEvent = require('../constants/socket');
const { resetRoomList, addGameRoom } = require('../gameRoom');

describe('03_소켓 테스트', function () {
  this.timeout(10000);

  let clientSocket;

  before(done => {
    const httpServer = http.createServer();

    socketModule(httpServer);

    httpServer.listen(() => {
      const port = httpServer.address().port;
      clientSocket = new Client(`http://localhost:${port}`);
      clientSocket.on('connect', done);
    });
  });

  after(done => {
    clientSocket.close();
    done();
  });

  describe('기본 접속 테스트', () => {
    it('정상 작동 여부 확인: 송신한 데이터 값을 그대로 수신받아야 합니다', done => {
      const randomNumber = Math.random();

      clientSocket.on(SocketEvent.RECEIVE_TEST, data => {
        expect(data).to.eq(randomNumber);
        done();
      });

      clientSocket.emit(SocketEvent.SEND_TEST, randomNumber);
    });

    it('유저의 소켓 아이디 값을 정확하게 받는지 확인합니다', done => {
      const userID = clientSocket.id;

      clientSocket.on(SocketEvent.RECEIVE_USER_ID, data => {
        expect(data).to.eq(userID);
        done();
      });
      clientSocket.emit(SocketEvent.REQUEST_USER_ID);
    });
  });

  describe('방 개설 동작 테스트', () => {
    let mockGameRoom1;
    let mockGameRoom2;

    before(() => {
      mockGameRoom1 = {
        registrationOrder: 0,
        gameId: 'abc',
        hostId: clientSocket.id,
        isNormalMode: false,
        isNormalTargetScore: false,
        isStarted: false,
        isFull: false,
        userList: ['aaa'],
        controllerList: [],
        width: Number.MAX_SAFE_INTEGER,
        height: Number.MAX_SAFE_INTEGER,
      };

      mockGameRoom2 = {
        registrationOrder: 0,
        gameId: 'def',
        hostId: clientSocket.id,
        isNormalMode: false,
        isNormalTargetScore: false,
        isStarted: false,
        isFull: false,
        userList: ['aaa', 'bbb'],
        controllerList: [],
        width: Number.MAX_SAFE_INTEGER,
        height: Number.MAX_SAFE_INTEGER,
      };
    });

    afterEach(() => {
      resetRoomList();
    });

    it('클라이언트가 방 생성을 요청하면 방이 제대로 개설되어야 합니다', done => {
      clientSocket.once(SocketEvent.RECEIVE_GAME_ROOM_LIST, data => {
        expect(data[0].gameId).to.eq('abc');
        expect(data[0].hostId).to.eq(clientSocket.id);
        done();
      });

      clientSocket.emit(SocketEvent.CREATE_GAME, mockGameRoom1);
    });

    it('인원이 모두 찬 방에 접속을 시도한 경우 에러를 응답해야 합니다', done => {
      clientSocket.once(SocketEvent.RECEIVE_JOIN_ERROR, () => {
        done();
      });

      addGameRoom(mockGameRoom2);
      clientSocket.emit(SocketEvent.SEND_JOIN_GAME, { gameId: 'def' });
    });

    it('입장 가능한 방에 접속을 시도한 경우, 해당 방의 정보를 얻을 수 있어야 합니다', done => {
      clientSocket.once(SocketEvent.RECEIVE_ROOM_DATA, data => {
        expect(data.gameId).to.eq('abc');
        expect(data.gameId).not.eq('def');
        done();
      });

      addGameRoom(mockGameRoom1);
      clientSocket.emit(SocketEvent.SEND_JOIN_GAME, { gameId: 'abc' });
    });
  });
});
