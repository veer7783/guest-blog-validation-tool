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
    const { page, limit, status, negotiationStatus, reachedBy } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (negotiationStatus) where.negotiationStatus = negotiationStatus;
    if (reachedBy) where.reachedBy = reachedBy;

    const [data, total] = await Promise.all([
      prisma.dataFinal.findMany({
        where,
        skip,
        take: limit,
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
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
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
  static async delete(id: string) {
    const existing = await prisma.dataFinal.findUnique({
      where: { id }
    });

    if (!existing) {
      throw new AppError('Record not found', 404);
    }

    await prisma.dataFinal.delete({
      where: { id }
    });

    return { success: true };
  }
}
