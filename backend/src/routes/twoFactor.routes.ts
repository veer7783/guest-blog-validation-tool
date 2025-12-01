import { Router } from 'express';
import { TwoFactorController } from '../controllers/twoFactor.controller';
import { authenticate } from '../middleware/auth';
import {
  validateEnable2FA,
  validateDisable2FA,
  validateBackupCode,
  validateRegenerateBackupCodes
} from '../middleware/twoFactorValidator';

const router = Router();

// All routes require authentication
router.use(authenticate);

// 2FA management routes
router.get('/status', TwoFactorController.getStatus);
router.post('/setup', TwoFactorController.setup);
router.post('/enable', validateEnable2FA, TwoFactorController.enable);
router.post('/disable', validateDisable2FA, TwoFactorController.disable);
router.post('/verify-backup-code', validateBackupCode, TwoFactorController.verifyBackupCode);
router.post('/regenerate-backup-codes', validateRegenerateBackupCodes, TwoFactorController.regenerateBackupCodes);

export default router;
