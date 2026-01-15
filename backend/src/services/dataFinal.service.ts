import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { ActivityLogService } from './activityLog.service';

interface DataFinalFilters {
  page: number;
  limit: number;
  status?: string;
  negotiationStatus?: string;
  reachedBy?: string;
  userId?: string;
  userRole?: string;
}

interface DataFinalUpdateRequest {
  publisherName?: string;
  publisherEmail?: string;
  publisherContact?: string;
  publisherId?: string;
  publisherMatched?: boolean;
  contactName?: string;
  contactEmail?: string;
  da?: number;
  dr?: number;
  traffic?: number;
  ss?: number;
  keywords?: number;
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
    const { status, negotiationStatus, reachedBy, userId, userRole } = filters;

    const where: any = {};
    if (status) where.status = status;
    if (negotiationStatus) where.negotiationStatus = negotiationStatus;
    if (reachedBy) where.reachedBy = reachedBy;
    
    // Filter by uploaded user for Contributor role
    if (userId && userRole === 'CONTRIBUTOR') {
      where.uploadedBy = userId;
    }
    
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

    // If publisher email is being changed, validate against main tool
    if (updateData.publisherEmail && updateData.publisherEmail !== existing.publisherEmail) {
      const MainProjectAPIService = require('./mainProjectAPI.service').MainProjectAPIService;
      const publishersResult = await MainProjectAPIService.fetchPublishers();
      
      if (publishersResult.success && publishersResult.publishers) {
        const emailLower = updateData.publisherEmail.toLowerCase().trim();
        const matchedPublisher = publishersResult.publishers.find((p: any) => 
          p.email?.toLowerCase().trim() === emailLower
        );

        if (matchedPublisher) {
          // Email matches - update as publisher
          updateData.publisherId = matchedPublisher.id;
          updateData.publisherMatched = true;
          updateData.publisherName = updateData.publisherName || matchedPublisher.publisherName;
          updateData.contactEmail = undefined;
          updateData.contactName = undefined;
        } else {
          // Email doesn't match - convert to contact
          updateData.publisherId = undefined;
          updateData.publisherMatched = false;
          updateData.contactEmail = updateData.publisherEmail;
          updateData.contactName = updateData.publisherName || 'Contact';
          updateData.publisherEmail = undefined;
          updateData.publisherName = undefined;
        }
      }
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
        keywords: updateData.keywords !== undefined ? updateData.keywords : null,
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
   * SUPER_ADMIN: See all pushed records
   * CONTRIBUTOR: See only their own uploaded records
   */
  static async getPushedRecords(userId?: string, userRole?: string) {
    const where: any = {
      mainProjectId: { not: null } // Only pushed records
    };
    
    // CONTRIBUTOR: Filter by their uploaded records
    if (userId && userRole === 'CONTRIBUTOR') {
      where.uploadedBy = userId;
    }
    
    return await prisma.dataFinal.findMany({
      where,
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

  /**
   * Get records by publisher for export
   */
  static async getRecordsByPublisher(filters: {
    publisherId?: string;
    publisherEmail?: string;
  }) {
    const where: any = {};
    
    if (filters.publisherId) {
      where.publisherId = filters.publisherId;
    } else if (filters.publisherEmail) {
      // Search by both publisher email and contact email
      where.OR = [
        { publisherEmail: filters.publisherEmail },
        { contactEmail: filters.publisherEmail }
      ];
    }

    return await prisma.dataFinal.findMany({
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
    });
  }

  /**
   * Generate CSV content for publisher export
   */
  static generatePublisherCSV(records: any[]): string {
    const headers = [
      'Website URL',
      'Publisher Name',
      'Publisher Email',
      'DA',
      'DR',
      'Traffic',
      'SS',
      'Keywords',
      'Category',
      'Country',
      'Language',
      'TAT',
      'GB Base Price',
      'LI Base Price',
      'Status',
      'Negotiation Status',
      'Reached By',
      'Reached At',
      'Created At',
      'Pushed Status',
      'Pushed At',
      'Main Project ID'
    ];

    const csvRows = [headers.join(',')];

    records.forEach(record => {
      // Determine the best name and email to display
      const isTemporaryPublisher = record.publisherId?.startsWith('pending_');
      let displayName, displayEmail;
      
      if (record.contactName && record.contactEmail) {
        displayName = record.contactName;
        displayEmail = record.contactEmail;
      } else if (record.publisherName && record.publisherEmail && !isTemporaryPublisher) {
        displayName = record.publisherName;
        displayEmail = record.publisherEmail;
      } else if (record.contactName || record.contactEmail) {
        displayName = record.contactName || (record.contactEmail ? record.contactEmail.split('@')[0] : '');
        displayEmail = record.contactEmail || '';
      } else {
        displayName = record.publisherName || (record.publisherEmail ? record.publisherEmail.split('@')[0] : '');
        displayEmail = record.publisherEmail || '';
      }
      
      const row = [
        `"${record.websiteUrl || ''}"`,
        `"${displayName || ''}"`,
        `"${displayEmail || ''}"`,
        record.da || '',
        record.dr || '',
        record.traffic || '',
        record.ss || '',
        record.keywords || '',
        `"${record.category || ''}"`,
        `"${record.country || ''}"`,
        `"${record.language || ''}"`,
        `"${record.tat || ''}"`,
        record.gbBasePrice || '',
        record.liBasePrice || '',
        `"${record.status || ''}"`,
        `"${record.negotiationStatus?.replace('_', ' ') || ''}"`,
        `"${record.reachedByUser ? `${record.reachedByUser.firstName} ${record.reachedByUser.lastName}` : record.reachedByName || ''}"`,
        record.reachedAt ? new Date(record.reachedAt).toISOString() : '',
        record.createdAt ? new Date(record.createdAt).toISOString() : '',
        record.mainProjectId ? 'Pushed' : 'Not Pushed',
        record.pushedAt ? new Date(record.pushedAt).toISOString() : '',
        `"${record.mainProjectId || ''}"`
      ];
      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  }

  /**
   * Get unique publishers for export dropdown
   */
  static async getUniquePublishers() {
    // Only get publishers from records that are actually in Data Final (not pushed yet)
    const records = await prisma.dataFinal.findMany({
      select: {
        publisherId: true,
        publisherName: true,
        publisherEmail: true,
        contactName: true,
        contactEmail: true,
        publisherMatched: true,
        mainProjectId: true
      },
      where: {
        AND: [
          {
            OR: [
              { publisherName: { not: null } },
              { publisherEmail: { not: null } },
              { contactName: { not: null } },
              { contactEmail: { not: null } }
            ]
          },
          {
            mainProjectId: null // Only unpushed records (visible in Data Final)
          }
        ]
      }
    });

    // Group by email (contact email preferred, then publisher email)
    const publisherMap = new Map();
    
    records.forEach(record => {
      // Prioritize contact information over temporary publisher data
      let email, name, isMatched;
      
      // Check if publisher data is temporary (starts with 'pending_')
      const isTemporaryPublisher = record.publisherId?.startsWith('pending_');
      
      if (record.contactEmail && record.contactName) {
        // Use contact information if available
        email = record.contactEmail;
        name = record.contactName;
        isMatched = false; // Contact, not matched publisher
      } else if (record.publisherEmail && record.publisherName && !isTemporaryPublisher) {
        // Use publisher information if it's not temporary
        email = record.publisherEmail;
        name = record.publisherName;
        isMatched = record.publisherMatched;
      } else if (record.contactEmail) {
        // Use contact email with fallback name
        email = record.contactEmail;
        name = record.contactName || record.publisherName || email.split('@')[0];
        isMatched = false;
      } else if (record.publisherEmail) {
        // Use publisher email with fallback name
        email = record.publisherEmail;
        name = record.publisherName || email.split('@')[0];
        isMatched = record.publisherMatched;
      }
      
      if (email && name) {
        if (!publisherMap.has(email)) {
          publisherMap.set(email, {
            id: record.publisherId,
            email: email,
            name: name,
            isMatched: isMatched,
            recordCount: 0
          });
        }
        publisherMap.get(email).recordCount++;
      }
    });

    return Array.from(publisherMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }
}
