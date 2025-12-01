import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import {
  TwoFactorEnableRequest,
  TwoFactorDisableRequest,
  BackupCodeVerifyRequest
} from '../types/twoFactor.types';
import { TwoFactorService } from '../services/twoFactor.service';
import { getClientIp } from '../utils/helpers';

export class TwoFactorController {
  /**
   * Setup 2FA (generate secret and QR code)
   */
  static async setup(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const ipAddress = getClientIp(req);
      const userAgent = req.headers['user-agent'] || null;

      const result = await TwoFactorService.setup(userId, ipAddress, userAgent);

      res.status(200).json({
        success: true,
        message: '2FA setup initiated. Please scan the QR code and verify with your authenticator app.',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Enable 2FA (verify code and activate)
   */
  static async enable(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { code }: TwoFactorEnableRequest = req.body;
      const ipAddress = getClientIp(req);
      const userAgent = req.headers['user-agent'] || null;

      const result = await TwoFactorService.enable(userId, code, ipAddress, userAgent);

      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Disable 2FA
   */
  static async disable(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { password, code }: TwoFactorDisableRequest = req.body;
      const ipAddress = getClientIp(req);
      const userAgent = req.headers['user-agent'] || null;

      const result = await TwoFactorService.disable(userId, password, code, ipAddress, userAgent);

      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify backup code
   */
  static async verifyBackupCode(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { backupCode }: BackupCodeVerifyRequest = req.body;

      const isValid = await TwoFactorService.verifyBackupCode(userId, backupCode);

      if (!isValid) {
        res.status(400).json({
          success: false,
          error: { message: 'Invalid backup code' }
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Backup code verified successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Regenerate backup codes
   */
  static async regenerateBackupCodes(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { password } = req.body;
      const ipAddress = getClientIp(req);
      const userAgent = req.headers['user-agent'] || null;

      const result = await TwoFactorService.regenerateBackupCodes(
        userId,
        password,
        ipAddress,
        userAgent
      );

      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          backupCodes: result.backupCodes
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get 2FA status
   */
  static async getStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const status = await TwoFactorService.getStatus(userId);

      res.status(200).json({
        success: true,
        data: status
      });
    } catch (error) {
      next(error);
    }
  }
}
