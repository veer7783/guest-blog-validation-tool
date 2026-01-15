import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import bcrypt from 'bcrypt';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { ActivityLogService } from './activityLog.service';

export class TwoFactorService {
  /**
   * Generate random backup codes
   */
  private static generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      // Generate 8-character alphanumeric code
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  /**
   * Setup 2FA for user (generate secret and QR code)
   */
  static async setup(userId: string, ipAddress: string, userAgent: string | null) {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { twoFactorAuth: true }
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Check if 2FA is already enabled
    if (user.twoFactorAuth?.isEnabled) {
      throw new AppError('2FA is already enabled for this account', 400);
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `Guest Blog Validation (${user.email})`,
      issuer: 'Guest Blog Validation Tool'
    });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url || '');

    // Generate backup codes
    const backupCodes = this.generateBackupCodes(10);
    const hashedBackupCodes = await Promise.all(
      backupCodes.map(code => bcrypt.hash(code, 10))
    );

    // Store or update 2FA settings (not enabled yet)
    await prisma.twoFactorAuth.upsert({
      where: { userId },
      create: {
        userId,
        secret: secret.base32,
        backupCodes: JSON.stringify(hashedBackupCodes),
        isEnabled: false
      },
      update: {
        secret: secret.base32,
        backupCodes: JSON.stringify(hashedBackupCodes),
        isEnabled: false
      }
    });

    // Log activity
    await ActivityLogService.createLog(
      userId,
      '2FA_SETUP_INITIATED',
      'TwoFactorAuth',
      userId,
      null,
      ipAddress,
      userAgent
    );

    return {
      secret: secret.base32,
      qrCodeUrl,
      backupCodes
    };
  }

  /**
   * Verify and enable 2FA
   */
  static async enable(userId: string, code: string, ipAddress: string, userAgent: string | null) {
    // Get user with 2FA settings
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { twoFactorAuth: true }
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (!user.twoFactorAuth) {
      throw new AppError('2FA setup not initiated. Please setup 2FA first.', 400);
    }

    if (user.twoFactorAuth.isEnabled) {
      throw new AppError('2FA is already enabled', 400);
    }

    // Verify the code
    const isValid = speakeasy.totp.verify({
      secret: user.twoFactorAuth.secret,
      encoding: 'base32',
      token: code,
      window: 2
    });

    if (!isValid) {
      throw new AppError('Invalid verification code', 400);
    }

    // Enable 2FA
    await prisma.twoFactorAuth.update({
      where: { userId },
      data: { isEnabled: true }
    });

    // Log activity
    await ActivityLogService.createLog(
      userId,
      '2FA_ENABLED',
      'TwoFactorAuth',
      userId,
      null,
      ipAddress,
      userAgent
    );

    return { message: '2FA enabled successfully' };
  }

  /**
   * Disable 2FA
   */
  static async disable(
    userId: string,
    password: string,
    code: string,
    ipAddress: string,
    userAgent: string | null
  ) {
    // Get user with 2FA settings
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { twoFactorAuth: true }
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (!user.twoFactorAuth?.isEnabled) {
      throw new AppError('2FA is not enabled', 400);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AppError('Invalid password', 400);
    }

    // Verify 2FA code
    const isCodeValid = speakeasy.totp.verify({
      secret: user.twoFactorAuth.secret,
      encoding: 'base32',
      token: code,
      window: 2
    });

    if (!isCodeValid) {
      throw new AppError('Invalid 2FA code', 400);
    }

    // Disable 2FA
    await prisma.twoFactorAuth.update({
      where: { userId },
      data: { isEnabled: false }
    });

    // Log activity
    await ActivityLogService.createLog(
      userId,
      '2FA_DISABLED',
      'TwoFactorAuth',
      userId,
      null,
      ipAddress,
      userAgent
    );

    return { message: '2FA disabled successfully' };
  }

  /**
   * Verify 2FA code during login
   */
  static async verifyCode(userId: string, code: string): Promise<boolean> {
    const twoFactorAuth = await prisma.twoFactorAuth.findUnique({
      where: { userId }
    });

    if (!twoFactorAuth || !twoFactorAuth.isEnabled) {
      return false;
    }

    return speakeasy.totp.verify({
      secret: twoFactorAuth.secret,
      encoding: 'base32',
      token: code,
      window: 2
    });
  }

  /**
   * Verify backup code during login
   */
  static async verifyBackupCode(userId: string, backupCode: string): Promise<boolean> {
    const twoFactorAuth = await prisma.twoFactorAuth.findUnique({
      where: { userId }
    });

    if (!twoFactorAuth || !twoFactorAuth.isEnabled || !twoFactorAuth.backupCodes) {
      return false;
    }

    // Cast backupCodes to string array
    const backupCodes = twoFactorAuth.backupCodes as unknown as string[];

    // Check each backup code
    for (let i = 0; i < backupCodes.length; i++) {
      const isValid = await bcrypt.compare(backupCode, backupCodes[i]);
      if (isValid) {
        // Remove used backup code
        const updatedCodes = backupCodes.filter((_, index) => index !== i);
        await prisma.twoFactorAuth.update({
          where: { userId },
          data: { backupCodes: JSON.stringify(updatedCodes) }
        });

        // Log backup code usage
        await ActivityLogService.createLog(
          userId,
          '2FA_BACKUP_CODE_USED',
          'TwoFactorAuth',
          userId,
          { backupCodesRemaining: updatedCodes.length },
          null,
          null
        );

        return true;
      }
    }

    return false;
  }

  /**
   * Regenerate backup codes
   */
  static async regenerateBackupCodes(
    userId: string,
    password: string,
    ipAddress: string,
    userAgent: string | null
  ) {
    // Get user with 2FA settings
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { twoFactorAuth: true }
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (!user.twoFactorAuth?.isEnabled) {
      throw new AppError('2FA is not enabled', 400);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AppError('Invalid password', 400);
    }

    // Generate new backup codes
    const backupCodes = this.generateBackupCodes(10);
    const hashedBackupCodes = await Promise.all(
      backupCodes.map(code => bcrypt.hash(code, 10))
    );

    // Update backup codes
    await prisma.twoFactorAuth.update({
      where: { userId },
      data: { backupCodes: JSON.stringify(hashedBackupCodes) }
    });

    // Log activity
    await ActivityLogService.createLog(
      userId,
      '2FA_BACKUP_CODES_REGENERATED',
      'TwoFactorAuth',
      userId,
      null,
      ipAddress,
      userAgent
    );

    return {
      backupCodes,
      message: 'Backup codes regenerated successfully'
    };
  }

  /**
   * Get 2FA status
   */
  static async getStatus(userId: string) {
    const twoFactorAuth = await prisma.twoFactorAuth.findUnique({
      where: { userId }
    });

    if (!twoFactorAuth) {
      return {
        isEnabled: false,
        hasBackupCodes: false
      };
    }

    const backupCodes = (twoFactorAuth.backupCodes as unknown as string[]) || [];

    return {
      isEnabled: twoFactorAuth.isEnabled,
      hasBackupCodes: backupCodes.length > 0,
      backupCodesRemaining: backupCodes.length
    };
  }
}
