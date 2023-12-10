import { CustomSocket } from '../socket';

export const getRevisedBeta = (beta: number, socket: CustomSocket) => {
  return (
    (beta - (socket.leftAngle ?? 0)) /
    ((socket.rightAngle ?? 0) - (socket.leftAngle ?? 0))
  );
};
