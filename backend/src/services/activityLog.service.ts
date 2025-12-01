import prisma from '../config/database';
import { ActivityLogDetails } from '../types';

export class ActivityLogService {
  /**
   * Create activity log
   */
  static async createLog(
    userId: string,
    action: string,
    entityType: string,
    entityId: string | null,
    details: ActivityLogDetails | null,
    ipAddress: string | null,
    userAgent: string | null
  ) {
    try {
      return await prisma.activityLog.create({
        data: {
          userId,
          action,
          entityType,
          entityId,
          details: details || undefined,
          ipAddress,
          userAgent
        }
      });
    } catch (error) {
      console.error('Error creating activity log:', error);
      // Don't throw error - logging should not break the main flow
      return null;
    }
  }

  /**
   * Get activity logs with pagination and filters
   */
  static async getLogs(filters: {
    userId?: string;
    action?: string;
    entityType?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }) {
    const {
      userId,
      action,
      entityType,
      startDate,
      endDate,
      page = 1,
      limit = 50
    } = filters;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (entityType) where.entityType = entityType;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.activityLog.count({ where })
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get log by ID
   */
  static async getLogById(id: string) {
    return await prisma.activityLog.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true
          }
        }
      }
    });
  }
}
