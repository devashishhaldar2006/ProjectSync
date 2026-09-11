import React, { useState, useEffect } from 'react';
import { Client, Project, User } from '../types';
import { apiRequest } from '../api/client';
import { X } from 'lucide-react';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  currentUserRole?: string;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  currentUserRole,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [clientId, setClientId] = useState('');
  const [managerId, setManagerId] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [pms, setPms] = useState<User[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName('');
      setDescription('');
      setError('');

      // Fetch clients
      apiRequest<Client[]>('/clients')
        .then((data) => {
          setClients(data);
          if (data.length > 0) setClientId(data[0].id);
        })
        .catch(() => {});

      // If Admin, fetch PMs for assignment
      if (currentUserRole === 'ADMIN') {
        apiRequest<User[]>('/users?role=PROJECT_MANAGER')
          .then((users) => {
            setPms(users);
            if (users.length > 0) setManagerId(users[0].id);
          })
          .catch(() => {});
      }
    }
  }, [isOpen, currentUserRole]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      await apiRequest('/projects', {
        method: 'POST',
        body: JSON.stringify({
          name,
          description,
          clientId,
          ...(currentUserRole === 'ADMIN' && managerId ? { managerId } : {}),
        }),
      });

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create project');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog glass-card" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Create New Project</h3>
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
            <label className="form-label">Project Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. NextGen Micro-Payments Portal"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Project goals, scope, and deliverables..."
            />
          </div>

          <div className="form-group">
            <label className="form-label">Assign Client</label>
            <select
              required
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.company})
                </option>
              ))}
            </select>
          </div>

          {currentUserRole === 'ADMIN' && (
            <div className="form-group">
              <label className="form-label">Assign Project Manager</label>
              <select
                value={managerId}
                onChange={(e) => setManagerId(e.target.value)}
              >
                {pms.map((pm) => (
                  <option key={pm.id} value={pm.id}>
                    {pm.name} ({pm.email})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
