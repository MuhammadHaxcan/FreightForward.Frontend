import { fetchApi, API_BASE_URL, setTokens, clearTokens, getRefreshToken } from './base';
import type {
  SystemAdminAuthResponse,
  SystemAdminLoginRequest,
  SystemAdminUser,
  Office,
  OfficeListItem,
  CreateOfficeRequest,
  UpdateOfficeRequest,
  OfficeCreatedResponse,
  OfficeAuditLog,
  CreateSystemAdminRequest,
  UpdateSystemAdminRequest,
  MigrationsInfo,
} from '../../types/auth';

// System Admin Auth API
export const systemAdminAuthApi = {
  login: async (request: SystemAdminLoginRequest) => {
    const response = await fetch(`${API_BASE_URL}/auth/system/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return { error: errorData?.error || 'Login failed' };
    }

    const data: SystemAdminAuthResponse = await response.json();
    setTokens(data.accessToken, data.refreshToken);
    return { data };
  },

  refresh: async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      return { error: 'No refresh token' };
    }

    const response = await fetch(`${API_BASE_URL}/auth/system/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      return { error: 'Token refresh failed' };
    }

    const data: SystemAdminAuthResponse = await response.json();
    setTokens(data.accessToken, data.refreshToken);
    return { data };
  },

  logout: async () => {
    const result = await fetchApi<void>('/auth/system/logout', { method: 'POST' });
    clearTokens();
    return result;
  },

  getCurrentAdmin: () => fetchApi<SystemAdminUser>('/auth/system/me'),
};

// Offices API
export const officesApi = {
  getAll: () => fetchApi<OfficeListItem[]>('/system/offices'),

  getById: (id: number) => fetchApi<Office>(`/system/offices/${id}`),

  create: (data: CreateOfficeRequest) =>
    fetchApi<OfficeCreatedResponse>('/system/offices', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: UpdateOfficeRequest) =>
    fetchApi<Office>(`/system/offices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  activate: (id: number) =>
    fetchApi<void>(`/system/offices/${id}/activate`, { method: 'PATCH' }),

  deactivate: (id: number) =>
    fetchApi<void>(`/system/offices/${id}/deactivate`, { method: 'PATCH' }),

  delete: (id: number) =>
    fetchApi<void>(`/system/offices/${id}`, { method: 'DELETE' }),

  getMigrations: (id: number) =>
    fetchApi<MigrationsInfo>(`/system/offices/${id}/migrations`),

  applyMigrations: (id: number) =>
    fetchApi<void>(`/system/offices/${id}/migrations/apply`, { method: 'POST' }),

  getAuditLogs: (officeId?: number, limit: number = 100) => {
    const query = new URLSearchParams();
    if (officeId) query.append('officeId', officeId.toString());
    query.append('limit', limit.toString());
    return fetchApi<OfficeAuditLog[]>(`/system/offices/audit-logs?${query}`);
  },
};

// System Admins API
export const systemAdminsApi = {
  getAll: () => fetchApi<SystemAdminUser[]>('/system/admins'),

  getById: (id: number) => fetchApi<SystemAdminUser>(`/system/admins/${id}`),

  create: (data: CreateSystemAdminRequest) =>
    fetchApi<SystemAdminUser>('/system/admins', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: UpdateSystemAdminRequest) =>
    fetchApi<SystemAdminUser>(`/system/admins/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    fetchApi<void>(`/system/admins/${id}`, { method: 'DELETE' }),
};
