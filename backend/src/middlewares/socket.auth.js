import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import User from '../models/User.model.js';

export const socketAuthMiddleware = async (socket, next) => {
  try {
    const authToken = socket.handshake.auth?.token;
    const header = socket.handshake.headers?.authorization || '';
    const headerToken = header.startsWith('Bearer ') ? header.slice(7) : null;
    const token = authToken || headerToken;

    if (!token) return next(new Error('Unauthorized: missing token'));

    const decoded = jwt.verify(token, env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return next(new Error('Unauthorized: user not found'));

    socket.user = user;
    return next();
  } catch (err) {
    return next(new Error('Unauthorized socket connection'));
  }
};
