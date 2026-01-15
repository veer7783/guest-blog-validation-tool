import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { DataInProcessService } from '../services/dataInProcess.service';
import { DataInProcessUpdateRequest, PushToMainProjectRequest } from '../types/upload.types';
import { ActivityLogService } from '../services/activityLog.service';
import { MainProjectAPIService } from '../services/mainProjectAPI.service';

export class DataInProcessController {
  /**
   * Get all data in process
   */
  static async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { page, limit, sortBy, sortOrder, uploadTaskId, status } = req.query;
      const userId = req.user!.id;
      const userRole = req.user!.role;

      console.log('[DataInProcess.getAll] User:', userId, 'Role:', userRole);
      console.log('[DataInProcess.getAll] Filtering params:', {
        userId: userRole === 'SUPER_ADMIN' ? undefined : userId,
        userRole
      });

      const result = await DataInProcessService.getAll({
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
        uploadTaskId: uploadTaskId as string,
        status: status as string,
        userId: userRole === 'SUPER_ADMIN' ? undefined : userId, // SUPER_ADMIN sees all, others see filtered
        userRole: userRole
      });

      console.log('[DataInProcess.getAll] Result count:', result.data.length, 'Total:', result.pagination.total);

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

      // Log activity with IP and user agent
      const movedToFinal = 'movedToDataFinal' in updated && updated.movedToDataFinal;
      await ActivityLogService.logFromRequest(
        req,
        userId,
        movedToFinal ? 'DATA_MARKED_AS_REACHED' : 'DATA_IN_PROCESS_UPDATED',
        'DataInProcess',
        id,
        { websiteUrl: updated.websiteUrl, changes: updateData, movedToDataFinal: movedToFinal }
      );

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

      // Log activity with IP and user agent
      await ActivityLogService.logFromRequest(
        req,
        userId,
        'DATA_IN_PROCESS_DELETED',
        'DataInProcess',
        id,
        null
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
   * Bulk delete data in process (Super Admin only)
   */
  static async bulkDelete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { ids } = req.body;
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

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Please provide an array of record IDs to delete'
        });
        return;
      }

      const result = await DataInProcessService.bulkDelete(ids, userId);

      // Log activity with IP and user agent
      await ActivityLogService.logFromRequest(
        req,
        userId,
        'DATA_IN_PROCESS_BULK_DELETED',
        'DataInProcess',
        null,
        { count: result.count, ids }
      );

      res.status(200).json({
        success: true,
        message: result.message,
        data: { deletedCount: result.count }
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

  /**
   * Update publisher information (Super Admin only)
   * Validates email against main tool - if not matched, converts to contact
   */
  static async updatePublisher(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { publisherName, publisherEmail } = req.body;
      const userId = req.user!.id;
      const userRole = req.user!.role;

      // Only Super Admin can update publisher info
      if (userRole !== 'SUPER_ADMIN') {
        res.status(403).json({
          success: false,
          message: 'Only Super Admin can update publisher information'
        });
        return;
      }

      if (!publisherEmail || !publisherEmail.trim()) {
        res.status(400).json({
          success: false,
          message: 'Publisher email is required'
        });
        return;
      }

      console.log(`[UpdatePublisher] Checking email: ${publisherEmail}`);

      // Fetch publishers from main tool to validate
      const publishersResult = await MainProjectAPIService.fetchPublishers();
      
      if (!publishersResult.success || !publishersResult.publishers) {
        res.status(500).json({
          success: false,
          message: 'Failed to fetch publishers from main tool'
        });
        return;
      }

      const emailLower = publisherEmail.toLowerCase().trim();
      const matchedPublisher = publishersResult.publishers.find(p => 
        p.email?.toLowerCase().trim() === emailLower
      );

      let updateData: any;

      if (matchedPublisher) {
        // Email matches a publisher in main tool
        console.log(`[UpdatePublisher] Email matched publisher: ${matchedPublisher.id}`);
        updateData = {
          publisherId: matchedPublisher.id,
          publisherMatched: true,
          publisherName: publisherName || matchedPublisher.publisherName,
          publisherEmail: matchedPublisher.email,
          contactEmail: null,
          contactName: null
        };
      } else {
        // Email does NOT match - convert to contact
        console.log(`[UpdatePublisher] Email not matched - converting to contact`);
        updateData = {
          publisherId: null,
          publisherMatched: false,
          publisherName: null,
          publisherEmail: null,
          contactEmail: publisherEmail,
          contactName: publisherName || 'Contact'
        };
      }

      const updated = await DataInProcessService.update(id, updateData, userId);

      // Log activity
      await ActivityLogService.logFromRequest(
        req,
        userId,
        'PUBLISHER_INFO_UPDATED',
        'DataInProcess',
        id,
        { 
          websiteUrl: updated.websiteUrl, 
          newEmail: publisherEmail,
          matched: !!matchedPublisher,
          convertedToContact: !matchedPublisher
        }
      );

      res.status(200).json({
        success: true,
        message: matchedPublisher 
          ? 'Publisher updated successfully' 
          : 'Email not matched - converted to contact',
        data: {
          record: updated,
          matched: !!matchedPublisher,
          publisherId: matchedPublisher?.id || null
        }
      });
    } catch (error) {
      next(error);
    }
  }
}
