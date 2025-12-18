import prisma from '../config/database';
import { UploadTaskCreateRequest, UploadTaskUpdateRequest } from '../types/upload.types';
import { PaginationParams } from '../types';
import { AppError } from '../middleware/errorHandler';

export class UploadTaskService {
  /**
   * Create new upload task
   */
  static async create(data: UploadTaskCreateRequest, createdBy: string) {
    const task = await prisma.dataUploadTask.create({
      data: {
        fileName: data.fileName,
        totalRecords: data.totalRecords,
        validRecords: data.validRecords,
        invalidRecords: data.invalidRecords,
        processedRecords: 0,
        duplicateRecords: 0,
        pushedRecords: 0,
        status: 'PENDING',
        assignedTo: data.assignedTo,
        createdBy,
        uploadedAt: new Date()
      },
      include: {
        assignedToUser: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        createdByUser: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    return task;
  }

  /**
   * Get all upload tasks with pagination
   */
  static async getAll(params: PaginationParams & { assignedTo?: string; status?: string }) {
    const { sortBy = 'uploadedAt', sortOrder = 'desc', assignedTo, status } = params;

    const where: any = {};
    if (assignedTo) where.assignedTo = assignedTo;
    if (status) where.status = status;

    const [tasks, total] = await Promise.all([
      prisma.dataUploadTask.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        include: {
          assignedToUser: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true
            }
          },
          createdByUser: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true
            }
          }
        }
      }),
      prisma.dataUploadTask.count({ where })
    ]);

    return {
      tasks,
      pagination: {
        total
      }
    };
  }

  /**
   * Get single upload task by ID
   */
  static async getById(id: string) {
    const task = await prisma.dataUploadTask.findUnique({
      where: { id },
      include: {
        assignedToUser: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        createdByUser: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        dataInProcess: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!task) {
      throw new AppError('Upload task not found', 404);
    }

    return task;
  }

  /**
   * Update upload task
   */
  static async update(id: string, data: UploadTaskUpdateRequest) {
    const task = await prisma.dataUploadTask.findUnique({
      where: { id }
    });

    if (!task) {
      throw new AppError('Upload task not found', 404);
    }

    const updated = await prisma.dataUploadTask.update({
      where: { id },
      data: {
        status: data.status,
        processedRecords: data.processedRecords,
        duplicateRecords: data.duplicateRecords,
        pushedRecords: data.pushedRecords,
        notes: data.notes
      },
      include: {
        assignedToUser: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    return updated;
  }

  /**
   * Get task statistics
   */
  static async getStatistics(userId?: string) {
    const where = userId ? { assignedTo: userId } : {};

    const [total, pending, inProgress, completed, failed] = await Promise.all([
      prisma.dataUploadTask.count({ where }),
      prisma.dataUploadTask.count({ where: { ...where, status: 'PENDING' } }),
      prisma.dataUploadTask.count({ where: { ...where, status: 'IN_PROGRESS' } }),
      prisma.dataUploadTask.count({ where: { ...where, status: 'COMPLETED' } }),
      prisma.dataUploadTask.count({ where: { ...where, status: 'FAILED' } })
    ]);

    const aggregates = await prisma.dataUploadTask.aggregate({
      where,
      _sum: {
        totalRecords: true,
        validRecords: true,
        invalidRecords: true,
        processedRecords: true,
        duplicateRecords: true,
        pushedRecords: true
      }
    });

    return {
      total,
      byStatus: {
        pending,
        inProgress,
        completed,
        failed
      },
      totals: {
        totalRecords: aggregates._sum.totalRecords || 0,
        validRecords: aggregates._sum.validRecords || 0,
        invalidRecords: aggregates._sum.invalidRecords || 0,
        processedRecords: aggregates._sum.processedRecords || 0,
        duplicateRecords: aggregates._sum.duplicateRecords || 0,
        pushedRecords: aggregates._sum.pushedRecords || 0
      }
    };
  }

  /**
   * Delete upload task
   */
  static async delete(id: string) {
    const task = await prisma.dataUploadTask.findUnique({
      where: { id }
    });

    if (!task) {
      throw new AppError('Upload task not found', 404);
    }

    await prisma.dataUploadTask.delete({
      where: { id }
    });

    return { message: 'Upload task deleted successfully' };
  }
}
