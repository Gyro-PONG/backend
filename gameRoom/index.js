const gameRoomList = [];

const findGameRoom = id => {
  let gameRoomIndex = -1;
  const gameRoom = gameRoomList.find((value, index) => {
    if (value.gameId === id) {
      gameRoomIndex = index;
      return true;
    } else {
      return false;
    }
  });

  return { gameRoom, gameRoomIndex };
};

const addGameRoom = gameRoom => {
  gameRoomList.push(gameRoom);
};

const deleteGameRoom = index => {
  gameRoomList.splice(index, 1);
};

const setGameRoom = (index, option, value) => {
  switch (option) {
    case 'addUser':
      gameRoomList[index].userList.push(value);
      break;
    case 'addController':
      gameRoomList[index].controllerList.push(value);
      break;
    case 'deleteUser':
      const userIndex = gameRoomList[index].userList.findIndex(
        id => id === value,
      );

      if (userIndex !== -1) {
        gameRoomList[index].userList.splice(userIndex, 1);
      }
      break;
    case 'deleteController':
      const controllerIndex = gameRoomList[index].controllerList.findIndex(
        id => id === value,
      );

      if (controllerIndex !== -1) {
        gameRoomList[index].controllerList.splice(controllerIndex, 1);
      }
      break;
    case 'width':
      gameRoomList[index].width = value;
      break;
    case 'height':
      gameRoomList[index].height = value;
      break;
    case 'isFull':
      gameRoomList[index].isFull = value;
      break;
    case 'isStarted':
      gameRoomList[index].isStarted = value;
      break;
    default:
      break;
  }
};

const getGameRoomList = () => {
  return gameRoomList;
};

exports.findGameRoom = findGameRoom;
exports.addGameRoom = addGameRoom;
exports.deleteGameRoom = deleteGameRoom;
exports.getGameRoomList = getGameRoomList;
exports.setGameRoom = setGameRoom;
