import { Response, NextFunction } from 'express';
import { ActivityService } from '../services/activity.service';
import { AuthenticatedRequest } from '../types';

export class ActivityController {
  static async getRecent(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = parseInt((req.query.limit as string) || '20', 10);
      const activities = await ActivityService.getRecentActivities(req.user!, limit);
      res.status(200).json({ success: true, data: activities });
    } catch (error) {
      next(error);
    }
  }
}
