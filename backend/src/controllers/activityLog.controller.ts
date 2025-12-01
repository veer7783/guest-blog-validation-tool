import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { ActivityLogService } from '../services/activityLog.service';

export class ActivityLogController {
  /**
   * Get activity logs
   */
  static async getLogs(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const {
        userId,
        action,
        entityType,
        startDate,
        endDate,
        page,
        limit
      } = req.query;

      const result = await ActivityLogService.getLogs({
        userId: userId as string,
        action: action as string,
        entityType: entityType as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
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
   * Get log by ID
   */
  static async getLogById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const log = await ActivityLogService.getLogById(id);

      res.status(200).json({
        success: true,
        data: log
      });
    } catch (error) {
      next(error);
    }
  }
}
