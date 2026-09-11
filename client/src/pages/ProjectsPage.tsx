import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Project } from '../types';
import { apiRequest } from '../api/client';
import { ProjectModal } from '../components/ProjectModal';
import { FolderKanban, Plus, ExternalLink, User, Building } from 'lucide-react';

interface ProjectsPageProps {
  onSelectProject: (projectId: string) => void;
}

export const ProjectsPage: React.FC<ProjectsPageProps> = ({ onSelectProject }) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchProjects = async () => {
    try {
      const data = await apiRequest<Project[]>('/projects');
      setProjects(data);
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [user]);

  return (
    <div className="page-container">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Client Projects</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            {user?.role === 'ADMIN'
              ? 'Global repository of all client accounts and enterprise initiatives.'
              : user?.role === 'PROJECT_MANAGER'
              ? 'Projects you currently manage and lead.'
              : 'Projects where you have assigned active tasks.'}
          </p>
        </div>

        {/* Only Admin and PM can create projects */}
        {(user?.role === 'ADMIN' || user?.role === 'PROJECT_MANAGER') && (
          <button className="btn btn-primary" onClick={() => setIsCreateModalOpen(true)}>
            <Plus size={16} />
            <span>New Project</span>
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading projects...
        </div>
      ) : projects.length === 0 ? (
        <div className="glass-card" style={{ padding: '4rem', textAlign: 'center' }}>
          <FolderKanban size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
          <h3>No Projects Found</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.9rem' }}>
            {user?.role === 'DEVELOPER'
              ? 'You do not have any tasks assigned in active projects.'
              : 'Get started by creating your first client project.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.5rem' }}>
          {projects.map((proj) => (
            <div
              key={proj.id}
              className="glass-card"
              style={{
                padding: '1.75rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onClick={() => onSelectProject(proj.id)}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(16, 185, 129, 0.15)',
                      color: '#34d399',
                    }}
                  >
                    {proj.status}
                  </span>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: '0.5rem' }}>{proj.name}</h3>
                </div>
                <button className="btn-icon" title="Open Board">
                  <ExternalLink size={16} />
                </button>
              </div>

              {proj.description && (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {proj.description}
                </p>
              )}

              <div
                style={{
                  marginTop: 'auto',
                  paddingTop: '1rem',
                  borderTop: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Building size={14} />
                  <span>{proj.client?.company || proj.client?.name}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <User size={14} />
                  <span>PM: {proj.manager?.name || 'Assigned'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSaved={fetchProjects}
        currentUserRole={user?.role}
      />
    </div>
  );
};
