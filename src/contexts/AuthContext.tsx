import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../services/api/auth';
import { setAuthFailureCallback, clearTokens, getAccessToken, getRefreshToken, isDevAuthDisabled } from '../services/api/base';
import type { CurrentUser, LoginRequest, AuthResponse } from '../types/auth';

interface AuthContextType {
  user: CurrentUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  officeSlug: string | null;
  officeName: string | null;
  login: (request: LoginRequest) => Promise<{ success: boolean; error?: string; forcePasswordChange?: boolean }>;
  logout: () => Promise<void>;
  hasPermission: (code: string) => boolean;
  hasAnyPermission: (...codes: string[]) => boolean;
  refreshUser: () => Promise<void>;
  getDefaultRoute: () => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Dev mode mock user
const DEV_USER: CurrentUser = {
  id: 1,
  username: 'admin',
  firstName: 'Dev',
  lastName: 'Admin',
  fullName: 'Dev Admin',
  email: 'dev@local.com',
  companyName: 'Development',
  forcePasswordChange: false,
  roles: ['Administrator'],
  permissions: [
    'dash_view',
    'ship_view', 'ship_add', 'ship_edit', 'ship_delete',
    'cust_view', 'cust_add', 'cust_edit', 'cust_delete',
    'leads_view', 'leads_add', 'leads_edit', 'leads_delete',
    'quot_view', 'quot_add', 'quot_edit', 'quot_delete',
    'ratereq_view', 'ratereq_add', 'ratereq_edit', 'ratereq_delete',
    'expense_view', 'expense_add', 'expense_edit', 'expense_delete',
    'invoice_view', 'invoice_add', 'invoice_edit', 'invoice_delete',
    'receipt_view', 'receipt_add', 'receipt_edit', 'receipt_delete',
    'paymentvoucher_view', 'paymentvoucher_add', 'paymentvoucher_edit', 'paymentvoucher_delete',
    'creditnote_view', 'creditnote_add', 'creditnote_edit', 'creditnote_delete',
    'user_view', 'user_add', 'user_edit', 'user_delete',
    'role_view', 'role_add', 'role_edit', 'role_delete',
    'banks_view', 'banks_add', 'banks_edit', 'banks_delete',
    'company_view', 'company_add', 'company_edit', 'company_delete',
    'currency_view', 'currency_add', 'currency_edit', 'currency_delete',
    'port_view', 'port_add', 'port_edit', 'port_delete',
    'chargeitem_view', 'chargeitem_add', 'chargeitem_edit', 'chargeitem_delete',
    'expensetype_view', 'expensetype_add', 'expensetype_edit', 'expensetype_delete',
  ],
  officeSlug: 'dev',
  officeName: 'Development Office',
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [officeSlug, setOfficeSlug] = useState<string | null>(null);
  const [officeName, setOfficeName] = useState<string | null>(null);
  const navigate = useNavigate();

  const isDevMode = isDevAuthDisabled();

  // Check if user is authenticated
  const isAuthenticated = isDevMode ? true : !!user && !!getAccessToken();

  // Load user on mount
  useEffect(() => {
    const loadUser = async () => {
      // Dev mode - auto-login as admin
      if (isDevMode) {
        setUser(DEV_USER);
        setOfficeSlug(DEV_USER.officeSlug || null);
        setOfficeName(DEV_USER.officeName || null);
        setIsLoading(false);
        return;
      }

      // Check if we have an access token
      let token = getAccessToken();

      // No access token but have refresh token? Try to refresh
      if (!token && getRefreshToken()) {
        const refreshResult = await authApi.refresh();
        if (refreshResult.data) {
          token = getAccessToken();
          // Update office context from refresh response
          setOfficeSlug(refreshResult.data.officeSlug || null);
          setOfficeName(refreshResult.data.officeName || null);
        }
      }

      if (!token) {
        setIsLoading(false);
        return;
      }

      // Fetch current user
      const result = await authApi.getCurrentUser();
      if (result.data) {
        setUser(result.data);
        setOfficeSlug(result.data.officeSlug || null);
        setOfficeName(result.data.officeName || null);
      } else {
        // Token invalid, clear it
        clearTokens();
      }
      setIsLoading(false);
    };

    loadUser();
  }, [isDevMode]);

  // Set up auth failure callback
  useEffect(() => {
    if (!isDevMode) {
      setAuthFailureCallback(() => {
        setUser(null);
        setOfficeSlug(null);
        setOfficeName(null);
        navigate('/login');
      });
    }
  }, [navigate, isDevMode]);

  const login = useCallback(async (request: LoginRequest) => {
    if (isDevMode) {
      setUser(DEV_USER);
      setOfficeSlug(DEV_USER.officeSlug || null);
      setOfficeName(DEV_USER.officeName || null);
      return { success: true, forcePasswordChange: false };
    }

    const result = await authApi.login(request);
    if (result.error) {
      return { success: false, error: result.error };
    }

    if (result.data) {
      const authData = result.data as AuthResponse;
      const currentUser: CurrentUser = {
        id: authData.user.id,
        username: authData.user.username,
        firstName: authData.user.firstName,
        lastName: authData.user.lastName,
        fullName: authData.user.fullName,
        email: authData.user.email,
        contactNumber: authData.user.contactNumber,
        companyName: authData.user.companyName,
        forcePasswordChange: authData.user.forcePasswordChange,
        profilePictureUrl: authData.user.profilePictureUrl,
        roles: authData.user.roles.map(r => r.name),
        permissions: authData.user.permissions,
        officeSlug: authData.officeSlug,
        officeName: authData.officeName,
      };
      setUser(currentUser);
      setOfficeSlug(authData.officeSlug || null);
      setOfficeName(authData.officeName || null);
      return { success: true, forcePasswordChange: authData.user.forcePasswordChange };
    }

    return { success: false, error: 'Unknown error' };
  }, [isDevMode]);

  const logout = useCallback(async () => {
    if (!isDevMode) {
      await authApi.logout();
    }
    setUser(null);
    setOfficeSlug(null);
    setOfficeName(null);
    clearTokens();
    navigate('/login');
  }, [navigate, isDevMode]);

  const hasPermission = useCallback((code: string) => {
    if (isDevMode) return true;
    return user?.permissions.includes(code) ?? false;
  }, [user, isDevMode]);

  const hasAnyPermission = useCallback((...codes: string[]) => {
    if (isDevMode) return true;
    return codes.some(code => user?.permissions.includes(code));
  }, [user, isDevMode]);

  const refreshUser = useCallback(async () => {
    if (isDevMode) {
      setUser(DEV_USER);
      setOfficeSlug(DEV_USER.officeSlug || null);
      setOfficeName(DEV_USER.officeName || null);
      return;
    }

    const result = await authApi.getCurrentUser();
    if (result.data) {
      setUser(result.data);
      setOfficeSlug(result.data.officeSlug || null);
      setOfficeName(result.data.officeName || null);
    }
  }, [isDevMode]);

  // Get the first accessible route based on user permissions
  const getDefaultRoute = useCallback(() => {
    if (isDevMode) return '/';

    // Priority ordered list of routes and their required permissions
    const routePermissions = [
      { route: '/', permission: 'dash_view' },
      { route: '/shipments', permission: 'ship_view' },
      { route: '/master-customers', permission: 'cust_view' },
      { route: '/sales/leads', permission: 'leads_view' },
      { route: '/sales/quotations', permission: 'quot_view' },
      { route: '/accounts/invoices', permission: 'invoice_view' },
      { route: '/accounts/receipt-vouchers', permission: 'receipt_view' },
      { route: '/accounts/payment-vouchers', permission: 'paymentvoucher_view' },
      { route: '/accounts/daily-expenses', permission: 'expense_view' },
      { route: '/users/all', permission: 'user_view' },
      { route: '/users/roles', permission: 'role_view' },
      { route: '/banks', permission: 'banks_view' },
      { route: '/companies', permission: 'company_view' },
      { route: '/settings', permission: null },
    ];

    for (const { route, permission } of routePermissions) {
      if (!permission || user?.permissions.includes(permission)) {
        return route;
      }
    }

    return '/unauthorized';
  }, [user, isDevMode]);

  const value = {
    user,
    isAuthenticated,
    isLoading,
    officeSlug,
    officeName,
    login,
    logout,
    hasPermission,
    hasAnyPermission,
    refreshUser,
    getDefaultRoute,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
