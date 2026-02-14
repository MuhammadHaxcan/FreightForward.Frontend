import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { officesApi } from '../../services/api/systemAdmin';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import { Loader2, Plus, Building2, Power, PowerOff, Trash2, Copy, Check, Database, CheckCircle2, AlertCircle, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import type { CreateOfficeRequest, UpdateOfficeRequest, OfficeCreatedResponse, OfficeListItem, MigrationsInfo } from '../../types/auth';
import SystemLayout from '../../components/system/SystemLayout';

export default function OfficesList() {
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createdOffice, setCreatedOffice] = useState<OfficeCreatedResponse | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Edit dialog state
  const [editingOffice, setEditingOffice] = useState<OfficeListItem | null>(null);
  const [editFormData, setEditFormData] = useState<UpdateOfficeRequest>({
    name: '',
    location: '',
    phone: '',
    email: '',
    jobPrefix: 'JAE',
    invoicePrefix: 'INVAE',
    purchaseInvoicePrefix: 'PVAE',
    receiptVoucherPrefix: 'RVAE',
    paymentVoucherPrefix: 'PVAE',
    creditNotePrefix: 'CNAE',
  });
  const [editFormError, setEditFormError] = useState('');

  // Migrations dialog state
  const [migrationsDialogOffice, setMigrationsDialogOffice] = useState<OfficeListItem | null>(null);
  const [migrationsInfo, setMigrationsInfo] = useState<MigrationsInfo | null>(null);
  const [migrationsLoading, setMigrationsLoading] = useState(false);
  const [migrationsError, setMigrationsError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateOfficeRequest>({
    name: '',
    slug: '',
    location: '',
    phone: '',
    email: '',
    jobPrefix: 'JAE',
    invoicePrefix: 'INVAE',
    purchaseInvoicePrefix: 'PVAE',
    receiptVoucherPrefix: 'RVAE',
    paymentVoucherPrefix: 'PVAE',
    creditNotePrefix: 'CNAE',
  });
  const [formError, setFormError] = useState('');

  const { data: offices, isLoading } = useQuery({
    queryKey: ['offices'],
    queryFn: async () => {
      const result = await officesApi.getAll();
      if (result.error) throw new Error(result.error);
      return result.data;
    },
  });

  const createOfficeMutation = useMutation({
    mutationFn: async (data: CreateOfficeRequest) => {
      const result = await officesApi.create(data);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['offices'] });
      setCreatedOffice(data!);
      setFormData({ name: '', slug: '', location: '', phone: '', email: '', jobPrefix: 'JAE', invoicePrefix: 'INVAE', purchaseInvoicePrefix: 'PVAE', receiptVoucherPrefix: 'RVAE', paymentVoucherPrefix: 'PVAE', creditNotePrefix: 'CNAE' });
    },
    onError: (error: Error) => {
      setFormError(error.message);
    },
  });

  const activateMutation = useMutation({
    mutationFn: officesApi.activate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offices'] });
      toast.success('Office activated');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: officesApi.deactivate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offices'] });
      toast.success('Office deactivated');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: officesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offices'] });
      toast.success('Office deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const applyMigrationsMutation = useMutation({
    mutationFn: officesApi.applyMigrations,
    onSuccess: () => {
      toast.success('Migrations applied successfully');
      setMigrationsDialogOffice(null);
      setMigrationsInfo(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to apply migrations');
    },
  });

  const updateOfficeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateOfficeRequest }) => {
      const result = await officesApi.update(id, data);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offices'] });
      toast.success('Office updated successfully');
      setEditingOffice(null);
    },
    onError: (error: Error) => {
      setEditFormError(error.message);
    },
  });

  const openEditDialog = async (office: OfficeListItem) => {
    setEditFormError('');
    // Fetch full office details to get phone/email
    const result = await officesApi.getById(office.id);
    if (result.error || !result.data) {
      toast.error(result.error || 'Failed to load office details');
      return;
    }
    const full = result.data;
    setEditFormData({
      name: full.name,
      location: full.location || '',
      phone: full.phone || '',
      email: full.email || '',
      jobPrefix: full.jobPrefix,
      invoicePrefix: full.invoicePrefix,
      purchaseInvoicePrefix: full.purchaseInvoicePrefix,
      receiptVoucherPrefix: full.receiptVoucherPrefix,
      paymentVoucherPrefix: full.paymentVoucherPrefix,
      creditNotePrefix: full.creditNotePrefix,
    });
    setEditingOffice(office);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEditFormError('');
    if (editingOffice) {
      updateOfficeMutation.mutate({ id: editingOffice.id, data: editFormData });
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    createOfficeMutation.mutate(formData);
  };

  const handleSlugChange = (value: string) => {
    const formatted = value.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    setFormData({ ...formData, slug: formatted });
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const closeCreatedDialog = () => {
    setCreatedOffice(null);
    setIsCreateDialogOpen(false);
  };

  const openMigrationsDialog = async (office: OfficeListItem) => {
    setMigrationsDialogOffice(office);
    setMigrationsInfo(null);
    setMigrationsError(null);
    setMigrationsLoading(true);

    const result = await officesApi.getMigrations(office.id);
    setMigrationsLoading(false);

    if (result.error) {
      setMigrationsError(result.error);
    } else if (result.data) {
      setMigrationsInfo(result.data);
    }
  };

  const closeMigrationsDialog = () => {
    setMigrationsDialogOffice(null);
    setMigrationsInfo(null);
    setMigrationsError(null);
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
            <h1 className="text-3xl font-bold">Offices</h1>
            <p className="text-muted-foreground">Manage sub-offices and branches</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Office
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] p-0 bg-card">
              {createdOffice ? (
                <>
                  <DialogHeader className="bg-modal-header text-white p-4 rounded-t-lg">
                    <DialogTitle className="text-white flex items-center gap-2">
                      <Check className="h-5 w-5" />
                      Office Created Successfully
                    </DialogTitle>
                    <DialogDescription className="text-white/70">
                      Save these credentials - the password cannot be retrieved later
                    </DialogDescription>
                  </DialogHeader>
                  <div className="p-6 space-y-4">
                    <Alert>
                      <AlertTitle>Office Details</AlertTitle>
                      <AlertDescription className="mt-2 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Name:</span>
                          <span>{createdOffice.office.name}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Slug:</span>
                          <span className="font-mono">{createdOffice.office.slug}</span>
                        </div>
                      </AlertDescription>
                    </Alert>
                    <Alert className="border-amber-500 bg-amber-50">
                      <AlertTitle className="text-amber-700">Admin Credentials</AlertTitle>
                      <AlertDescription className="mt-2 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Username:</span>
                          <div className="flex items-center gap-2">
                            <code className="bg-white px-2 py-1 rounded border">
                              {createdOffice.adminCredentials.username}
                            </code>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(createdOffice.adminCredentials.username, 'username')}
                            >
                              {copiedField === 'username' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Password:</span>
                          <div className="flex items-center gap-2">
                            <code className="bg-white px-2 py-1 rounded border">
                              {createdOffice.adminCredentials.password}
                            </code>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(createdOffice.adminCredentials.password, 'password')}
                            >
                              {copiedField === 'password' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Login as:</span>
                          <div className="flex items-center gap-2">
                            <code className="bg-white px-2 py-1 rounded border">
                              {createdOffice.office.slug}|{createdOffice.adminCredentials.username}
                            </code>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(`${createdOffice.office.slug}|${createdOffice.adminCredentials.username}`, 'login')}
                            >
                              {copiedField === 'login' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  </div>
                  <div className="px-6 pb-6">
                    <DialogFooter>
                      <Button onClick={closeCreatedDialog}>Done</Button>
                    </DialogFooter>
                  </div>
                </>
              ) : (
                <>
                  <DialogHeader className="bg-modal-header text-white p-4 rounded-t-lg">
                    <DialogTitle className="text-white">Create New Office</DialogTitle>
                    <DialogDescription className="text-white/70">
                      Create a new office with its own isolated data
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateSubmit}>
                    <div className="p-6 space-y-4">
                      {formError && (
                        <Alert variant="destructive">
                          <AlertDescription>{formError}</AlertDescription>
                        </Alert>
                      )}
                      <div className="space-y-2">
                        <Label htmlFor="name">Office Name</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Dubai Office"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="slug">Office Code (Slug)</Label>
                        <Input
                          id="slug"
                          value={formData.slug}
                          onChange={(e) => handleSlugChange(e.target.value)}
                          placeholder="dubai"
                          required
                          maxLength={50}
                        />
                        <p className="text-xs text-muted-foreground">
                          Lowercase letters, numbers, and underscores only. Used for login.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="location">Location (Optional)</Label>
                        <Input
                          id="location"
                          value={formData.location || ''}
                          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                          placeholder="Business Bay, Dubai"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone (Optional)</Label>
                          <Input
                            id="phone"
                            value={formData.phone || ''}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="+971 4 123 4567"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email (Optional)</Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email || ''}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="dubai@company.com"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">Document Prefixes</Label>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label htmlFor="jobPrefix" className="text-xs text-muted-foreground">Job Prefix</Label>
                            <Input id="jobPrefix" value={formData.jobPrefix} onChange={(e) => setFormData({ ...formData, jobPrefix: e.target.value })} placeholder="JAE" />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="invoicePrefix" className="text-xs text-muted-foreground">Invoice Prefix</Label>
                            <Input id="invoicePrefix" value={formData.invoicePrefix} onChange={(e) => setFormData({ ...formData, invoicePrefix: e.target.value })} placeholder="INVAE" />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="purchaseInvoicePrefix" className="text-xs text-muted-foreground">Purchase Invoice Prefix</Label>
                            <Input id="purchaseInvoicePrefix" value={formData.purchaseInvoicePrefix} onChange={(e) => setFormData({ ...formData, purchaseInvoicePrefix: e.target.value })} placeholder="PVAE" />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="receiptVoucherPrefix" className="text-xs text-muted-foreground">Receipt Voucher Prefix</Label>
                            <Input id="receiptVoucherPrefix" value={formData.receiptVoucherPrefix} onChange={(e) => setFormData({ ...formData, receiptVoucherPrefix: e.target.value })} placeholder="RVAE" />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="paymentVoucherPrefix" className="text-xs text-muted-foreground">Payment Voucher Prefix</Label>
                            <Input id="paymentVoucherPrefix" value={formData.paymentVoucherPrefix} onChange={(e) => setFormData({ ...formData, paymentVoucherPrefix: e.target.value })} placeholder="PVAE" />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="creditNotePrefix" className="text-xs text-muted-foreground">Credit Note Prefix</Label>
                            <Input id="creditNotePrefix" value={formData.creditNotePrefix} onChange={(e) => setFormData({ ...formData, creditNotePrefix: e.target.value })} placeholder="CNAE" />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="px-6 pb-6">
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={createOfficeMutation.isPending}>
                          {createOfficeMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            'Create Office'
                          )}
                        </Button>
                      </DialogFooter>
                    </div>
                  </form>
                </>
              )}
            </DialogContent>
          </Dialog>
        </div>

        {/* Migrations Dialog */}
        <Dialog open={!!migrationsDialogOffice} onOpenChange={(open) => !open && closeMigrationsDialog()}>
          <DialogContent className="sm:max-w-[600px] p-0 bg-card">
            <DialogHeader className="bg-modal-header text-white p-4 rounded-t-lg">
              <DialogTitle className="text-white flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database Migrations - {migrationsDialogOffice?.name}
              </DialogTitle>
              <DialogDescription className="text-white/70">
                View and apply database schema updates for this office
              </DialogDescription>
            </DialogHeader>

            <div className="p-6">
              {migrationsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : migrationsError ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{migrationsError}</AlertDescription>
                </Alert>
              ) : migrationsInfo ? (
                <div className="space-y-4">
                  {/* Pending Migrations */}
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      {migrationsInfo.hasPendingMigrations ? (
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      )}
                      Pending Migrations ({migrationsInfo.pendingMigrations.length})
                    </h4>
                    {migrationsInfo.pendingMigrations.length > 0 ? (
                      <div className="bg-amber-50 border border-amber-200 rounded-md p-3 max-h-[150px] overflow-y-auto">
                        <ul className="space-y-1 text-sm font-mono">
                          {migrationsInfo.pendingMigrations.map((m) => (
                            <li key={m} className="text-amber-800">{m}</li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No pending migrations. Database is up to date.</p>
                    )}
                  </div>

                  {/* Applied Migrations */}
                  <div>
                    <h4 className="font-medium mb-2">Applied Migrations ({migrationsInfo.appliedMigrations.length})</h4>
                    {migrationsInfo.appliedMigrations.length > 0 ? (
                      <div className="bg-muted rounded-md p-3 max-h-[150px] overflow-y-auto">
                        <ul className="space-y-1 text-sm font-mono text-muted-foreground">
                          {migrationsInfo.appliedMigrations.map((m) => (
                            <li key={m}>{m}</li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No migrations applied yet.</p>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="px-6 pb-6">
              <DialogFooter>
                <Button variant="outline" onClick={closeMigrationsDialog}>
                  Close
                </Button>
                {migrationsInfo?.hasPendingMigrations && (
                  <Button
                    onClick={() => migrationsDialogOffice && applyMigrationsMutation.mutate(migrationsDialogOffice.id)}
                    disabled={applyMigrationsMutation.isPending}
                  >
                    {applyMigrationsMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Applying...
                      </>
                    ) : (
                      <>
                        <Database className="mr-2 h-4 w-4" />
                        Apply {migrationsInfo.pendingMigrations.length} Migration(s)
                      </>
                    )}
                  </Button>
                )}
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Office Dialog */}
        <Dialog open={!!editingOffice} onOpenChange={(open) => !open && setEditingOffice(null)}>
          <DialogContent className="sm:max-w-[500px] p-0 bg-card">
            <DialogHeader className="bg-modal-header text-white p-4 rounded-t-lg">
              <DialogTitle className="text-white">Edit Office</DialogTitle>
              <DialogDescription className="text-white/70">
                Update office details and document prefixes
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditSubmit}>
              <div className="p-6 space-y-4">
                {editFormError && (
                  <Alert variant="destructive">
                    <AlertDescription>{editFormError}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Office Name</Label>
                  <Input
                    id="edit-name"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-location">Location (Optional)</Label>
                  <Input
                    id="edit-location"
                    value={editFormData.location || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-phone">Phone (Optional)</Label>
                    <Input
                      id="edit-phone"
                      value={editFormData.phone || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-email">Email (Optional)</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={editFormData.email || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Document Prefixes</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="edit-jobPrefix" className="text-xs text-muted-foreground">Job Prefix</Label>
                      <Input id="edit-jobPrefix" value={editFormData.jobPrefix} onChange={(e) => setEditFormData({ ...editFormData, jobPrefix: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="edit-invoicePrefix" className="text-xs text-muted-foreground">Invoice Prefix</Label>
                      <Input id="edit-invoicePrefix" value={editFormData.invoicePrefix} onChange={(e) => setEditFormData({ ...editFormData, invoicePrefix: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="edit-purchaseInvoicePrefix" className="text-xs text-muted-foreground">Purchase Invoice Prefix</Label>
                      <Input id="edit-purchaseInvoicePrefix" value={editFormData.purchaseInvoicePrefix} onChange={(e) => setEditFormData({ ...editFormData, purchaseInvoicePrefix: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="edit-receiptVoucherPrefix" className="text-xs text-muted-foreground">Receipt Voucher Prefix</Label>
                      <Input id="edit-receiptVoucherPrefix" value={editFormData.receiptVoucherPrefix} onChange={(e) => setEditFormData({ ...editFormData, receiptVoucherPrefix: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="edit-paymentVoucherPrefix" className="text-xs text-muted-foreground">Payment Voucher Prefix</Label>
                      <Input id="edit-paymentVoucherPrefix" value={editFormData.paymentVoucherPrefix} onChange={(e) => setEditFormData({ ...editFormData, paymentVoucherPrefix: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="edit-creditNotePrefix" className="text-xs text-muted-foreground">Credit Note Prefix</Label>
                      <Input id="edit-creditNotePrefix" value={editFormData.creditNotePrefix} onChange={(e) => setEditFormData({ ...editFormData, creditNotePrefix: e.target.value })} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-6 pb-6">
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setEditingOffice(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateOfficeMutation.isPending}>
                    {updateOfficeMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </DialogFooter>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              All Offices
            </CardTitle>
            <CardDescription>
              {offices?.length || 0} office(s) configured
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {offices?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No offices created yet. Click "Create Office" to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  offices?.map((office) => (
                    <TableRow key={office.id}>
                      <TableCell className="font-medium">{office.name}</TableCell>
                      <TableCell>
                        <code className="bg-muted px-2 py-1 rounded text-sm">{office.slug}</code>
                      </TableCell>
                      <TableCell>{office.location || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={office.isActive ? 'default' : 'secondary'}>
                          {office.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(office.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {office.isActive ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              title="Deactivate Office"
                              onClick={() => deactivateMutation.mutate(office.id)}
                              disabled={deactivateMutation.isPending}
                            >
                              <PowerOff className="h-4 w-4 text-amber-600" />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              title="Activate Office"
                              onClick={() => activateMutation.mutate(office.id)}
                              disabled={activateMutation.isPending}
                            >
                              <Power className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            title="Edit Office"
                            onClick={() => openEditDialog(office)}
                          >
                            <Pencil className="h-4 w-4 text-gray-600" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            title="Manage Migrations"
                            onClick={() => openMigrationsDialog(office)}
                          >
                            <Database className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            title="Delete Office"
                            onClick={() => {
                              if (confirm('Are you sure you want to permanently delete this office and ALL its data?')) {
                                deleteMutation.mutate(office.id);
                              }
                            }}
                            disabled={deleteMutation.isPending}
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
