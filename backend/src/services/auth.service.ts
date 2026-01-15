import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import prisma from '../config/database';
import { JWTPayload, LoginRequest, RegisterRequest } from '../types';
import { AppError } from '../middleware/errorHandler';
import { ActivityLogService } from './activityLog.service';
import { TwoFactorService } from './twoFactor.service';

export class AuthService {
  /**
   * Generate JWT token
   */
  static generateToken(payload: JWTPayload): string {
    const secret = process.env.JWT_SECRET || 'default-secret';
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
    
    // @ts-ignore - TypeScript has issues with jwt.sign overloads
    return jwt.sign(payload, secret, { expiresIn });
  }

  /**
   * Register new user (Super Admin only)
   */
  static async register(data: RegisterRequest, createdBy: string, ipAddress: string, userAgent: string | null) {
    const { email, password, firstName, lastName, role = 'ADMIN' } = data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw new AppError('User with this email already exists', 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role,
        isActive: true
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });

    // Log activity
    await ActivityLogService.createLog(
      createdBy,
      'USER_CREATE',
      'User',
      user.id,
      { email: user.email, role: user.role },
      ipAddress,
      userAgent
    );

    return user;
  }

  /**
   * Login user
   */
  static async login(data: LoginRequest, ipAddress: string, userAgent: string | null) {
    const { email, password, twoFactorCode } = data;

    console.log('🔐 [AuthService] Login attempt for:', email);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        twoFactorAuth: true
      }
    });

    if (!user) {
      console.log('❌ [AuthService] User not found:', email);
      throw new AppError('Invalid email or password', 401);
    }

    console.log('✅ [AuthService] User found:', user.email, 'Active:', user.isActive);

    // Check if user is active
    if (!user.isActive) {
      throw new AppError('Your account has been deactivated', 403);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('🔑 [AuthService] Password valid:', isPasswordValid);
    if (!isPasswordValid) {
      console.log('❌ [AuthService] Invalid password for:', email);
      throw new AppError('Invalid email or password', 401);
    }

    // Check if 2FA is enabled
    if (user.twoFactorAuth?.isEnabled) {
      if (!twoFactorCode) {
        return {
          requiresTwoFactor: true,
          userId: user.id
        };
      }

      // Verify 2FA code or backup code
      const isCodeValid = await TwoFactorService.verifyCode(user.id, twoFactorCode);
      const isBackupCodeValid = !isCodeValid 
        ? await TwoFactorService.verifyBackupCode(user.id, twoFactorCode)
        : false;

      if (!isCodeValid && !isBackupCodeValid) {
        throw new AppError('Invalid 2FA code or backup code', 401);
      }

      // Log if backup code was used
      if (isBackupCodeValid) {
        await ActivityLogService.createLog(
          user.id,
          'LOGIN_WITH_BACKUP_CODE',
          'User',
          user.id,
          null,
          ipAddress,
          userAgent
        );
      }
    }

    // Generate token
    const token = this.generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    // Log activity
    await ActivityLogService.createLog(
      user.id,
      'LOGIN',
      'User',
      user.id,
      null,
      ipAddress,
      userAgent
    );

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive
      }
    };
  }

  /**
   * Get current user
   */
  static async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        twoFactorAuth: {
          select: {
            isEnabled: true
          }
        }
      }
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }

  /**
   * Change password
   */
  static async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    ipAddress: string,
    userAgent: string | null
  ) {
    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new AppError('Current password is incorrect', 400);
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    // Log activity
    await ActivityLogService.createLog(
      userId,
      'PASSWORD_CHANGE',
      'User',
      userId,
      null,
      ipAddress,
      userAgent
    );

    return { message: 'Password changed successfully' };
  }

  /**
   * Logout (for activity logging)
   */
  static async logout(userId: string, ipAddress: string, userAgent: string | null) {
    await ActivityLogService.createLog(
      userId,
      'LOGOUT',
      'User',
      userId,
      null,
      ipAddress,
      userAgent
    );

    return { message: 'Logged out successfully' };
  }
}
