import { Server, Socket } from 'socket.io';

import { EVENT } from '../constants/socket.js';

export const vibrationEvent = (io: Server, socket: Socket) => {
  socket.on(EVENT.SET_VIBRATION, (set: boolean) => {
    const userControllerRoom = [...socket.rooms][1];

    io.to(userControllerRoom).emit(EVENT.SET_VIBRATION, set);
  });

  type VibrtionType = 'hp' | 'gp' | 'hs' | 'gs';

  socket.on(EVENT.SEND_VIBRATION, (type: VibrtionType) => {
    const gameRoom = [...socket.rooms][2];

    io.to(gameRoom).emit(EVENT.SEND_VIBRATION, type);
  });
};
