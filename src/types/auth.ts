// Authentication Types

export interface User {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email?: string;
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
  username: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email?: string;
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
  username: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email?: string;
  contactNumber?: string;
  companyName?: string;
  forcePasswordChange: boolean;
  profilePictureUrl?: string;
  roles: string[];
  permissions: string[];
  officeSlug?: string;
  officeName?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: User;
  officeSlug?: string;
  officeName?: string;
}

export interface LoginRequest {
  username: string;  // Format: "officeSlug|username" (e.g., "dubai|admin")
  password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface CreateUserRequest {
  username: string;
  firstName: string;
  lastName: string;
  email?: string;
  password: string;
  contactNumber?: string;
  companyId?: number;
  isActive: boolean;
  profilePictureUrl?: string;
  roleIds: number[];
}

export interface UpdateUserRequest {
  username: string;
  firstName: string;
  lastName: string;
  email?: string;
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
  officeSlug?: string;
  officeName?: string;
}

// ===========================================
// SYSTEM ADMIN TYPES
// ===========================================

export interface SystemAdminUser {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export interface SystemAdminAuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: SystemAdminUser;
}

export interface SystemAdminLoginRequest {
  email: string;
  password: string;
}

export interface Office {
  id: number;
  name: string;
  slug: string;
  schemaName: string;
  location?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface OfficeListItem {
  id: number;
  name: string;
  slug: string;
  location?: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateOfficeRequest {
  name: string;
  slug: string;
  location?: string;
  phone?: string;
  email?: string;
}

export interface UpdateOfficeRequest {
  name: string;
  location?: string;
  phone?: string;
  email?: string;
}

export interface OfficeAdminCredentials {
  username: string;
  password: string;
}

export interface OfficeCreatedResponse {
  office: Office;
  adminCredentials: OfficeAdminCredentials;
}

export interface OfficeAuditLog {
  id: number;
  officeId?: number;
  officeName?: string;
  action: string;
  description: string;
  details?: string;
  performedBy: string;
  ipAddress?: string;
  isSuccess: boolean;
  errorMessage?: string;
  timestamp: string;
}

export interface CreateSystemAdminRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface UpdateSystemAdminRequest {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  isActive: boolean;
}

export interface MigrationsInfo {
  pendingMigrations: string[];
  appliedMigrations: string[];
  hasPendingMigrations: boolean;
}
