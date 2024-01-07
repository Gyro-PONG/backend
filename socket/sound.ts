import { Server, Socket } from 'socket.io';

import { EVENT } from '../constants/socket.js';

export const soundEvent = (io: Server, socket: Socket) => {
  socket.on(EVENT.SEND_SFX, (type: 'paddle' | 'wall' | 'extinction') => {
    const gameRoom = [...socket.rooms][2];

    socket.to(gameRoom).emit(EVENT.SEND_SFX, type);
  });
};
