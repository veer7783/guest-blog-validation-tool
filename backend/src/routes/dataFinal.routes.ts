import { Router } from 'express';
import { DataFinalController } from '../controllers/dataFinal.controller';
import { authenticate } from '../middleware/auth';
import { requireSuperAdmin } from '../middleware/roleCheck';

const router = Router();

// All routes require authentication (Super Admin check in controller)
router.use(authenticate);

// Get all data final records (unpushed only)
router.get('/', DataFinalController.getAll);

// Get all pushed records
router.get('/pushed', DataFinalController.getPushedRecords);

// Delete pushed records (bulk delete)
router.delete('/pushed', requireSuperAdmin, DataFinalController.deletePushedRecords);

// Bulk delete unpushed records (Super Admin only)
router.post('/bulk-delete', requireSuperAdmin, DataFinalController.bulkDelete);

// Get single data final record
router.get('/:id', DataFinalController.getById);

// Update data final record
router.put('/:id', DataFinalController.update);

// Delete data final record
router.delete('/:id', DataFinalController.delete);

// Push to main project (Super Admin only)
router.post('/push-to-main-project', requireSuperAdmin, DataFinalController.pushToMainProject);

export default router;
