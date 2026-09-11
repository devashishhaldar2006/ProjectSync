import { prisma } from '../config/prisma';
import { getUniqueActiveUserCount } from '../sockets/socketManager';
import { AuthenticatedUser } from '../types';

export class DashboardService {
  static async getStats(user: AuthenticatedUser) {
    if (user.role === 'ADMIN') {
      const [totalProjects, totalTasks, tasksByStatus, overdueCount] = await Promise.all([
        prisma.project.count(),
        prisma.task.count(),
        prisma.task.groupBy({
          by: ['status'],
          _count: { id: true },
        }),
        prisma.task.count({ where: { isOverdue: true, status: { not: 'DONE' } } }),
      ]);

      const activeUsersCount = getUniqueActiveUserCount();

      return {
        role: 'ADMIN',
        totalProjects,
        totalTasks,
        overdueCount,
        activeUsersOnline: activeUsersCount,
        tasksByStatus: tasksByStatus.reduce((acc, curr) => {
          acc[curr.status] = curr._count.id;
          return acc;
        }, {} as Record<string, number>),
      };
    }

    if (user.role === 'PROJECT_MANAGER') {
      const projects = await prisma.project.findMany({
        where: { managerId: user.id },
        include: {
          client: true,
          _count: { select: { tasks: true } },
        },
      });

      const projectIds = projects.map((p) => p.id);

      const [tasksByPriority, tasksByStatus, overdueCount, upcomingThisWeek] = await Promise.all([
        prisma.task.groupBy({
          by: ['priority'],
          where: { projectId: { in: projectIds } },
          _count: { id: true },
        }),
        prisma.task.groupBy({
          by: ['status'],
          where: { projectId: { in: projectIds } },
          _count: { id: true },
        }),
        prisma.task.count({
          where: { projectId: { in: projectIds }, isOverdue: true, status: { not: 'DONE' } },
        }),
        prisma.task.findMany({
          where: {
            projectId: { in: projectIds },
            status: { not: 'DONE' },
            dueDate: {
              gte: new Date(),
              lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
          },
          include: {
            assignedTo: { select: { id: true, name: true } },
            project: { select: { id: true, name: true } },
          },
          orderBy: { dueDate: 'asc' },
        }),
      ]);

      return {
        role: 'PROJECT_MANAGER',
        totalProjects: projects.length,
        projectsSummary: projects,
        overdueCount,
        tasksByPriority: tasksByPriority.reduce((acc, curr) => {
          acc[curr.priority] = curr._count.id;
          return acc;
        }, {} as Record<string, number>),
        tasksByStatus: tasksByStatus.reduce((acc, curr) => {
          acc[curr.status] = curr._count.id;
          return acc;
        }, {} as Record<string, number>),
        upcomingDueDatesThisWeek: upcomingThisWeek,
      };
    }

    // DEVELOPER
    const [assignedTasks, overdueCount, completedCount] = await Promise.all([
      prisma.task.findMany({
        where: { assignedToId: user.id },
        include: {
          project: { select: { id: true, name: true } },
        },
        orderBy: [
          { priority: 'desc' },
          { dueDate: 'asc' },
        ],
      }),
      prisma.task.count({
        where: { assignedToId: user.id, isOverdue: true, status: { not: 'DONE' } },
      }),
      prisma.task.count({
        where: { assignedToId: user.id, status: 'DONE' },
      }),
    ]);

    return {
      role: 'DEVELOPER',
      totalAssignedTasks: assignedTasks.length,
      overdueCount,
      completedCount,
      pendingCount: assignedTasks.filter((t) => t.status !== 'DONE').length,
      tasks: assignedTasks,
    };
  }
}
