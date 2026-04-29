import { io } from 'socket.io-client';
import { API_BASE } from './api';

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(API_BASE, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });
  }
  return socket;
}

export function joinUserRoom(userId) {
  if (userId) getSocket().emit('join:user', String(userId));
}

export function leaveUserRoom(userId) {
  if (userId) getSocket().emit('leave:user', String(userId));
}
