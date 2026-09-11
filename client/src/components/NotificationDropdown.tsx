import React, { useState, useRef, useEffect } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { Bell, Check, CheckCheck } from 'lucide-react';

export const NotificationDropdown: React.FC = () => {
  const { notifications, unreadCount, markNotificationRead, markAllNotificationsRead } = useSocket();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatRelativeTime = (isoString: string) => {
    const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button
        className="btn-icon"
        onClick={() => setIsOpen(!isOpen)}
        title="Notifications"
        style={{ position: 'relative' }}
      >
        <Bell size={19} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              background: '#b84444',
              color: '#fff',
              fontSize: '0.65rem',
              fontWeight: 700,
              minWidth: '17px',
              height: '17px',
              borderRadius: '9999px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-popover glass-card">
          <div className="notification-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <strong style={{ fontSize: '0.9rem' }}>Notifications</strong>
              {unreadCount > 0 && (
                <span
                  style={{
                    fontSize: '0.7rem',
                    background: 'rgba(45, 138, 102, 0.18)',
                    color: '#72cca7',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 600,
                  }}
                >
                  {unreadCount} unread
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                className="btn-sm btn-secondary"
                onClick={markAllNotificationsRead}
                style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
              >
                <CheckCheck size={14} /> Mark all read
              </button>
            )}
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No notifications right now.
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`notification-item ${!notif.isRead ? 'unread' : ''}`}
                  onClick={() => !notif.isRead && markNotificationRead(notif.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.82rem' }}>
                      {notif.title}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {formatRelativeTime(notif.createdAt)}
                    </span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: 1.35 }}>
                    {notif.message}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
