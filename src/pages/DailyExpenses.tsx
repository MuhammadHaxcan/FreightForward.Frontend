import { useState, useMemo } from "react";
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
import { Plus, Printer, Search, Eye, Pencil, Trash2, Loader2, Edit } from "lucide-react";
import { DateInput } from "@/components/ui/date-input";
import { ExpenseModal } from "@/components/expenses/ExpenseModal";
import { useAllExpenseTypes } from "@/hooks/useSettings";
import { useBanks } from "@/hooks/useBanks";
import { useExpenses, useCreateExpense, useUpdateExpense, useDeleteExpense } from "@/hooks/useExpenses";
import { Expense as ApiExpense, CreateExpenseRequest } from "@/services/api";
import { PermissionGate } from "@/components/auth/PermissionGate";

// Map PaymentMode enum values to display labels
const paymentModeLabels: Record<string, string> = {
  "Cash": "CASH",
  "Cheque": "CHEQUE",
  "BankWire": "BANK WIRE",
  "BankTransfer": "BANK TRANSFER",
  "Card": "CARD",
};

// Map display labels back to enum values
const paymentModeValues: Record<string, string> = {
  "CASH": "Cash",
  "CHEQUE": "Cheque",
  "BANK WIRE": "BankWire",
  "BANK TRANSFER": "BankTransfer",
  "CARD": "Card",
};

export default function DailyExpenses() {
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

  // Fetch expenses from API
  const { data: expensesData, isLoading } = useExpenses({ pageNumber, pageSize });
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();

  // Fetch expense types from Settings API
  const { data: expenseTypesData } = useAllExpenseTypes();
  const { data: banksData } = useBanks({ pageSize: 100 });

  // Map expense types to category names
  const expenseCategories = useMemo(() => {
    if (!Array.isArray(expenseTypesData)) return [];
    return expenseTypesData.map((et) => et.name);
  }, [expenseTypesData]);

  // Get banks as objects with id and bankName
  const banks = useMemo(() => {
    if (!banksData?.items) return [];
    return banksData.items;
  }, [banksData]);

  // Map banks to bank names for filter dropdown
  const bankNames = useMemo(() => {
    return banks.map((b) => b.bankName);
  }, [banks]);

  const formatAmount = (currency: string, amount: number) => {
    return `${currency} ${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Get expenses from API data
  const expenses = expensesData?.items || [];

  // Filter expenses
  const filteredExpenses = expenses.filter((expense) => {
    const matchesSearch = (expense.description || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBank = selectedBank === "all" || expense.bankName === selectedBank;
    const matchesCategory = selectedCategory === "all" || expense.category === selectedCategory;
    const expenseDate = new Date(expense.expenseDate);
    const matchesDateRange = expenseDate >= new Date(startDate) && expenseDate <= new Date(endDate);
    return matchesSearch && matchesBank && matchesCategory && matchesDateRange;
  });

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
        <div className="bg-card rounded-lg border p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Date Range</label>
              <div className="flex gap-2 items-center">
                <DateInput value={startDate} onChange={setStartDate} placeholder="Start Date" />
                <span className="text-muted-foreground">-</span>
                <DateInput value={endDate} onChange={setEndDate} placeholder="End Date" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Bank</label>
              <SearchableSelect
                options={[
                  { value: "all", label: "Select All" },
                  ...bankNames.map((bank) => ({ value: bank, label: bank }))
                ]}
                value={selectedBank}
                onValueChange={setSelectedBank}
                placeholder="Select All"
                searchPlaceholder="Search banks..."
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Expense Type</label>
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
              <Button className="bg-primary hover:bg-primary/90">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
              <Button
                onClick={() => {
                  const params = new URLSearchParams({ startDate, endDate });
                  if (selectedBank !== "all") params.append("bank", selectedBank);
                  if (selectedCategory !== "all") params.append("category", selectedCategory);
                  window.open(`/accounts/expenses/print?${params.toString()}`, '_blank');
                }}
                variant="outline"
              >
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
            </div>
          </div>
        </div>

        {/* Search and Table */}
        <div className="bg-card rounded-lg border">
          <div className="p-4 flex justify-between items-center">
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
                onValueChange={(v) => {
                  setPageSize(parseInt(v));
                  setPageNumber(1);
                }}
                triggerClassName="w-[90px]"
              />
              <span className="text-sm text-muted-foreground">entries</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Search:</span>
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-48"
              />
            </div>
          </div>

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
                {filteredExpenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No expenses found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredExpenses.map((expense) => (
                    <TableRow key={expense.id} className="hover:bg-table-row-hover">
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
                            className="bg-yellow-500 hover:bg-yellow-600 text-white h-8 w-8 p-0"
                            title="View"
                            onClick={() => setViewingExpense(expense)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <PermissionGate permission="expense_edit">
                            <Button
                              size="sm"
                              className="bg-amber-500 hover:bg-amber-600 text-white h-8 w-8 p-0"
                              title="Edit"
                              onClick={() => openEditModal(expense)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </PermissionGate>
                          <PermissionGate permission="expense_delete">
                            <Button
                              size="sm"
                              className="bg-red-500 hover:bg-red-600 text-white h-8 w-8 p-0"
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

          {/* Pagination */}
          {expensesData && (
            <div className="p-4 flex justify-between items-center">
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
        <DialogContent className="max-w-lg p-0 bg-card">
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
