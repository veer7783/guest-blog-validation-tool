import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get dashboard statistics
router.get('/stats', DashboardController.getDashboardStats);

export default router;
