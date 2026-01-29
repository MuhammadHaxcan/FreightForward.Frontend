// Authentication Types

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  contactNumber?: string;
  companyId?: number;
  companyName?: string;
  isActive: boolean;
  forcePasswordChange: boolean;
  lastLoginAt?: string;
  createdAt: string;
  profilePictureUrl?: string;
  roles: Role[];
  permissions: string[];
}

export interface UserListItem {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  contactNumber?: string;
  companyName?: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  profilePictureUrl?: string;
  roleNames: string[];
}

export interface Role {
  id: number;
  name: string;
  description?: string;
  isSystemRole: boolean;
  permissions?: Permission[];
}

export interface RoleListItem {
  id: number;
  name: string;
  description?: string;
  isSystemRole: boolean;
  userCount: number;
  permissionCount: number;
}

export interface Permission {
  id: number;
  module: string;
  action: string;
  code: string;
  description?: string;
}

export interface CurrentUser {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  contactNumber?: string;
  companyName?: string;
  forcePasswordChange: boolean;
  profilePictureUrl?: string;
  roles: string[];
  permissions: string[];
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  contactNumber?: string;
  companyId?: number;
  isActive: boolean;
  profilePictureUrl?: string;
  roleIds: number[];
}

export interface UpdateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  contactNumber?: string;
  companyId?: number;
  isActive: boolean;
  profilePictureUrl?: string;
  roleIds: number[];
}

export interface CreateRoleRequest {
  name: string;
  description?: string;
  permissionIds: number[];
}

export interface UpdateRoleRequest {
  name: string;
  description?: string;
  permissionIds: number[];
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  contactNumber?: string;
  profilePictureUrl?: string;
}

// Auth state
export interface AuthState {
  user: CurrentUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
