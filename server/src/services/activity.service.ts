import { prisma } from '../config/prisma';
import { getIO } from '../sockets/socketManager';
import { ActivityAction } from '@prisma/client';

export interface CreateActivityParams {
  taskId?: string;
  projectId: string;
  userId: string;
  action: ActivityAction;
  details: Record<string, any>;
}

export class ActivityService {
  static async recordActivity(params: CreateActivityParams) {
    const activity = await prisma.activityLog.create({
      data: {
        taskId: params.taskId,
        projectId: params.projectId,
        userId: params.userId,
        action: params.action,
        details: params.details,
      },
      include: {
        user: { select: { id: true, name: true, role: true, avatarUrl: true } },
        task: { select: { id: true, taskNumber: true, title: true, assignedToId: true } },
        project: { select: { id: true, name: true, managerId: true } },
      },
    });

    // Broadcast over WebSocket safely
    try {
      const io = getIO();

      // 1. Admin gets every event globally
      io.to('role:admin').emit('activity:new', activity);

      // 2. Broadcast to users viewing this project
      io.to(`project:${params.projectId}`).emit('activity:new', activity);

      // 3. PM of the project gets the activity even if not viewing the specific board tab
      if (activity.project.managerId) {
        io.to(`user:${activity.project.managerId}`).emit('activity:new', activity);
      }

      // 4. Assigned developer gets activity regarding their task
      if (activity.task?.assignedToId && activity.task.assignedToId !== params.userId) {
        io.to(`user:${activity.task.assignedToId}`).emit('activity:new', activity);
      }
    } catch (err) {
      // Socket error should not fail DB transaction
      console.error('Socket broadcast error in ActivityService:', err);
    }

    return activity;
  }

  static async getRecentActivities(user: { id: string; role: string }, limit = 20) {
    // Role-filtered retrieval: strictly enforce role at the database query level
    let whereClause: any = {};

    if (user.role === 'ADMIN') {
      // Admin sees activity across all projects
      whereClause = {};
    } else if (user.role === 'PROJECT_MANAGER') {
      // PM sees activity only from their own projects
      whereClause = {
        project: {
          managerId: user.id,
        },
      };
    } else if (user.role === 'DEVELOPER') {
      // Developer sees activity only on tasks assigned to them
      whereClause = {
        task: {
          assignedToId: user.id,
        },
      };
    }

    const activities = await prisma.activityLog.findMany({
      where: whereClause,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, role: true, avatarUrl: true } },
        task: { select: { id: true, taskNumber: true, title: true } },
        project: { select: { id: true, name: true } },
      },
    });

    return activities;
  }
}
