import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { DataFinalService } from '../services/dataFinal.service';

export class DataFinalController {
  /**
   * Get all data final records (Super Admin only)
   */
  static async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userRole = req.user!.role;

      // Only Super Admin can access Data Final
      if (userRole !== 'SUPER_ADMIN') {
        res.status(403).json({
          success: false,
          message: 'Only Super Admin can access Data Final'
        });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as string;
      const negotiationStatus = req.query.negotiationStatus as string;
      const reachedBy = req.query.reachedBy as string;

      const result = await DataFinalService.getAll({
        page,
        limit,
        status,
        negotiationStatus,
        reachedBy
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
   * Get single data final record by ID
   */
  static async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const record = await DataFinalService.getById(id);

      res.status(200).json({
        success: true,
        data: record
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update data final record
   */
  static async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const userId = req.user!.id;

      const updated = await DataFinalService.update(id, updateData, userId);

      res.status(200).json({
        success: true,
        message: 'Record updated successfully',
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete data final record (Super Admin only)
   */
  static async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userRole = req.user!.role;

      // Only Super Admin can delete
      if (userRole !== 'SUPER_ADMIN') {
        res.status(403).json({
          success: false,
          message: 'Only Super Admin can delete records'
        });
        return;
      }

      await DataFinalService.delete(id);

      res.status(200).json({
        success: true,
        message: 'Record deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}
