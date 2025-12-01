import { Router } from 'express';
import { DataInProcessController } from '../controllers/dataInProcess.controller';
import { authenticate } from '../middleware/auth';
import { isSuperAdmin } from '../middleware/roleCheck';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all data in process
router.get('/', DataInProcessController.getAll);

// Get statistics
router.get('/statistics', DataInProcessController.getStatistics);

// Get single data in process
router.get('/:id', DataInProcessController.getById);

// Update data in process
router.put('/:id', DataInProcessController.update);

// Push to main project (Super Admin only)
router.post('/push', isSuperAdmin, DataInProcessController.pushToMainProject);

// Delete data in process (Super Admin only)
router.delete('/:id', isSuperAdmin, DataInProcessController.delete);

export default router;
