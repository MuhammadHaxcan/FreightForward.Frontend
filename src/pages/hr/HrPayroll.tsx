import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { format } from "date-fns";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { DateInput } from "@/components/ui/date-input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Eye, Check } from "lucide-react";
import { PermissionGate } from "@/components/auth/PermissionGate";
import {
  hrPayrollApi,
  hrEmployeeApi,
  PayrollListItem,
  UpdatePayrollRequest,
  MarkPaidRequest,
} from "@/services/api/hr";
import { useBanks } from "@/hooks/useBanks";

const monthNames = [
  "",
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const months = monthNames.slice(1).map((name, i) => ({
  value: (i + 1).toString(),
  label: name,
}));

const formatAmount = (n: number) =>
  n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

// Payment mode config (same pattern as ExpenseModal)
const paymentModeToEnum: Record<string, string> = {
  "CASH": "Cash",
  "CHEQUE": "Cheque",
  "BANK WIRE": "BankWire",
  "BANK TRANSFER": "BankTransfer",
  "CARD": "Card",
  "POST DATED CHEQUE": "PostDatedCheque",
};

const paymentModes = ["CASH", "CHEQUE", "BANK WIRE", "BANK TRANSFER", "CARD", "POST DATED CHEQUE"];

const paymentModeConfig: Record<string, { requiresBank: boolean; requiresChequeDetails: boolean }> = {
  "CASH": { requiresBank: false, requiresChequeDetails: false },
  "CHEQUE": { requiresBank: true, requiresChequeDetails: true },
  "BANK WIRE": { requiresBank: true, requiresChequeDetails: false },
  "BANK TRANSFER": { requiresBank: true, requiresChequeDetails: false },
  "CARD": { requiresBank: true, requiresChequeDetails: false },
  "POST DATED CHEQUE": { requiresBank: true, requiresChequeDetails: true },
};

const HrPayroll = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const currentDate = new Date();

  // Filters
  const [filterYear, setFilterYear] = useState(
    currentDate.getFullYear().toString()
  );
  const [filterMonthFrom, setFilterMonthFrom] = useState(
    (currentDate.getMonth() + 1).toString()
  );
  const [filterMonthTo, setFilterMonthTo] = useState(
    (currentDate.getMonth() + 1).toString()
  );
  const [filterEmployeeId, setFilterEmployeeId] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Edit modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PayrollListItem | null>(null);
  const [editEarnings, setEditEarnings] = useState("");
  const [editDeductions, setEditDeductions] = useState("");
  const [editAdvance, setEditAdvance] = useState("");
  const [editRemarks, setEditRemarks] = useState("");

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Mark Paid modal
  const [markPaidModalOpen, setMarkPaidModalOpen] = useState(false);
  const [markPaidPayroll, setMarkPaidPayroll] = useState<PayrollListItem | null>(null);
  const [markPaidPaymentMode, setMarkPaidPaymentMode] = useState("CASH");
  const [markPaidBankId, setMarkPaidBankId] = useState<string>("");
  const [markPaidExpenseDate, setMarkPaidExpenseDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [markPaidChequeNumber, setMarkPaidChequeNumber] = useState("");
  const [markPaidChequeDate, setMarkPaidChequeDate] = useState("");
  const [markPaidPostDatedValidDate, setMarkPaidPostDatedValidDate] = useState("");

  // Year options
  const yearOptions = Array.from({ length: 5 }, (_, i) => {
    const y = currentDate.getFullYear() - 2 + i;
    return { value: y.toString(), label: y.toString() };
  });

  // ==================== Queries ====================

  const { data: payrollData, isLoading } = useQuery({
    queryKey: ["hr-payroll", pageNumber, pageSize, filterYear, filterMonthFrom, filterMonthTo, filterEmployeeId],
    queryFn: async () => {
      const result = await hrPayrollApi.getAll({
        pageNumber,
        pageSize,
        year: parseInt(filterYear),
        monthFrom: parseInt(filterMonthFrom),
        monthTo: parseInt(filterMonthTo),
        employeeId: filterEmployeeId ? parseInt(filterEmployeeId) : undefined,
      });
      if (result.error) throw new Error(result.error);
      return result.data;
    },
  });

  const { data: empDropdown } = useQuery({
    queryKey: ["hr-employees-dropdown"],
    queryFn: async () => {
      const result = await hrEmployeeApi.getDropdown();
      if (result.error) throw new Error(result.error);
      return result.data;
    },
  });

  const { data: banksData } = useBanks({ pageSize: 100 });

  // ==================== Mutations ====================

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: UpdatePayrollRequest;
    }) => {
      const result = await hrPayrollApi.update(id, data);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      toast.success("Payroll updated successfully");
      queryClient.invalidateQueries({ queryKey: ["hr-payroll"] });
      queryClient.invalidateQueries({ queryKey: ["hr-payroll-pregenerate"] });
      queryClient.invalidateQueries({ queryKey: ["hr-payroll-exists"] });
      setEditModalOpen(false);
      setEditingItem(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update payroll");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const result = await hrPayrollApi.delete(id);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      toast.success("Payroll deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["hr-payroll"] });
      queryClient.invalidateQueries({ queryKey: ["hr-payroll-pregenerate"] });
      queryClient.invalidateQueries({ queryKey: ["hr-payroll-exists"] });
      setDeleteDialogOpen(false);
      setDeletingId(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete payroll");
    },
  });

  const markPaidMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: MarkPaidRequest }) => {
      const result = await hrPayrollApi.markPaid(id, data);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      toast.success("Payroll marked as paid");
      queryClient.invalidateQueries({ queryKey: ["hr-payroll"] });
      queryClient.invalidateQueries({ queryKey: ["hr-payroll-pregenerate"] });
      queryClient.invalidateQueries({ queryKey: ["hr-payroll-exists"] });
      setMarkPaidModalOpen(false);
      setMarkPaidPayroll(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to mark as paid");
    },
  });

  // ==================== Derived ====================

  const items = payrollData?.items || [];
  const totalCount = payrollData?.totalCount || 0;
  const totalPages = payrollData?.totalPages || 1;
  const employees = empDropdown || [];
  const banks = banksData?.items || [];

  const editNetSalary =
    (parseFloat(editEarnings) || 0) -
    (parseFloat(editDeductions) || 0) -
    (parseFloat(editAdvance) || 0);

  const markPaidRequiresBank = paymentModeConfig[markPaidPaymentMode]?.requiresBank ?? false;
  const markPaidRequiresChequeDetails = paymentModeConfig[markPaidPaymentMode]?.requiresChequeDetails ?? false;

  // ==================== Handlers ====================

  const handleOpenEdit = (item: PayrollListItem) => {
    setEditingItem(item);
    setEditEarnings(item.totalEarnings.toString());
    setEditDeductions(item.totalDeductions.toString());
    setEditAdvance(item.advanceDeduction.toString());
    setEditRemarks("");
    setEditModalOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingItem) return;
    const data: UpdatePayrollRequest = {
      totalEarnings: parseFloat(editEarnings) || 0,
      totalDeductions: parseFloat(editDeductions) || 0,
      advanceDeduction: parseFloat(editAdvance) || 0,
      netSalary: editNetSalary,
      remarks: editRemarks || undefined,
    };
    updateMutation.mutate({ id: editingItem.id, data });
  };

  const handleConfirmDelete = (id: number) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (deletingId !== null) {
      deleteMutation.mutate(deletingId);
    }
  };

  const handleOpenMarkPaid = (item: PayrollListItem) => {
    setMarkPaidPayroll(item);
    setMarkPaidPaymentMode("CASH");
    setMarkPaidBankId("");
    setMarkPaidExpenseDate(format(new Date(), "yyyy-MM-dd"));
    setMarkPaidChequeNumber("");
    setMarkPaidChequeDate("");
    setMarkPaidPostDatedValidDate("");
    setMarkPaidModalOpen(true);
  };

  const handleSubmitMarkPaid = () => {
    if (!markPaidPayroll) return;
    const data: MarkPaidRequest = {
      paymentMode: paymentModeToEnum[markPaidPaymentMode] || "Cash",
      bankId: markPaidRequiresBank && markPaidBankId ? parseInt(markPaidBankId) : undefined,
      expenseDate: markPaidExpenseDate,
      chequeNumber: markPaidRequiresChequeDetails && markPaidChequeNumber ? markPaidChequeNumber : undefined,
      chequeDate: markPaidRequiresChequeDetails && markPaidChequeDate ? markPaidChequeDate : undefined,
      postDatedValidDate: markPaidPaymentMode === "POST DATED CHEQUE" && markPaidPostDatedValidDate ? markPaidPostDatedValidDate : undefined,
    };
    markPaidMutation.mutate({ id: markPaidPayroll.id, data });
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      Draft: "bg-yellow-500",
      Paid: "bg-green-500",
      Cancelled: "bg-red-400",
    };
    return (
      <span
        className={`px-3 py-1 rounded text-sm font-medium text-white ${
          colors[status] || "bg-gray-500"
        }`}
      >
        {status}
      </span>
    );
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-foreground">HR Payroll</h1>
          <PermissionGate permission="hr_payroll_add">
            <Button
              className="btn-success gap-2"
              onClick={() => navigate("/hr/payroll/generate")}
            >
              <Plus size={16} />
              Generate Payroll
            </Button>
          </PermissionGate>
        </div>

        {/* Filters */}
        <div className="bg-muted/30 border rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-green-600 mb-1 block">
                Year
              </label>
              <SearchableSelect
                options={yearOptions}
                value={filterYear}
                onValueChange={(v) => {
                  setFilterYear(v);
                  setPageNumber(1);
                }}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-green-600 mb-1 block">
                Month From
              </label>
              <SearchableSelect
                options={months}
                value={filterMonthFrom}
                onValueChange={(v) => {
                  setFilterMonthFrom(v);
                  setPageNumber(1);
                }}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-green-600 mb-1 block">
                Month To
              </label>
              <SearchableSelect
                options={months}
                value={filterMonthTo}
                onValueChange={(v) => {
                  setFilterMonthTo(v);
                  setPageNumber(1);
                }}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-green-600 mb-1 block">
                Employee
              </label>
              <SearchableSelect
                options={[
                  { value: "", label: "All Employees" },
                  ...employees.map((e) => ({
                    value: e.id.toString(),
                    label: `${e.employeeCode} - ${e.fullName}`,
                  })),
                ]}
                value={filterEmployeeId}
                onValueChange={(v) => {
                  setFilterEmployeeId(v);
                  setPageNumber(1);
                }}
                placeholder="All Employees"
                searchPlaceholder="Search employees..."
              />
            </div>
          </div>
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
              onValueChange={(v) => {
                setPageSize(parseInt(v));
                setPageNumber(1);
              }}
              triggerClassName="w-[90px] h-8"
            />
            <span className="text-sm text-muted-foreground">entries</span>
          </div>
        </div>

        {/* Table */}
        <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-table-header text-table-header-foreground">
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Action
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Employee
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Period
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">
                    Earnings
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">
                    Deductions
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">
                    Advance Ded.
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">
                    Lates→Abs
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">
                    Paid Lv.
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">
                    Absent Days
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">
                    Net Salary
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Paid Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={12}
                      className="px-4 py-8 text-center text-muted-foreground"
                    >
                      Loading...
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td
                      colSpan={12}
                      className="px-4 py-8 text-center text-muted-foreground"
                    >
                      No records found
                    </td>
                  </tr>
                ) : (
                  items.map((item, index) => (
                    <tr
                      key={item.id}
                      className={`border-b border-border hover:bg-table-row-hover transition-colors ${
                        index % 2 === 0 ? "bg-card" : "bg-secondary/30"
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {/* View */}
                          <button
                            className="p-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                            onClick={() => navigate(`/hr/payslip/${item.id}`)}
                            title="View Payslip"
                          >
                            <Eye size={14} />
                          </button>

                          {/* Edit (hidden when Paid) */}
                          {item.status !== "Paid" && (
                            <PermissionGate permission="hr_payroll_edit">
                              <button
                                className="p-1.5 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                                onClick={() => handleOpenEdit(item)}
                                title="Edit"
                              >
                                <Pencil size={14} />
                              </button>
                            </PermissionGate>
                          )}

                          {/* Delete (hidden when Paid) */}
                          {item.status !== "Paid" && (
                            <PermissionGate permission="hr_payroll_edit">
                              <button
                                className="p-1.5 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 transition-colors"
                                onClick={() => handleConfirmDelete(item.id)}
                                title="Delete"
                              >
                                <Trash2 size={14} />
                              </button>
                            </PermissionGate>
                          )}

                          {/* Mark Paid (Draft only) */}
                          {item.status === "Draft" && (
                            <PermissionGate permission="hr_payroll_edit">
                              <button
                                className="p-1.5 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                                onClick={() => handleOpenMarkPaid(item)}
                                title="Mark Paid"
                              >
                                <Check size={14} />
                              </button>
                            </PermissionGate>
                          )}

                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {item.employeeName}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {monthNames[item.month]} {item.year}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        {formatAmount(item.totalEarnings)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        {formatAmount(item.totalDeductions)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        {formatAmount(item.advanceDeduction)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        {item.latesDaysDeducted > 0 ? (
                          <span className="text-yellow-600 font-medium">{item.latesDaysDeducted}d</span>
                        ) : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        {item.paidLeavesConsumed > 0 ? (
                          <span className="text-green-600 font-medium">{item.paidLeavesConsumed}d</span>
                        ) : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        {item.uncoveredAbsentDays > 0 ? (
                          <span className="text-red-500 font-medium">{item.uncoveredAbsentDays}d</span>
                        ) : (item.paidLeavesConsumed > 0 ? (
                          <span className="text-green-600 text-xs">{item.paidLeavesConsumed}d ✓</span>
                        ) : <span className="text-muted-foreground">—</span>)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium">
                        {formatAmount(item.netSalary)}
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(item.status)}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {item.paidDate
                          ? new Date(item.paidDate).toLocaleDateString()
                          : "-"}
                      </td>
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
            Showing{" "}
            {items.length > 0 ? (pageNumber - 1) * pageSize + 1 : 0} to{" "}
            {Math.min(pageNumber * pageSize, totalCount)} of {totalCount}{" "}
            entries
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={pageNumber === 1}
              onClick={() => setPageNumber((p) => p - 1)}
            >
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
            <Button
              variant="outline"
              size="sm"
              disabled={pageNumber === totalPages || totalPages === 0}
              onClick={() => setPageNumber((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Edit Payroll Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto p-0 bg-card">
          <DialogHeader className="bg-modal-header text-white p-4 rounded-t-lg">
            <DialogTitle className="text-white">Edit Payroll</DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-4">
            {editingItem && (
              <>
                {/* Read-only info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">
                      Employee
                    </Label>
                    <p className="text-sm font-medium">
                      {editingItem.employeeName}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">
                      Period
                    </Label>
                    <p className="text-sm font-medium">
                      {monthNames[editingItem.month]} {editingItem.year}
                    </p>
                  </div>
                </div>

                <div className="border-t border-border pt-4 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Total Earnings</Label>
                    <Input
                      type="number"
                      value={editEarnings}
                      onChange={(e) => setEditEarnings(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Total Deductions</Label>
                    <Input
                      type="number"
                      value={editDeductions}
                      onChange={(e) => setEditDeductions(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Advance Deduction</Label>
                    <Input
                      type="number"
                      value={editAdvance}
                      onChange={(e) => setEditAdvance(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Net Salary (auto-calculated)</Label>
                    <Input
                      type="number"
                      value={editNetSalary.toFixed(2)}
                      readOnly
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Remarks</Label>
                    <Input
                      value={editRemarks}
                      onChange={(e) => setEditRemarks(e.target.value)}
                      placeholder="Optional remarks"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t border-border">
              <Button
                variant="outline"
                onClick={() => setEditModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="btn-success"
                onClick={handleSaveEdit}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px] p-0 bg-card">
          <DialogHeader className="bg-modal-header text-white p-4 rounded-t-lg">
            <DialogTitle className="text-white">Confirm Delete</DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete this payroll record? This action
              cannot be undone.
            </p>
            <div className="flex justify-end gap-2 pt-4 border-t border-border">
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteDialogOpen(false);
                  setDeletingId(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mark as Paid Modal */}
      <Dialog open={markPaidModalOpen} onOpenChange={setMarkPaidModalOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-y-auto p-0 bg-card">
          <DialogHeader className="bg-modal-header text-white p-4 rounded-t-lg">
            <DialogTitle className="text-white">Mark as Paid</DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-4">
            {markPaidPayroll && (
              <>
                {/* Read-only info */}
                <div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded-lg border">
                  <div>
                    <Label className="text-sm text-muted-foreground">Employee</Label>
                    <p className="text-sm font-medium">{markPaidPayroll.employeeName}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Net Salary</Label>
                    <p className="text-sm font-medium">{formatAmount(markPaidPayroll.netSalary)}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Period</Label>
                    <p className="text-sm font-medium">{monthNames[markPaidPayroll.month]} {markPaidPayroll.year}</p>
                  </div>
                </div>

                <div className="border-t border-border pt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">Payment Mode</label>
                      <SearchableSelect
                        options={paymentModes.map((mode) => ({ value: mode, label: mode }))}
                        value={markPaidPaymentMode}
                        onValueChange={(value) => {
                          const config = paymentModeConfig[value];
                          setMarkPaidPaymentMode(value);
                          if (!config?.requiresBank) setMarkPaidBankId("");
                          if (!config?.requiresChequeDetails) {
                            setMarkPaidChequeNumber("");
                            setMarkPaidChequeDate("");
                          }
                          if (value !== "POST DATED CHEQUE") setMarkPaidPostDatedValidDate("");
                        }}
                        placeholder="Select Payment Mode"
                        searchPlaceholder="Search..."
                      />
                    </div>
                    <div>
                      <label className="form-label">Bank</label>
                      <SearchableSelect
                        options={banks.map((bank) => ({ value: bank.id.toString(), label: bank.bankName }))}
                        value={markPaidBankId}
                        onValueChange={setMarkPaidBankId}
                        disabled={!markPaidRequiresBank}
                        triggerClassName={!markPaidRequiresBank ? "bg-muted" : ""}
                        placeholder="Select Bank"
                        searchPlaceholder="Search..."
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label">Expense Date</label>
                    <DateInput
                      value={markPaidExpenseDate}
                      onChange={setMarkPaidExpenseDate}
                    />
                  </div>

                  {/* Cheque-specific fields */}
                  {markPaidRequiresChequeDetails && (
                    <div className={`grid ${markPaidPaymentMode === "POST DATED CHEQUE" ? "grid-cols-3" : "grid-cols-2"} gap-4 p-4 bg-muted/50 rounded-lg border`}>
                      <div>
                        <label className="form-label">Cheque Number</label>
                        <Input
                          placeholder="Enter cheque number"
                          value={markPaidChequeNumber}
                          onChange={(e) => setMarkPaidChequeNumber(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="form-label">Cheque Date</label>
                        <DateInput
                          value={markPaidChequeDate}
                          onChange={setMarkPaidChequeDate}
                        />
                      </div>
                      {markPaidPaymentMode === "POST DATED CHEQUE" && (
                        <div>
                          <label className="form-label">Valid Date (Maturity)</label>
                          <DateInput
                            value={markPaidPostDatedValidDate}
                            onChange={setMarkPaidPostDatedValidDate}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t border-border">
              <Button
                variant="outline"
                onClick={() => setMarkPaidModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="btn-success"
                onClick={handleSubmitMarkPaid}
                disabled={markPaidMutation.isPending}
              >
                {markPaidMutation.isPending ? "Processing..." : "Confirm Payment"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </MainLayout>
  );
};

export default HrPayroll;
