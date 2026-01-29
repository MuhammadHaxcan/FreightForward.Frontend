import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
}

export function ProtectedRoute({
  children,
  permission,
  permissions,
  requireAll = false,
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading, hasPermission, hasAnyPermission } = useAuth();
  const location = useLocation();

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Force password change - redirect to change-password page (except if already there)
  if (user?.forcePasswordChange && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  // Check single permission
  if (permission && !hasPermission(permission)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Check multiple permissions
  if (permissions && permissions.length > 0) {
    const hasRequired = requireAll
      ? permissions.every(p => hasPermission(p))
      : hasAnyPermission(...permissions);

    if (!hasRequired) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
}
