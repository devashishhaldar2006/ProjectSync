import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);
router.get('/', NotificationController.getAll);
router.patch('/:id/read', NotificationController.markRead);
router.post('/read-all', NotificationController.markAllRead);

export default router;
