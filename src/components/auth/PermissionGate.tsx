import { ReactNode } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface PermissionGateProps {
  children: ReactNode;
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  fallback?: ReactNode;
}

export function PermissionGate({
  children,
  permission,
  permissions,
  requireAll = false,
  fallback = null,
}: PermissionGateProps) {
  const { hasPermission, hasAnyPermission } = useAuth();

  // Check single permission
  if (permission) {
    if (!hasPermission(permission)) {
      return <>{fallback}</>;
    }
  }

  // Check multiple permissions
  if (permissions && permissions.length > 0) {
    const hasRequired = requireAll
      ? permissions.every(p => hasPermission(p))
      : hasAnyPermission(...permissions);

    if (!hasRequired) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
}
