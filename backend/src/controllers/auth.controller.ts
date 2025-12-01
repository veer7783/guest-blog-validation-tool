import { Response, NextFunction } from 'express';
import { AuthRequest, LoginRequest, RegisterRequest, ChangePasswordRequest } from '../types';
import { AuthService } from '../services/auth.service';
import { getClientIp } from '../utils/helpers';

export class AuthController {
  /**
   * Register new user (Super Admin only)
   */
  static async register(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data: RegisterRequest = req.body;
      const createdBy = req.user!.id;
      const ipAddress = getClientIp(req);
      const userAgent = req.headers['user-agent'] || null;

      const user = await AuthService.register(data, createdBy, ipAddress, userAgent);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login user
   */
  static async login(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data: LoginRequest = req.body;
      const ipAddress = getClientIp(req);
      const userAgent = req.headers['user-agent'] || null;

      const result = await AuthService.login(data, ipAddress, userAgent);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user
   */
  static async getCurrentUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const user = await AuthService.getCurrentUser(userId);

      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change password
   */
  static async changePassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { currentPassword, newPassword }: ChangePasswordRequest = req.body;
      const ipAddress = getClientIp(req);
      const userAgent = req.headers['user-agent'] || null;

      const result = await AuthService.changePassword(
        userId,
        currentPassword,
        newPassword,
        ipAddress,
        userAgent
      );

      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout
   */
  static async logout(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const ipAddress = getClientIp(req);
      const userAgent = req.headers['user-agent'] || null;

      const result = await AuthService.logout(userId, ipAddress, userAgent);

      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  }
}
