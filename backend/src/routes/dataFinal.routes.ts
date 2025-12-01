import { Router } from 'express';
import { DataFinalController } from '../controllers/dataFinal.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication (Super Admin check in controller)
router.use(authenticate);

// Get all data final records
router.get('/', DataFinalController.getAll);

// Get single data final record
router.get('/:id', DataFinalController.getById);

// Update data final record
router.put('/:id', DataFinalController.update);

// Delete data final record
router.delete('/:id', DataFinalController.delete);

export default router;
