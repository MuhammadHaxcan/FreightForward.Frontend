import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DateInput } from "@/components/ui/date-input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Eye, Trash2 } from "lucide-react";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { formatDate, getTodayDateOnly } from "@/lib/utils";
import {
  hrAdvanceApi,
  hrEmployeeApi,
  Advance,
  CreateAdvanceRequest,
} from "@/services/api/hr";
import { MutationBlockingOverlay } from "@/components/ui/mutation-blocking-overlay";

const HrAdvances = () => {
  const queryClient = useQueryClient();
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filterEmployeeId, setFilterEmployeeId] = useState("");

  // Add modal state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [employeeId, setEmployeeId] = useState("");
  const [amount, setAmount] = useState("");
  const [monthlyDeduction, setMonthlyDeduction] = useState("");
  const [issueDate, setIssueDate] = useState(getTodayDateOnly());
  const [reason, setReason] = useState("");

  // View modal state
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewingAdvance, setViewingAdvance] = useState<Advance | null>(null);

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingAdvance, setDeletingAdvance] = useState<Advance | null>(null);

  // Fetch advances
  const { data: advData, isLoading } = useQuery({
    queryKey: ["hr-advances", pageNumber, pageSize, filterEmployeeId],
    queryFn: async () => {
      const result = await hrAdvanceApi.getAll({
        pageNumber,
        pageSize,
        employeeId: filterEmployeeId ? parseInt(filterEmployeeId) : undefined,
      });
      if (result.error) throw new Error(result.error);
      return result.data;
    },
  });

  // Fetch employees dropdown
  const { data: empDropdown } = useQuery({
    queryKey: ["hr-employees-dropdown"],
    queryFn: async () => {
      const result = await hrEmployeeApi.getDropdown();
      if (result.error) throw new Error(result.error);
      return result.data;
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: CreateAdvanceRequest) => {
      const result = await hrAdvanceApi.create(data);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: (_data, vars) => {
      toast.success("Advance created successfully");
      queryClient.invalidateQueries({ queryKey: ["hr-advances"] });
      // C1: Invalidate employee-specific advances cache used by HrEmployeeDetail
      queryClient.invalidateQueries({ queryKey: ["hr-advances-emp", vars.employeeId] });
      setAddModalOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create advance");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async ({ id, empId }: { id: number; empId: number }) => {
      const result = await hrAdvanceApi.delete(id);
      if (result.error) throw new Error(result.error);
      return { id, empId };
    },
    onSuccess: (vars) => {
      toast.success("Advance deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["hr-advances"] });
      queryClient.invalidateQueries({ queryKey: ["hr-advances-emp", vars.empId] });
      setDeleteDialogOpen(false);
      setDeletingAdvance(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete advance");
    },
  });

  const items = advData?.items || [];
  const totalCount = advData?.totalCount || 0;
  const totalPages = advData?.totalPages || 1;
  const employees = empDropdown || [];

  const resetForm = () => {
    setEmployeeId("");
    setAmount("");
    setMonthlyDeduction("");
    setIssueDate(getTodayDateOnly());
    setReason("");
  };

  const handleAddNew = () => {
    resetForm();
    setAddModalOpen(true);
  };

  const handleView = (adv: Advance) => {
    setViewingAdvance(adv);
    setViewModalOpen(true);
  };

  const handleDeleteClick = (adv: Advance) => {
    setDeletingAdvance(adv);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (deletingAdvance) {
      const empId = deletingAdvance.employeeId;
      deleteMutation.mutate({ id: deletingAdvance.id, empId });
    }
  };

  const handleSave = () => {
    if (!employeeId) {
      toast.error("Please select an employee");
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }
    if (!monthlyDeduction || parseFloat(monthlyDeduction) <= 0) {
      toast.error("Monthly deduction must be greater than 0");
      return;
    }
    const data: CreateAdvanceRequest = {
      employeeId: parseInt(employeeId),
      amount: parseFloat(amount),
      monthlyDeduction: parseFloat(monthlyDeduction),
      issueDate,
      reason: reason || undefined,
    };
    createMutation.mutate(data);
  };

  const formatAmount = (amt: number) =>
    amt.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      Active: "bg-green-500",
      FullyRepaid: "bg-blue-500",
      WrittenOff: "bg-gray-500",
    };
    const labels: Record<string, string> = {
      Active: "Active",
      FullyRepaid: "Fully Repaid",
      WrittenOff: "Written Off",
    };
    return (
      <span className={`px-3 py-1 rounded text-sm font-medium text-white ${colors[status] || "bg-gray-500"}`}>
        {labels[status] || status}
      </span>
    );
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-foreground">HR Advances</h1>
          <PermissionGate permission="hr_advance_add">
            <Button className="btn-success gap-2" onClick={handleAddNew}>
              <Plus size={16} />
              New Advance
            </Button>
          </PermissionGate>
        </div>

        {/* Filter */}
        <div className="bg-muted/30 border rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Employee</label>
              <SearchableSelect
                options={[
                  { value: "", label: "All Employees" },
                  ...employees.map((e) => ({ value: e.id.toString(), label: `${e.employeeCode} - ${e.fullName}` })),
                ]}
                value={filterEmployeeId}
                onValueChange={(v) => { setFilterEmployeeId(v); setPageNumber(1); }}
                placeholder="All Employees"
                searchPlaceholder="Search employees..."
              />
            </div>
            <div className="flex items-end">
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
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-table-header text-table-header-foreground">
                  <th className="px-4 py-3 text-left text-sm font-semibold">Action</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Employee</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Code</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Issue Date</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Amount</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Repaid</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Balance</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Monthly Ded.</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">Loading...</td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">No records found</td>
                  </tr>
                ) : (
                  items.map((adv, index) => (
                    <tr
                      key={adv.id}
                      className={`border-b border-border hover:bg-table-row-hover transition-colors ${
                        index % 2 === 0 ? "bg-card" : "bg-secondary/30"
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            className="p-1.5 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                            onClick={() => handleView(adv)}
                            title="View"
                          >
                            <Eye size={14} />
                          </button>
                          {adv.repaidAmount === 0 && (
                            <PermissionGate permission="hr_advance_add">
                              <button
                                className="p-1.5 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 transition-colors"
                                onClick={() => handleDeleteClick(adv)}
                                title="Delete"
                              >
                                <Trash2 size={14} />
                              </button>
                            </PermissionGate>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">{adv.employeeName}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{adv.employeeCode}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(adv.issueDate)}</td>
                      <td className="px-4 py-3 text-sm text-right">{formatAmount(adv.amount)}</td>
                      <td className="px-4 py-3 text-sm text-right">{formatAmount(adv.repaidAmount)}</td>
                      <td className="px-4 py-3 text-sm text-right font-medium">{formatAmount(adv.balanceAmount)}</td>
                      <td className="px-4 py-3 text-sm text-right">{formatAmount(adv.monthlyDeduction)}</td>
                      <td className="px-4 py-3">{getStatusBadge(adv.status)}</td>
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

      {/* Add Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto p-0 bg-card">
          <DialogHeader className="bg-modal-header text-white p-4 rounded-t-lg">
            <DialogTitle className="text-white">New Advance</DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-4 relative">
            <MutationBlockingOverlay isPending={createMutation.isPending} message="Saving..." />
            <div className="space-y-2">
              <Label className="text-sm">Employee <span className="text-destructive">*</span></Label>
              <SearchableSelect
                options={employees.map((e) => ({ value: e.id.toString(), label: `${e.employeeCode} - ${e.fullName}` }))}
                value={employeeId}
                onValueChange={setEmployeeId}
                placeholder="Select employee..."
                searchPlaceholder="Search employees..."
                disabled={createMutation.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Amount <span className="text-destructive">*</span></Label>
              <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" disabled={createMutation.isPending} />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Issue Date</Label>
              <DateInput value={issueDate} onChange={setIssueDate} disabled={createMutation.isPending} />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Monthly Deduction <span className="text-destructive">*</span></Label>
              <Input type="number" value={monthlyDeduction} onChange={(e) => setMonthlyDeduction(e.target.value)} placeholder="0.00" disabled={createMutation.isPending} />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Reason</Label>
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for advance" rows={3} disabled={createMutation.isPending} />
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-border">
              <Button variant="outline" onClick={() => setAddModalOpen(false)} disabled={createMutation.isPending}>Cancel</Button>
              <Button
                className="btn-success"
                onClick={handleSave}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto p-0 bg-card">
          <DialogHeader className="bg-modal-header text-white p-4 rounded-t-lg">
            <DialogTitle className="text-white">Advance Details</DialogTitle>
          </DialogHeader>
          {viewingAdvance && (
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Employee</Label>
                  <p className="text-sm font-medium">{viewingAdvance.employeeName}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Employee Code</Label>
                  <p className="text-sm font-medium">{viewingAdvance.employeeCode}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Issue Date</Label>
                  <p className="text-sm font-medium">{formatDate(viewingAdvance.issueDate)}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Status</Label>
                  <div className="mt-1">{getStatusBadge(viewingAdvance.status)}</div>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Amount</Label>
                  <p className="text-sm font-medium">{formatAmount(viewingAdvance.amount)}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Monthly Deduction</Label>
                  <p className="text-sm font-medium">{formatAmount(viewingAdvance.monthlyDeduction)}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Repaid Amount</Label>
                  <p className="text-sm font-medium">{formatAmount(viewingAdvance.repaidAmount)}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Balance Amount</Label>
                  <p className="text-sm font-medium">{formatAmount(viewingAdvance.balanceAmount)}</p>
                </div>
              </div>
              {viewingAdvance.reason && (
                <div>
                  <Label className="text-sm text-muted-foreground">Reason</Label>
                  <p className="text-sm font-medium mt-1">{viewingAdvance.reason}</p>
                </div>
              )}
              <div className="flex justify-end pt-4 border-t border-border">
                <Button variant="outline" onClick={() => setViewModalOpen(false)}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <MutationBlockingOverlay isPending={deleteMutation.isPending} message="Deleting..." />
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Advance</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this advance
              {deletingAdvance && ` for ${deletingAdvance.employeeName} (${formatAmount(deletingAdvance.amount)})`}?
              This will also remove the linked daily expense entry. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
};

export default HrAdvances;
