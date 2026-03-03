import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DateInput } from "@/components/ui/date-input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, Save, Plus, Loader2, Trash2 } from "lucide-react";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { formatDate, getTodayDateOnly } from "@/lib/utils";
import {
  hrEmployeeApi,
  hrSalaryApi,
  hrAttendanceApi,
  hrAdvanceApi,
  UpdateEmployeeRequest,
  SetSalaryStructureRequest,
} from "@/services/api/hr";

const employmentStatuses = [
  { value: "Active", label: "Active" },
  { value: "Probation", label: "Probation" },
  { value: "Resigned", label: "Resigned" },
  { value: "Terminated", label: "Terminated" },
];

const genderOptions = [
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
  { value: "Other", label: "Other" },
];

const HrEmployeeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const employeeId = parseInt(id || "0");
  const [activeTab, setActiveTab] = useState("profile");

  // ========== Profile Tab State ==========
  const [employeeCode, setEmployeeCode] = useState("");
  const [department, setDepartment] = useState("");
  const [designation, setDesignation] = useState("");
  const [joiningDate, setJoiningDate] = useState("");
  const [confirmationDate, setConfirmationDate] = useState("");
  const [resignationDate, setResignationDate] = useState("");
  const [lastWorkingDate, setLastWorkingDate] = useState("");
  const [employmentStatus, setEmploymentStatus] = useState("Active");
  const [gender, setGender] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [passportNumber, setPassportNumber] = useState("");
  const [passportExpiry, setPassportExpiry] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactNumber, setEmergencyContactNumber] = useState("");
  const [address, setAddress] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankIban, setBankIban] = useState("");
  const [bankBranch, setBankBranch] = useState("");
  const [profileLoaded, setProfileLoaded] = useState(false);

  // ========== Salary Tab State ==========
  const [salaryModalOpen, setSalaryModalOpen] = useState(false);
  const [salaryLines, setSalaryLines] = useState<{ salaryComponentId: string; amount: string }[]>([]);
  const [salaryEffectiveFrom, setSalaryEffectiveFrom] = useState(getTodayDateOnly());

  // ========== Fetch Employee Detail ==========
  const { data: employee, isLoading: empLoading } = useQuery({
    queryKey: ["hr-employee", employeeId],
    queryFn: async () => {
      const result = await hrEmployeeApi.getById(employeeId);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    enabled: employeeId > 0,
  });

  // Populate profile form when employee data loads
  if (employee && !profileLoaded) {
    setEmployeeCode(employee.employeeCode);
    setDepartment(employee.department || "");
    setDesignation(employee.designation || "");
    setJoiningDate(employee.joiningDate?.split("T")[0] || "");
    setConfirmationDate(employee.confirmationDate?.split("T")[0] || "");
    setResignationDate(employee.resignationDate?.split("T")[0] || "");
    setLastWorkingDate(employee.lastWorkingDate?.split("T")[0] || "");
    setEmploymentStatus(employee.employmentStatus || "Active");
    setGender(employee.gender || "");
    setDateOfBirth(employee.dateOfBirth?.split("T")[0] || "");
    setNationalId(employee.nationalId || "");
    setPassportNumber(employee.passportNumber || "");
    setPassportExpiry(employee.passportExpiry?.split("T")[0] || "");
    setEmergencyContactName(employee.emergencyContactName || "");
    setEmergencyContactNumber(employee.emergencyContactNumber || "");
    setAddress(employee.address || "");
    setBankName(employee.bankName || "");
    setBankAccountNumber(employee.bankAccountNumber || "");
    setBankIban(employee.bankIban || "");
    setBankBranch(employee.bankBranch || "");
    setProfileLoaded(true);
  }

  // ========== Salary Tab Data ==========
  const { data: salaryStructure, isLoading: salaryLoading } = useQuery({
    queryKey: ["hr-salary-structure", employeeId],
    queryFn: async () => {
      const result = await hrSalaryApi.getStructure(employeeId);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    enabled: activeTab === "salary" && employeeId > 0,
  });

  const { data: activeComponents } = useQuery({
    queryKey: ["hr-salary-components-active"],
    queryFn: async () => {
      const result = await hrSalaryApi.getActiveComponents();
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    enabled: activeTab === "salary",
  });

  // ========== Attendance Tab Data ==========
  const { data: attendanceData, isLoading: attLoading } = useQuery({
    queryKey: ["hr-attendance-emp", employeeId],
    queryFn: async () => {
      const result = await hrAttendanceApi.getAll({ employeeId, pageSize: 50 });
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    enabled: activeTab === "attendance" && employeeId > 0,
  });

  // ========== Advances Tab Data ==========
  const { data: advancesData, isLoading: advLoading } = useQuery({
    queryKey: ["hr-advances-emp", employeeId],
    queryFn: async () => {
      const result = await hrAdvanceApi.getByEmployee(employeeId);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    enabled: activeTab === "advances" && employeeId > 0,
  });

  // ========== Mutations ==========
  const updateMutation = useMutation({
    mutationFn: async (data: UpdateEmployeeRequest) => {
      const result = await hrEmployeeApi.update(employeeId, data);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      toast.success("Employee updated successfully");
      queryClient.invalidateQueries({ queryKey: ["hr-employee", employeeId] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update employee");
    },
  });

  const setSalaryMutation = useMutation({
    mutationFn: async (data: SetSalaryStructureRequest) => {
      const result = await hrSalaryApi.setStructure(employeeId, data);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      toast.success("Salary structure updated successfully");
      queryClient.invalidateQueries({ queryKey: ["hr-salary-structure", employeeId] });
      setSalaryModalOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update salary structure");
    },
  });

  const handleSaveProfile = () => {
    if (!employeeCode.trim()) {
      toast.error("Employee code is required");
      return;
    }
    const data: UpdateEmployeeRequest = {
      employeeCode,
      department: department || undefined,
      designation: designation || undefined,
      joiningDate,
      confirmationDate: confirmationDate || undefined,
      resignationDate: resignationDate || undefined,
      lastWorkingDate: lastWorkingDate || undefined,
      employmentStatus,
      gender: gender || undefined,
      dateOfBirth: dateOfBirth || undefined,
      nationalId: nationalId || undefined,
      passportNumber: passportNumber || undefined,
      passportExpiry: passportExpiry || undefined,
      emergencyContactName: emergencyContactName || undefined,
      emergencyContactNumber: emergencyContactNumber || undefined,
      address: address || undefined,
      bankName: bankName || undefined,
      bankAccountNumber: bankAccountNumber || undefined,
      bankIban: bankIban || undefined,
      bankBranch: bankBranch || undefined,
    };
    updateMutation.mutate(data);
  };

  const handleOpenSalaryModal = () => {
    const existing = (salaryStructure || []).map((s) => ({
      salaryComponentId: s.salaryComponentId.toString(),
      amount: s.amount.toString(),
    }));
    setSalaryLines(existing.length > 0 ? existing : [{ salaryComponentId: "", amount: "" }]);
    setSalaryEffectiveFrom(getTodayDateOnly());
    setSalaryModalOpen(true);
  };

  const handleSaveSalary = () => {
    const lines = salaryLines
      .filter((l) => l.salaryComponentId && l.amount)
      .map((l) => ({ salaryComponentId: parseInt(l.salaryComponentId), amount: parseFloat(l.amount) }));
    if (lines.length === 0) {
      toast.error("Add at least one salary component");
      return;
    }
    setSalaryMutation.mutate({ lines, effectiveFrom: salaryEffectiveFrom });
  };

  const addSalaryLine = () => {
    setSalaryLines([...salaryLines, { salaryComponentId: "", amount: "" }]);
  };

  const removeSalaryLine = (index: number) => {
    setSalaryLines(salaryLines.filter((_, i) => i !== index));
  };

  const updateSalaryLine = (index: number, field: "salaryComponentId" | "amount", value: string) => {
    const updated = [...salaryLines];
    updated[index] = { ...updated[index], [field]: value };
    setSalaryLines(updated);
  };

  const components = activeComponents || [];

  const formatAmount = (amount: number) =>
    amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const getAdvanceStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      Active: "bg-green-500",
      FullyRepaid: "bg-blue-500",
      Cancelled: "bg-gray-500",
    };
    return <span className={`px-2 py-0.5 rounded text-xs font-medium text-white ${colors[status] || "bg-gray-500"}`}>{status}</span>;
  };

  const getAttendanceStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      Present: "bg-green-500",
      Absent: "bg-red-500",
      Late: "bg-yellow-500",
      HalfDay: "bg-orange-500",
      Leave: "bg-blue-500",
      Holiday: "bg-purple-500",
    };
    return <span className={`px-2 py-0.5 rounded text-xs font-medium text-white ${colors[status] || "bg-gray-500"}`}>{status}</span>;
  };

  if (empLoading) {
    return (
      <MainLayout>
        <div className="p-6 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    );
  }

  if (!employee) {
    return (
      <MainLayout>
        <div className="p-6">
          <p className="text-muted-foreground">Employee not found.</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/hr/employees")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Employees
          </Button>
        </div>
      </MainLayout>
    );
  }

  const tabs = [
    { id: "profile", label: "Profile" },
    { id: "salary", label: "Salary" },
    { id: "attendance", label: "Attendance" },
    { id: "advances", label: "Advances" },
  ];

  return (
    <MainLayout>
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => navigate("/hr/employees")}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">{employee.fullName}</h1>
              <p className="text-sm text-muted-foreground">{employee.employeeCode} - {employee.designation || "No Designation"}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-border">
          <div className="flex gap-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ========== Profile Tab ========== */}
        {activeTab === "profile" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Employee Code <span className="text-destructive">*</span></Label>
                <Input value={employeeCode} onChange={(e) => setEmployeeCode(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Department</Label>
                <Input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g. Operations" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Designation</Label>
                <Input value={designation} onChange={(e) => setDesignation(e.target.value)} placeholder="e.g. Manager" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Joining Date</Label>
                <DateInput value={joiningDate} onChange={setJoiningDate} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Confirmation Date</Label>
                <DateInput value={confirmationDate} onChange={setConfirmationDate} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Employment Status</Label>
                <SearchableSelect
                  options={employmentStatuses}
                  value={employmentStatus}
                  onValueChange={setEmploymentStatus}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Resignation Date</Label>
                <DateInput value={resignationDate} onChange={setResignationDate} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Last Working Date</Label>
                <DateInput value={lastWorkingDate} onChange={setLastWorkingDate} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Gender</Label>
                <SearchableSelect
                  options={[{ value: "", label: "None" }, ...genderOptions]}
                  value={gender}
                  onValueChange={setGender}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Date of Birth</Label>
                <DateInput value={dateOfBirth} onChange={setDateOfBirth} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">National ID</Label>
                <Input value={nationalId} onChange={(e) => setNationalId(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Passport Number</Label>
                <Input value={passportNumber} onChange={(e) => setPassportNumber(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Passport Expiry</Label>
                <DateInput value={passportExpiry} onChange={setPassportExpiry} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Emergency Contact Name</Label>
                <Input value={emergencyContactName} onChange={(e) => setEmergencyContactName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Emergency Contact Number</Label>
                <Input value={emergencyContactNumber} onChange={(e) => setEmergencyContactNumber(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Address</Label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>

            <h3 className="text-lg font-medium border-b pb-2">Bank Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Bank Name</Label>
                <Input value={bankName} onChange={(e) => setBankName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Account Number</Label>
                <Input value={bankAccountNumber} onChange={(e) => setBankAccountNumber(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">IBAN</Label>
                <Input value={bankIban} onChange={(e) => setBankIban(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Branch</Label>
                <Input value={bankBranch} onChange={(e) => setBankBranch(e.target.value)} />
              </div>
            </div>

            <PermissionGate permission="hr_emp_edit">
              <div className="flex justify-end pt-4 border-t border-border">
                <Button className="btn-success gap-2" onClick={handleSaveProfile} disabled={updateMutation.isPending}>
                  <Save size={16} />
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </PermissionGate>
          </div>
        )}

        {/* ========== Salary Tab ========== */}
        {activeTab === "salary" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">Salary Structure</h2>
              <PermissionGate permission="hr_emp_edit">
                <Button className="btn-success gap-2" onClick={handleOpenSalaryModal}>
                  <Plus size={16} />
                  Set Salary Structure
                </Button>
              </PermissionGate>
            </div>
            <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-table-header text-table-header-foreground">
                    <th className="px-4 py-3 text-left text-sm font-semibold">Component</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Type</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Amount</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Effective From</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Effective To</th>
                  </tr>
                </thead>
                <tbody>
                  {salaryLoading ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
                  ) : !salaryStructure || salaryStructure.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No salary structure defined</td></tr>
                  ) : (
                    salaryStructure.map((item, i) => (
                      <tr key={item.id} className={`border-b border-border hover:bg-table-row-hover ${i % 2 === 0 ? "bg-card" : "bg-secondary/30"}`}>
                        <td className="px-4 py-3 text-sm font-medium">{item.componentName}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium text-white ${item.componentType === "Earning" ? "bg-green-500" : "bg-red-400"}`}>
                            {item.componentType}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-right">{formatAmount(item.amount)}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(item.effectiveFrom)}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{item.effectiveTo ? formatDate(item.effectiveTo) : "-"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========== Attendance Tab ========== */}
        {activeTab === "attendance" && (
          <div className="space-y-4">
            <h2 className="text-lg font-medium">Attendance Records</h2>
            <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-table-header text-table-header-foreground">
                    <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Check In</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Check Out</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Work Hours</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {attLoading ? (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
                  ) : !attendanceData?.items || attendanceData.items.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No records found</td></tr>
                  ) : (
                    attendanceData.items.map((rec, i) => (
                      <tr key={rec.id} className={`border-b border-border hover:bg-table-row-hover ${i % 2 === 0 ? "bg-card" : "bg-secondary/30"}`}>
                        <td className="px-4 py-3 text-sm">{formatDate(rec.date)}</td>
                        <td className="px-4 py-3 text-sm">{rec.checkIn || "-"}</td>
                        <td className="px-4 py-3 text-sm">{rec.checkOut || "-"}</td>
                        <td className="px-4 py-3 text-sm text-right">{rec.workHours?.toFixed(1) || "-"}</td>
                        <td className="px-4 py-3">{getAttendanceStatusBadge(rec.status)}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{rec.remarks || "-"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========== Advances Tab ========== */}
        {activeTab === "advances" && (
          <div className="space-y-4">
            <h2 className="text-lg font-medium">Advances</h2>
            <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-table-header text-table-header-foreground">
                    <th className="px-4 py-3 text-left text-sm font-semibold">Issue Date</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Amount</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Repaid</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Balance</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Monthly Ded.</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Reason</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {advLoading ? (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
                  ) : !advancesData || advancesData.length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No records found</td></tr>
                  ) : (
                    advancesData.map((adv, i) => (
                      <tr key={adv.id} className={`border-b border-border hover:bg-table-row-hover ${i % 2 === 0 ? "bg-card" : "bg-secondary/30"}`}>
                        <td className="px-4 py-3 text-sm">{formatDate(adv.issueDate)}</td>
                        <td className="px-4 py-3 text-sm text-right">{formatAmount(adv.amount)}</td>
                        <td className="px-4 py-3 text-sm text-right">{formatAmount(adv.repaidAmount)}</td>
                        <td className="px-4 py-3 text-sm text-right font-medium">{formatAmount(adv.balanceAmount)}</td>
                        <td className="px-4 py-3 text-sm text-right">{formatAmount(adv.monthlyDeduction)}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{adv.reason || "-"}</td>
                        <td className="px-4 py-3">{getAdvanceStatusBadge(adv.status)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Salary Structure Modal */}
      <Dialog open={salaryModalOpen} onOpenChange={setSalaryModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto p-0 bg-card">
          <DialogHeader className="bg-modal-header text-white p-4 rounded-t-lg">
            <DialogTitle className="text-white">Set Salary Structure</DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <Label className="text-sm">Effective From <span className="text-destructive">*</span></Label>
              <DateInput value={salaryEffectiveFrom} onChange={setSalaryEffectiveFrom} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Components</Label>
                <Button variant="outline" size="sm" onClick={addSalaryLine}>
                  <Plus size={14} className="mr-1" /> Add Line
                </Button>
              </div>
              {salaryLines.map((line, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="flex-1">
                    <SearchableSelect
                      options={components.map((c) => ({ value: c.id.toString(), label: `${c.name} (${c.componentType})` }))}
                      value={line.salaryComponentId}
                      onValueChange={(v) => updateSalaryLine(idx, "salaryComponentId", v)}
                      placeholder="Select component..."
                    />
                  </div>
                  <Input
                    type="number"
                    className="w-32"
                    value={line.amount}
                    onChange={(e) => updateSalaryLine(idx, "amount", e.target.value)}
                    placeholder="Amount"
                  />
                  <Button variant="destructive" size="sm" onClick={() => removeSalaryLine(idx)} className="h-9 w-9 p-0">
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-border">
              <Button variant="outline" onClick={() => setSalaryModalOpen(false)}>Cancel</Button>
              <Button className="btn-success" onClick={handleSaveSalary} disabled={setSalaryMutation.isPending}>
                {setSalaryMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default HrEmployeeDetail;
