import { Response, NextFunction } from 'express';
import { TaskService } from '../services/task.service';
import { AuthenticatedRequest } from '../types';
import { TaskPriority, TaskStatus } from '@prisma/client';

export class TaskController {
  static async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { projectId, status, priority, startDate, endDate, search } = req.query;

      const tasks = await TaskService.getTasks(req.user!, {
        projectId: projectId as string,
        status: status as TaskStatus,
        priority: priority as TaskPriority,
        startDate: startDate as string,
        endDate: endDate as string,
        search: search as string,
      });

      res.status(200).json({ success: true, data: tasks });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const task = await TaskService.getTaskById(req.params.id, req.user!);
      res.status(200).json({ success: true, data: task });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const task = await TaskService.createTask(req.body, req.user!);
      res.status(201).json({ success: true, data: task });
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status } = req.body;
      const task = await TaskService.updateTaskStatus(req.params.id, status, req.user!);
      res.status(200).json({ success: true, data: task });
    } catch (error) {
      next(error);
    }
  }

  static async updateDetails(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const task = await TaskService.updateTaskDetails(req.params.id, req.body, req.user!);
      res.status(200).json({ success: true, data: task });
    } catch (error) {
      next(error);
    }
  }
}
