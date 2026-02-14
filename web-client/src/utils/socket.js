import { io } from 'socket.io-client';

const resolveSocketUrl = () => {
  const explicit = import.meta.env.VITE_SOCKET_URL;
  if (explicit) return explicit;

  const apiBase = import.meta.env.VITE_API_BASE_URL;
  if (apiBase) return apiBase;

  return window.location.origin;
};

export const createChatSocket = (token) => {
  return io(resolveSocketUrl(), {
    auth: { token },
    transports: ['websocket', 'polling'],
    withCredentials: true,
  });
};

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

