import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { ShieldX, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Unauthorized() {
  const { getDefaultRoute, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Wait for auth to load, then redirect to first accessible route
    if (!isLoading && isAuthenticated) {
      const defaultRoute = getDefaultRoute();
      // Small delay to show the message briefly
      const timer = setTimeout(() => {
        navigate(defaultRoute, { replace: true });
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isLoading, isAuthenticated, getDefaultRoute, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-red-100 p-4">
              <ShieldX className="h-12 w-12 text-red-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Access Denied
          </CardTitle>
          <CardDescription className="text-base">
            You don't have permission to access this page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-500">
            Redirecting you to an accessible page...
          </p>
          <div className="flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
