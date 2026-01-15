import prisma from '../config/database';
import { ActivityLogDetails } from '../types';
import { Request } from 'express';

export class ActivityLogService {
  /**
   * Extract IP address from request
   */
  static getClientIP(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      const ips = typeof forwarded === 'string' ? forwarded : forwarded[0];
      return ips.split(',')[0].trim();
    }
    return req.socket?.remoteAddress || req.ip || 'unknown';
  }

  /**
   * Extract user agent from request
   */
  static getUserAgent(req: Request): string {
    return req.headers['user-agent'] || 'unknown';
  }

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
          details: details ? JSON.stringify(details) : undefined,
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
   * Create activity log from request (convenience method)
   */
  static async logFromRequest(
    req: Request,
    userId: string,
    action: string,
    entityType: string,
    entityId: string | null,
    details: ActivityLogDetails | null
  ) {
    const ipAddress = this.getClientIP(req);
    const userAgent = this.getUserAgent(req);
    return this.createLog(userId, action, entityType, entityId, details, ipAddress, userAgent);
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
      endDate
    } = filters;

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
        orderBy: { createdAt: 'desc' }
      }),
      prisma.activityLog.count({ where })
    ]);

    return {
      logs,
      pagination: {
        total
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
