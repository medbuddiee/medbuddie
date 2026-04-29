const { Server } = require('socket.io');

let io = null;

function init(httpServer, corsOptions) {
  io = new Server(httpServer, {
    cors: {
      origin: corsOptions.origin,
      credentials: true,
      methods: ['GET', 'POST'],
    },
    // Allow long-polling fallback for restrictive networks
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket) => {
    // Everyone joins the shared feed room automatically
    socket.join('feed');

    // Join a personal room for user-specific events
    socket.on('join:user', (userId) => {
      if (userId) socket.join(`user:${userId}`);
    });

    socket.on('leave:user', (userId) => {
      if (userId) socket.leave(`user:${userId}`);
    });
  });

  return io;
}

function getIO() {
  if (!io) throw new Error('Socket.io not initialised yet');
  return io;
}

// Safe emit — never crashes if socket not ready
function emit(room, event, data) {
  try {
    getIO().to(room).emit(event, data);
  } catch { /* server still starting */ }
}

module.exports = { init, getIO, emit };
