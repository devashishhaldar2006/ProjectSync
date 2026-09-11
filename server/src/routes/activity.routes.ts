import { Router } from 'express';
import { ActivityController } from '../controllers/activity.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);
router.get('/', ActivityController.getRecent);

export default router;
