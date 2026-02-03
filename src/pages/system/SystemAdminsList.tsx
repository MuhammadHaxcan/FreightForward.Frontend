import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { systemAdminsApi } from '../../services/api/systemAdmin';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Switch } from '../../components/ui/switch';
import { Loader2, Plus, Users, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { SystemAdminUser, CreateSystemAdminRequest, UpdateSystemAdminRequest } from '../../types/auth';
import SystemLayout from '../../components/system/SystemLayout';

export default function SystemAdminsList() {
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<SystemAdminUser | null>(null);

  const [formData, setFormData] = useState<CreateSystemAdminRequest>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });
  const [updateFormData, setUpdateFormData] = useState<UpdateSystemAdminRequest>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    isActive: true,
  });
  const [formError, setFormError] = useState('');

  const { data: admins, isLoading } = useQuery({
    queryKey: ['system-admins'],
    queryFn: async () => {
      const result = await systemAdminsApi.getAll();
      if (result.error) throw new Error(result.error);
      return result.data;
    },
  });

  const createAdminMutation = useMutation({
    mutationFn: async (data: CreateSystemAdminRequest) => {
      const result = await systemAdminsApi.create(data);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-admins'] });
      setIsCreateDialogOpen(false);
      setFormData({ firstName: '', lastName: '', email: '', password: '' });
      setFormError('');
      toast.success('Admin created successfully');
    },
    onError: (error: Error) => {
      setFormError(error.message);
    },
  });

  const updateAdminMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateSystemAdminRequest }) => {
      const result = await systemAdminsApi.update(id, data);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-admins'] });
      setEditingAdmin(null);
      setFormError('');
      toast.success('Admin updated successfully');
    },
    onError: (error: Error) => {
      setFormError(error.message);
    },
  });

  const deleteAdminMutation = useMutation({
    mutationFn: async (id: number) => {
      const result = await systemAdminsApi.delete(id);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-admins'] });
      toast.success('Admin deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    createAdminMutation.mutate(formData);
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdmin) return;
    setFormError('');
    updateAdminMutation.mutate({ id: editingAdmin.id, data: updateFormData });
  };

  const openEditDialog = (admin: SystemAdminUser) => {
    setEditingAdmin(admin);
    setUpdateFormData({
      firstName: admin.firstName,
      lastName: admin.lastName,
      email: admin.email,
      password: '',
      isActive: admin.isActive,
    });
    setFormError('');
  };

  if (isLoading) {
    return (
      <SystemLayout>
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </SystemLayout>
    );
  }

  return (
    <SystemLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">System Admins</h1>
            <p className="text-muted-foreground">Manage system administrator accounts</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Admin
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create System Admin</DialogTitle>
                <DialogDescription>
                  Add a new system administrator account
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateSubmit}>
                <div className="space-y-4 py-4">
                  {formError && (
                    <Alert variant="destructive">
                      <AlertDescription>{formError}</AlertDescription>
                    </Alert>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      minLength={6}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createAdminMutation.isPending}>
                    {createAdminMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Admin'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Edit Dialog */}
        <Dialog open={!!editingAdmin} onOpenChange={(open) => !open && setEditingAdmin(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit System Admin</DialogTitle>
              <DialogDescription>
                Update administrator account details
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateSubmit}>
              <div className="space-y-4 py-4">
                {formError && (
                  <Alert variant="destructive">
                    <AlertDescription>{formError}</AlertDescription>
                  </Alert>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="editFirstName">First Name</Label>
                    <Input
                      id="editFirstName"
                      value={updateFormData.firstName}
                      onChange={(e) => setUpdateFormData({ ...updateFormData, firstName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editLastName">Last Name</Label>
                    <Input
                      id="editLastName"
                      value={updateFormData.lastName}
                      onChange={(e) => setUpdateFormData({ ...updateFormData, lastName: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editEmail">Email</Label>
                  <Input
                    id="editEmail"
                    type="email"
                    value={updateFormData.email}
                    onChange={(e) => setUpdateFormData({ ...updateFormData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editPassword">New Password (leave blank to keep current)</Label>
                  <Input
                    id="editPassword"
                    type="password"
                    value={updateFormData.password || ''}
                    onChange={(e) => setUpdateFormData({ ...updateFormData, password: e.target.value })}
                    minLength={6}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="isActive">Active Status</Label>
                  <Switch
                    id="isActive"
                    checked={updateFormData.isActive}
                    onCheckedChange={(checked) => setUpdateFormData({ ...updateFormData, isActive: checked })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingAdmin(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateAdminMutation.isPending}>
                  {updateAdminMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              All System Admins
            </CardTitle>
            <CardDescription>
              {admins?.length || 0} administrator(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No system admins found.
                    </TableCell>
                  </TableRow>
                ) : (
                  admins?.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell className="font-medium">{admin.fullName}</TableCell>
                      <TableCell>{admin.email}</TableCell>
                      <TableCell>
                        <Badge variant={admin.isActive ? 'default' : 'secondary'}>
                          {admin.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {admin.lastLoginAt
                          ? new Date(admin.lastLoginAt).toLocaleString()
                          : 'Never'}
                      </TableCell>
                      <TableCell>{new Date(admin.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditDialog(admin)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this admin?')) {
                                deleteAdminMutation.mutate(admin.id);
                              }
                            }}
                            disabled={deleteAdminMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </SystemLayout>
  );
}
