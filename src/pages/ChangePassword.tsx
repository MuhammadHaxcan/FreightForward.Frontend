import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../services/api/auth';
import { settingsApi } from '../services/api/settings';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Loader2, KeyRound, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [baseCurrencyId, setBaseCurrencyId] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();

  const needsCurrencySetup = user?.forcePasswordChange === true && user?.baseCurrencySet === false;

  const { data: currencies, isLoading: currenciesLoading } = useQuery({
    queryKey: ['allCurrencyTypes'],
    queryFn: async () => {
      const result = await settingsApi.getAllCurrencyTypes();
      return result.data || [];
    },
    enabled: needsCurrencySetup,
  });

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number';
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return 'Password must contain at least one special character';
    }
    return null;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (currentPassword === newPassword) {
      setError('New password must be different from current password');
      return;
    }

    if (needsCurrencySetup && !baseCurrencyId) {
      setError('Please select a base currency');
      return;
    }

    setIsSubmitting(true);

    const result = await authApi.changePassword({
      currentPassword,
      newPassword,
      ...(needsCurrencySetup && baseCurrencyId ? { baseCurrencyId: parseInt(baseCurrencyId) } : {}),
    });

    if (result.error) {
      setError(result.error);
      setIsSubmitting(false);
      return;
    }

    toast.success(needsCurrencySetup ? 'Initial setup completed successfully' : 'Password changed successfully');

    // Refresh user to update forcePasswordChange flag
    await refreshUser();

    // Navigate to dashboard
    navigate('/', { replace: true });
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <div className="rounded-full bg-amber-500 p-3">
              <KeyRound className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            {needsCurrencySetup ? 'Initial Setup' : 'Change Password'}
          </CardTitle>
          <CardDescription>
            {needsCurrencySetup
              ? 'Set your password and base currency to get started'
              : user?.forcePasswordChange
                ? 'You must change your password before continuing'
                : 'Update your account password'}
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
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? 'text' : 'password'}
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  autoFocus
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  aria-label={showCurrentPassword ? "Hide current password" : "Show current password"}
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  aria-label={showNewPassword ? "Hide new password" : "Show new password"}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="text-xs text-gray-500 space-y-1">
              <p>Password requirements:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>At least 8 characters</li>
                <li>One uppercase letter</li>
                <li>One lowercase letter</li>
                <li>One number</li>
                <li>One special character (!@#$%^&*)</li>
              </ul>
            </div>

            {needsCurrencySetup && (
              <div className="space-y-2">
                <Label>Base Currency (LCY)</Label>
                <SearchableSelect
                  options={(currencies || []).map((c) => ({ value: c.id.toString(), label: `${c.code} - ${c.name}` }))}
                  value={baseCurrencyId}
                  onValueChange={(val) => setBaseCurrencyId(val)}
                  placeholder={currenciesLoading ? "Loading..." : "Select Base Currency"}
                  searchPlaceholder="Search currencies..."
                  emptyMessage={currenciesLoading ? "Loading..." : "No currencies found"}
                />
                <div className="flex items-start gap-2 rounded-md bg-amber-50 border border-amber-200 p-2.5">
                  <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-700">
                    This cannot be changed later. Choose carefully.
                  </p>
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {needsCurrencySetup ? 'Completing Setup...' : 'Changing Password...'}
                </>
              ) : (
                needsCurrencySetup ? 'Complete Setup' : 'Change Password'
              )}
            </Button>

            {user?.forcePasswordChange && (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleLogout}
              >
                Logout Instead
              </Button>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
