import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { getAccessToken } from '../api/client';
import { ActivityLog, NotificationItem, Task } from '../types';

interface SocketContextType {
  socket: Socket | null;
  onlineCount: number;
  recentActivities: ActivityLog[];
  notifications: NotificationItem[];
  unreadCount: number;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  joinProjectRoom: (projectId: string) => void;
  leaveProjectRoom: (projectId: string) => void;
  refreshActivities: () => Promise<void>;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineCount, setOnlineCount] = useState<number>(1);
  const [recentActivities, setRecentActivities] = useState<ActivityLog[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // Load missed event catch-up from DB (last 20 events)
  const refreshActivities = async () => {
    if (!user) return;
    try {
      const token = getAccessToken();
      const res = await fetch('/api/activities?limit=20', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setRecentActivities(json.data || []);
      }
    } catch (err) {
      console.error('Failed to catch up missed activities:', err);
    }
  };

  // Load initial notifications
  const loadNotifications = async () => {
    if (!user) return;
    try {
      const token = getAccessToken();
      const res = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setNotifications(json.data.notifications || []);
        setUnreadCount(json.data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      setRecentActivities([]);
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    refreshActivities();
    loadNotifications();

    const token = getAccessToken();
    const newSocket = io(window.location.origin, {
      auth: { token },
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      // Upon reconnect, catch up on any missed activities from DB
      refreshActivities();
    });

    newSocket.on('presence:count', (data: { onlineCount: number }) => {
      setOnlineCount(data.onlineCount);
    });

    // Real-time live activity feed event
    newSocket.on('activity:new', (activity: ActivityLog) => {
      setRecentActivities((prev) => {
        // Prepend new activity, limit to 20
        const updated = [activity, ...prev.filter((a) => a.id !== activity.id)];
        return updated.slice(0, 20);
      });
    });

    // Real-time in-app notification event
    newSocket.on('notification:new', (data: { notification: NotificationItem; unreadCount: number }) => {
      setNotifications((prev) => [data.notification, ...prev]);
      setUnreadCount(data.unreadCount);
    });

    newSocket.on('notification:unreadCount', (data: { unreadCount: number }) => {
      setUnreadCount(data.unreadCount);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  const joinProjectRoom = (projectId: string) => {
    if (socket && socket.connected) {
      socket.emit('join:project', projectId);
    }
  };

  const leaveProjectRoom = (projectId: string) => {
    if (socket && socket.connected) {
      socket.emit('leave:project', projectId);
    }
  };

  const markNotificationRead = async (id: string) => {
    try {
      const token = getAccessToken();
      await fetch(`/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {}
  };

  const markAllNotificationsRead = async () => {
    try {
      const token = getAccessToken();
      await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {}
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        onlineCount,
        recentActivities,
        notifications,
        unreadCount,
        markNotificationRead,
        markAllNotificationsRead,
        joinProjectRoom,
        leaveProjectRoom,
        refreshActivities,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
