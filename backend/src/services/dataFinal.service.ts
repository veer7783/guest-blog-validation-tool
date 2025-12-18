import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { ActivityLogService } from './activityLog.service';

interface DataFinalFilters {
  page: number;
  limit: number;
  status?: string;
  negotiationStatus?: string;
  reachedBy?: string;
}

interface DataFinalUpdateRequest {
  publisherName?: string;
  publisherEmail?: string;
  publisherContact?: string;
  da?: number;
  dr?: number;
  traffic?: number;
  ss?: number;
  category?: string;
  country?: string;
  language?: string;
  tat?: string;
  gbBasePrice?: number;
  liBasePrice?: number;
  status?: 'ACTIVE' | 'INACTIVE';
  negotiationStatus?: 'IN_PROGRESS' | 'DONE';
}

export class DataFinalService {
  /**
   * Get all data final records with pagination
   */
  static async getAll(filters: DataFinalFilters) {
    const { status, negotiationStatus, reachedBy } = filters;

    const where: any = {};
    if (status) where.status = status;
    if (negotiationStatus) where.negotiationStatus = negotiationStatus;
    if (reachedBy) where.reachedBy = reachedBy;
    
    // Only show unpushed sites (sites not yet transferred to main project)
    where.mainProjectId = null;

    const [data, total] = await Promise.all([
      prisma.dataFinal.findMany({
        where,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          reachedByUser: {
            select: {
              firstName: true,
              lastName: true,
              role: true
            }
          },
          pushedByUser: {
            select: {
              firstName: true,
              lastName: true,
              role: true
            }
          }
        }
      }),
      prisma.dataFinal.count({ where })
    ]);

    return {
      data,
      pagination: {
        total
      }
    };
  }

  /**
   * Get single data final record by ID
   */
  static async getById(id: string) {
    const record = await prisma.dataFinal.findUnique({
      where: { id }
    });

    if (!record) {
      throw new AppError('Record not found', 404);
    }

    return record;
  }

  /**
   * Update data final record
   */
  static async update(id: string, updateData: DataFinalUpdateRequest, updatedBy: string) {
    const existing = await prisma.dataFinal.findUnique({
      where: { id }
    });

    if (!existing) {
      throw new AppError('Record not found', 404);
    }

    // Get user info for tracking
    const user = await prisma.user.findUnique({
      where: { id: updatedBy },
      select: { firstName: true, lastName: true }
    });

    const updated = await prisma.dataFinal.update({
      where: { id },
      data: {
        publisherName: updateData.publisherName,
        publisherEmail: updateData.publisherEmail,
        publisherContact: updateData.publisherContact,
        da: updateData.da,
        dr: updateData.dr,
        traffic: updateData.traffic,
        ss: updateData.ss,
        category: updateData.category,
        country: updateData.country,
        language: updateData.language,
        tat: updateData.tat,
        gbBasePrice: updateData.gbBasePrice,
        liBasePrice: updateData.liBasePrice,
        status: updateData.status,
        negotiationStatus: updateData.negotiationStatus,
        lastModifiedBy: updatedBy,
        lastModifiedByName: user ? `${user.firstName} ${user.lastName}` : undefined
      }
    });

    // Log activity
    await ActivityLogService.createLog(
      updatedBy,
      'DATA_FINAL_UPDATED',
      'DataFinal',
      id,
      { websiteUrl: existing.websiteUrl },
      null,
      null
    );

    return updated;
  }

  /**
   * Delete data final record
   */
  static async delete(id: string, deletedBy?: string) {
    const existing = await prisma.dataFinal.findUnique({
      where: { id }
    });

    if (!existing) {
      throw new AppError('Record not found', 404);
    }

    await prisma.dataFinal.delete({
      where: { id }
    });

    // Log activity if deletedBy is provided
    if (deletedBy) {
      await ActivityLogService.createLog(
        deletedBy,
        'DATA_FINAL_DELETED',
        'DataFinal',
        id,
        { websiteUrl: existing.websiteUrl },
        null,
        null
      );
    }

    return { success: true };
  }

  /**
   * Get all pushed records (for Pushed Data page)
   */
  static async getPushedRecords() {
    return await prisma.dataFinal.findMany({
      where: {
        mainProjectId: { not: null } // Only pushed records
      },
      orderBy: {
        pushedAt: 'desc'
      },
      include: {
        pushedByUser: {
          select: {
            firstName: true,
            lastName: true,
            role: true
          }
        }
      }
    });
  }

  /**
   * Delete pushed records by IDs
   */
  static async deletePushedRecords(ids: string[], deletedBy?: string) {
    // Get records for logging
    const records = await prisma.dataFinal.findMany({
      where: {
        id: { in: ids },
        mainProjectId: { not: null }
      },
      select: { id: true, websiteUrl: true }
    });

    const result = await prisma.dataFinal.deleteMany({
      where: {
        id: { in: ids },
        mainProjectId: { not: null } // Only delete pushed records
      }
    });

    // Log activity if deletedBy is provided
    if (deletedBy && records.length > 0) {
      await ActivityLogService.createLog(
        deletedBy,
        'DATA_FINAL_BULK_DELETED',
        'DataFinal',
        ids.join(','),
        { count: records.length, websiteUrls: records.map(r => r.websiteUrl) },
        null,
        null
      );
    }

    return result;
  }

  /**
   * Bulk delete unpushed data final records
   */
  static async bulkDelete(ids: string[], deletedBy: string) {
    // Get records for logging
    const records = await prisma.dataFinal.findMany({
      where: {
        id: { in: ids },
        mainProjectId: null // Only unpushed records
      },
      select: { id: true, websiteUrl: true }
    });

    if (records.length === 0) {
      throw new AppError('No unpushed records found to delete', 404);
    }

    const result = await prisma.dataFinal.deleteMany({
      where: {
        id: { in: ids },
        mainProjectId: null // Only delete unpushed records
      }
    });

    // Log activity
    await ActivityLogService.createLog(
      deletedBy,
      'DATA_FINAL_BULK_DELETED',
      'DataFinal',
      ids.join(','),
      { count: records.length, websiteUrls: records.map(r => r.websiteUrl) },
      null,
      null
    );

    return { count: result.count, message: `${result.count} record(s) deleted successfully` };
  }

  /**
   * Get records to push (selected or all unpushed)
   */
  static async getRecordsToPush(recordIds?: string[]) {
    const where: any = {};
    
    if (recordIds && recordIds.length > 0) {
      where.id = { in: recordIds };
    } else {
      where.mainProjectId = null; // Only unpushed records
    }
    
    return await prisma.dataFinal.findMany({ where });
  }

  /**
   * Mark records as pushed to main project and update with latest data
   */
  static async markAsPushed(submittedSites: any[], originalRecords: any[], userId: string) {
    console.log('markAsPushed called with:', submittedSites.length, 'submitted sites');
    console.log('Original records count:', originalRecords.length);
    
    for (const site of submittedSites) {
      console.log('Processing submitted site:', site.site_url);
      
      // Normalize URL - remove protocol and trailing slash to match DataFinal
      const normalizedUrl = site.site_url
        .replace(/^https?:\/\//, '')  // Remove http:// or https://
        .replace(/\/$/, '');           // Remove trailing slash
      
      // Find the original record data that was submitted (by matching URL)
      const originalRecord = originalRecords.find(r => {
        const recordUrl = r.websiteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase();
        const siteUrl = normalizedUrl.toLowerCase();
        return recordUrl === siteUrl || r.websiteUrl.toLowerCase() === site.site_url.toLowerCase();
      });
      
      if (originalRecord) {
        console.log('Found original record by ID:', originalRecord.id, 'URL:', originalRecord.websiteUrl);
        
        // Update directly using the original record's ID
        await prisma.dataFinal.update({
          where: { id: originalRecord.id },
          data: {
            mainProjectId: site.site_url, // Use site_url as identifier
            pushedAt: new Date(),
            pushedBy: userId,
            // Keep all existing data from the record (already in DB)
          }
        });
        
        console.log('✅ Successfully marked record as pushed:', originalRecord.id);
      } else {
        console.log('❌ No matching original record found for:', site.site_url);
        console.log('Available records:', originalRecords.map(r => r.websiteUrl));
      }
    }
  }
}
