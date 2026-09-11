import { Router } from 'express';
import { z } from 'zod';
import { TaskController } from '../controllers/task.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';
import { validateBody } from '../middlewares/validate.middleware';

const router = Router();

const createTaskSchema = z.object({
  title: z.string().min(2, 'Task title is required'),
  description: z.string().optional(),
  projectId: z.string().uuid('Project ID must be a valid UUID'),
  assignedToId: z.string().uuid('Assignee ID must be a valid UUID').optional().nullable(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Valid due date is required'),
});

const updateStatusSchema = z.object({
  status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']),
});

const updateDetailsSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().optional(),
  assignedToId: z.string().uuid().optional().nullable(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Valid due date required').optional(),
});

router.use(authenticate);

// Get tasks (Developer: own; PM: project tasks; Admin: all)
router.get('/', TaskController.getAll);
router.get('/:id', TaskController.getById);

// Create task: Admin & PM only
router.post('/', requireRole(['ADMIN', 'PROJECT_MANAGER']), validateBody(createTaskSchema), TaskController.create);

// Update status: Any authenticated user assigned to or managing the task
router.patch('/:id/status', validateBody(updateStatusSchema), TaskController.updateStatus);

// Update full task details: Admin & PM only
router.patch('/:id', requireRole(['ADMIN', 'PROJECT_MANAGER']), validateBody(updateDetailsSchema), TaskController.updateDetails);

export default router;
