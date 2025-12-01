import prisma from '../config/database';
import { DataInProcessCreateRequest, DataInProcessUpdateRequest, PushToMainProjectRequest } from '../types/upload.types';
import { PaginationParams } from '../types';
import { AppError } from '../middleware/errorHandler';
import { MainProjectAPIService } from './mainProjectAPI.service';
import { ActivityLogService } from './activityLog.service';

export class DataInProcessService {
  /**
   * Create data in process record
   */
  static async create(data: DataInProcessCreateRequest) {
    const record = await prisma.dataInProcess.create({
      data: {
        websiteUrl: data.websiteUrl,
        category: data.category,
        language: data.language,
        country: data.country,
        daRange: data.daRange,
        price: data.price,
        linkType: data.linkType,
        tat: data.tat,
        publisherName: data.publisherName,
        publisherEmail: data.publisherEmail,
        publisherContact: data.publisherContact,
        notes: data.notes,
        status: 'PENDING',
        uploadTaskId: data.uploadTaskId
      }
    });

    return record;
  }

  /**
   * Bulk create data in process records
   */
  static async bulkCreate(records: DataInProcessCreateRequest[]) {
    const created = await prisma.dataInProcess.createMany({
      data: records.map(r => ({
        websiteUrl: r.websiteUrl,
        category: r.category,
        language: r.language,
        country: r.country,
        daRange: r.daRange,
        price: r.price,
        linkType: r.linkType,
        tat: r.tat,
        publisherName: r.publisherName,
        publisherEmail: r.publisherEmail,
        publisherContact: r.publisherContact,
        notes: r.notes,
        status: 'PENDING',
        uploadTaskId: r.uploadTaskId
      }))
    });

    return { count: created.count };
  }

  /**
   * Get all data in process with pagination
   */
  static async getAll(params: PaginationParams & { uploadTaskId?: string; status?: string; userId?: string; userRole?: string }) {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', uploadTaskId, status, userId, userRole } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (uploadTaskId) where.uploadTaskId = uploadTaskId;
    if (status) where.status = status;
    
    // Filter by assigned user for Admin role
    if (userId && userRole === 'ADMIN') {
      where.uploadTask = {
        assignedTo: userId
      };
    }

    const [data, total] = await Promise.all([
      prisma.dataInProcess.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          uploadTask: {
            select: {
              id: true,
              fileName: true,
              uploadedAt: true,
              assignedTo: true,
              assignedToUser: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          }
        }
      }),
      prisma.dataInProcess.count({ where })
    ]);

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get single data in process by ID
   */
  static async getById(id: string) {
    const data = await prisma.dataInProcess.findUnique({
      where: { id },
      include: {
        uploadTask: true
      }
    });

    if (!data) {
      throw new AppError('Data not found', 404);
    }

    return data;
  }

  /**
   * Update data in process
   */
  static async update(id: string, updateData: DataInProcessUpdateRequest, updatedBy: string) {
    const existing = await prisma.dataInProcess.findUnique({
      where: { id }
    });

    if (!existing) {
      throw new AppError('Data not found', 404);
    }

    // If status is being changed to REACHED, move to DataFinal
    if (updateData.status === 'REACHED' && existing.status !== 'REACHED') {
      // Get user info for tracking who marked as reached
      const user = await prisma.user.findUnique({
        where: { id: updatedBy },
        select: { firstName: true, lastName: true }
      });

      // Create record in DataFinal
      await prisma.dataFinal.create({
        data: {
          websiteUrl: existing.websiteUrl,
          category: existing.category,
          language: existing.language,
          country: existing.country,
          daRange: existing.daRange,
          linkType: existing.linkType,
          tat: existing.tat,
          publisherName: existing.publisherName,
          publisherEmail: existing.publisherEmail,
          publisherContact: existing.publisherContact,
          notes: existing.notes,
          status: 'ACTIVE', // DataFinal uses SiteStatus (ACTIVE/INACTIVE)
          reachedBy: updatedBy, // Track who marked it as reached
          reachedByName: user ? `${user.firstName} ${user.lastName}` : undefined, // Track name
          reachedAt: new Date(),
          da: existing.da,
          dr: existing.dr,
          traffic: existing.traffic,
          ss: existing.ss
        }
      });

      // Delete from DataInProcess
      await prisma.dataInProcess.delete({
        where: { id }
      });

      // Check if all data rows in this upload task are now completed
      const remainingRows = await prisma.dataInProcess.count({
        where: { uploadTaskId: existing.uploadTaskId }
      });

      // If no rows remaining, mark the upload task as COMPLETED
      if (remainingRows === 0) {
        await prisma.dataUploadTask.update({
          where: { id: existing.uploadTaskId },
          data: { status: 'COMPLETED' }
        });
      }

      // Log activity
      await ActivityLogService.createLog(
        updatedBy,
        'DATA_MOVED_TO_FINAL',
        'DataFinal',
        id,
        { websiteUrl: existing.websiteUrl, status: 'REACHED' },
        null,
        null
      );

      return { ...existing, status: 'REACHED', movedToDataFinal: true };
    }

    // Otherwise, just update the record
    // Get user info for tracking
    const user = await prisma.user.findUnique({
      where: { id: updatedBy },
      select: { firstName: true, lastName: true }
    });

    const updated = await prisma.dataInProcess.update({
      where: { id },
      data: {
        publisherEmail: updateData.publisherEmail,
        publisherName: updateData.publisherName,
        publisherContact: updateData.publisherContact,
        da: updateData.da,
        dr: updateData.dr,
        traffic: updateData.traffic,
        ss: updateData.ss,
        category: updateData.category,
        country: updateData.country,
        language: updateData.language,
        tat: updateData.tat,
        daRange: updateData.daRange,
        price: updateData.price,
        linkType: updateData.linkType,
        notes: updateData.notes,
        status: updateData.status,
        lastModifiedBy: updatedBy,
        lastModifiedByName: user ? `${user.firstName} ${user.lastName}` : undefined
      }
    });

    // Log activity
    await ActivityLogService.createLog(
      updatedBy,
      'DATA_IN_PROCESS_UPDATED',
      'DataInProcess',
      id,
      { websiteUrl: existing.websiteUrl },
      null,
      null
    );

    return updated;
  }

  /**
   * Push data to main project
   */
  static async pushToMainProject(request: PushToMainProjectRequest, pushedBy: string) {
    const dataRecords = await prisma.dataInProcess.findMany({
      where: {
        id: { in: request.dataIds },
        status: 'VERIFIED'
      }
    });

    if (dataRecords.length === 0) {
      throw new AppError('No verified data found to push', 400);
    }

    // Prepare data for main project
    const dataForPush = dataRecords.map((d: any) => ({
      websiteUrl: d.websiteUrl,
      category: d.category || undefined,
      language: d.language || undefined,
      country: d.country || undefined,
      daRange: d.daRange || undefined,
      price: d.price || undefined,
      linkType: d.linkType || undefined,
      tat: d.tat || undefined,
      publisherName: d.publisherName || undefined,
      publisherEmail: d.publisherEmail || undefined,
      publisherContact: d.publisherContact || undefined,
      notes: d.notes || undefined
    }));

    // Push to main project
    const pushResult = await MainProjectAPIService.bulkImport(dataForPush);

    // Update status and move to data final
    for (let i = 0; i < dataRecords.length; i++) {
      const record = dataRecords[i];
      const result = pushResult.results[i];

      if (result?.success) {
        // Move to DataFinal
        await prisma.dataFinal.create({
          data: {
            websiteUrl: record.websiteUrl,
            category: record.category,
            language: record.language,
            country: record.country,
            daRange: record.daRange,
            linkType: record.linkType,
            tat: record.tat,
            publisherName: record.publisherName,
            publisherEmail: record.publisherEmail,
            publisherContact: record.publisherContact,
            notes: record.notes,
            da: record.da,
            dr: record.dr,
            traffic: record.traffic,
            ss: record.ss,
            mainProjectId: result.mainProjectId || null,
            pushedAt: new Date(),
            pushedBy
          }
        });

        // Update status in DataInProcess
        await prisma.dataInProcess.update({
          where: { id: record.id },
          data: { status: 'PUSHED' }
        });

        // Log activity
        await ActivityLogService.createLog(
          pushedBy,
          'DATA_PUSHED_TO_MAIN_PROJECT',
          'DataInProcess',
          record.id,
          { websiteUrl: record.websiteUrl, mainProjectId: result.mainProjectId },
          null,
          null
        );
      }
    }

    return pushResult;
  }

  /**
   * Delete data in process
   */
  static async delete(id: string, deletedBy: string) {
    const data = await prisma.dataInProcess.findUnique({
      where: { id }
    });

    if (!data) {
      throw new AppError('Data not found', 404);
    }

    await prisma.dataInProcess.delete({
      where: { id }
    });

    // Log activity
    await ActivityLogService.createLog(
      deletedBy,
      'DATA_IN_PROCESS_DELETED',
      'DataInProcess',
      id,
      { websiteUrl: data.websiteUrl },
      null,
      null
    );

    return { message: 'Data deleted successfully' };
  }

  /**
   * Get statistics
   */
  static async getStatistics(uploadTaskId?: string) {
    const where = uploadTaskId ? { uploadTaskId } : {};

    const [total, pending, verified, rejected, pushed] = await Promise.all([
      prisma.dataInProcess.count({ where }),
      prisma.dataInProcess.count({ where: { ...where, status: 'PENDING' } }),
      prisma.dataInProcess.count({ where: { ...where, status: 'VERIFIED' } }),
      prisma.dataInProcess.count({ where: { ...where, status: 'REJECTED' } }),
      prisma.dataInProcess.count({ where: { ...where, status: 'PUSHED' } })
    ]);

    return {
      total,
      byStatus: {
        pending,
        verified,
        rejected,
        pushed
      }
    };
  }
}
