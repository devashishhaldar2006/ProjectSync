import { prisma } from '../config/prisma';
import { AppError } from '../middlewares/error.middleware';
import { AuthenticatedUser } from '../types';

export class ProjectService {
  static async getProjects(user: AuthenticatedUser) {
    if (user.role === 'ADMIN') {
      return prisma.project.findMany({
        include: {
          client: true,
          manager: { select: { id: true, name: true, email: true } },
          _count: { select: { tasks: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (user.role === 'PROJECT_MANAGER') {
      return prisma.project.findMany({
        where: { managerId: user.id },
        include: {
          client: true,
          manager: { select: { id: true, name: true, email: true } },
          _count: { select: { tasks: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    // Developer can view projects where they have at least one assigned task
    return prisma.project.findMany({
      where: {
        tasks: {
          some: { assignedToId: user.id },
        },
      },
      include: {
        client: true,
        manager: { select: { id: true, name: true, email: true } },
        _count: { select: { tasks: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getProjectById(projectId: string, user: AuthenticatedUser) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        client: true,
        manager: { select: { id: true, name: true, email: true } },
      },
    });

    if (!project) {
      throw new AppError('Project not found', 404, 'NOT_FOUND');
    }

    // Role-based security check
    if (user.role === 'PROJECT_MANAGER' && project.managerId !== user.id) {
      throw new AppError(
        'Access denied: You do not have permission to access another Project Manager’s project',
        403,
        'FORBIDDEN'
      );
    }

    if (user.role === 'DEVELOPER') {
      const hasTask = await prisma.task.findFirst({
        where: { projectId, assignedToId: user.id },
      });
      if (!hasTask) {
        throw new AppError('Access denied: You are not assigned to any tasks in this project', 403, 'FORBIDDEN');
      }
    }

    return project;
  }

  static async createProject(
    data: { name: string; description?: string; clientId: string; managerId?: string },
    user: AuthenticatedUser
  ) {
    // If user is PM, they can only assign themselves as manager
    const managerId = user.role === 'PROJECT_MANAGER' ? user.id : data.managerId || user.id;

    const project = await prisma.project.create({
      data: {
        name: data.name,
        description: data.description,
        clientId: data.clientId,
        managerId,
      },
      include: {
        client: true,
        manager: { select: { id: true, name: true, email: true } },
      },
    });

    return project;
  }

  static async updateProject(
    projectId: string,
    data: { name?: string; description?: string; status?: string; clientId?: string },
    user: AuthenticatedUser
  ) {
    const existing = await this.getProjectById(projectId, user);

    if (user.role === 'PROJECT_MANAGER' && existing.managerId !== user.id) {
      throw new AppError('Cannot edit another PM’s project', 403, 'FORBIDDEN');
    }

    return prisma.project.update({
      where: { id: projectId },
      data,
      include: {
        client: true,
        manager: { select: { id: true, name: true, email: true } },
      },
    });
  }
}
