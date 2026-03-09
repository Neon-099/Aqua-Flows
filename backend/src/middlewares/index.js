import { Server } from 'socket.io';
import { env } from '../config/env.js';
import { socketAuthMiddleware } from './socket.auth.js';
import { registerChatHandlers } from './chat.socket.js';

// SOCKET BOOTSTRAP CONFIG
// const defaultOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];
const defaultOrigins = (env.CLIENT_URLS || env.CLIENT_URL || '')
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

    // Lower latency defaults for chat-style small payloads
    perMessageDeflate: env.SOCKET_PER_MESSAGE_DEFLATE === 'true',
    pingInterval: Number(env.SOCKET_PING_INTERVAL_MS || 20000),
    pingTimeout: Number(env.SOCKET_PING_TIMEOUT_MS || 10000),
    allowEIO3: false,
  });

  io.use(socketAuthMiddleware);

  io.on('connection', (socket) => {
    registerChatHandlers(io, socket);
  });

  return io;
};
