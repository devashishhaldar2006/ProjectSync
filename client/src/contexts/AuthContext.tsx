import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { apiRequest, setAccessToken, getAccessToken } from '../api/client';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
  switchUserRole: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Initial session restoration via HttpOnly refresh cookie
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const data = await apiRequest<{ user: User; accessToken: string }>('/auth/refresh', {
          method: 'POST',
        });
        setAccessToken(data.accessToken);
        setUser(data.user);
      } catch (err) {
        // No active session or expired
        setAccessToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (email: string, password = 'Password123!') => {
    setLoading(true);
    try {
      const data = await apiRequest<{ user: User; accessToken: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setAccessToken(data.accessToken);
      setUser(data.user);
    } finally {
      setLoading(false);
    }
  };

  const switchUserRole = async (email: string) => {
    await login(email, 'Password123!');
  };

  const logout = async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, switchUserRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
