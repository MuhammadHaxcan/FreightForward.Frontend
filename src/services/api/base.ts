// API Configuration and Base Client
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://localhost:7001/api';

// Auth token storage keys
// SECURITY NOTE: Tokens are stored in browser storage which is vulnerable to XSS attacks.
// For production systems with high security requirements, consider migrating to httpOnly
// cookies with CSRF protection. This requires backend changes to set cookies in responses.
const ACCESS_TOKEN_KEY = 'ff_access_token';
const REFRESH_TOKEN_KEY = 'ff_refresh_token';

// Common Types
export interface PaginatedList<T> {
  items: T[];
  pageNumber: number;
  totalPages: number;
  totalCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  errors?: string[];
}

// Enums and Common Types
export type MasterType = 'Debtors' | 'Creditors' | 'Neutral';
export type PaymentStatus = 'Pending' | 'Paid' | 'PartiallyPaid' | 'Overdue' | 'Closed';

// Token management - sessionStorage for access (clears on tab close)
// localStorage for refresh (persists for "remember me" and auto-refresh)
export function getAccessToken(): string | null {
  return sessionStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken: string): void {
  sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens(): void {
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

// Callback for when auth fails and needs redirect
let onAuthFailure: (() => void) | null = null;
export function setAuthFailureCallback(callback: () => void): void {
  onAuthFailure = callback;
}

// Check if dev mode auth bypass is enabled
// SECURITY: Only allows bypass in development mode (not production builds)
export function isDevAuthDisabled(): boolean {
  return import.meta.env.DEV && import.meta.env.VITE_DISABLE_AUTH === 'true';
}

// Generic fetch wrapper with auth
export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add auth header if token exists (skip in dev bypass mode)
    if (!isDevAuthDisabled()) {
      const accessToken = getAccessToken();
      if (accessToken) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`;
      }
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Handle 401 Unauthorized - attempt refresh or redirect to login
    if (response.status === 401) {
      // Try to refresh the token
      const refreshResult = await attemptTokenRefresh();
      if (refreshResult) {
        // Retry the original request with new token
        const newAccessToken = getAccessToken();
        (headers as Record<string, string>)['Authorization'] = `Bearer ${newAccessToken}`;
        const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
          ...options,
          headers,
        });

        if (retryResponse.ok) {
          if (retryResponse.status === 204) {
            return { data: undefined as T };
          }
          const data = await retryResponse.json();
          return { data };
        }
      }

      // Refresh failed, clear tokens and redirect to login
      clearTokens();
      if (onAuthFailure) {
        onAuthFailure();
      }
      return { error: 'Session expired. Please login again.' };
    }

    // Handle 403 Forbidden
    if (response.status === 403) {
      return { error: 'You do not have permission to perform this action.' };
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return {
        error: errorData?.error || errorData?.message || `HTTP error! status: ${response.status}`,
        errors: errorData?.errors || [],
      };
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return { data: undefined as T };
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'An unknown error occurred',
    };
  }
}

// Authenticated fetch for binary data (PDFs, etc.) and simple API calls
export async function fetchBlob(url: string): Promise<Response> {
  const headers: HeadersInit = {};

  // Add auth header if not in dev bypass mode
  if (!isDevAuthDisabled()) {
    const token = getAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const response = await fetch(url, { headers });

  // Handle 401 - attempt token refresh
  if (response.status === 401 && !isDevAuthDisabled()) {
    const refreshResult = await attemptTokenRefresh();
    if (refreshResult) {
      // Retry with new token
      const newToken = getAccessToken();
      if (newToken) {
        headers['Authorization'] = `Bearer ${newToken}`;
      }
      return fetch(url, { headers });
    }

    // Refresh failed, trigger auth failure callback
    clearTokens();
    if (onAuthFailure) {
      onAuthFailure();
    }
  }

  return response;
}

// Token refresh mutex to prevent concurrent refresh attempts
let refreshPromise: Promise<boolean> | null = null;

// Token refresh helper with mutex to prevent race conditions
export async function attemptTokenRefresh(): Promise<boolean> {
  // If refresh already in progress, wait for it
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = doTokenRefresh();
  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

async function doTokenRefresh(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return false;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    setTokens(data.accessToken, data.refreshToken);
    return true;
  } catch {
    return false;
  }
}
