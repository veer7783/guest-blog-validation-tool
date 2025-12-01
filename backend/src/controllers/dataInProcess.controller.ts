import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { DataInProcessService } from '../services/dataInProcess.service';
import { DataInProcessUpdateRequest, PushToMainProjectRequest } from '../types/upload.types';

export class DataInProcessController {
  /**
   * Get all data in process
   */
  static async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { page, limit, sortBy, sortOrder, uploadTaskId, status } = req.query;
      const userId = req.user!.id;
      const userRole = req.user!.role;

      const result = await DataInProcessService.getAll({
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
        uploadTaskId: uploadTaskId as string,
        status: status as string,
        userId: userRole === 'SUPER_ADMIN' ? undefined : userId, // Admin sees only their data
        userRole: userRole
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
   * Get single data in process
   */
  static async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = await DataInProcessService.getById(id);

      res.status(200).json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update data in process
   */
  static async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updateData: DataInProcessUpdateRequest = req.body;
      const userId = req.user!.id;

      const updated = await DataInProcessService.update(id, updateData, userId);

      res.status(200).json({
        success: true,
        message: 'Data updated successfully',
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Push data to main project
   */
  static async pushToMainProject(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const pushRequest: PushToMainProjectRequest = req.body;
      const userId = req.user!.id;

      const result = await DataInProcessService.pushToMainProject(pushRequest, userId);

      res.status(200).json({
        success: true,
        message: `Pushed ${result.pushedCount} records to main project`,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete data in process (Super Admin only)
   */
  static async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const userRole = req.user!.role;

      // Only Super Admin can delete
      if (userRole !== 'SUPER_ADMIN') {
        res.status(403).json({
          success: false,
          message: 'Only Super Admin can delete records'
        });
        return;
      }

      const result = await DataInProcessService.delete(id, userId);

      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get statistics
   */
  static async getStatistics(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { uploadTaskId } = req.query;
      const stats = await DataInProcessService.getStatistics(uploadTaskId as string);

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }
}
