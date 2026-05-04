import { useState, useMemo, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { formatDate } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Printer, FileSpreadsheet, Eye, Trash2, Loader2, Edit } from "lucide-react";
import { DateInput } from "@/components/ui/date-input";
import { ExpenseModal } from "@/components/expenses/ExpenseModal";
import { useAllExpenseTypes } from "@/hooks/useSettings";
import { useBanks } from "@/hooks/useBanks";
import { useExpenses, useExpenseSummary, useCreateExpense, useUpdateExpense, useDeleteExpense } from "@/hooks/useExpenses";
import { Expense as ApiExpense, CreateExpenseRequest, API_BASE_URL, fetchBlob, ExpenseSummaryFilters } from "@/services/api";
import { useBaseCurrency } from "@/hooks/useBaseCurrency";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { toast } from "sonner";

// Map PaymentMode enum values to display labels
const paymentModeLabels: Record<string, string> = {
  "Cash": "CASH",
  "Cheque": "CHEQUE",
  "BankWire": "BANK WIRE",
  "BankTransfer": "BANK TRANSFER",
  "Card": "CARD",
  "PostDatedCheque": "POST DATED CHEQUE",
};

// Map display labels back to enum values
const paymentModeValues: Record<string, string> = {
  "CASH": "Cash",
  "CHEQUE": "Cheque",
  "BANK WIRE": "BankWire",
  "BANK TRANSFER": "BankTransfer",
  "CARD": "Card",
  "POST DATED CHEQUE": "PostDatedCheque",
};

export default function DailyExpenses() {
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const currentYear = new Date().getFullYear();
  const [startDate, setStartDate] = useState(`${currentYear}-01-01`);
  const [endDate, setEndDate] = useState(`${currentYear}-12-31`);
  const [selectedBank, setSelectedBank] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ApiExpense | null>(null);
  const [viewingExpense, setViewingExpense] = useState<ApiExpense | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isExporting, setIsExporting] = useState(false);

  const baseCurrencyCode = useBaseCurrency();

  // Debounce search input → only re-query 400ms after the user stops typing.
  useEffect(() => {
    const handle = setTimeout(() => {
      setSearchTerm(searchInput.trim());
    }, 400);
    return () => clearTimeout(handle);
  }, [searchInput]);

  // Fetch expense types from Settings API
  const { data: expenseTypesData } = useAllExpenseTypes();
  const { data: banksData } = useBanks({ pageSize: 100 });

  // Map expense types to category names + an id lookup
  const expenseCategories = useMemo(() => {
    if (!Array.isArray(expenseTypesData)) return [];
    return expenseTypesData.map((et) => et.name);
  }, [expenseTypesData]);

  const expenseTypeIdByName = useMemo(() => {
    const map = new Map<string, number>();
    if (Array.isArray(expenseTypesData)) {
      expenseTypesData.forEach((et) => map.set(et.name, et.id));
    }
    return map;
  }, [expenseTypesData]);

  // Get banks as objects with id and bankName
  const banks = useMemo(() => banksData?.items ?? [], [banksData]);
  const bankIdByName = useMemo(() => {
    const map = new Map<string, number>();
    banks.forEach((b) => map.set(b.bankName, b.id));
    return map;
  }, [banks]);

  // Resolve filter selections to ids for the API
  const filterParams = useMemo(() => ({
    startDate,
    endDate,
    searchTerm: searchTerm || undefined,
    bankId: selectedBank !== "all" ? bankIdByName.get(selectedBank) : undefined,
    expenseTypeId: selectedCategory !== "all" ? expenseTypeIdByName.get(selectedCategory) : undefined,
  }), [startDate, endDate, searchTerm, selectedBank, selectedCategory, bankIdByName, expenseTypeIdByName]);

  // Reset to page 1 whenever any filter changes (not pageNumber itself).
  useEffect(() => {
    setPageNumber(1);
  }, [startDate, endDate, searchTerm, selectedBank, selectedCategory, pageSize]);

  const { data: expensesData, isLoading } = useExpenses({ pageNumber, pageSize, ...filterParams });
  const { data: summaryData } = useExpenseSummary(filterParams);
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();

  const formatAmount = (currency: string, amount: number) => {
    return `${currency} ${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const expenses = expensesData?.items || [];

  const handleAddExpense = (expenseData: {
    date: string;
    paymentType: string;
    paymentMode: string;
    category: string;
    bankId?: number;
    description: string;
    receipt: string;
    currencyId?: number;
    expenseTypeId?: number;
    amount: number;
    chequeNumber?: string;
    chequeDate?: string;
    postDatedValidDate?: string;
  }) => {
    const request: CreateExpenseRequest = {
      expenseDate: expenseData.date,
      paymentType: expenseData.paymentType as "Inwards" | "Outwards",
      paymentMode: paymentModeValues[expenseData.paymentMode] || expenseData.paymentMode,
      category: expenseData.category,
      bankId: expenseData.bankId,
      description: expenseData.description,
      receiptRef: expenseData.receipt !== "---" ? expenseData.receipt : undefined,
      chequeNumber: expenseData.chequeNumber,
      chequeDate: expenseData.chequeDate,
      postDatedValidDate: expenseData.postDatedValidDate,
      currencyId: expenseData.currencyId,
      expenseTypeId: expenseData.expenseTypeId,
      amount: expenseData.amount,
    };
    createExpense.mutate(request, {
      onSuccess: () => setIsModalOpen(false),
    });
  };

  const handleEditExpense = (expenseData: {
    date: string;
    paymentType: string;
    paymentMode: string;
    category: string;
    bankId?: number;
    description: string;
    receipt: string;
    currencyId?: number;
    expenseTypeId?: number;
    amount: number;
    chequeNumber?: string;
    chequeDate?: string;
    postDatedValidDate?: string;
  }) => {
    if (editingExpense) {
      const request: CreateExpenseRequest = {
        expenseDate: expenseData.date,
        paymentType: expenseData.paymentType as "Inwards" | "Outwards",
        paymentMode: paymentModeValues[expenseData.paymentMode] || expenseData.paymentMode,
        category: expenseData.category,
        bankId: expenseData.bankId,
        description: expenseData.description,
        receiptRef: expenseData.receipt !== "---" ? expenseData.receipt : undefined,
        chequeNumber: expenseData.chequeNumber,
        chequeDate: expenseData.chequeDate,
        postDatedValidDate: expenseData.postDatedValidDate,
        currencyId: expenseData.currencyId,
        expenseTypeId: expenseData.expenseTypeId,
        amount: expenseData.amount,
      };
      updateExpense.mutate({ id: editingExpense.id, data: request }, {
        onSuccess: () => {
          setEditingExpense(null);
          setIsModalOpen(false);
        },
      });
    }
  };

  const handleDeleteExpense = (id: number) => {
    deleteExpense.mutate(id);
  };

  const openEditModal = (expense: ApiExpense) => {
    setEditingExpense(expense);
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setEditingExpense(null);
    setIsModalOpen(true);
  };

  const buildReportQueryString = (params: ExpenseSummaryFilters) => {
    const query = new URLSearchParams({
      startDate: params.startDate ?? startDate,
      endDate: params.endDate ?? endDate,
    });
    if (params.searchTerm) query.append("searchTerm", params.searchTerm);
    if (params.bankId !== undefined) query.append("bankId", params.bankId.toString());
    if (params.expenseTypeId !== undefined) query.append("expenseTypeId", params.expenseTypeId.toString());
    if (params.paymentType) query.append("paymentType", params.paymentType);
    if (params.paymentMode) query.append("paymentMode", params.paymentMode);
    return query.toString();
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const response = await fetchBlob(`${API_BASE_URL}/invoices/expenses/excel?${buildReportQueryString(filterParams)}`);
      if (!response.ok) {
        throw new Error(`Export failed (${response.status})`);
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `DailyExpensesReport-${startDate}-to-${endDate}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to export Excel");
    } finally {
      setIsExporting(false);
    }
  };

  const formatBaseAmount = (amount: number) =>
    `${baseCurrencyCode} ${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <MainLayout>
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-foreground">All Expenses</h1>
          <PermissionGate permission="expense_add">
            <Button onClick={openAddModal} className="btn-success">
              <Plus className="h-4 w-4 mr-2" />
              Add New
            </Button>
          </PermissionGate>
        </div>

        {/* Filters */}
        <div className="bg-muted/30 border rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-green-600 mb-1 block">Date Range</label>
              <div className="flex gap-2 items-center">
                <DateInput value={startDate} onChange={setStartDate} placeholder="Start Date" />
                <span className="text-muted-foreground">-</span>
                <DateInput value={endDate} onChange={setEndDate} placeholder="End Date" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-green-600 mb-1 block">Bank</label>
              <SearchableSelect
                options={[
                  { value: "all", label: "Select All" },
                  ...banks.map((b) => ({ value: b.bankName, label: b.bankName }))
                ]}
                value={selectedBank}
                onValueChange={setSelectedBank}
                placeholder="Select All"
                searchPlaceholder="Search banks..."
              />
            </div>
            <div>
              <label className="text-sm font-medium text-green-600 mb-1 block">Expense Type</label>
              <SearchableSelect
                options={[
                  { value: "all", label: "Select All" },
                  ...expenseCategories.map((cat) => ({ value: cat, label: cat }))
                ]}
                value={selectedCategory}
                onValueChange={setSelectedCategory}
                placeholder="Select All"
                searchPlaceholder="Search expense types..."
              />
            </div>
            <div className="flex items-end gap-2">
              <Button
                onClick={() => window.open(`/accounts/expenses/print?${buildReportQueryString(filterParams)}`, '_blank')}
                variant="outline"
              >
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button
                onClick={handleExportExcel}
                disabled={isExporting}
                variant="outline"
              >
                {isExporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileSpreadsheet className="h-4 w-4 mr-2" />}
                Excel
              </Button>
            </div>
          </div>
        </div>

        {/* Totals summary */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="rounded-lg border bg-card p-3">
            <div className="text-xs text-muted-foreground">Cash Receipts</div>
            <div className="text-lg font-semibold">{formatBaseAmount(summaryData?.totalCashReceipts ?? 0)}</div>
          </div>
          <div className="rounded-lg border bg-card p-3">
            <div className="text-xs text-muted-foreground">Bank Receipts</div>
            <div className="text-lg font-semibold">{formatBaseAmount(summaryData?.totalBankReceipts ?? 0)}</div>
          </div>
          <div className="rounded-lg border bg-card p-3">
            <div className="text-xs text-muted-foreground">Cash Payments</div>
            <div className="text-lg font-semibold">{formatBaseAmount(summaryData?.totalCashPayments ?? 0)}</div>
          </div>
          <div className="rounded-lg border bg-card p-3">
            <div className="text-xs text-muted-foreground">Bank Payments</div>
            <div className="text-lg font-semibold">{formatBaseAmount(summaryData?.totalBankPayments ?? 0)}</div>
          </div>
          <div className="rounded-lg border bg-green-50 dark:bg-green-950/30 p-3">
            <div className="text-xs text-muted-foreground">Net Cash Flow</div>
            <div className={`text-lg font-bold ${(summaryData?.netCashFlow ?? 0) < 0 ? "text-destructive" : "text-green-700 dark:text-green-400"}`}>
              {formatBaseAmount(summaryData?.netCashFlow ?? 0)}
            </div>
          </div>
        </div>

        {/* Search and Table */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Show</span>
              <SearchableSelect
                options={[
                  { value: "10", label: "10" },
                  { value: "25", label: "25" },
                  { value: "50", label: "50" },
                  { value: "100", label: "100" },
                ]}
                value={pageSize.toString()}
                onValueChange={(v) => setPageSize(parseInt(v))}
                triggerClassName="w-[90px]"
              />
              <span className="text-sm text-muted-foreground">entries</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Search:</span>
              <Input
                placeholder="Search description, cheque, ref..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-64"
              />
            </div>
          </div>

        <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-table-header">
                  <TableHead className="text-table-header-foreground font-semibold">Date</TableHead>
                  <TableHead className="text-table-header-foreground font-semibold">Payment Type/Mode</TableHead>
                  <TableHead className="text-table-header-foreground font-semibold">Category</TableHead>
                  <TableHead className="text-table-header-foreground font-semibold">Bank</TableHead>
                  <TableHead className="text-table-header-foreground font-semibold">Description</TableHead>
                  <TableHead className="text-table-header-foreground font-semibold">Receipt</TableHead>
                  <TableHead className="text-table-header-foreground font-semibold">Payment</TableHead>
                  <TableHead className="text-table-header-foreground font-semibold">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No expenses found
                    </TableCell>
                  </TableRow>
                ) : (
                  expenses.map((expense, index) => (
                    <TableRow key={expense.id} className={`border-b border-border hover:bg-table-row-hover transition-colors ${index % 2 === 0 ? "bg-card" : "bg-secondary/30"}`}>
                      <TableCell className="whitespace-nowrap">{formatDate(expense.expenseDate)}</TableCell>
                      <TableCell>{expense.paymentType} || {paymentModeLabels[expense.paymentMode] || expense.paymentMode}</TableCell>
                      <TableCell>{expense.category}</TableCell>
                      <TableCell>{expense.bankName || "---"}</TableCell>
                      <TableCell className="max-w-md">{expense.description}</TableCell>
                      <TableCell>{expense.receiptRef || "---"}</TableCell>
                      <TableCell className="text-right whitespace-nowrap">{formatAmount(expense.currencyCode || "", expense.amount)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            className="bg-blue-500 hover:bg-blue-600 text-white h-8 w-8 p-0"
                            title="View"
                            onClick={() => setViewingExpense(expense)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <PermissionGate permission="expense_edit">
                            <Button
                              size="sm"
                              className="bg-primary hover:bg-primary/90 text-primary-foreground h-8 w-8 p-0"
                              title="Edit"
                              onClick={() => openEditModal(expense)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </PermissionGate>
                          <PermissionGate permission="expense_delete">
                            <Button
                              size="sm"
                              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground h-8 w-8 p-0"
                              title="Delete"
                              onClick={() => handleDeleteExpense(expense.id)}
                              disabled={deleteExpense.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </PermissionGate>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Pagination */}
        {expensesData && (
          <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                Showing {expensesData.totalCount > 0 ? (pageNumber - 1) * pageSize + 1 : 0} to {Math.min(pageNumber * pageSize, expensesData.totalCount)} of {expensesData.totalCount} entries
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                  disabled={pageNumber === 1}
                >
                  Previous
                </Button>
                {expensesData.totalPages > 0 && Array.from({ length: Math.min(7, expensesData.totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (expensesData.totalPages <= 7) {
                    pageNum = i + 1;
                  } else if (pageNumber <= 4) {
                    pageNum = i + 1;
                  } else if (pageNumber >= expensesData.totalPages - 3) {
                    pageNum = expensesData.totalPages - 6 + i;
                  } else {
                    pageNum = pageNumber - 3 + i;
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={pageNumber === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPageNumber(pageNum)}
                      className="w-8"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                {expensesData.totalPages > 7 && pageNumber < expensesData.totalPages - 3 && (
                  <>
                    <span className="px-2">...</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPageNumber(expensesData.totalPages)}
                      className="w-8"
                    >
                      {expensesData.totalPages}
                    </Button>
                  </>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPageNumber((p) => Math.min(expensesData.totalPages, p + 1))}
                  disabled={pageNumber === expensesData.totalPages || expensesData.totalPages === 0}
                >
                  Next
                </Button>
            </div>
          </div>
        )}
      </div>

      <ExpenseModal
        open={isModalOpen}
        onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) setEditingExpense(null);
        }}
        onSubmit={editingExpense ? handleEditExpense : handleAddExpense}
        expense={editingExpense}
        banks={banks}
        isSubmitting={createExpense.isPending || updateExpense.isPending}
      />

      <Dialog open={!!viewingExpense} onOpenChange={() => setViewingExpense(null)}>
        <DialogContent className="max-w-modal-lg p-0 bg-card">
          <DialogHeader className="bg-modal-header text-white p-4 rounded-t-lg">
            <DialogTitle className="text-white">Expense Details</DialogTitle>
          </DialogHeader>
          {viewingExpense && (
            <div className="p-6 space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="font-medium text-muted-foreground">Date:</span> <span>{formatDate(viewingExpense.expenseDate)}</span></div>
                <div><span className="font-medium text-muted-foreground">Payment Type:</span> <span>{viewingExpense.paymentType}</span></div>
                <div><span className="font-medium text-muted-foreground">Payment Mode:</span> <span>{paymentModeLabels[viewingExpense.paymentMode] || viewingExpense.paymentMode}</span></div>
                <div><span className="font-medium text-muted-foreground">Category:</span> <span>{viewingExpense.category}</span></div>
                <div><span className="font-medium text-muted-foreground">Bank:</span> <span>{viewingExpense.bankName || "---"}</span></div>
                <div><span className="font-medium text-muted-foreground">Amount:</span> <span>{formatAmount(viewingExpense.currencyCode || "", viewingExpense.amount)}</span></div>
                <div><span className="font-medium text-muted-foreground">Receipt Ref:</span> <span>{viewingExpense.receiptRef || "---"}</span></div>
                {viewingExpense.chequeNumber && (
                  <>
                    <div><span className="font-medium text-muted-foreground">Cheque No:</span> <span>{viewingExpense.chequeNumber}</span></div>
                    <div><span className="font-medium text-muted-foreground">Cheque Date:</span> <span>{viewingExpense.chequeDate ? formatDate(viewingExpense.chequeDate) : "---"}</span></div>
                  </>
                )}
                {viewingExpense.postDatedValidDate && (
                  <div><span className="font-medium text-muted-foreground">Valid Date (Maturity):</span> <span>{formatDate(viewingExpense.postDatedValidDate)}</span></div>
                )}
              </div>
              {viewingExpense.description && (
                <div className="text-sm">
                  <span className="font-medium text-muted-foreground">Description:</span>
                  <p className="mt-1">{viewingExpense.description}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
