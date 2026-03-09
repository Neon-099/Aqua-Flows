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
    rememberUpgrade: true,
    reconnection: true,
    reconnectionAttempts: 8,
    reconnectionDelay: 500,
    reconnectionDelayMax: 2500,
    withCredentials: true,
  });
};

export const emitWithAck = (socket, eventName, payload, timeoutMs = 5000) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${eventName} ack timeout`));
    }, timeoutMs);

    socket.emit(eventName, payload, (ack) => {
      clearTimeout(timer);
      if (ack?.ok) {
        resolve(ack.data ?? ack);
        return;
      }
      reject(new Error(ack?.error || `${eventName} failed`));
    });
  });
