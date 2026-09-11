import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  Briefcase,
  CheckSquare,
  LogOut,
  ShieldCheck,
  UserCheck,
  Code
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const { user, logout, switchUserRole } = useAuth();

  const getRoleBadgeClass = () => {
    switch (user?.role) {
      case 'ADMIN': return 'badge-admin';
      case 'PROJECT_MANAGER': return 'badge-pm';
      default: return 'badge-dev';
    }
  };

  const getRoleLabel = () => {
    switch (user?.role) {
      case 'ADMIN': return 'Admin';
      case 'PROJECT_MANAGER': return 'Project Manager';
      default: return 'Developer';
    }
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '6px',
              background: '#2d8a66',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.85rem',
            }}
          >
            PS
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>ProjectSync</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Agency Management</div>
          </div>
        </div>
      </div>

      {/* Demo role switch toolbar */}
      <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.4rem' }}>
          Switch Role View
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.35rem' }}>
          <button
            className={`btn-sm ${user?.role === 'ADMIN' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.7rem', padding: '0.25rem 0.2rem' }}
            onClick={() => switchUserRole('admin@velozity.com')}
            title="Switch to Admin (Arthur)"
          >
            Admin
          </button>
          <button
            className={`btn-sm ${user?.role === 'PROJECT_MANAGER' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.7rem', padding: '0.25rem 0.2rem' }}
            onClick={() => switchUserRole('pm.sarah@velozity.com')}
            title="Switch to PM (Sarah)"
          >
            PM
          </button>
          <button
            className={`btn-sm ${user?.role === 'DEVELOPER' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.7rem', padding: '0.25rem 0.2rem' }}
            onClick={() => switchUserRole('dev.ravi@velozity.com')}
            title="Switch to Developer (Ravi)"
          >
            Dev
          </button>
        </div>
      </div>

      <nav className="sidebar-nav">
        <button
          className={`nav-item ${currentTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => onSelectTab('dashboard')}
          style={{ width: '100%', textAlign: 'left' }}
        >
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </button>

        {/* Developer sees their tasks, PM/Admin see projects */}
        <button
          className={`nav-item ${currentTab === 'projects' ? 'active' : ''}`}
          onClick={() => onSelectTab('projects')}
          style={{ width: '100%', textAlign: 'left' }}
        >
          <Briefcase size={18} />
          <span>Projects</span>
        </button>

        <button
          className={`nav-item ${currentTab === 'tasks' ? 'active' : ''}`}
          onClick={() => onSelectTab('tasks')}
          style={{ width: '100%', textAlign: 'left' }}
        >
          <CheckSquare size={18} />
          <span>{user?.role === 'DEVELOPER' ? 'My Assigned Tasks' : 'All Tasks'}</span>
        </button>
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile">
          <img
            src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
            alt={user?.name}
            className="avatar"
          />
          <div className="user-info">
            <span className="user-name" title={user?.email}>{user?.name}</span>
            <span className={`user-role-badge ${getRoleBadgeClass()}`}>{getRoleLabel()}</span>
          </div>
        </div>

        <button className="btn-icon" onClick={logout} title="Sign Out">
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
};
