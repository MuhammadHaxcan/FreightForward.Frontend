import { useState, FormEvent, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Loader2, Ship, Eye, EyeOff } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { authApi } from '../services/api/auth';
import loginBg from '../assets/login-bg.png';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [forgotUsername, setForgotUsername] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [isForgotSubmitting, setIsForgotSubmitting] = useState(false);

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

  const handleForgotPasswordOpen = () => {
    setForgotUsername('');
    setForgotError('');
    setForgotSuccess(false);
    setIsForgotPasswordOpen(true);
  };

  const handleForgotPasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setIsForgotSubmitting(true);

    const trimmed = forgotUsername.trim();
    if (!trimmed) {
      setForgotError('Please enter your username.');
      setIsForgotSubmitting(false);
      return;
    }

    const result = await authApi.requestPasswordReset(trimmed);
    if (result.error) {
      setForgotError('This user is not registered in the system.');
    } else {
      setForgotSuccess(true);
    }
    setIsForgotSubmitting(false);
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
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
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
        <CardFooter className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={handleForgotPasswordOpen}
            className="text-sm text-muted-foreground hover:text-primary hover:underline"
          >
            Forgot Password?
          </button>
          <Link
            to="/system/login"
            className="text-sm text-muted-foreground hover:text-primary hover:underline"
          >
            System Administrator Login
          </Link>
        </CardFooter>
      </Card>

      <Dialog open={isForgotPasswordOpen} onOpenChange={setIsForgotPasswordOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Forgot Password</DialogTitle>
            <DialogDescription>
              Enter your username to request a password reset from your system administrator.
            </DialogDescription>
          </DialogHeader>

          {forgotSuccess ? (
            <div className="py-4 text-center text-sm text-green-700">
              Request submitted. Contact your admin to get your new password.
            </div>
          ) : (
            <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
              {forgotError && (
                <Alert variant="destructive">
                  <AlertDescription>{forgotError}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="forgot-username">Username</Label>
                <Input
                  id="forgot-username"
                  type="text"
                  placeholder="office/username"
                  value={forgotUsername}
                  onChange={(e) => setForgotUsername(e.target.value)}
                  autoComplete="username"
                />
                <p className="text-xs text-muted-foreground">
                  Format: office/username (e.g., dubai/admin)
                </p>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsForgotPasswordOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isForgotSubmitting}>
                  {isForgotSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Request'
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
