import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { requireSuperAdmin } from '../middleware/roleCheck';
import {
  validateLogin,
  validateRegister,
  validateChangePassword
} from '../middleware/validator';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

// Public routes
router.post('/login', authLimiter, validateLogin, AuthController.login);

// Protected routes
router.use(authenticate); // All routes below require authentication

router.get('/me', AuthController.getCurrentUser);
router.post('/logout', AuthController.logout);
router.put('/change-password', validateChangePassword, AuthController.changePassword);

// Super Admin only routes
router.post('/register', requireSuperAdmin, validateRegister, AuthController.register);

export default router;
