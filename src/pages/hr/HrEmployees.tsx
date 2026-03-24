import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
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
import { Plus, Pencil, Trash2, Eye } from "lucide-react";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { formatDate, getTodayDateOnly } from "@/lib/utils";
import {
  hrEmployeeApi,
  EmployeeListItem,
  CreateEmployeeRequest,
} from "@/services/api/hr";
import { usersApi } from "@/services/api/auth";

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

const HrEmployees = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filterStatus, setFilterStatus] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<EmployeeListItem | null>(null);

  // Form state
  const [userId, setUserId] = useState("");
  const [employeeCode, setEmployeeCode] = useState("");
  const [department, setDepartment] = useState("");
  const [designation, setDesignation] = useState("");
  const [joiningDate, setJoiningDate] = useState(getTodayDateOnly());
  const [employmentStatus, setEmploymentStatus] = useState("Active");
  const [gender, setGender] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [address, setAddress] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactNumber, setEmergencyContactNumber] = useState("");
  const [annualLeaveDays, setAnnualLeaveDays] = useState("30");
  const [sickLeaveDays, setSickLeaveDays] = useState("10");
  const [paidLeaveDays, setPaidLeaveDays] = useState("5");

  // Fetch employees
  const { data: empData, isLoading } = useQuery({
    queryKey: ["hr-employees", pageNumber, pageSize, searchTerm, filterStatus],
    queryFn: async () => {
      const result = await hrEmployeeApi.getAll({
        pageNumber,
        pageSize,
        searchTerm: searchTerm || undefined,
        status: filterStatus || undefined,
      });
      if (result.error) throw new Error(result.error);
      return result.data;
    },
  });

  // Fetch users for dropdown (all active users - we'll use them for selection)
  const { data: usersData } = useQuery({
    queryKey: ["users-for-employee"],
    queryFn: async () => {
      const result = await usersApi.getAll({ pageSize: 500, isActive: true });
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    enabled: modalOpen,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: CreateEmployeeRequest) => {
      const result = await hrEmployeeApi.create(data);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      toast.success("Employee created successfully");
      queryClient.invalidateQueries({ queryKey: ["hr-employees"] });
      setModalOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create employee");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const result = await hrEmployeeApi.delete(id);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      toast.success("Employee deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["hr-employees"] });
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete employee");
    },
  });

  const items = empData?.items || [];
  const totalCount = empData?.totalCount || 0;
  const totalPages = empData?.totalPages || 1;
  const users = usersData?.items || [];

  const resetForm = () => {
    setUserId("");
    setEmployeeCode("");
    setDepartment("");
    setDesignation("");
    setJoiningDate(getTodayDateOnly());
    setEmploymentStatus("Active");
    setGender("");
    setDateOfBirth("");
    setNationalId("");
    setContactNumber("");
    setAddress("");
    setEmergencyContactName("");
    setEmergencyContactNumber("");
    setAnnualLeaveDays("30");
    setSickLeaveDays("10");
    setPaidLeaveDays("5");
  };

  const handleAddNew = async () => {
    resetForm();
    setModalOpen(true);
    const result = await hrEmployeeApi.getNextCode();
    if (result.data) {
      setEmployeeCode(result.data);
    }
  };

  const handleDelete = (emp: EmployeeListItem) => {
    setItemToDelete(emp);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      deleteMutation.mutate(itemToDelete.id);
    }
  };

  const handleSave = () => {
    if (!userId) {
      toast.error("Please select a user");
      return;
    }
    if (!joiningDate) {
      toast.error("Joining date is required");
      return;
    }
    const data: CreateEmployeeRequest = {
      userId: parseInt(userId),
      employeeCode,
      department: department || undefined,
      designation: designation || undefined,
      joiningDate,
      employmentStatus,
      gender: gender || undefined,
      dateOfBirth: dateOfBirth || undefined,
      nationalId: nationalId || undefined,
      emergencyContactName: emergencyContactName || undefined,
      emergencyContactNumber: emergencyContactNumber || undefined,
      address: address || undefined,
      annualLeaveDays: parseInt(annualLeaveDays) || 30,
      sickLeaveDays: parseInt(sickLeaveDays) || 10,
      paidLeaveDays: parseInt(paidLeaveDays) || 5,
    };
    createMutation.mutate(data);
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      Active: "bg-green-500",
      Probation: "bg-yellow-500",
      Resigned: "bg-orange-500",
      Terminated: "bg-red-500",
    };
    return (
      <span className={`px-3 py-1 rounded text-sm font-medium text-white ${colors[status] || "bg-gray-500"}`}>
        {status}
      </span>
    );
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-foreground">HR Employees</h1>
          <PermissionGate permission="hr_emp_add">
            <Button className="btn-success gap-2" onClick={handleAddNew}>
              <Plus size={16} />
              Add New
            </Button>
          </PermissionGate>
        </div>

        {/* Filters */}
        <div className="bg-muted/30 border rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-green-600 mb-1 block">Status</label>
              <SearchableSelect
                options={[
                  { value: "", label: "All Statuses" },
                  ...employmentStatuses,
                ]}
                value={filterStatus}
                onValueChange={(v) => { setFilterStatus(v); setPageNumber(1); }}
                placeholder="All Statuses"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-green-600 mb-1 block">Search</label>
              <Input
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPageNumber(1); }}
                placeholder="Search by name, code, email..."
              />
            </div>
          </div>
        </div>

        {/* Entries selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Show:</span>
          <SearchableSelect
            options={[
              { value: "10", label: "10" },
              { value: "25", label: "25" },
              { value: "50", label: "50" },
              { value: "100", label: "100" },
            ]}
            value={pageSize.toString()}
            onValueChange={(v) => { setPageSize(parseInt(v)); setPageNumber(1); }}
            triggerClassName="w-[90px] h-8"
          />
          <span className="text-sm text-muted-foreground">entries</span>
        </div>

        {/* Table */}
        <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-table-header text-table-header-foreground">
                  <th className="px-4 py-3 text-left text-sm font-semibold">Action</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Code</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Department</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Designation</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Joining Date</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                      Loading...
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                      No records found
                    </td>
                  </tr>
                ) : (
                  items.map((emp, index) => (
                    <tr
                      key={emp.id}
                      className={`border-b border-border hover:bg-table-row-hover transition-colors ${
                        index % 2 === 0 ? "bg-card" : "bg-secondary/30"
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <PermissionGate permission="hr_emp_view">
                            <button
                              className="p-1.5 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
                              onClick={() => navigate(`/hr/employees/${emp.id}`)}
                              title="View"
                            >
                              <Eye size={14} />
                            </button>
                          </PermissionGate>
                          <PermissionGate permission="hr_emp_edit">
                            <button
                              className="p-1.5 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                              onClick={() => navigate(`/hr/employees/${emp.id}`)}
                              title="Edit"
                            >
                              <Pencil size={14} />
                            </button>
                          </PermissionGate>
                          <PermissionGate permission="hr_emp_delete">
                            <button
                              className="p-1.5 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 transition-colors"
                              onClick={() => handleDelete(emp)}
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </PermissionGate>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">{emp.employeeCode}</td>
                      <td className="px-4 py-3 text-sm font-medium text-primary">{emp.fullName}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{emp.email || "-"}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{emp.department || "-"}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{emp.designation || "-"}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(emp.joiningDate)}</td>
                      <td className="px-4 py-3">{getStatusBadge(emp.employmentStatus)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Showing {items.length > 0 ? (pageNumber - 1) * pageSize + 1 : 0} to{" "}
            {Math.min(pageNumber * pageSize, totalCount)} of {totalCount} entries
          </p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" disabled={pageNumber === 1} onClick={() => setPageNumber((p) => p - 1)}>
              Previous
            </Button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (pageNumber <= 3) {
                pageNum = i + 1;
              } else if (pageNumber >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = pageNumber - 2 + i;
              }
              return (
                <Button
                  key={pageNum}
                  variant={pageNumber === pageNum ? "default" : "outline"}
                  size="sm"
                  className={pageNumber === pageNum ? "btn-success" : ""}
                  onClick={() => setPageNumber(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
            <Button variant="outline" size="sm" disabled={pageNumber === totalPages || totalPages === 0} onClick={() => setPageNumber((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Add Employee Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto p-0 bg-card">
          <DialogHeader className="bg-modal-header text-white p-4 rounded-t-lg">
            <DialogTitle className="text-white">Add New Employee</DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">User <span className="text-destructive">*</span></Label>
                <SearchableSelect
                  options={users.map((u) => ({ value: u.id.toString(), label: `${u.fullName} (${u.username})` }))}
                  value={userId}
                  onValueChange={setUserId}
                  placeholder="Select user..."
                  searchPlaceholder="Search users..."
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Employee Code <span className="text-destructive">*</span></Label>
                <Input value={employeeCode} readOnly className="bg-muted" placeholder="Auto-generated" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Department</Label>
                <Input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g. Operations" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Designation</Label>
                <Input value={designation} onChange={(e) => setDesignation(e.target.value)} placeholder="e.g. Manager" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Joining Date <span className="text-destructive">*</span></Label>
                <DateInput value={joiningDate} onChange={setJoiningDate} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Employment Status</Label>
                <SearchableSelect
                  options={employmentStatuses}
                  value={employmentStatus}
                  onValueChange={setEmploymentStatus}
                  placeholder="Select status..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Gender</Label>
                <SearchableSelect
                  options={[{ value: "", label: "None" }, ...genderOptions]}
                  value={gender}
                  onValueChange={setGender}
                  placeholder="Select gender..."
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Date of Birth</Label>
                <DateInput value={dateOfBirth} onChange={setDateOfBirth} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">National ID</Label>
                <Input value={nationalId} onChange={(e) => setNationalId(e.target.value)} placeholder="National ID" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Contact Number</Label>
                <Input value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} placeholder="Contact Number" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Emergency Contact Name</Label>
                <Input value={emergencyContactName} onChange={(e) => setEmergencyContactName(e.target.value)} placeholder="Emergency Contact Name" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Emergency Contact Number</Label>
                <Input value={emergencyContactNumber} onChange={(e) => setEmergencyContactNumber(e.target.value)} placeholder="Emergency Contact Number" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Address</Label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address" />
            </div>

            <h3 className="text-sm font-medium text-foreground pt-2 border-t border-border">Leave Entitlements (per year)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Annual Leave Days</Label>
                <Input type="number" min={0} value={annualLeaveDays} onChange={(e) => setAnnualLeaveDays(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Sick Leave Days</Label>
                <Input type="number" min={0} value={sickLeaveDays} onChange={(e) => setSickLeaveDays(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Paid Leave Days</Label>
                <Input type="number" min={0} value={paidLeaveDays} onChange={(e) => setPaidLeaveDays(e.target.value)} />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-border">
              <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button className="btn-success" onClick={handleSave} disabled={createMutation.isPending}>
                {createMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px] p-0 bg-card">
          <DialogHeader className="bg-modal-header text-white p-4 rounded-t-lg">
            <DialogTitle className="text-white">Confirm Delete</DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete employee{" "}
              <span className="font-medium text-foreground">{itemToDelete?.fullName}</span>?
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 pt-4 border-t border-border">
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={confirmDelete} disabled={deleteMutation.isPending}>
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default HrEmployees;
