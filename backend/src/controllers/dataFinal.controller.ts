import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { DataFinalService } from '../services/dataFinal.service';
import { MainProjectAPIService } from '../services/mainProjectAPI.service';
import { ActivityLogService } from '../services/activityLog.service';
import { PublisherSyncService } from '../services/publisherSync.service';

export class DataFinalController {
  /**
   * Get all data final records (Super Admin only)
   */
  static async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const userRole = req.user!.role;

      // Allow Super Admin and Contributor to access Data Final
      if (userRole !== 'SUPER_ADMIN' && userRole !== 'CONTRIBUTOR') {
        res.status(403).json({
          success: false,
          message: 'Access denied'
        });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 1000;
      const status = req.query.status as string;
      const negotiationStatus = req.query.negotiationStatus as string;
      const reachedBy = req.query.reachedBy as string;

      const result = await DataFinalService.getAll({
        page,
        limit,
        status,
        negotiationStatus,
        reachedBy,
        userId,
        userRole
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
      const userId = req.user!.id;
      const userRole = req.user!.role;

      // Allow Super Admin and Contributor to access
      if (userRole !== 'SUPER_ADMIN' && userRole !== 'CONTRIBUTOR') {
        res.status(403).json({
          success: false,
          message: 'Only Super Admin and Contributors can access Pushed Data'
        });
        return;
      }

      const records = await DataFinalService.getPushedRecords(userId, userRole);

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

      // Allow Super Admin and Contributor to push to main project
      // CONTRIBUTOR: All sites go to pending module for approval
      // SUPER_ADMIN: New sites direct import, lower price to pending
      if (userRole !== 'SUPER_ADMIN' && userRole !== 'CONTRIBUTOR') {
        res.status(403).json({
          success: false,
          message: 'Only Super Admin and Contributors can push to main project'
        });
        return;
      }
      
      // Get records to push
      const allRecords = await DataFinalService.getRecordsToPush(recordIds);
      
      if (allRecords.length === 0) {
        res.status(400).json({
          success: false,
          message: 'No records to push'
        });
        return;
      }
      
      // Fetch all publishers from main tool to check if contact emails exist as publishers
      const publishersResult = await MainProjectAPIService.fetchPublishers();
      const mainToolPublisherEmails = new Set(
        (publishersResult.publishers || [])
          .filter(p => p.email)
          .map(p => p.email!.toLowerCase())
      );
      
      console.log('Main tool publisher emails count:', mainToolPublisherEmails.size);
      
      // Filter records: only allow if publisherMatched=true OR email exists in main tool publishers
      const records: typeof allRecords = [];
      const recordsWithoutPublisher: typeof allRecords = [];
      
      for (const record of allRecords) {
        const email = (record.publisherEmail || record.contactEmail || '').toLowerCase();
        const hasLocalPublisher = record.publisherMatched === true;
        const hasMainToolPublisher = email && mainToolPublisherEmails.has(email);
        
        if (hasLocalPublisher || hasMainToolPublisher) {
          // If email exists in main tool but not marked locally, update the record info
          if (hasMainToolPublisher && !hasLocalPublisher) {
            console.log(`Record ${record.websiteUrl}: Email ${email} found in main tool publishers`);
          }
          records.push(record);
        } else {
          recordsWithoutPublisher.push(record);
        }
      }
      
      if (records.length === 0) {
        res.status(400).json({
          success: false,
          message: `Cannot push ${recordsWithoutPublisher.length} record(s) - no valid Publisher found. Records must have a matched Publisher (locally marked or existing in main tool) before pushing. Please mark the contact as a Publisher first.`,
          data: {
            recordsWithoutPublisher: recordsWithoutPublisher.map(r => ({
              websiteUrl: r.websiteUrl,
              contactName: r.contactName,
              contactEmail: r.contactEmail,
              publisherMatched: r.publisherMatched
            }))
          }
        });
        return;
      }
      
      // Log if some records were filtered out
      if (recordsWithoutPublisher.length > 0) {
        console.log(`Filtered out ${recordsWithoutPublisher.length} records without valid publisher:`, 
          recordsWithoutPublisher.map(r => ({ url: r.websiteUrl, contact: r.contactEmail || r.contactName })));
      }
      
      // Check which sites already exist in main project and get their prices
      const websiteUrls = records.map(r => r.websiteUrl);
      const duplicateCheck = await MainProjectAPIService.checkDuplicates(websiteUrls);
      
      console.log('Duplicate check results:', JSON.stringify(duplicateCheck, null, 2));
      
      // Split records based on user role:
      // CONTRIBUTOR: ALL sites go to pending module (no direct import)
      // SUPER_ADMIN: New sites -> direct import, lower price -> pending
      const newSites: typeof records = [];
      const lowerPriceSites: typeof records = [];
      const skippedSites: Array<{ site_url: string; reason: string }> = [];
      
      for (const record of records) {
        const dupInfo = duplicateCheck.find(d => d.websiteUrl === record.websiteUrl);
        
        console.log(`Processing ${record.websiteUrl}: dupInfo=${JSON.stringify(dupInfo)}, gbBasePrice=${record.gbBasePrice}, publisherEmail=${record.publisherEmail}, publisherName=${record.publisherName}, publisherMatched=${record.publisherMatched}`);
        
        // CONTRIBUTOR: All sites go to pending for approval
        if (userRole === 'CONTRIBUTOR') {
          lowerPriceSites.push(record);
          console.log(`[CONTRIBUTOR] ${record.websiteUrl} -> Pending for approval`);
          continue;
        }
        
        // SUPER_ADMIN: Original logic
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
          
          // Sync publishers for directly imported sites
          console.log('[PUSH] Syncing publishers for directly imported sites...');
          const directSyncResult = await PublisherSyncService.syncPublishersForRecords(newSites);
          console.log(`[PUSH] Direct import publisher sync: ${directSyncResult.synced} records synced`);
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
          
          // Sync publishers for submitted sites
          console.log('[PUSH] Syncing publishers for submitted sites...');
          const approvalSyncResult = await PublisherSyncService.syncPublishersForRecords(lowerPriceSites);
          console.log(`[PUSH] Approval publisher sync: ${approvalSyncResult.synced} records synced`);
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

  /**
   * Export data by publisher (CSV format)
   */
  static async exportByPublisher(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userRole = req.user!.role;
      const userId = req.user!.id;

      // Only Super Admin can export data
      if (userRole !== 'SUPER_ADMIN') {
        res.status(403).json({
          success: false,
          message: 'Only Super Admin can export data'
        });
        return;
      }

      const { publisherId, publisherEmail, format = 'csv' } = req.query;

      if (!publisherId && !publisherEmail) {
        res.status(400).json({
          success: false,
          message: 'Publisher ID or Publisher Email is required'
        });
        return;
      }

      // Get records for the specific publisher
      const records = await DataFinalService.getRecordsByPublisher({
        publisherId: publisherId as string,
        publisherEmail: publisherEmail as string
      });

      if (records.length === 0) {
        res.status(404).json({
          success: false,
          message: 'No records found for this publisher'
        });
        return;
      }

      // Generate CSV content
      const csvContent = DataFinalService.generatePublisherCSV(records);
      
      // Get publisher name for filename - prioritize contact info over temporary publisher data
      let publisherName = 'Unknown';
      if (records.length > 0) {
        const record = records[0];
        const isTemporaryPublisher = record.publisherId?.startsWith('pending_');
        
        if (record.contactName) {
          publisherName = record.contactName;
        } else if (record.publisherName && !isTemporaryPublisher) {
          publisherName = record.publisherName;
        } else if (record.contactEmail) {
          publisherName = record.contactEmail.split('@')[0];
        } else if (record.publisherEmail) {
          publisherName = record.publisherEmail.split('@')[0];
        }
      }
      
      const sanitizedName = publisherName.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `publisher_${sanitizedName}_export_${new Date().toISOString().split('T')[0]}.csv`;

      // Log activity
      await ActivityLogService.logFromRequest(
        req,
        userId,
        'DATA_FINAL_EXPORTED',
        'DataFinal',
        publisherId as string || publisherEmail as string,
        { 
          publisherName,
          recordCount: records.length,
          exportType: 'publisher_wise'
        }
      );

      // Set headers for CSV download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(csvContent);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get unique publishers for export dropdown
   */
  static async getUniquePublishers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userRole = req.user!.role;

      // Only Super Admin can access
      if (userRole !== 'SUPER_ADMIN') {
        res.status(403).json({
          success: false,
          message: 'Only Super Admin can access publisher list'
        });
        return;
      }

      const publishers = await DataFinalService.getUniquePublishers();

      res.json({
        success: true,
        data: publishers
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

      console.log(`[UpdatePublisher DataFinal] Checking email: ${publisherEmail}`);

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
        console.log(`[UpdatePublisher DataFinal] Email matched publisher: ${matchedPublisher.id}`);
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
        console.log(`[UpdatePublisher DataFinal] Email not matched - converting to contact`);
        updateData = {
          publisherId: null,
          publisherMatched: false,
          publisherName: null,
          publisherEmail: null,
          contactEmail: publisherEmail,
          contactName: publisherName || 'Contact'
        };
      }

      const updated = await DataFinalService.update(id, updateData, userId);

      // Log activity
      await ActivityLogService.logFromRequest(
        req,
        userId,
        'PUBLISHER_INFO_UPDATED',
        'DataFinal',
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
