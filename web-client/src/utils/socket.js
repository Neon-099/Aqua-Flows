// web-client/src/utils/socket.js
import { io } from "socket.io-client";

const normalizeBaseUrl = (url) => (url || "").trim().replace(/\/+$/, "");

const resolveSocketUrl = () => {
  const explicit = normalizeBaseUrl(import.meta.env.VITE_SOCKET_URL);
  if (explicit) return explicit;

  const apiBase = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL);
  if (apiBase) return apiBase;

  if (import.meta.env.DEV) return "http://localhost:5500";

  throw new Error("Missing VITE_SOCKET_URL (or VITE_API_BASE_URL) in production");
};

export const createChatSocket = (token) =>
  io(resolveSocketUrl(), {
    auth: { token },
    transports: ["websocket", "polling"],
    withCredentials: true,
  });

export const emitWithAck = (socket, eventName, payload) =>
  new Promise((resolve, reject) => {
    socket.emit(eventName, payload, (ack) => {
      if (ack?.ok) return resolve(ack.data ?? ack);
      reject(new Error(ack?.error || `${eventName} failed`));
    });
  });
