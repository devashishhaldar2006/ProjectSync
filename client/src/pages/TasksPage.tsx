import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { Task, TaskStatus } from '../types';
import { apiRequest } from '../api/client';
import { TaskCard } from '../components/TaskCard';
import { FilterBar } from '../components/FilterBar';
import { ActivityFeed } from '../components/ActivityFeed';

export const TasksPage: React.FC = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Initialize filters from URL query parameters (Shareable URLs requirement)
  const getInitialFilters = () => {
    const params = new URLSearchParams(window.location.search);
    return {
      status: params.get('status') || '',
      priority: params.get('priority') || '',
      startDate: params.get('startDate') || '',
      endDate: params.get('endDate') || '',
      search: params.get('search') || '',
    };
  };

  const initialFilters = getInitialFilters();
  const [status, setStatus] = useState(initialFilters.status);
  const [priority, setPriority] = useState(initialFilters.priority);
  const [startDate, setStartDate] = useState(initialFilters.startDate);
  const [endDate, setEndDate] = useState(initialFilters.endDate);
  const [search, setSearch] = useState(initialFilters.search);

  // Synchronize state changes to URL query parameters
  useEffect(() => {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (priority) params.set('priority', priority);
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    if (search) params.set('search', search);

    const queryString = params.toString();
    const newUrl = queryString
      ? `${window.location.pathname}?${queryString}`
      : window.location.pathname;

    window.history.replaceState({}, '', newUrl);
  }, [status, priority, startDate, endDate, search]);

  const fetchTasks = async () => {
    try {
      const data = await apiRequest<Task[]>('/tasks', {
        params: {
          status: status || undefined,
          priority: priority || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          search: search || undefined,
        },
      });
      setTasks(data);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [user, status, priority, startDate, endDate, search]);

  // Real-time task status updates via WebSocket
  useEffect(() => {
    if (!socket) return;

    const handleTaskUpdated = (updatedTask: Task) => {
      setTasks((prev) => {
        const index = prev.findIndex((t) => t.id === updatedTask.id);
        if (index >= 0) {
          const next = [...prev];
          next[index] = updatedTask;
          return next;
        }
        return [updatedTask, ...prev];
      });
    };

    socket.on('task:updated', handleTaskUpdated);
    return () => {
      socket.off('task:updated', handleTaskUpdated);
    };
  }, [socket]);

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );

      await apiRequest(`/tasks/${taskId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (err) {
      console.error('Status change error:', err);
      fetchTasks();
    }
  };

  const handleResetFilters = () => {
    setStatus('');
    setPriority('');
    setStartDate('');
    setEndDate('');
    setSearch('');
  };

  return (
    <div className="page-container">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>
          {user?.role === 'DEVELOPER' ? 'My Assigned Tasks' : 'All Tasks'}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
          {user?.role === 'DEVELOPER'
            ? 'Tasks assigned specifically to you. Filter and execute seamlessly.'
            : user?.role === 'PROJECT_MANAGER'
            ? 'All tasks across projects under your management.'
            : 'All tasks across the entire company portfolio.'}
        </p>
      </div>

      {/* Shareable Filter Toolbar */}
      <FilterBar
        status={status}
        priority={priority}
        startDate={startDate}
        endDate={endDate}
        search={search}
        onFilterChange={(f) => {
          if (f.status !== undefined) setStatus(f.status);
          if (f.priority !== undefined) setPriority(f.priority);
          if (f.startDate !== undefined) setStartDate(f.startDate);
          if (f.endDate !== undefined) setEndDate(f.endDate);
          if (f.search !== undefined) setSearch(f.search);
        }}
        onReset={handleResetFilters}
      />

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading tasks...
        </div>
      ) : tasks.length === 0 ? (
        <div className="glass-card" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          No tasks found matching your filter criteria.
        </div>
      ) : (
        <div className="tasks-grid" style={{ marginBottom: '2.5rem' }}>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onStatusChange={handleStatusChange}
              canEditDetails={user?.role !== 'DEVELOPER'}
            />
          ))}
        </div>
      )}

      {/* Live Feed */}
      <ActivityFeed title="Recent Activity Stream" />
    </div>
  );
};
