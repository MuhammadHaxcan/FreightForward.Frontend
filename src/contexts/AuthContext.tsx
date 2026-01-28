import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../services/api/auth';
import { setAuthFailureCallback, clearTokens, getAccessToken, isDevAuthDisabled } from '../services/api/base';
import type { CurrentUser, LoginRequest, AuthResponse } from '../types/auth';

interface AuthContextType {
  user: CurrentUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (request: LoginRequest) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  hasPermission: (code: string) => boolean;
  hasAnyPermission: (...codes: string[]) => boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Dev mode mock user
const DEV_USER: CurrentUser = {
  id: 1,
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
    'custcat_view', 'custcat_add', 'custcat_edit', 'custcat_delete',
    'incoterm_view', 'incoterm_add', 'incoterm_edit', 'incoterm_delete',
    'packagetype_view', 'packagetype_add', 'packagetype_edit', 'packagetype_delete',
    'networkpartner_view', 'networkpartner_add', 'networkpartner_edit', 'networkpartner_delete',
    'bltype_view', 'bltype_add', 'bltype_edit', 'bltype_delete',
    'costingunit_view', 'costingunit_add', 'costingunit_edit', 'costingunit_delete',
    'containertype_view', 'containertype_add', 'containertype_edit', 'containertype_delete',
    'documenttype_view', 'documenttype_add', 'documenttype_edit', 'documenttype_delete',
    'country_view', 'country_add', 'country_edit', 'country_delete',
  ],
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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
        setIsLoading(false);
        return;
      }

      // Check if we have a token
      const token = getAccessToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      // Fetch current user
      const result = await authApi.getCurrentUser();
      if (result.data) {
        setUser(result.data);
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
        navigate('/login');
      });
    }
  }, [navigate, isDevMode]);

  const login = useCallback(async (request: LoginRequest) => {
    if (isDevMode) {
      setUser(DEV_USER);
      return { success: true };
    }

    const result = await authApi.login(request);
    if (result.error) {
      return { success: false, error: result.error };
    }

    if (result.data) {
      // Convert User to CurrentUser format
      const authData = result.data as AuthResponse;
      const currentUser: CurrentUser = {
        id: authData.user.id,
        firstName: authData.user.firstName,
        lastName: authData.user.lastName,
        fullName: authData.user.fullName,
        email: authData.user.email,
        companyName: authData.user.companyName,
        forcePasswordChange: authData.user.forcePasswordChange,
        roles: authData.user.roles.map(r => r.name),
        permissions: authData.user.permissions,
      };
      setUser(currentUser);
      return { success: true };
    }

    return { success: false, error: 'Unknown error' };
  }, [isDevMode]);

  const logout = useCallback(async () => {
    if (!isDevMode) {
      await authApi.logout();
    }
    setUser(null);
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
      return;
    }

    const result = await authApi.getCurrentUser();
    if (result.data) {
      setUser(result.data);
    }
  }, [isDevMode]);

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    hasPermission,
    hasAnyPermission,
    refreshUser,
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
