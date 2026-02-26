import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { passwordResetApi } from '../../services/api/systemAdmin';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Loader2, KeyRound, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import type { PasswordResetRequestDto } from '../../types/auth';
import SystemLayout from '../../components/system/SystemLayout';

export default function ResetPasswordRequests() {
  const queryClient = useQueryClient();
  const [resetTarget, setResetTarget] = useState<PasswordResetRequestDto | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const { data: requests, isLoading } = useQuery({
    queryKey: ['password-reset-requests-all'],
    queryFn: async () => {
      const result = await passwordResetApi.getAllRequests();
      if (result.error) throw new Error(result.error);
      return result.data;
    },
  });

  const fulfillMutation = useMutation({
    mutationFn: ({ officeId, userId, password }: { officeId: number; userId: number; password: string }) =>
      passwordResetApi.fulfill(officeId, userId, password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['password-reset-requests-all'] });
      toast.success('Password reset successfully');
      setResetTarget(null);
      setNewPassword('');
      setPasswordError('');
    },
    onError: () => {
      toast.error('Failed to reset password');
    },
  });

  const handleOpenResetDialog = (request: PasswordResetRequestDto) => {
    setResetTarget(request);
    setNewPassword('');
    setShowNewPassword(false);
    setPasswordError('');
  };

  const handleFulfillSubmit = () => {
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }
    if (!resetTarget) return;
    fulfillMutation.mutate({ officeId: resetTarget.officeId, userId: resetTarget.id, password: newPassword });
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleString();

  return (
    <SystemLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reset Password Requests</h1>
          <p className="text-gray-500 mt-1">Pending password reset requests across all offices.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" />
              Pending Requests
            </CardTitle>
            <CardDescription>All users who have submitted a password reset request.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div className="flex items-center gap-2 text-muted-foreground py-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading requests...
              </div>
            )}

            {!isLoading && (!requests || requests.length === 0) && (
              <p className="text-sm text-muted-foreground py-4">No pending password reset requests.</p>
            )}

            {!isLoading && requests && requests.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Full Name</TableHead>
                    <TableHead>Office</TableHead>
                    <TableHead>Requested At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={`${request.officeId}-${request.id}`}>
                      <TableCell className="font-medium">{request.username}</TableCell>
                      <TableCell>{request.fullName}</TableCell>
                      <TableCell>{request.officeName}</TableCell>
                      <TableCell>{formatDate(request.passwordResetRequestedAt)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenResetDialog(request)}
                        >
                          <KeyRound className="mr-2 h-4 w-4" />
                          Reset Password
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!resetTarget} onOpenChange={(open) => { if (!open) setResetTarget(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Set a new password for <strong>{resetTarget?.fullName}</strong> ({resetTarget?.username})
              {resetTarget && <> — {resetTarget.officeName}</>}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {passwordError && (
              <Alert variant="destructive">
                <AlertDescription>{passwordError}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="Enter new password (min. 6 characters)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowNewPassword((v) => !v)}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetTarget(null)}>
              Cancel
            </Button>
            <Button onClick={handleFulfillSubmit} disabled={fulfillMutation.isPending}>
              {fulfillMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Set Password'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SystemLayout>
  );
}
