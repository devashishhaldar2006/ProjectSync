export type Role = 'ADMIN' | 'PROJECT_MANAGER' | 'DEVELOPER';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatarUrl?: string | null;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  company: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  clientId: string;
  managerId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  client?: Client;
  manager?: { id: string; name: string; email: string };
  _count?: { tasks: number };
}

export interface Task {
  id: string;
  taskNumber: number;
  title: string;
  description?: string | null;
  projectId: string;
  assignedToId?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  isOverdue: boolean;
  createdAt: string;
  updatedAt: string;
  project?: { id: string; name: string; managerId: string };
  assignedTo?: { id: string; name: string; email: string; avatarUrl?: string | null } | null;
}

export interface ActivityLog {
  id: string;
  taskId?: string | null;
  projectId: string;
  userId: string;
  action: 'TASK_CREATED' | 'STATUS_CHANGED' | 'PRIORITY_CHANGED' | 'DEVELOPER_ASSIGNED' | 'OVERDUE_FLAGGED';
  details: {
    taskNumber?: number;
    taskTitle?: string;
    fromStatus?: string;
    toStatus?: string;
    assignedToName?: string;
    dueDate?: string;
    [key: string]: any;
  };
  createdAt: string;
  user: { id: string; name: string; role: Role; avatarUrl?: string | null };
  task?: { id: string; taskNumber: number; title: string } | null;
  project: { id: string; name: string };
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'TASK_ASSIGNED' | 'TASK_REVIEW' | 'TASK_OVERDUE' | 'STATUS_CHANGED';
  referenceId?: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface DashboardStats {
  role: Role;
  totalProjects?: number;
  totalTasks?: number;
  overdueCount: number;
  activeUsersOnline?: number;
  tasksByStatus?: Record<string, number>;
  tasksByPriority?: Record<string, number>;
  projectsSummary?: Project[];
  upcomingDueDatesThisWeek?: Task[];
  totalAssignedTasks?: number;
  completedCount?: number;
  pendingCount?: number;
  tasks?: Task[];
}
