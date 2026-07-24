import { useState, FormEvent, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../../components/ui/card';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Loader2, Shield } from 'lucide-react';
import loginBg from '../../assets/login-bg.png';
import { systemAdminAuthApi } from '../../services/api/systemAdmin';
import { getAccessToken } from '../../services/api/base';
import { BRAND } from '../../config/branding';

export default function SystemLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();

  // Check if already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const token = getAccessToken();
      if (token) {
        const result = await systemAdminAuthApi.getCurrentAdmin();
        if (result.data) {
          setIsAuthenticated(true);
          navigate('/system/offices', { replace: true });
        }
      }
      setIsLoading(false);
    };
    checkAuth();
  }, [navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const result = await systemAdminAuthApi.login({ email, password });

    if (result.error) {
      setError(result.error);
      setIsSubmitting(false);
    } else {
      setIsAuthenticated(true);
      navigate('/system/offices', { replace: true });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${loginBg})`, backgroundColor: '#d5e3ed' }}>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
        <div className="h-1.5 bg-gradient-to-r from-[#052E26] via-[#00C889] to-[#6FE6B2]" />
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <div className="relative">
              <img
                src={BRAND.assets.iconTransparent}
                alt={`${BRAND.productName} logo`}
                className="h-20 w-20 object-contain"
              />
              <div className="absolute -bottom-1 -right-1 rounded-full bg-primary p-1.5">
                <Shield className="h-4 w-4 text-primary-foreground" />
              </div>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">{BRAND.productName} System Admin</CardTitle>
          <CardDescription>
            Sign in to manage offices and system settings
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
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@system.local"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
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
                onKeyDown={(e) => setCapsLockOn(e.getModifierState("CapsLock"))}
                onKeyUp={(e) => setCapsLockOn(e.getModifierState("CapsLock"))}
              />
              {capsLockOn && (
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  ⇪ Caps Lock is on
                </p>
              )}
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
            to="/login"
            className="text-sm text-muted-foreground hover:text-primary hover:underline"
          >
            Office User Login
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
