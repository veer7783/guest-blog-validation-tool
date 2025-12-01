import { Router } from 'express';
import { ActivityLogController } from '../controllers/activityLog.controller';
import { authenticate } from '../middleware/auth';
import { requireSuperAdmin } from '../middleware/roleCheck';

const router = Router();

// All routes require authentication and Super Admin role
router.use(authenticate);
router.use(requireSuperAdmin);

router.get('/', ActivityLogController.getLogs);
router.get('/:id', ActivityLogController.getLogById);

export default router;
