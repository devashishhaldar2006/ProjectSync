import { prisma } from '../config/prisma';
import { AppError } from '../middlewares/error.middleware';
import { AuthenticatedUser } from '../types';
import { ActivityService } from './activity.service';
import { NotificationService } from './notification.service';
import { TaskPriority, TaskStatus } from '@prisma/client';
import { getIO } from '../sockets/socketManager';

export interface TaskFilterParams {
  projectId?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export class TaskService {
  static async getTasks(user: AuthenticatedUser, filters: TaskFilterParams) {
    const where: any = {};

    // 1. Role enforcement
    if (user.role === 'DEVELOPER') {
      // Developer can strictly see only their assigned tasks
      where.assignedToId = user.id;
    } else if (user.role === 'PROJECT_MANAGER') {
      // PM can strictly see tasks in projects they manage
      where.project = {
        managerId: user.id,
      };
    }
    // Admin sees all without restriction

    // 2. Query filter parameters
    if (filters.projectId) {
      where.projectId = filters.projectId;
    }
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.priority) {
      where.priority = filters.priority;
    }
    if (filters.startDate || filters.endDate) {
      where.dueDate = {};
      if (filters.startDate) {
        where.dueDate.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.dueDate.lte = new Date(filters.endDate);
      }
    }
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return prisma.task.findMany({
      where,
      include: {
        project: { select: { id: true, name: true, managerId: true } },
        assignedTo: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
      orderBy: [
        { priority: 'desc' },
        { dueDate: 'asc' },
      ],
    });
  }

  static async getTaskById(taskId: string, user: AuthenticatedUser) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: { select: { id: true, name: true, managerId: true } },
        assignedTo: { select: { id: true, name: true, email: true, avatarUrl: true } },
        activities: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { id: true, name: true } } },
        },
      },
    });

    if (!task) {
      throw new AppError('Task not found', 404, 'NOT_FOUND');
    }

    // Role-based boundary enforcement
    if (user.role === 'DEVELOPER' && task.assignedToId !== user.id) {
      throw new AppError('Access denied: You cannot view tasks assigned to other developers', 403, 'FORBIDDEN');
    }

    if (user.role === 'PROJECT_MANAGER' && task.project.managerId !== user.id) {
      throw new AppError('Access denied: You cannot view tasks from another manager’s project', 403, 'FORBIDDEN');
    }

    return task;
  }

  static async createTask(
    data: {
      title: string;
      description?: string;
      projectId: string;
      assignedToId?: string;
      priority?: TaskPriority;
      dueDate: string | Date;
    },
    user: AuthenticatedUser
  ) {
    // Check project permission
    const project = await prisma.project.findUnique({
      where: { id: data.projectId },
    });

    if (!project) {
      throw new AppError('Project not found', 404, 'NOT_FOUND');
    }

    if (user.role === 'PROJECT_MANAGER' && project.managerId !== user.id) {
      throw new AppError('Cannot create tasks in projects you do not manage', 403, 'FORBIDDEN');
    }

    const taskDueDate = new Date(data.dueDate);
    const isOverdue = taskDueDate < new Date();

    const task = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        projectId: data.projectId,
        assignedToId: data.assignedToId,
        priority: data.priority || 'MEDIUM',
        dueDate: taskDueDate,
        isOverdue,
      },
      include: {
        project: { select: { id: true, name: true, managerId: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    });

    // Activity Log
    await ActivityService.recordActivity({
      taskId: task.id,
      projectId: task.projectId,
      userId: user.id,
      action: 'TASK_CREATED',
      details: {
        taskNumber: task.taskNumber,
        taskTitle: task.title,
        assignedToName: task.assignedTo?.name || 'Unassigned',
      },
    });

    // Notify assigned developer if any
    if (task.assignedToId) {
      await NotificationService.createNotification({
        userId: task.assignedToId,
        title: 'New Task Assigned',
        message: `${user.name} assigned you Task #${task.taskNumber}: "${task.title}"`,
        type: 'TASK_ASSIGNED',
        referenceId: task.id,
      });
    }

    return task;
  }

  static async updateTaskStatus(taskId: string, newStatus: TaskStatus, user: AuthenticatedUser) {
    const existingTask = await this.getTaskById(taskId, user);

    if (existingTask.status === newStatus) {
      return existingTask;
    }

    const oldStatus = existingTask.status;

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: { status: newStatus },
      include: {
        project: { select: { id: true, name: true, managerId: true } },
        assignedTo: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });

    // Real-time broadcast task update to project room
    try {
      const io = getIO();
      io.to(`project:${updatedTask.projectId}`).emit('task:updated', updatedTask);
      io.to('role:admin').emit('task:updated', updatedTask);
      if (updatedTask.assignedToId) {
        io.to(`user:${updatedTask.assignedToId}`).emit('task:updated', updatedTask);
      }
    } catch (err) {}

    // Record Activity in DB and broadcast formatted live feed event
    await ActivityService.recordActivity({
      taskId: updatedTask.id,
      projectId: updatedTask.projectId,
      userId: user.id,
      action: 'STATUS_CHANGED',
      details: {
        taskNumber: updatedTask.taskNumber,
        taskTitle: updatedTask.title,
        fromStatus: oldStatus,
        toStatus: newStatus,
      },
    });

    // Notification: When a task is moved to IN_REVIEW, notify PM
    if (newStatus === 'IN_REVIEW' && updatedTask.project.managerId) {
      await NotificationService.createNotification({
        userId: updatedTask.project.managerId,
        title: 'Task Ready For Review',
        message: `${user.name} moved Task #${updatedTask.taskNumber} ("${updatedTask.title}") to In Review`,
        type: 'TASK_REVIEW',
        referenceId: updatedTask.id,
      });
    }

    return updatedTask;
  }

  static async updateTaskDetails(
    taskId: string,
    data: {
      title?: string;
      description?: string;
      assignedToId?: string;
      priority?: TaskPriority;
      dueDate?: string | Date;
    },
    user: AuthenticatedUser
  ) {
    const existingTask = await this.getTaskById(taskId, user);

    // Only Admin or PM can edit full task details (developer can only change status)
    if (user.role === 'DEVELOPER') {
      throw new AppError('Developers are only permitted to update task status', 403, 'FORBIDDEN');
    }

    let dueDate = existingTask.dueDate;
    let isOverdue = existingTask.isOverdue;

    if (data.dueDate) {
      dueDate = new Date(data.dueDate);
      isOverdue = dueDate < new Date() && existingTask.status !== 'DONE';
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        title: data.title,
        description: data.description,
        assignedToId: data.assignedToId,
        priority: data.priority,
        dueDate,
        isOverdue,
      },
      include: {
        project: { select: { id: true, name: true, managerId: true } },
        assignedTo: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });

    // Notify new assignee if developer changed
    if (data.assignedToId && data.assignedToId !== existingTask.assignedToId) {
      await NotificationService.createNotification({
        userId: data.assignedToId,
        title: 'Task Assigned To You',
        message: `${user.name} assigned you Task #${updatedTask.taskNumber}: "${updatedTask.title}"`,
        type: 'TASK_ASSIGNED',
        referenceId: updatedTask.id,
      });

      await ActivityService.recordActivity({
        taskId: updatedTask.id,
        projectId: updatedTask.projectId,
        userId: user.id,
        action: 'DEVELOPER_ASSIGNED',
        details: {
          taskNumber: updatedTask.taskNumber,
          taskTitle: updatedTask.title,
          assignedToName: updatedTask.assignedTo?.name || 'Developer',
        },
      });
    }

    return updatedTask;
  }
}
