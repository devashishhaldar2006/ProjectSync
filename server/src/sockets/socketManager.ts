import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { TokenPayload } from '../types';

let io: SocketIOServer | null = null;
// Active connected sockets: socketId -> TokenPayload
const activeUsers = new Map<string, { socketId: string; user: TokenPayload }>();

export const initSocketServer = (httpServer: HttpServer): SocketIOServer => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: [config.clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true,
    },
  });

  // Authentication Handshake Middleware
  io.use((socket: Socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        (socket.handshake.headers['authorization'] as string)?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication error: Token missing'));
      }

      const decoded = jwt.verify(token, config.jwt.accessSecret) as TokenPayload;
      (socket as any).user = decoded;
      next();
    } catch (err) {
      return next(new Error('Authentication error: Invalid or expired token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user as TokenPayload;
    if (!user) return;

    activeUsers.set(socket.id, { socketId: socket.id, user });

    // Join personal room for notifications and assigned task events
    socket.join(`user:${user.userId}`);

    // Admins join global room to monitor all activity across every project
    if (user.role === 'ADMIN') {
      socket.join('role:admin');
      socket.join('global');
    }

    // Broadcast updated active presence count
    broadcastPresence();

    // Client dynamically joins a project room when viewing its board
    socket.on('join:project', (projectId: string) => {
      socket.join(`project:${projectId}`);
    });

    socket.on('leave:project', (projectId: string) => {
      socket.leave(`project:${projectId}`);
    });

    socket.on('disconnect', () => {
      activeUsers.delete(socket.id);
      broadcastPresence();
    });
  });

  return io;
};

export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error('Socket.io has not been initialized');
  }
  return io;
};

export const getUniqueActiveUserCount = (): number => {
  const uniqueUserIds = new Set<string>();
  for (const item of activeUsers.values()) {
    uniqueUserIds.add(item.user.userId);
  }
  return uniqueUserIds.size;
};

export const broadcastPresence = () => {
  if (!io) return;
  const count = getUniqueActiveUserCount();
  io.emit('presence:count', { onlineCount: count });
};
