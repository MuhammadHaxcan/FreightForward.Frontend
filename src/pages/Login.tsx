import { useState, FormEvent, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Loader2, Ship } from 'lucide-react';
import loginBg from '../assets/login-bg.png';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, isAuthenticated, isLoading, getDefaultRoute } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      const from = location.state?.from?.pathname;
      const defaultRoute = getDefaultRoute();
      navigate(from || defaultRoute, { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, location, getDefaultRoute]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmed = username.trim();
    const slashIndex = trimmed.indexOf('/');

    if (slashIndex <= 0 || slashIndex === trimmed.length - 1) {
      setError('Username must be in format: office/username (e.g., dubai/admin)');
      return;
    }

    setIsSubmitting(true);

    // Convert "office/user" to "office|user" for the backend
    const officeSlug = trimmed.substring(0, slashIndex).toLowerCase();
    const user = trimmed.substring(slashIndex + 1);
    const fullUsername = `${officeSlug}|${user}`;

    const result = await login({ username: fullUsername, password });

    if (!result.success) {
      setError(result.error || 'Login failed');
      setIsSubmitting(false);
    } else if (result.forcePasswordChange) {
      navigate('/change-password', { replace: true });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${loginBg})`, backgroundColor: '#d5e3ed' }}>
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center p-4 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${loginBg})`, backgroundColor: '#d5e3ed' }}
    >
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <div className="rounded-full bg-blue-600 p-3">
              <Ship className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
          <CardDescription>
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="office/username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Format: office/username (e.g., dubai/admin)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link
            to="/system/login"
            className="text-sm text-muted-foreground hover:text-primary hover:underline"
          >
            System Administrator Login
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
