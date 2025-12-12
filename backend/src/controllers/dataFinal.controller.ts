import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { DataFinalService } from '../services/dataFinal.service';
import { MainProjectAPIService } from '../services/mainProjectAPI.service';
import { ActivityLogService } from '../services/activityLog.service';

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

      // Log activity
      await ActivityLogService.logFromRequest(
        req,
        userId,
        'DATA_FINAL_UPDATED',
        'DataFinal',
        id,
        { websiteUrl: updated.websiteUrl, changes: updateData }
      );

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

      await DataFinalService.delete(id, userId);

      // Log activity
      await ActivityLogService.logFromRequest(
        req,
        userId,
        'DATA_FINAL_DELETED',
        'DataFinal',
        id,
        null
      );

      res.status(200).json({
        success: true,
        message: 'Record deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all pushed records (for Pushed Data page)
   */
  static async getPushedRecords(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userRole = req.user!.role;

      // Only Super Admin can access
      if (userRole !== 'SUPER_ADMIN') {
        res.status(403).json({
          success: false,
          message: 'Only Super Admin can access Pushed Data'
        });
        return;
      }

      const records = await DataFinalService.getPushedRecords();

      res.json({
        success: true,
        data: records
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete pushed records (bulk delete)
   */
  static async deletePushedRecords(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { ids } = req.body;
      const userId = req.user!.id;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        res.status(400).json({
          success: false,
          message: 'No record IDs provided'
        });
        return;
      }

      const result = await DataFinalService.deletePushedRecords(ids, userId);

      // Log activity with IP and user agent
      await ActivityLogService.logFromRequest(
        req,
        userId,
        'PUSHED_DATA_DELETED',
        'DataFinal',
        null,
        { count: result.count, ids }
      );

      res.json({
        success: true,
        message: `Successfully deleted ${result.count} record(s)`,
        data: { deletedCount: result.count }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Bulk delete unpushed data final records (Super Admin only)
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

      const result = await DataFinalService.bulkDelete(ids, userId);

      // Log activity with IP and user agent
      await ActivityLogService.logFromRequest(
        req,
        userId,
        'DATA_FINAL_BULK_DELETED',
        'DataFinal',
        null,
        { count: result.count, ids }
      );

      res.json({
        success: true,
        message: result.message,
        data: { deletedCount: result.count }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Push selected or all unpushed records to main project
   * - New sites go directly to guest blog site table (bulk import)
   * - Sites with lower price than existing go to pending (submit for approval)
   */
  static async pushToMainProject(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      console.log('=== PUSH TO MAIN PROJECT STARTED ===');
      const { recordIds } = req.body;
      const userId = req.user!.id;
      const userRole = req.user!.role;
      
      console.log('User ID:', userId);
      console.log('User Role:', userRole);
      console.log('Record IDs:', recordIds);

      // Only Super Admin can push to main project
      if (userRole !== 'SUPER_ADMIN') {
        res.status(403).json({
          success: false,
          message: 'Only Super Admin can push to main project'
        });
        return;
      }
      
      // Get records to push
      const records = await DataFinalService.getRecordsToPush(recordIds);
      
      if (records.length === 0) {
        res.status(400).json({
          success: false,
          message: 'No records to push'
        });
        return;
      }
      
      // Check which sites already exist in main project and get their prices
      const websiteUrls = records.map(r => r.websiteUrl);
      const duplicateCheck = await MainProjectAPIService.checkDuplicates(websiteUrls);
      
      console.log('Duplicate check results:', JSON.stringify(duplicateCheck, null, 2));
      
      // Split records into two groups:
      // 1. New sites (not in main project) -> direct import
      // 2. Sites with lower price -> submit for approval
      const newSites: typeof records = [];
      const lowerPriceSites: typeof records = [];
      const skippedSites: Array<{ site_url: string; reason: string }> = [];
      
      for (const record of records) {
        const dupInfo = duplicateCheck.find(d => d.websiteUrl === record.websiteUrl);
        
        console.log(`Processing ${record.websiteUrl}: dupInfo=${JSON.stringify(dupInfo)}, gbBasePrice=${record.gbBasePrice}`);
        
        if (!dupInfo || !dupInfo.isDuplicate) {
          // New site - goes directly to main table
          newSites.push(record);
          console.log(`New site: ${record.websiteUrl} -> Direct import`);
        } else if (record.gbBasePrice != null && dupInfo.existingPrice != null && record.gbBasePrice < dupInfo.existingPrice) {
          // Existing site with lower price - goes to pending
          lowerPriceSites.push(record);
          console.log(`Lower price: ${record.websiteUrl} ($${dupInfo.existingPrice} -> $${record.gbBasePrice}) -> Pending`);
        } else if (record.gbBasePrice != null && (dupInfo.existingPrice == null || dupInfo.existingPrice === 0)) {
          // Existing site but no price info from main tool - send to pending for review
          lowerPriceSites.push(record);
          console.log(`Existing but no price info: ${record.websiteUrl} -> Pending for review`);
        } else {
          // Existing site with same or higher price - skip
          const reason = dupInfo.existingPrice != null 
            ? `Same or higher price (existing: $${dupInfo.existingPrice}, new: $${record.gbBasePrice})`
            : 'Already exists in main tool (no price comparison available)';
          skippedSites.push({ site_url: record.websiteUrl, reason });
          console.log(`Skipped: ${record.websiteUrl} - ${reason}`);
        }
      }
      
      console.log(`Split: ${newSites.length} new, ${lowerPriceSites.length} lower price, ${skippedSites.length} skipped`);
      
      // Results tracking
      let directImportResult = { success: true, pushedCount: 0, failedCount: 0, results: [] as any[] };
      let approvalResult = { 
        success: true, 
        submitted: 0, 
        skipped: 0, 
        errors: 0, 
        details: { submitted: [] as any[], skipped: [] as any[], errors: [] as any[] } 
      };
      
      // 1. Direct import for new sites
      if (newSites.length > 0) {
        console.log(`Direct importing ${newSites.length} new sites...`);
        directImportResult = await MainProjectAPIService.bulkImport(newSites as any);
        console.log('Direct import result:', JSON.stringify(directImportResult, null, 2));
        
        // Mark directly imported records as pushed
        if (directImportResult.pushedCount > 0) {
          const importedSites = newSites.slice(0, directImportResult.pushedCount).map(s => ({ site_url: s.websiteUrl }));
          await DataFinalService.markAsPushed(importedSites, newSites, userId);
        }
      }
      
      // 2. Submit for approval for lower price sites
      if (lowerPriceSites.length > 0) {
        console.log(`Submitting ${lowerPriceSites.length} lower price sites for approval...`);
        approvalResult = await MainProjectAPIService.submitForApproval(lowerPriceSites as any);
        console.log('Approval result:', JSON.stringify(approvalResult, null, 2));
        
        // Mark submitted records as pushed (pending approval)
        if (approvalResult.details.submitted && approvalResult.details.submitted.length > 0) {
          await DataFinalService.markAsPushed(approvalResult.details.submitted, lowerPriceSites, userId);
        }
        
        // Add any skipped from approval to our skipped list
        if (approvalResult.details.skipped) {
          skippedSites.push(...approvalResult.details.skipped);
        }
      }
      
      // Build response message
      const totalSuccessful = directImportResult.pushedCount + approvalResult.submitted;
      const totalSkipped = skippedSites.length;
      const totalFailed = directImportResult.failedCount + approvalResult.errors;
      
      let message = '';
      if (directImportResult.pushedCount > 0) {
        message += `${directImportResult.pushedCount} new site(s) added directly. `;
      }
      if (approvalResult.submitted > 0) {
        message += `${approvalResult.submitted} site(s) with lower price submitted for approval. `;
      }
      if (totalSkipped > 0) {
        message += `${totalSkipped} site(s) skipped (same/higher price or already exists). `;
      }
      if (totalFailed > 0) {
        message += `${totalFailed} site(s) failed. `;
      }
      if (!message) {
        message = 'No sites were processed.';
      }

      const responseData = {
        total: records.length,
        successful: totalSuccessful,
        directImport: directImportResult.pushedCount,
        pendingApproval: approvalResult.submitted,
        failed: totalFailed,
        skipped: totalSkipped,
        details: {
          submitted: [
            ...newSites.slice(0, directImportResult.pushedCount).map(s => ({ site_url: s.websiteUrl, action_type: 'direct_import' })),
            ...approvalResult.details.submitted.map((s: any) => ({ ...s, action_type: 'pending_approval' }))
          ],
          skipped: skippedSites,
          errors: approvalResult.details.errors
        },
        message
      };
      
      // Log activity
      await ActivityLogService.logFromRequest(
        req,
        userId,
        'PUSH_TO_MAIN_PROJECT',
        'DataFinal',
        null,
        {
          totalRecords: records.length,
          directImport: directImportResult.pushedCount,
          pendingApproval: approvalResult.submitted,
          skipped: totalSkipped,
          failed: totalFailed,
          newSites: newSites.map(s => s.websiteUrl),
          lowerPriceSites: lowerPriceSites.map(s => s.websiteUrl),
          skippedSites: skippedSites.map(s => ({ url: s.site_url, reason: s.reason }))
        }
      );
      
      console.log('Sending response:', JSON.stringify(responseData, null, 2));
      
      res.json({
        success: true,
        data: responseData
      });
    } catch (error) {
      next(error);
    }
  }
}
