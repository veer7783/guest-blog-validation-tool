import bcrypt from 'bcrypt';
import prisma from '../config/database';
import { UpdateUserRequest } from '../types';
import { AppError } from '../middleware/errorHandler';
import { ActivityLogService } from './activityLog.service';

export class UserService {
  /**
   * Get all users with pagination
   */
  static async getAllUsers(filters: {
    role?: string;
    isActive?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const {
      role,
      isActive,
      search
    } = filters;

    const where: any = {};

    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive;
    if (search) {
      where.OR = [
        { email: { contains: search } },
        { firstName: { contains: search } },
        { lastName: { contains: search } }
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
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
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);

    // Add remaining CSV upload tasks count for each user
    const usersWithTasks = await Promise.all(
      users.map(async (user) => {
        // Count CSV upload tasks that are not completed
        const remainingTasks = await prisma.dataUploadTask.count({
          where: {
            assignedTo: user.id,
            status: {
              in: ['PENDING', 'IN_PROGRESS']
            }
          }
        });

        return {
          ...user,
          remainingTasks
        };
      })
    );

    return {
      users: usersWithTasks,
      pagination: {
        total
      }
    };
  }

  /**
   * Get user by ID
   */
  static async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
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
   * Update user
   */
  static async updateUser(
    id: string,
    data: UpdateUserRequest,
    updatedBy: string,
    ipAddress: string,
    userAgent: string | null
  ) {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      throw new AppError('User not found', 404);
    }

    // If email is being updated, check if it's already taken
    if (data.email && data.email !== existingUser.email) {
      const emailTaken = await prisma.user.findUnique({
        where: { email: data.email }
      });

      if (emailTaken) {
        throw new AppError('Email already in use', 400);
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(data.email && { email: data.email }),
        ...(data.firstName && { firstName: data.firstName }),
        ...(data.lastName && { lastName: data.lastName }),
        ...(data.isActive !== undefined && { isActive: data.isActive })
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Log activity
    await ActivityLogService.createLog(
      updatedBy,
      'USER_UPDATE',
      'User',
      id,
      { changes: data },
      ipAddress,
      userAgent
    );

    return updatedUser;
  }

  /**
   * Delete user
   */
  static async deleteUser(
    id: string,
    deletedBy: string,
    ipAddress: string,
    userAgent: string | null
  ) {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Prevent deleting yourself
    if (id === deletedBy) {
      throw new AppError('You cannot delete your own account', 400);
    }

    // Delete user
    await prisma.user.delete({
      where: { id }
    });

    // Log activity
    await ActivityLogService.createLog(
      deletedBy,
      'USER_DELETE',
      'User',
      id,
      { email: user.email },
      ipAddress,
      userAgent
    );

    return { message: 'User deleted successfully' };
  }

  /**
   * Toggle user active status
   */
  static async toggleUserStatus(
    id: string,
    updatedBy: string,
    ipAddress: string,
    userAgent: string | null
  ) {
    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Prevent deactivating yourself
    if (id === updatedBy) {
      throw new AppError('You cannot deactivate your own account', 400);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true
      }
    });

    // Log activity
    await ActivityLogService.createLog(
      updatedBy,
      'USER_STATUS_CHANGE',
      'User',
      id,
      { isActive: updatedUser.isActive },
      ipAddress,
      userAgent
    );

    return updatedUser;
  }

  /**
   * Get user statistics
   */
  static async getUserStats() {
    const [total, active, inactive, superAdmins, admins] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { isActive: false } }),
      prisma.user.count({ where: { role: 'SUPER_ADMIN' } }),
      prisma.user.count({ where: { role: 'ADMIN' } })
    ]);

    return {
      total,
      active,
      inactive,
      superAdmins,
      admins
    };
  }

  /**
   * Change user password (Super Admin only)
   */
  static async changeUserPassword(
    userId: string,
    newPassword: string,
    updatedBy: string,
    ipAddress: string | null,
    userAgent: string | null
  ) {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new AppError('User not found', 404);
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
      updatedBy,
      'USER_PASSWORD_CHANGED',
      'User',
      userId,
      { email: user.email },
      ipAddress,
      userAgent
    );

    return { success: true };
  }

  /**
   * Setup 2FA for user
   */
  static async setup2FA(userId: string) {
    const speakeasy = require('speakeasy');
    const QRCode = require('qrcode');

    // Get user email for QR code label
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true }
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `Guest Blog (${user.email})`,
      length: 32
    });

    // Generate QR code
    const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url);

    // Create or update 2FA record
    await prisma.twoFactorAuth.upsert({
      where: { userId },
      create: {
        userId,
        secret: secret.base32,
        backupCodes: [],
        isEnabled: true
      },
      update: {
        secret: secret.base32,
        isEnabled: true
      }
    });

    return {
      secret: secret.base32,
      qrCode: qrCodeDataUrl
    };
  }

  /**
   * Reset 2FA for user
   */
  static async reset2FA(userId: string) {
    // Delete 2FA record
    await prisma.twoFactorAuth.deleteMany({
      where: { userId }
    });

    return { success: true };
  }
}
