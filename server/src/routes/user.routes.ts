import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';

const router = Router();

router.use(authenticate);

// List developers or managers (needed for task assignment by Admin / PM)
router.get('/users', requireRole(['ADMIN', 'PROJECT_MANAGER']), UserController.getUsers);

// List clients (for project creation by Admin / PM)
router.get('/clients', requireRole(['ADMIN', 'PROJECT_MANAGER']), UserController.getClients);

export default router;
