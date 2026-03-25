import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../services/api/auth';
import { setAuthFailureCallback, clearTokens, getAccessToken, getRefreshToken } from '../services/api/base';
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [officeSlug, setOfficeSlug] = useState<string | null>(null);
  const [officeName, setOfficeName] = useState<string | null>(null);
  const navigate = useNavigate();

  // Check if user is authenticated
  const isAuthenticated = !!user && !!getAccessToken();

  // Load user on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
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
      } catch {
        // Network or unexpected error — clear any invalid tokens
        clearTokens();
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  // Set up auth failure callback
  useEffect(() => {
    setAuthFailureCallback(() => {
      setUser(null);
      setOfficeSlug(null);
      setOfficeName(null);
      navigate('/login');
    });
  }, [navigate]);

  const login = useCallback(async (request: LoginRequest) => {
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
        baseCurrencySet: authData.user.baseCurrencySet,
        profilePictureUrl: authData.user.profilePictureUrl,
        roles: (authData.user.roles ?? []).map(r => r.name),
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
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
    setOfficeSlug(null);
    setOfficeName(null);
    clearTokens();
    navigate('/login');
  }, [navigate]);

  const hasPermission = useCallback((code: string) => {
    return (user?.permissions ?? []).includes(code);
  }, [user]);

  const hasAnyPermission = useCallback((...codes: string[]) => {
    return codes.some(code => (user?.permissions ?? []).includes(code));
  }, [user]);

  const refreshUser = useCallback(async () => {
    const result = await authApi.getCurrentUser();
    if (result.data) {
      setUser(result.data);
      setOfficeSlug(result.data.officeSlug || null);
      setOfficeName(result.data.officeName || null);
    }
  }, []);

  // Get the first accessible route based on user permissions
  const getDefaultRoute = useCallback(() => {
    // Priority ordered list of routes and their required permissions
    const routePermissions = [
      { route: '/', permission: 'dash_view' },
      { route: '/shipments', permission: 'ship_view' },
      { route: '/master-customers', permission: 'cust_view' },
      { route: '/sales/leads', permission: 'leads_view' },
      { route: '/sales/rate-requests', permission: 'ratereq_view' },
      { route: '/sales/quotations', permission: 'quot_view' },
      { route: '/accounts/invoices', permission: 'invoice_view' },
      { route: '/accounts/purchase-invoices', permission: 'purchase_view' },
      { route: '/accounts/receipt-vouchers', permission: 'receipt_view' },
      { route: '/accounts/payment-vouchers', permission: 'paymentvoucher_view' },
      { route: '/accounts/daily-expenses', permission: 'expense_view' },
      { route: '/accounts/credit-notes', permission: 'creditnote_view' },
      { route: '/accounts/post-dated-cheques', permission: 'pdc_view' },
      { route: '/accounts/account-receivable', permission: 'accrec_view' },
      { route: '/accounts/account-payable', permission: 'accpay_view' },
      { route: '/hr/employees', permission: 'hr_emp_view' },
      { route: '/hr/salary-components', permission: 'hr_salary_view' },
      { route: '/hr/attendance', permission: 'hr_attend_view' },
      { route: '/hr/payroll', permission: 'hr_payroll_view' },
      { route: '/hr/advances', permission: 'hr_advance_view' },
      { route: '/users/all', permission: 'user_view' },
      { route: '/users/roles', permission: 'role_view' },
      { route: '/settings', permission: null },
    ];

    for (const { route, permission } of routePermissions) {
      if (!permission || user?.permissions.includes(permission)) {
        return route;
      }
    }

    return '/unauthorized';
  }, [user]);

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
