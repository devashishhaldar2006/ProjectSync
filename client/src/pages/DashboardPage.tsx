import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { DashboardStats, Task, TaskStatus } from '../types';
import { apiRequest } from '../api/client';
import { StatCard } from '../components/StatCard';
import { ActivityFeed } from '../components/ActivityFeed';
import { TaskCard } from '../components/TaskCard';
import {
  FolderKanban,
  CheckCircle2,
  AlertTriangle,
  Users,
  Clock,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface DashboardPageProps {
  onNavigateToProjects: () => void;
  onNavigateToTasks: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigateToProjects,
  onNavigateToTasks,
}) => {
  const { user } = useAuth();
  const { onlineCount } = useSocket();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const data = await apiRequest<DashboardStats>('/dashboard/stats');
      setStats(data);
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [user]);

  const handleTaskStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await apiRequest(`/tasks/${taskId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      fetchStats();
    } catch (err) {
      console.error('Failed to update task status:', err);
    }
  };

  if (loading) {
    return (
      <div className="page-container" style={{ textAlign: 'center', paddingTop: '4rem' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading your dashboard intelligence...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header Banner */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.5px' }}>
            Welcome back, {user?.name.split(' ')[0]} 👋
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            Here is what is happening across your projects today.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={onNavigateToProjects}>
            <span>View Projects</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* 1. ADMIN DASHBOARD VIEW */}
      {user?.role === 'ADMIN' && (
        <>
          <div className="stats-grid">
            <StatCard
              label="Total Client Projects"
              value={stats?.totalProjects || 0}
              icon={FolderKanban}
            />
            <StatCard
              label="Active Tasks"
              value={stats?.totalTasks || 0}
              icon={CheckCircle2}
              subtitle={`${stats?.tasksByStatus?.['DONE'] || 0} completed`}
            />
            <StatCard
              label="Overdue Tasks"
              value={stats?.overdueCount || 0}
              icon={AlertTriangle}
              variant="overdue"
              subtitle="Automated node-cron scheduler"
            />
            <StatCard
              label="Active Users Online"
              value={onlineCount}
              icon={Users}
              variant="active-users"
              subtitle="Live WebSocket Presence"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
            {/* Status Breakdown */}
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1.25rem' }}>
                Tasks by Status
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                <div style={{ padding: '1rem', background: 'rgba(107, 114, 128, 0.1)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>TO DO</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.25rem' }}>{stats?.tasksByStatus?.['TODO'] || 0}</div>
                </div>
                <div style={{ padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <div style={{ color: '#60a5fa', fontSize: '0.75rem', fontWeight: 600 }}>IN PROGRESS</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.25rem' }}>{stats?.tasksByStatus?.['IN_PROGRESS'] || 0}</div>
                </div>
                <div style={{ padding: '1rem', background: 'rgba(168, 85, 247, 0.1)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <div style={{ color: '#c084fc', fontSize: '0.75rem', fontWeight: 600 }}>IN REVIEW</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.25rem' }}>{stats?.tasksByStatus?.['IN_REVIEW'] || 0}</div>
                </div>
                <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <div style={{ color: '#34d399', fontSize: '0.75rem', fontWeight: 600 }}>DONE</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.25rem' }}>{stats?.tasksByStatus?.['DONE'] || 0}</div>
                </div>
              </div>
            </div>

            {/* Role Permissions Callout */}
            <div className="glass-card" style={{ padding: '1.5rem', border: '1px solid rgba(45, 138, 102, 0.35)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#72cca7', marginBottom: '0.5rem' }}>
                <Sparkles size={16} />
                <strong style={{ fontSize: '0.9rem' }}>Admin Access Level</strong>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                As Admin, you have unrestricted global oversight: view and manage all client projects, observe team activity across every workspace, assign tasks to any developer, and monitor real-time connected users over WebSockets.
              </p>
            </div>
          </div>

          {/* Global Activity Feed */}
          <ActivityFeed title="Global Organization Activity Feed (All Projects)" />
        </>
      )}

      {/* 2. PROJECT MANAGER DASHBOARD VIEW */}
      {user?.role === 'PROJECT_MANAGER' && (
        <>
          <div className="stats-grid">
            <StatCard
              label="My Managed Projects"
              value={stats?.totalProjects || 0}
              icon={FolderKanban}
            />
            <StatCard
              label="Overdue in My Projects"
              value={stats?.overdueCount || 0}
              icon={AlertTriangle}
              variant="overdue"
            />
            <StatCard
              label="Critical Priority Tasks"
              value={stats?.tasksByPriority?.['CRITICAL'] || 0}
              icon={AlertTriangle}
            />
            <StatCard
              label="In Review Pending"
              value={stats?.tasksByStatus?.['IN_REVIEW'] || 0}
              icon={Clock}
              subtitle="Ready for approval"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1.5rem', marginBottom: '2rem' }}>
            {/* Upcoming Due Dates This Week */}
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Upcoming Due Dates (This Week)</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {stats?.upcomingDueDatesThisWeek?.length || 0} tasks
                </span>
              </div>

              {(!stats?.upcomingDueDatesThisWeek || stats.upcomingDueDatesThisWeek.length === 0) ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No upcoming deadlines due in the next 7 days.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {stats.upcomingDueDatesThisWeek.map((t) => (
                    <div
                      key={t.id}
                      style={{
                        padding: '0.75rem 1rem',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>
                          #{t.taskNumber} {t.title}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Project: {t.project?.name} · Assigned to: {t.assignedTo?.name || 'Unassigned'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className={`badge-priority priority-${t.priority}`}>{t.priority}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {new Date(t.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Priority Breakdown */}
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1.25rem' }}>
                Tasks by Priority
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((pri) => (
                  <div key={pri} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span className={`badge-priority priority-${pri}`}>{pri}</span>
                    <strong style={{ fontSize: '1rem' }}>{stats?.tasksByPriority?.[pri] || 0}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* PM Project Activity Feed */}
          <ActivityFeed title="Team Activity Feed (My Projects Only)" />
        </>
      )}

      {/* 3. DEVELOPER DASHBOARD VIEW */}
      {user?.role === 'DEVELOPER' && (
        <>
          <div className="stats-grid">
            <StatCard
              label="Assigned Tasks"
              value={stats?.totalAssignedTasks || 0}
              icon={CheckCircle2}
            />
            <StatCard
              label="Pending Execution"
              value={stats?.pendingCount || 0}
              icon={Clock}
            />
            <StatCard
              label="Completed Tasks"
              value={stats?.completedCount || 0}
              icon={CheckCircle2}
            />
            <StatCard
              label="Overdue Tasks"
              value={stats?.overdueCount || 0}
              icon={AlertTriangle}
              variant="overdue"
            />
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
                  My Assigned Tasks
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Sorted strictly by Priority (Critical → Low), then Due Date
                </p>
              </div>

              <button className="btn btn-secondary btn-sm" onClick={onNavigateToTasks}>
                View All & Filter
              </button>
            </div>

            {(!stats?.tasks || stats.tasks.length === 0) ? (
              <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No tasks assigned to you right now. Great job!
              </div>
            ) : (
              <div className="tasks-grid">
                {stats.tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onStatusChange={handleTaskStatusChange}
                    canEditDetails={false}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Developer's Scoped Activity Feed */}
          <ActivityFeed title="My Task Activity Stream" />
        </>
      )}
    </div>
  );
};
