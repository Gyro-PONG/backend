import { app, httpServer } from './app.js';
import { socketServer } from './socket/index.js';

const startServer = () => {
  socketServer(httpServer);

  httpServer.listen(app.get('port'), () => {
    console.log('express server is started');
    console.log(`port number is ${app.get('port')}`);
    console.log(`environment is ${process.env.NODE_ENV}`);
  });
};

startServer();
