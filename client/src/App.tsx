import React, { useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { ProjectDetailsPage } from './pages/ProjectDetailsPage';
import { TasksPage } from './pages/TasksPage';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';

export const App: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'projects' | 'tasks'>('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-primary)',
          color: 'var(--text-secondary)',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem', animation: 'pulseDot 1.5s infinite' }}>⚡</div>
          <p>Connecting to ProjectSync Secure Session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="app-layout">
      {/* Persistent Left Sidebar */}
      <Sidebar
        currentTab={selectedProjectId ? 'projects' : currentTab}
        onSelectTab={(tab) => {
          setSelectedProjectId(null);
          setCurrentTab(tab as any);
        }}
      />

      {/* Main Content Area */}
      <div className="main-content">
        <Navbar />

        {selectedProjectId ? (
          <ProjectDetailsPage
            projectId={selectedProjectId}
            onBack={() => setSelectedProjectId(null)}
          />
        ) : currentTab === 'dashboard' ? (
          <DashboardPage
            onNavigateToProjects={() => setCurrentTab('projects')}
            onNavigateToTasks={() => setCurrentTab('tasks')}
          />
        ) : currentTab === 'projects' ? (
          <ProjectsPage
            onSelectProject={(projId) => setSelectedProjectId(projId)}
          />
        ) : (
          <TasksPage />
        )}
      </div>
    </div>
  );
};
