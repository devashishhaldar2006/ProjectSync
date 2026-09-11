import { Response, NextFunction } from 'express';
import { DashboardService } from '../services/dashboard.service';
import { AuthenticatedRequest } from '../types';

export class DashboardController {
  static async getStats(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await DashboardService.getStats(req.user!);
      res.status(200).json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }
}
