import { Response, NextFunction } from 'express';
import { AuthRequest, UpdateUserRequest } from '../types';
import { UserService } from '../services/user.service';
import { getClientIp } from '../utils/helpers';

export class UserController {
  /**
   * Create a new user (Super Admin only)
   */
  static async createUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { firstName, lastName, email, password, role, assignedAdminId } = req.body;
      const ipAddress = getClientIp(req);
      const userAgent = req.headers['user-agent'] || null;
      const createdBy = req.user!.id;

      const user = await UserService.createUser(
        { firstName, lastName, email, password, role, assignedAdminId },
        createdBy,
        ipAddress,
        userAgent
      );

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all users
   */
  static async getAllUsers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const {
        role,
        isActive,
        search,
        page,
        limit
      } = req.query;

      const result = await UserService.getAllUsers({
        role: role as string,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        search: search as string,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined
      });

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user by ID
   */
  static async getUserById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = await UserService.getUserById(id);

      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user
   */
  static async updateUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data: UpdateUserRequest = req.body;
      const updatedBy = req.user!.id;
      const ipAddress = getClientIp(req);
      
      console.log('Update user request body:', JSON.stringify(req.body, null, 2));
      const userAgent = req.headers['user-agent'] || null;

      const user = await UserService.updateUser(id, data, updatedBy, ipAddress, userAgent);

      res.status(200).json({
        success: true,
        message: 'User updated successfully',
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete user
   */
  static async deleteUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const deletedBy = req.user!.id;
      const ipAddress = getClientIp(req);
      const userAgent = req.headers['user-agent'] || null;

      const result = await UserService.deleteUser(id, deletedBy, ipAddress, userAgent);

      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Toggle user status
   */
  static async toggleUserStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updatedBy = req.user!.id;
      const ipAddress = getClientIp(req);
      const userAgent = req.headers['user-agent'] || null;

      const user = await UserService.toggleUserStatus(id, updatedBy, ipAddress, userAgent);

      res.status(200).json({
        success: true,
        message: 'User status updated successfully',
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user statistics
   */
  static async getUserStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const stats = await UserService.getUserStats();

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change user password (Super Admin only)
   */
  static async changeUserPassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;
      const updatedBy = req.user!.id;
      const ipAddress = getClientIp(req);
      const userAgent = req.headers['user-agent'] || null;

      await UserService.changeUserPassword(id, newPassword, updatedBy, ipAddress, userAgent);

      res.status(200).json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Setup 2FA for user
   */
  static async setup2FA(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await UserService.setup2FA(id);

      res.status(200).json({
        success: true,
        data: result,
        message: '2FA setup initiated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reset 2FA for user
   */
  static async reset2FA(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await UserService.reset2FA(id);

      res.status(200).json({
        success: true,
        message: '2FA reset successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}
