import { Response, NextFunction } from 'express';
import { NotificationService } from '../services/notification.service';
import { AuthenticatedRequest } from '../types';

export class NotificationController {
  static async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await NotificationService.getUserNotifications(req.user!.id);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async markRead(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await NotificationService.markAsRead(req.params.id, req.user!.id);
      res.status(200).json({ success: true, data: { message: 'Marked as read' } });
    } catch (error) {
      next(error);
    }
  }

  static async markAllRead(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await NotificationService.markAllAsRead(req.user!.id);
      res.status(200).json({ success: true, data: { message: 'All marked as read' } });
    } catch (error) {
      next(error);
    }
  }
}
