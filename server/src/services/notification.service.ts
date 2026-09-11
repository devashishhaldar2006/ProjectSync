import { prisma } from '../config/prisma';
import { getIO } from '../sockets/socketManager';
import { NotificationType } from '@prisma/client';

export class NotificationService {
  static async createNotification(params: {
    userId: string;
    title: string;
    message: string;
    type: NotificationType;
    referenceId?: string;
  }) {
    const notification = await prisma.notification.create({
      data: {
        userId: params.userId,
        title: params.title,
        message: params.message,
        type: params.type,
        referenceId: params.referenceId,
      },
    });

    // Unread count
    const unreadCount = await prisma.notification.count({
      where: { userId: params.userId, isRead: false },
    });

    try {
      const io = getIO();
      // Emit to specific user's socket room
      io.to(`user:${params.userId}`).emit('notification:new', {
        notification,
        unreadCount,
      });
    } catch (err) {
      console.error('Failed to emit notification socket event:', err);
    }

    return notification;
  }

  static async getUserNotifications(userId: string, limit = 30) {
    const notifications = await prisma.notification.findMany({
      where: { userId },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false },
    });

    return { notifications, unreadCount };
  }

  static async markAsRead(notificationId: string, userId: string) {
    const notification = await prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });

    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false },
    });

    try {
      const io = getIO();
      io.to(`user:${userId}`).emit('notification:unreadCount', { unreadCount });
    } catch (err) {}

    return notification;
  }

  static async markAllAsRead(userId: string) {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    try {
      const io = getIO();
      io.to(`user:${userId}`).emit('notification:unreadCount', { unreadCount: 0 });
    } catch (err) {}

    return { success: true };
  }
}
