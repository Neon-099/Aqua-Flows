// import { io } from 'socket.io-client';

// const resolveSocketUrl = () => {
//   const explicit = import.meta.env.VITE_SOCKET_URL;
//   if (explicit) return explicit;

//   const apiBase = import.meta.env.VITE_API_BASE_URL || 'https://aqua-flow-v5f6.onrender.com' || window.location.origin;
//   if (apiBase) return apiBase;

//   return window.location.origin;
// };

// export const createChatSocket = (token) => {
//   return io(resolveSocketUrl(), {
//     auth: { token },
//     transports: ['websocket', 'polling'],
//     withCredentials: true,
//   });
// };

// export const emitWithAck = (socket, eventName, payload) =>
//   new Promise((resolve, reject) => {
//     socket.emit(eventName, payload, (ack) => {
//       if (ack?.ok) {
//         resolve(ack.data ?? ack);
//         return;
//       }
//       reject(new Error(ack?.error || `${eventName} failed`));
//     });
//   });

import { io } from 'socket.io-client';

const normalize = (url) => (url || '').trim().replace(/\/+$/, '');

const resolveSocketUrl = () => {
  const explicit = normalize(import.meta.env.VITE_SOCKET_URL);
  if (explicit) return explicit;

  const apiBase = normalize(import.meta.env.VITE_API_BASE_URL);
  if (apiBase) return apiBase;

  if (import.meta.env.PROD) {
    throw new Error('Missing VITE_SOCKET_URL (or VITE_API_BASE_URL) in production environment');
  }

  return window.location.origin; // local/dev fallback
};

export const createChatSocket = (token) =>
  io(resolveSocketUrl(), {
    auth: { token },
    transports: ['websocket', 'polling'],
    withCredentials: true,
  });

export const emitWithAck = (socket, eventName, payload) =>
  new Promise((resolve, reject) => {
    socket.emit(eventName, payload, (ack) => {
      if (ack?.ok) {
        resolve(ack.data ?? ack);
        return;
      }
      reject(new Error(ack?.error || `${eventName} failed`));
    });
  });
