import express, {
  Application,
  ErrorRequestHandler,
  NextFunction,
  Request,
  Response,
} from 'express';
import http from 'http';
import createError from 'http-errors';
import morgan from 'morgan';

import { PORT } from './config/env.js';

const app: Application = express();
const httpServer = http.createServer(app);

app.set('port', PORT || 8000);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'server_status_ok' });
});

app.use((req: Request, res: Response, next: NextFunction) => {
  next(createError(404));
});

app.use(((err, req, res, next) => {
  if (err.status) {
    res.status(err.status).json({ message: err.message });
  } else {
    res.status(500).json({ message: 'internal error' });
  }
}) as ErrorRequestHandler);

export { app, httpServer };
