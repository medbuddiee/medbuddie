import { io } from 'socket.io-client';

const URL = import.meta.env.DEV ? 'http://localhost:5000' : window.location.origin;

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });
  }
  return socket;
}

export function joinUserRoom(userId) {
  if (userId) getSocket().emit('join:user', userId);
}

export function leaveUserRoom(userId) {
  if (userId) getSocket().emit('leave:user', userId);
}
