import React from 'react';
import { useSocket } from '../contexts/SocketContext';
import { ActivityLog } from '../types';
import { Activity, ArrowRight, Clock, AlertTriangle, CheckCircle, UserPlus, FilePlus } from 'lucide-react';

interface ActivityFeedProps {
  title?: string;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ title = 'Live Activity Feed' }) => {
  const { recentActivities } = useSocket();

  const formatRelativeTime = (isoString: string) => {
    const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
    if (diff < 15) return 'just now';
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'STATUS_CHANGED':
        return <ArrowRight size={14} color="#2d8a66" />;
      case 'OVERDUE_FLAGGED':
        return <AlertTriangle size={14} color="#c94b4b" />;
      case 'DEVELOPER_ASSIGNED':
        return <UserPlus size={14} color="#38a178" />;
      case 'TASK_CREATED':
        return <FilePlus size={14} color="#2f946c" />;
      default:
        return <Activity size={14} color="#8ea399" />;
    }
  };

  const formatStatusName = (status?: string) => {
    if (!status) return '';
    switch (status) {
      case 'TODO': return 'To Do';
      case 'IN_PROGRESS': return 'In Progress';
      case 'IN_REVIEW': return 'In Review';
      case 'DONE': return 'Done';
      default: return status;
    }
  };

  return (
    <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Activity size={18} color="#2d8a66" />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{title}</h3>
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Real-time WebSocket · Last 20 events
        </span>
      </div>

      <div className="feed-container">
        {recentActivities.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            No recent activity recorded yet.
          </div>
        ) : (
          recentActivities.map((act) => {
            const userName = act.user?.name || 'Team member';
            const taskNum = act.task?.taskNumber || act.details?.taskNumber || 'Task';
            const details = act.details || {};

            let messageContent = null;

            if (act.action === 'STATUS_CHANGED') {
              messageContent = (
                <span>
                  <strong>{userName}</strong> moved Task #{taskNum} from{' '}
                  <span style={{ color: 'var(--text-muted)' }}>{formatStatusName(details.fromStatus)}</span> →{' '}
                  <span style={{ color: '#a5b4fc', fontWeight: 600 }}>{formatStatusName(details.toStatus)}</span>
                </span>
              );
            } else if (act.action === 'OVERDUE_FLAGGED') {
              messageContent = (
                <span>
                  <strong style={{ color: '#f87171' }}>System</strong> flagged Task #{taskNum} ("{details.taskTitle || act.task?.title}") as{' '}
                  <strong style={{ color: '#ef4444' }}>Overdue</strong>
                </span>
              );
            } else if (act.action === 'DEVELOPER_ASSIGNED') {
              messageContent = (
                <span>
                  <strong>{userName}</strong> assigned Task #{taskNum} to{' '}
                  <span style={{ color: '#60a5fa', fontWeight: 600 }}>{details.assignedToName}</span>
                </span>
              );
            } else if (act.action === 'TASK_CREATED') {
              messageContent = (
                <span>
                  <strong>{userName}</strong> created Task #{taskNum}: "{details.taskTitle || act.task?.title}"
                </span>
              );
            } else {
              messageContent = (
                <span>
                  <strong>{userName}</strong> updated Task #{taskNum}
                </span>
              );
            }

            return (
              <div key={act.id} className="feed-item">
                <img
                  src={act.user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                  alt={userName}
                  className="feed-avatar"
                />
                <div className="feed-content">
                  <div className="feed-text" style={{ fontSize: '0.85rem' }}>
                    {messageContent}
                  </div>
                  <div className="feed-meta">
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      {getActionIcon(act.action)}
                      <span>{act.project?.name}</span>
                    </span>
                    <span>•</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Clock size={12} />
                      {formatRelativeTime(act.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
