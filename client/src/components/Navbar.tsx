import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { NotificationDropdown } from './NotificationDropdown';
import { Radio } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user } = useAuth();
  const { onlineCount } = useSocket();

  return (
    <header className="navbar">
      <div className="navbar-brand">
        <span style={{ fontSize: '1.25rem', color: '#38a178' }}>⚡</span>
        <span>ProjectSync</span>
      </div>

      <div className="navbar-actions">
        {/* Real-time active connection indicator */}
        <div className="presence-badge" title="Active users online">
          <span className="presence-dot"></span>
          <span>{onlineCount} {onlineCount === 1 ? 'user' : 'users'} online</span>
        </div>

        {/* Real-time In-App Notification Dropdown */}
        <NotificationDropdown />
      </div>
    </header>
  );
};
