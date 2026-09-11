import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { Project, Task, TaskStatus } from '../types';
import { apiRequest } from '../api/client';
import { TaskCard } from '../components/TaskCard';
import { TaskModal } from '../components/TaskModal';
import { FilterBar } from '../components/FilterBar';
import { ActivityFeed } from '../components/ActivityFeed';
import { ArrowLeft, Plus, Building, UserCheck } from 'lucide-react';

interface ProjectDetailsPageProps {
  projectId: string;
  onBack: () => void;
}

export const ProjectDetailsPage: React.FC<ProjectDetailsPageProps> = ({
  projectId,
  onBack,
}) => {
  const { user } = useAuth();
  const { joinProjectRoom, leaveProjectRoom, socket } = useSocket();

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [search, setSearch] = useState('');

  // Modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const fetchProjectData = async () => {
    try {
      const [projData, tasksData] = await Promise.all([
        apiRequest<Project>(`/projects/${projectId}`),
        apiRequest<Task[]>('/tasks', {
          params: {
            projectId,
            status: statusFilter || undefined,
            priority: priorityFilter || undefined,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
            search: search || undefined,
          },
        }),
      ]);
      setProject(projData);
      setTasks(tasksData);
    } catch (err) {
      console.error('Failed to load project details:', err);
    } finally {
      setLoading(false);
    }
  };

  // Join WebSocket project room for real-time live board updates
  useEffect(() => {
    joinProjectRoom(projectId);

    return () => {
      leaveProjectRoom(projectId);
    };
  }, [projectId]);

  // Listen for real-time task update events over WebSocket
  useEffect(() => {
    if (!socket) return;

    const handleTaskUpdated = (updatedTask: Task) => {
      if (updatedTask.projectId === projectId) {
        setTasks((prev) => {
          const index = prev.findIndex((t) => t.id === updatedTask.id);
          if (index >= 0) {
            const next = [...prev];
            next[index] = updatedTask;
            return next;
          }
          return [updatedTask, ...prev];
        });
      }
    };

    socket.on('task:updated', handleTaskUpdated);
    return () => {
      socket.off('task:updated', handleTaskUpdated);
    };
  }, [socket, projectId]);

  useEffect(() => {
    fetchProjectData();
  }, [projectId, statusFilter, priorityFilter, startDate, endDate, search]);

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      // Optimistic update
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );

      await apiRequest(`/tasks/${taskId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (err) {
      console.error('Failed to update task status:', err);
      fetchProjectData();
    }
  };

  const handleResetFilters = () => {
    setStatusFilter('');
    setPriorityFilter('');
    setStartDate('');
    setEndDate('');
    setSearch('');
  };

  const canManageTasks = user?.role === 'ADMIN' || (user?.role === 'PROJECT_MANAGER' && project?.managerId === user?.id);

  if (loading) {
    return (
      <div className="page-container" style={{ textAlign: 'center', paddingTop: '4rem' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading project details...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Navigation and Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <button
          className="btn-sm btn-secondary"
          onClick={onBack}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1rem' }}
        >
          <ArrowLeft size={14} /> Back to Projects
        </button>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>{project?.name}</h1>
              <span className="badge-status DONE" style={{ fontSize: '0.75rem' }}>
                {project?.status}
              </span>
            </div>
            {project?.description && (
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.35rem', maxWidth: '800px', fontSize: '0.9rem' }}>
                {project.description}
              </p>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginTop: '0.75rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Building size={14} />
                <span>Client: {project?.client?.company || project?.client?.name}</span>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <UserCheck size={14} />
                <span>PM: {project?.manager?.name}</span>
              </span>
            </div>
          </div>

          {canManageTasks && (
            <button
              className="btn btn-primary"
              onClick={() => {
                setSelectedTask(null);
                setIsTaskModalOpen(true);
              }}
            >
              <Plus size={16} />
              <span>Add Task</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter toolbar */}
      <FilterBar
        status={statusFilter}
        priority={priorityFilter}
        startDate={startDate}
        endDate={endDate}
        search={search}
        onFilterChange={(f) => {
          if (f.status !== undefined) setStatusFilter(f.status);
          if (f.priority !== undefined) setPriorityFilter(f.priority);
          if (f.startDate !== undefined) setStartDate(f.startDate);
          if (f.endDate !== undefined) setEndDate(f.endDate);
          if (f.search !== undefined) setSearch(f.search);
        }}
        onReset={handleResetFilters}
      />

      {/* Kanban Board / Tasks Grid */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>
          Project Tasks ({tasks.length})
        </h3>

        {tasks.length === 0 ? (
          <div className="glass-card" style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No tasks match the selected criteria.
          </div>
        ) : (
          <div className="tasks-grid">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onStatusChange={handleStatusChange}
                onClick={(t) => {
                  if (canManageTasks) {
                    setSelectedTask(t);
                    setIsTaskModalOpen(true);
                  }
                }}
                canEditDetails={canManageTasks}
              />
            ))}
          </div>
        )}
      </div>

      {/* Live Activity Feed for this project */}
      <ActivityFeed title={`Live Activity for ${project?.name}`} />

      {/* Task Creation & Editing Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        task={selectedTask}
        projectId={projectId}
        onClose={() => {
          setIsTaskModalOpen(false);
          setSelectedTask(null);
        }}
        onSaved={fetchProjectData}
        canEditDetails={canManageTasks}
      />
    </div>
  );
};
