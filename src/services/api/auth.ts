import { fetchApi, PaginatedList, API_BASE_URL, setTokens, clearTokens, getRefreshToken } from './base';
import type {
  AuthResponse,
  LoginRequest,
  CurrentUser,
  User,
  UserListItem,
  CreateUserRequest,
  UpdateUserRequest,
  Role,
  RoleListItem,
  CreateRoleRequest,
  UpdateRoleRequest,
  Permission,
  ChangePasswordRequest,
} from '../../types/auth';

// Auth API
export const authApi = {
  login: async (request: LoginRequest) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return { error: errorData?.error || 'Login failed' };
    }

    const data: AuthResponse = await response.json();
    setTokens(data.accessToken, data.refreshToken);
    return { data };
  },

  refresh: async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      return { error: 'No refresh token' };
    }

    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      return { error: 'Token refresh failed' };
    }

    const data: AuthResponse = await response.json();
    setTokens(data.accessToken, data.refreshToken);
    return { data };
  },

  logout: async () => {
    const result = await fetchApi<void>('/auth/logout', { method: 'POST' });
    clearTokens();
    return result;
  },

  getCurrentUser: () => fetchApi<CurrentUser>('/auth/me'),

  changePassword: (request: ChangePasswordRequest) =>
    fetchApi<void>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(request),
    }),
};

// Users API
export const usersApi = {
  getAll: (params: { pageNumber?: number; pageSize?: number; searchTerm?: string; isActive?: boolean }) => {
    const query = new URLSearchParams();
    if (params.pageNumber) query.append('pageNumber', params.pageNumber.toString());
    if (params.pageSize) query.append('pageSize', params.pageSize.toString());
    if (params.searchTerm) query.append('searchTerm', params.searchTerm);
    if (params.isActive !== undefined) query.append('isActive', params.isActive.toString());
    return fetchApi<PaginatedList<UserListItem>>(`/users?${query}`);
  },

  getById: (id: number) => fetchApi<User>(`/users/${id}`),

  create: (data: CreateUserRequest) =>
    fetchApi<number>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: UpdateUserRequest) =>
    fetchApi<void>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    fetchApi<void>(`/users/${id}`, { method: 'DELETE' }),

  activate: (id: number) =>
    fetchApi<void>(`/users/${id}/activate`, { method: 'POST' }),

  deactivate: (id: number) =>
    fetchApi<void>(`/users/${id}/deactivate`, { method: 'POST' }),

  resetPassword: (id: number, newPassword: string) =>
    fetchApi<void>(`/users/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword }),
    }),
};

// Roles API
export const rolesApi = {
  getAll: (params: { pageNumber?: number; pageSize?: number; searchTerm?: string }) => {
    const query = new URLSearchParams();
    if (params.pageNumber) query.append('pageNumber', params.pageNumber.toString());
    if (params.pageSize) query.append('pageSize', params.pageSize.toString());
    if (params.searchTerm) query.append('searchTerm', params.searchTerm);
    return fetchApi<PaginatedList<RoleListItem>>(`/roles?${query}`);
  },

  getAllList: () => fetchApi<RoleListItem[]>('/roles/all'),

  getById: (id: number) => fetchApi<Role>(`/roles/${id}`),

  create: (data: CreateRoleRequest) =>
    fetchApi<number>('/roles', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: UpdateRoleRequest) =>
    fetchApi<void>(`/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    fetchApi<void>(`/roles/${id}`, { method: 'DELETE' }),
};

// Permissions API
export const permissionsApi = {
  getAll: () => fetchApi<Permission[]>('/permissions'),

  getGrouped: () => fetchApi<Record<string, Permission[]>>('/permissions/grouped'),
};
