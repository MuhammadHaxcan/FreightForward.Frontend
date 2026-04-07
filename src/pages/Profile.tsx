import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/services/api/auth';
import { hrAttendanceApi, hrPayrollApi, type Payslip } from '@/services/api/hr';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Camera, User, Mail, Phone, Building2, KeyRound } from 'lucide-react';
import { toast } from 'sonner';

const monthOptions = [
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

const statusColors: Record<string, string> = {
  Present: 'bg-green-500',
  Absent: 'bg-red-500',
  Late: 'bg-yellow-500',
  HalfDay: 'bg-orange-500',
  SickLeave: 'bg-teal-500',
  PaidLeave: 'bg-blue-500',
  AnnualLeave: 'bg-cyan-500',
  Holiday: 'bg-purple-500',
};

const statusLabels: Record<string, string> = {
  Present: 'Present',
  Absent: 'Absent',
  Late: 'Late',
  HalfDay: 'Half Day',
  SickLeave: 'Sick Leave',
  PaidLeave: 'Paid Leave',
  AnnualLeave: 'Annual Leave',
  Holiday: 'Holiday',
};

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const payrollStatusColors: Record<string, string> = {
  Draft: 'bg-gray-200 text-gray-700',
  Paid: 'bg-green-100 text-green-700',
  Cancelled: 'bg-red-100 text-red-700',
  Processed: 'bg-blue-100 text-blue-700',
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [contactNumber, setContactNumber] = useState(user?.contactNumber || '');
  const [profilePictureUrl, setProfilePictureUrl] = useState(user?.profilePictureUrl || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const currentDate = new Date();
  const [attendYear, setAttendYear] = useState(currentDate.getFullYear().toString());
  const [attendMonth, setAttendMonth] = useState((currentDate.getMonth() + 1).toString());

  const [payslipDialogOpen, setPayslipDialogOpen] = useState(false);
  const [selectedPayrollId, setSelectedPayrollId] = useState<number | null>(null);

  const yearOptions = Array.from({ length: 5 }, (_, i) => {
    const y = currentDate.getFullYear() - 2 + i;
    return { value: y.toString(), label: y.toString() };
  });

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName);
      setLastName(user.lastName);
      setContactNumber(user.contactNumber || '');
      setProfilePictureUrl(user.profilePictureUrl || '');
    }
  }, [user]);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be less than 2MB');
      return;
    }

    setIsProcessing(true);
    try {
      const base64 = await convertToBase64(file);
      setProfilePictureUrl(base64);
      toast.success('Image selected. Click Save to update your profile.');
    } catch {
      toast.error('Failed to process image');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim()) {
      toast.error('First name and last name are required');
      return;
    }

    setIsSubmitting(true);

    const result = await authApi.updateProfile({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      contactNumber: contactNumber.trim() || undefined,
      profilePictureUrl: profilePictureUrl || undefined,
    });

    if (result.error) {
      toast.error(result.error);
      setIsSubmitting(false);
      return;
    }

    await refreshUser();
    toast.success('Profile updated successfully');
    setIsSubmitting(false);
  };

  const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase();
  const employeeId = user?.linkedEmployeeId;

  // Attendance query
  const { data: attendanceData, isLoading: attendanceLoading } = useQuery({
    queryKey: ['profile-attendance', employeeId, attendYear, attendMonth],
    queryFn: async () => {
      const result = await hrAttendanceApi.getEmployeeMonthly(
        employeeId!,
        parseInt(attendYear),
        parseInt(attendMonth)
      );
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    enabled: !!employeeId,
  });

  // Payroll query
  const { data: payrollData, isLoading: payrollLoading } = useQuery({
    queryKey: ['profile-payroll', employeeId],
    queryFn: async () => {
      const result = await hrPayrollApi.getAll({ employeeId: employeeId!, pageSize: 100 });
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    enabled: !!employeeId,
  });

  // Payslip query (fetched on demand when dialog opens)
  const { data: payslipData, isLoading: payslipLoading } = useQuery({
    queryKey: ['profile-payslip', selectedPayrollId],
    queryFn: async () => {
      const result = await hrPayrollApi.getPayslip(selectedPayrollId!);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    enabled: !!selectedPayrollId,
  });

  const attendanceRecords = attendanceData?.records || [];
  const payrollItems = payrollData?.items || [];

  const noEmployeeMessage = (
    <div className="text-center py-12 text-muted-foreground">
      No employee record is linked to your account.
    </div>
  );

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto py-8 px-4">
        <Tabs defaultValue="profile">
          <TabsList className="mb-6">
            <TabsTrigger
              value="profile"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6 py-2.5"
            >
              Profile
            </TabsTrigger>
            <TabsTrigger
              value="attendance"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6 py-2.5"
            >
              Attendance Summary
            </TabsTrigger>
            <TabsTrigger
              value="payroll"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6 py-2.5"
            >
              Payroll
            </TabsTrigger>
          </TabsList>

          {/* ── Profile Tab ── */}
          <TabsContent value="profile">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">My Profile</CardTitle>
                <CardDescription>
                  Update your personal information and profile picture
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Profile Picture */}
                  <div className="flex flex-col items-center space-y-4">
                    <div className="relative">
                      <Avatar className="h-24 w-24 cursor-pointer" onClick={handleImageClick}>
                        <AvatarImage src={profilePictureUrl} alt={user?.fullName} />
                        <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <button
                        type="button"
                        onClick={handleImageClick}
                        disabled={isProcessing}
                        className="absolute bottom-0 right-0 p-1.5 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50"
                      >
                        {isProcessing ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Camera className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <p className="text-sm text-muted-foreground">
                      Click to upload a new profile picture (max 2MB)
                    </p>
                  </div>

                  {/* Name Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        First Name
                      </Label>
                      <Input
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Enter first name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Last Name
                      </Label>
                      <Input
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Enter last name"
                        required
                      />
                    </div>
                  </div>

                  {/* Email (read-only) */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </Label>
                    <Input
                      id="email"
                      value={user?.email || ''}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">
                      Email cannot be changed. Contact an administrator if you need to update it.
                    </p>
                  </div>

                  {/* Contact Number */}
                  <div className="space-y-2">
                    <Label htmlFor="contactNumber" className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Contact Number
                    </Label>
                    <Input
                      id="contactNumber"
                      value={contactNumber}
                      onChange={(e) => setContactNumber(e.target.value)}
                      placeholder="Enter contact number"
                    />
                  </div>

                  {/* Company (read-only) */}
                  {user?.companyName && (
                    <div className="space-y-2">
                      <Label htmlFor="company" className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Company
                      </Label>
                      <Input
                        id="company"
                        value={user.companyName}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-3 pt-4">
                    <Button type="submit" disabled={isSubmitting || isProcessing} className="w-full">
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate('/change-password')}
                      className="w-full"
                    >
                      <KeyRound className="mr-2 h-4 w-4" />
                      Change Password
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Attendance Summary Tab ── */}
          <TabsContent value="attendance">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Attendance Summary</CardTitle>
                <CardDescription>Your monthly attendance records</CardDescription>
              </CardHeader>
              <CardContent>
                {!employeeId ? noEmployeeMessage : (
                  <>
                    {/* Filters */}
                    <div className="flex gap-3 mb-4">
                      <Select value={attendMonth} onValueChange={setAttendMonth}>
                        <SelectTrigger className="w-36">
                          <SelectValue placeholder="Month" />
                        </SelectTrigger>
                        <SelectContent>
                          {monthOptions.map((m) => (
                            <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={attendYear} onValueChange={setAttendYear}>
                        <SelectTrigger className="w-28">
                          <SelectValue placeholder="Year" />
                        </SelectTrigger>
                        <SelectContent>
                          {yearOptions.map((y) => (
                            <SelectItem key={y.value} value={y.value}>{y.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {attendanceLoading ? (
                      <div className="flex justify-center py-10">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : attendanceRecords.length === 0 ? (
                      <div className="text-center py-10 text-muted-foreground">
                        No attendance records found for this period.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b bg-muted/50">
                              <th className="text-left px-3 py-2 font-medium">Date</th>
                              <th className="text-left px-3 py-2 font-medium">Day</th>
                              <th className="text-left px-3 py-2 font-medium">Status</th>
                              <th className="text-left px-3 py-2 font-medium">Remarks</th>
                            </tr>
                          </thead>
                          <tbody>
                            {attendanceRecords.map((record, idx) => {
                              const date = new Date(record.date);
                              const dayName = dayNames[date.getDay()];
                              const colorClass = statusColors[record.status] || 'bg-gray-400';
                              const label = statusLabels[record.status] || record.status;
                              return (
                                <tr
                                  key={record.id}
                                  className={idx % 2 === 0 ? 'bg-background' : 'bg-muted/30'}
                                >
                                  <td className="px-3 py-2">{record.date}</td>
                                  <td className="px-3 py-2">{dayName}</td>
                                  <td className="px-3 py-2">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-white text-xs font-medium ${colorClass}`}>
                                      {label}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2 text-muted-foreground">{record.remarks || '—'}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Payroll Tab ── */}
          <TabsContent value="payroll">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Payroll</CardTitle>
                <CardDescription>Your monthly salary records</CardDescription>
              </CardHeader>
              <CardContent>
                {!employeeId ? noEmployeeMessage : (
                  <>
                    {payrollLoading ? (
                      <div className="flex justify-center py-10">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : payrollItems.length === 0 ? (
                      <div className="text-center py-10 text-muted-foreground">
                        No payroll records found.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b bg-muted/50">
                              <th className="text-left px-3 py-2 font-medium">Month / Year</th>
                              <th className="text-right px-3 py-2 font-medium">Earnings</th>
                              <th className="text-right px-3 py-2 font-medium">Deductions</th>
                              <th className="text-right px-3 py-2 font-medium">Net Salary</th>
                              <th className="text-left px-3 py-2 font-medium">Status</th>
                              <th className="px-3 py-2"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {payrollItems.map((item, idx) => {
                              const monthLabel = monthOptions.find((m) => parseInt(m.value) === item.month)?.label || item.month;
                              const statusClass = payrollStatusColors[item.status] || 'bg-gray-100 text-gray-600';
                              return (
                                <tr
                                  key={item.id}
                                  className={idx % 2 === 0 ? 'bg-background' : 'bg-muted/30'}
                                >
                                  <td className="px-3 py-2">{monthLabel} {item.year}</td>
                                  <td className="px-3 py-2 text-right">{formatCurrency(item.totalEarnings)}</td>
                                  <td className="px-3 py-2 text-right">{formatCurrency(item.totalDeductions)}</td>
                                  <td className="px-3 py-2 text-right font-medium">{formatCurrency(item.netSalary)}</td>
                                  <td className="px-3 py-2">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusClass}`}>
                                      {item.status}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setSelectedPayrollId(item.id);
                                        setPayslipDialogOpen(true);
                                      }}
                                    >
                                      View
                                    </Button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* ── Payslip Dialog ── */}
      <Dialog open={payslipDialogOpen} onOpenChange={(open) => { setPayslipDialogOpen(open); if (!open) setSelectedPayrollId(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Salary Breakdown</DialogTitle>
          </DialogHeader>
          {payslipLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : payslipData ? (
            <PayslipBreakdown payslip={payslipData} />
          ) : null}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}

function PayslipBreakdown({ payslip }: { payslip: Payslip }) {
  const monthLabel = monthOptions.find((m) => parseInt(m.value) === payslip.month)?.label || payslip.month;
  const statusClass = payrollStatusColors[payslip.status] || 'bg-gray-100 text-gray-600';

  return (
    <div className="space-y-4 text-sm">
      {/* Header info */}
      <div className="flex items-center justify-between border-b pb-3">
        <div>
          <p className="font-semibold text-base">{payslip.employeeName}</p>
          <p className="text-muted-foreground">{monthLabel} {payslip.year}</p>
          {(payslip.department || payslip.designation) && (
            <p className="text-muted-foreground text-xs">{[payslip.designation, payslip.department].filter(Boolean).join(' · ')}</p>
          )}
        </div>
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusClass}`}>
          {payslip.status}
        </span>
      </div>

      {/* Earnings & Deductions */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="font-semibold mb-2 text-green-700">Earnings</p>
          <div className="space-y-1">
            {payslip.earnings.map((e, i) => (
              <div key={i} className="flex justify-between">
                <span className="text-muted-foreground">{e.componentName}</span>
                <span>{formatCurrency(e.amount)}</span>
              </div>
            ))}
            {payslip.earnings.length === 0 && <p className="text-muted-foreground text-xs">None</p>}
          </div>
        </div>
        <div>
          <p className="font-semibold mb-2 text-red-700">Deductions</p>
          <div className="space-y-1">
            {payslip.deductions.map((d, i) => (
              <div key={i} className="flex justify-between">
                <span className="text-muted-foreground">{d.componentName}</span>
                <span>{formatCurrency(d.amount)}</span>
              </div>
            ))}
            {payslip.advanceDeduction > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Advance Deduction</span>
                <span>{formatCurrency(payslip.advanceDeduction)}</span>
              </div>
            )}
            {payslip.deductions.length === 0 && payslip.advanceDeduction === 0 && (
              <p className="text-muted-foreground text-xs">None</p>
            )}
          </div>
        </div>
      </div>

      {/* Totals */}
      <div className="border-t pt-3 space-y-1">
        <div className="flex justify-between text-muted-foreground">
          <span>Total Earnings</span>
          <span>{formatCurrency(payslip.totalEarnings)}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Total Deductions</span>
          <span>{formatCurrency(payslip.totalDeductions)}</span>
        </div>
        <div className="flex justify-between font-semibold text-base border-t pt-2 mt-1">
          <span>Net Salary</span>
          <span>{formatCurrency(payslip.netSalary)}</span>
        </div>
      </div>

      {payslip.remarks && (
        <p className="text-xs text-muted-foreground border-t pt-2">Remarks: {payslip.remarks}</p>
      )}
    </div>
  );
}
