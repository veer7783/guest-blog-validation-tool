import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth';
import { requireSuperAdmin } from '../middleware/roleCheck';
import { validateUpdateUser } from '../middleware/validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Super Admin only routes
router.post('/', requireSuperAdmin, UserController.createUser);
router.get('/', requireSuperAdmin, UserController.getAllUsers);
router.get('/stats', requireSuperAdmin, UserController.getUserStats);
router.get('/:id', requireSuperAdmin, UserController.getUserById);
router.put('/:id', requireSuperAdmin, validateUpdateUser, UserController.updateUser);
router.patch('/:id/password', requireSuperAdmin, UserController.changeUserPassword);
router.post('/:id/setup-2fa', requireSuperAdmin, UserController.setup2FA);
router.post('/:id/reset-2fa', requireSuperAdmin, UserController.reset2FA);
router.delete('/:id', requireSuperAdmin, UserController.deleteUser);
router.patch('/:id/status', requireSuperAdmin, UserController.toggleUserStatus);

export default router;
