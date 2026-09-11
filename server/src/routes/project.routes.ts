import { Router } from 'express';
import { z } from 'zod';
import { ProjectController } from '../controllers/project.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';
import { validateBody } from '../middlewares/validate.middleware';

const router = Router();

const createProjectSchema = z.object({
  name: z.string().min(2, 'Project name is required'),
  description: z.string().optional(),
  clientId: z.string().uuid('Valid client ID is required'),
  managerId: z.string().uuid('Valid manager ID is required').optional(),
});

const updateProjectSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  status: z.string().optional(),
  clientId: z.string().uuid().optional(),
});

// All project routes require authentication
router.use(authenticate);

// Get projects (role filtered in service)
router.get('/', ProjectController.getAll);
router.get('/:id', ProjectController.getById);

// Create and update projects: Admin and PM only
router.post('/', requireRole(['ADMIN', 'PROJECT_MANAGER']), validateBody(createProjectSchema), ProjectController.create);
router.patch('/:id', requireRole(['ADMIN', 'PROJECT_MANAGER']), validateBody(updateProjectSchema), ProjectController.update);

export default router;
