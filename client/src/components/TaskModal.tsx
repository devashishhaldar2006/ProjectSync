import React, { useState, useEffect } from 'react';
import { Task, TaskPriority, TaskStatus, User } from '../types';
import { apiRequest } from '../api/client';
import { X } from 'lucide-react';

interface TaskModalProps {
  task?: Task | null;
  projectId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  canEditDetails?: boolean;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  task,
  projectId,
  isOpen,
  onClose,
  onSaved,
  canEditDetails = true,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [assignedToId, setAssignedToId] = useState<string>('');
  const [dueDate, setDueDate] = useState('');
  const [developers, setDevelopers] = useState<User[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setPriority(task.priority);
      setAssignedToId(task.assignedToId || '');
      setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
    } else {
      setTitle('');
      setDescription('');
      setPriority('MEDIUM');
      setAssignedToId('');
      // Default to 7 days from now
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 7);
      setDueDate(defaultDate.toISOString().split('T')[0]);
    }
  }, [task, isOpen]);

  useEffect(() => {
    // Fetch available developers for assignment dropdown
    if (isOpen) {
      apiRequest<User[]>('/users?role=DEVELOPER')
        .then((users) => setDevelopers(users))
        .catch(() => setDevelopers([]));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      if (task) {
        // Update existing task
        await apiRequest(`/tasks/${task.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            title,
            description,
            priority,
            assignedToId: assignedToId || null,
            dueDate: new Date(dueDate).toISOString(),
          }),
        });
      } else {
        // Create new task
        if (!projectId) {
          throw new Error('Project ID required to create a task');
        }
        await apiRequest('/tasks', {
          method: 'POST',
          body: JSON.stringify({
            title,
            description,
            projectId,
            priority,
            assignedToId: assignedToId || null,
            dueDate: new Date(dueDate).toISOString(),
          }),
        });
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save task');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog glass-card" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
            {task ? `Edit Task #${task.taskNumber}` : 'Create New Task'}
          </h3>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: '0.75rem',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid #ef4444',
              borderRadius: 'var(--radius-sm)',
              color: '#f87171',
              fontSize: '0.85rem',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Task Title</label>
            <input
              type="text"
              required
              disabled={!canEditDetails}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Implement WebAuthn Biometrics"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              rows={3}
              disabled={!canEditDetails}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Technical specifications and acceptance criteria..."
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select
                disabled={!canEditDetails}
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input
                type="date"
                required
                disabled={!canEditDetails}
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Assign Developer</label>
            <select
              disabled={!canEditDetails}
              value={assignedToId}
              onChange={(e) => setAssignedToId(e.target.value)}
            >
              <option value="">-- Unassigned --</option>
              {developers.map((dev) => (
                <option key={dev.id} value={dev.id}>
                  {dev.name} ({dev.email})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            {canEditDetails && (
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : task ? 'Update Task' : 'Create Task'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
