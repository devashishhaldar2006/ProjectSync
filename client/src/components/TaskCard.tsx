import React from 'react';
import { Task, TaskStatus } from '../types';
import { Clock, AlertTriangle, ArrowRight, User } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onClick?: (task: Task) => void;
  canEditDetails?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onStatusChange,
  onClick,
  canEditDetails = false,
}) => {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  };

  const nextStatuses: Record<TaskStatus, TaskStatus[]> = {
    TODO: ['IN_PROGRESS'],
    IN_PROGRESS: ['IN_REVIEW', 'DONE'],
    IN_REVIEW: ['IN_PROGRESS', 'DONE'],
    DONE: ['IN_PROGRESS'],
  };

  return (
    <div
      className={`task-card glass-card ${task.isOverdue && task.status !== 'DONE' ? 'is-overdue' : ''}`}
      onClick={() => onClick && onClick(task)}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className="task-header">
        <span className="task-number">#{task.taskNumber}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          {task.isOverdue && task.status !== 'DONE' && (
            <span className="overdue-tag">
              <AlertTriangle size={11} /> Overdue
            </span>
          )}
          <span className={`badge-priority priority-${task.priority}`}>
            {task.priority}
          </span>
        </div>
      </div>

      <div>
        <h4 className="task-title">{task.title}</h4>
        {task.description && <p className="task-desc">{task.description}</p>}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.25rem' }}>
        <span className={`badge-status ${task.status}`}>
          {task.status.replace('_', ' ')}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <Clock size={12} />
          <span>Due {formatDate(task.dueDate)}</span>
        </div>
      </div>

      <div className="task-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <User size={13} color="var(--text-muted)" />
          <span style={{ fontSize: '0.78rem' }}>
            {task.assignedTo ? task.assignedTo.name : 'Unassigned'}
          </span>
        </div>

        {/* Quick status transition dropdown/buttons */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          onClick={(e) => e.stopPropagation()}
        >
          <select
            value={task.status}
            onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatus)}
            style={{
              padding: '0.25rem 0.5rem',
              fontSize: '0.72rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-tertiary)',
            }}
          >
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="DONE">Done</option>
          </select>
        </div>
      </div>
    </div>
  );
};
