import { Response, NextFunction } from 'express';
import { ProjectService } from '../services/project.service';
import { AuthenticatedRequest } from '../types';

export class ProjectController {
  static async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const projects = await ProjectService.getProjects(req.user!);
      res.status(200).json({ success: true, data: projects });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const project = await ProjectService.getProjectById(req.params.id, req.user!);
      res.status(200).json({ success: true, data: project });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const project = await ProjectService.createProject(req.body, req.user!);
      res.status(201).json({ success: true, data: project });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const project = await ProjectService.updateProject(req.params.id, req.body, req.user!);
      res.status(200).json({ success: true, data: project });
    } catch (error) {
      next(error);
    }
  }
}
