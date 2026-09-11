import cron from 'node-cron';
import { prisma } from '../config/prisma';
import { ActivityService } from '../services/activity.service';
import { NotificationService } from '../services/notification.service';
import { getIO } from '../sockets/socketManager';

/**
 * Scheduled background job for automatically detecting and flagging overdue tasks.
 * Evaluates tasks where:
 *   - dueDate < NOW()
 *   - status != 'DONE'
 *   - isOverdue == false
 * Updates the database, logs the activity, and notifies PM and assigned Developer.
 */
export const startOverdueScheduler = () => {
  // Run every minute (60s interval)
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();

      const overdueTasks = await prisma.task.findMany({
        where: {
          dueDate: { lt: now },
          status: { not: 'DONE' },
          isOverdue: false,
        },
        include: {
          project: { select: { id: true, name: true, managerId: true } },
          assignedTo: { select: { id: true, name: true, email: true } },
        },
      });

      if (overdueTasks.length === 0) {
        return;
      }

      console.log(`[OverdueScheduler] Found ${overdueTasks.length} newly overdue tasks. Flagging...`);

      // Find system/admin user for activity log attribution
      const adminUser = await prisma.user.findFirst({
        where: { role: 'ADMIN' },
      });
      const systemUserId = adminUser ? adminUser.id : overdueTasks[0].project.managerId;

      for (const task of overdueTasks) {
        await prisma.task.update({
          where: { id: task.id },
          data: { isOverdue: true },
        });

        // 1. Record activity
        await ActivityService.recordActivity({
          taskId: task.id,
          projectId: task.projectId,
          userId: systemUserId,
          action: 'OVERDUE_FLAGGED',
          details: {
            taskNumber: task.taskNumber,
            taskTitle: task.title,
            dueDate: task.dueDate.toISOString(),
          },
        });

        // 2. Notify PM
        if (task.project.managerId) {
          await NotificationService.createNotification({
            userId: task.project.managerId,
            title: 'Task Overdue',
            message: `Task #${task.taskNumber} ("${task.title}") in project "${task.project.name}" is now overdue.`,
            type: 'TASK_OVERDUE',
            referenceId: task.id,
          });
        }

        // 3. Notify Developer
        if (task.assignedToId) {
          await NotificationService.createNotification({
            userId: task.assignedToId,
            title: 'Task Overdue Alert',
            message: `Your assigned task #${task.taskNumber} ("${task.title}") has passed its due date.`,
            type: 'TASK_OVERDUE',
            referenceId: task.id,
          });
        }

        // 4. Socket emit task update
        try {
          const io = getIO();
          io.to(`project:${task.projectId}`).emit('task:updated', { ...task, isOverdue: true });
          io.to('role:admin').emit('task:updated', { ...task, isOverdue: true });
        } catch (err) {}
      }
    } catch (err) {
      console.error('[OverdueScheduler] Error during scheduled execution:', err);
    }
  });

  console.log('[OverdueScheduler] Background scheduler initialized (runs every 1 minute).');
};
