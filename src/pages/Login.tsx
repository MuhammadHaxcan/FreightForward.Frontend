import { useState, FormEvent, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Loader2, Ship, Building2, ArrowLeft } from 'lucide-react';
import loginBg from '../assets/login-bg.png';

type LoginStep = 'office' | 'credentials';

export default function Login() {
  const [step, setStep] = useState<LoginStep>('office');
  const [officeSlug, setOfficeSlug] = useState('');
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

  const handleOfficeSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!officeSlug.trim()) {
      setError('Please enter your office code');
      return;
    }

    setStep('credentials');
  };

  const handleCredentialsSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    // Format: "officeSlug|username"
    const fullUsername = `${officeSlug.toLowerCase().trim()}|${username.trim()}`;

    const result = await login({ username: fullUsername, password });

    if (!result.success) {
      setError(result.error || 'Login failed');
      setIsSubmitting(false);
    } else if (result.forcePasswordChange) {
      navigate('/change-password', { replace: true });
    }
  };

  const goBackToOffice = () => {
    setStep('office');
    setUsername('');
    setPassword('');
    setError('');
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
          <CardTitle className="text-2xl font-bold">
            {step === 'office' ? 'Select Your Office' : 'Sign In'}
          </CardTitle>
          <CardDescription>
            {step === 'office'
              ? 'Enter your office code to continue'
              : `Signing in to ${officeSlug.toUpperCase()}`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'office' ? (
            <form onSubmit={handleOfficeSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="office">Office Code</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="office"
                    type="text"
                    placeholder="e.g., dubai, karachi"
                    value={officeSlug}
                    onChange={(e) => setOfficeSlug(e.target.value.toLowerCase())}
                    required
                    autoFocus
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter the office code provided by your administrator
                </p>
              </div>

              <Button type="submit" className="w-full">
                Continue
              </Button>
            </form>
          ) : (
            <form onSubmit={handleCredentialsSubmit} className="space-y-4">
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
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                  autoFocus
                />
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

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={goBackToOffice}
                  className="flex-1"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
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
              </div>
            </form>
          )}
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
