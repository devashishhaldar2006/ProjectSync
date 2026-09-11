import { User } from '../types';

let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export const getAccessToken = (): string | null => {
  return accessToken;
};

interface RequestOptions extends RequestInit {
  params?: Record<string, string | undefined>;
}

export async function apiRequest<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, headers = {}, ...customConfig } = options;

  let url = `/api${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, value);
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>),
  };

  if (accessToken) {
    defaultHeaders['Authorization'] = `Bearer ${accessToken}`;
  }

  const response = await fetch(url, {
    ...customConfig,
    headers: defaultHeaders,
    credentials: 'include', // Includes HttpOnly refreshToken cookie
  });

  // If unauthorized and not already hitting refresh endpoint, attempt automatic token refresh
  if (response.status === 401 && !endpoint.startsWith('/auth/refresh') && !endpoint.startsWith('/auth/login')) {
    try {
      const refreshResponse = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        setAccessToken(refreshData.data.accessToken);

        // Retry original request with new access token
        defaultHeaders['Authorization'] = `Bearer ${refreshData.data.accessToken}`;
        const retryResponse = await fetch(url, {
          ...customConfig,
          headers: defaultHeaders,
          credentials: 'include',
        });

        const retryData = await retryResponse.json();
        if (!retryResponse.ok) {
          throw new Error(retryData.error?.message || 'Request failed after refresh');
        }
        return retryData.data;
      }
    } catch (refreshErr) {
      setAccessToken(null);
    }
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || 'An unexpected error occurred');
  }

  return data.data;
}
