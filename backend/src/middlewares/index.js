import { Server } from 'socket.io';
import { env } from '../config/env.js';
import { socketAuthMiddleware } from './socket.auth.js';
import { registerChatHandlers } from './chat.socket.js';


//SOCKET BOOTSTRAP CONFIG
const defaultOrigins = env.CLIENT_URLS;
const configuredOrigins = (env.CLIENT_URLS || env.CLIENT_URL || '')
  .split(',')
  .map((x) => x.trim())
  .filter(Boolean);

const origins = configuredOrigins.length ? configuredOrigins : defaultOrigins;

export const createSocketServer = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: origins,
      credentials: true,
      methods: ['GET', 'POST'],
    },
  });

  io.use(socketAuthMiddleware);

  io.on('connection', (socket) => {
    registerChatHandlers(io, socket);
  });

  return io;
};
