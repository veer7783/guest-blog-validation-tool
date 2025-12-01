import prisma from '../config/database';

export class DashboardService {
  /**
   * Get dashboard statistics based on user role
   */
  static async getDashboardStats(userId: string, userRole: string) {
    const stats: any = {};

    // Only Super Admin sees total users
    if (userRole === 'SUPER_ADMIN') {
      stats.totalUsers = await prisma.user.count();
    }

    // Get task counts based on role (CSV upload tasks, not individual rows)
    if (userRole === 'SUPER_ADMIN') {
      // Super Admin sees all CSV upload tasks
      const [assignedTasks, completedTasks, pendingTasks] = await Promise.all([
        // Total CSV upload tasks
        prisma.dataUploadTask.count(),
        // CSV tasks marked as completed
        prisma.dataUploadTask.count({
          where: { status: 'COMPLETED' }
        }),
        // CSV tasks still pending (not completed)
        prisma.dataUploadTask.count({
          where: { 
            status: {
              in: ['PENDING', 'IN_PROGRESS']
            }
          }
        })
      ]);

      // Get data row counts for pending tasks
      const pendingTasksData = await prisma.dataUploadTask.findMany({
        where: {
          status: {
            in: ['PENDING', 'IN_PROGRESS']
          }
        },
        select: {
          id: true,
          processedRecords: true  // Original count of records added to the task
        }
      });

      // Calculate total data rows in pending tasks (original count from upload)
      const pendingTaskTotalRows = pendingTasksData.reduce((sum, task) => sum + task.processedRecords, 0);

      // Get data row counts
      const [completedDataRows, pendingDataRows, superAdminCompletedRows] = await Promise.all([
        // Count all data rows marked as REACHED (completed)
        prisma.dataFinal.count(),
        // Count data rows still in process (pending)
        prisma.dataInProcess.count(),
        // Count data rows marked as REACHED by Super Admin
        prisma.dataFinal.count({
          where: {
            reachedByUser: {
              role: 'SUPER_ADMIN'
            }
          }
        })
      ]);

      const totalDataRows = completedDataRows + pendingDataRows;

      // Get user-wise task breakdown for Super Admin
      const userTaskBreakdown = await prisma.user.findMany({
        where: {
          role: 'ADMIN',
          isActive: true
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          assignedTasks: {
            select: {
              id: true,
              status: true
            }
          }
        }
      });

      const userStats = userTaskBreakdown.map(user => ({
        name: `${user.firstName} ${user.lastName}`,
        assignedTasks: user.assignedTasks.length,
        pendingTasks: user.assignedTasks.filter(t => t.status === 'PENDING' || t.status === 'IN_PROGRESS').length,
        completedTasks: user.assignedTasks.filter(t => t.status === 'COMPLETED').length
      }));

      stats.assignedTasks = assignedTasks;
      stats.completedTasks = completedTasks;
      stats.pendingTasks = pendingTasks;
      stats.completedDataRows = completedDataRows;
      stats.pendingDataRows = pendingDataRows;
      stats.totalDataRows = totalDataRows;
      stats.pendingTasksTotalData = pendingTaskTotalRows;
      stats.superAdminCompletedRows = superAdminCompletedRows;
      stats.userTaskBreakdown = userStats;
    } else {
      // Admin sees only their assigned CSV upload tasks
      const [assignedTasks, completedTasks, pendingTasks] = await Promise.all([
        // CSV tasks assigned to this admin
        prisma.dataUploadTask.count({
          where: { assignedTo: userId }
        }),
        // CSV tasks assigned to this admin and completed
        prisma.dataUploadTask.count({
          where: { 
            assignedTo: userId,
            status: 'COMPLETED'
          }
        }),
        // CSV tasks assigned to this admin and still pending
        prisma.dataUploadTask.count({
          where: { 
            assignedTo: userId,
            status: {
              in: ['PENDING', 'IN_PROGRESS']
            }
          }
        })
      ]);

      // Get pending tasks for this admin to calculate total data
      const adminPendingTasks = await prisma.dataUploadTask.findMany({
        where: {
          assignedTo: userId,
          status: {
            in: ['PENDING', 'IN_PROGRESS']
          }
        },
        select: {
          processedRecords: true
        }
      });

      const adminPendingTasksTotalData = adminPendingTasks.reduce((sum, task) => sum + task.processedRecords, 0);

      // Get data row counts for this admin
      const [completedDataRows, pendingDataRows] = await Promise.all([
        // Count data rows marked as REACHED by this admin
        prisma.dataFinal.count({
          where: { reachedBy: userId }
        }),
        // Count data rows in process assigned to this admin
        prisma.dataInProcess.count({
          where: {
            uploadTask: {
              assignedTo: userId
            }
          }
        })
      ]);

      const totalDataRows = completedDataRows + pendingDataRows;

      stats.assignedTasks = assignedTasks;
      stats.completedTasks = completedTasks;
      stats.pendingTasks = pendingTasks;
      stats.completedDataRows = completedDataRows;
      stats.pendingDataRows = pendingDataRows;
      stats.totalDataRows = totalDataRows;
      stats.pendingTasksTotalData = adminPendingTasksTotalData;
    }

    return stats;
  }

  /**
   * Get remaining CSV upload task count for a specific user (Super Admin only)
   */
  static async getUserRemainingTasks(userId: string) {
    // Count CSV upload tasks that are not completed
    const remainingTasks = await prisma.dataUploadTask.count({
      where: {
        assignedTo: userId,
        status: {
          in: ['PENDING', 'IN_PROGRESS']
        }
      }
    });

    return remainingTasks;
  }
}
