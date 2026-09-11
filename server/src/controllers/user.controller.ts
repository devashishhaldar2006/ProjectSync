import { Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { AuthenticatedRequest } from '../types';

export class UserController {
  static async getUsers(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { role } = req.query;
      const where: any = {};
      if (role) {
        where.role = role;
      }

      const users = await prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          avatarUrl: true,
          createdAt: true,
        },
        orderBy: { name: 'asc' },
      });

      res.status(200).json({ success: true, data: users });
    } catch (error) {
      next(error);
    }
  }

  static async getClients(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const clients = await prisma.client.findMany({
        orderBy: { name: 'asc' },
      });
      res.status(200).json({ success: true, data: clients });
    } catch (error) {
      next(error);
    }
  }
}
