import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Printer, Search, Eye, Pencil, Trash2, Loader2 } from "lucide-react";
import { DateInput } from "@/components/ui/date-input";
import { ExpenseModal } from "@/components/expenses/ExpenseModal";
import { ExpensePrintView } from "@/components/expenses/ExpensePrintView";
import { useAllExpenseTypes } from "@/hooks/useSettings";
import { useBanks } from "@/hooks/useBanks";
import { useExpenses, useCreateExpense, useUpdateExpense, useDeleteExpense } from "@/hooks/useExpenses";
import { Expense as ApiExpense, CreateExpenseRequest } from "@/services/api";

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
  const [startDate, setStartDate] = useState("2025-01-01");
  const [endDate, setEndDate] = useState("2025-12-31");
  const [selectedBank, setSelectedBank] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ApiExpense | null>(null);
  const [showPrintView, setShowPrintView] = useState(false);

  // Fetch expenses from API
  const { data: expensesData, isLoading } = useExpenses({ pageSize: 100 });
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();

  // Fetch expense types from Settings API
  const { data: expenseTypesData } = useAllExpenseTypes();
  const { data: banksData } = useBanks({ pageSize: 100 });

  // Map expense types to category names
  const expenseCategories = useMemo(() => {
    if (!expenseTypesData) return [];
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

  // Map expenses for print view (convert to expected format)
  const printExpenses = filteredExpenses.map((e) => ({
    id: e.id.toString(),
    date: e.expenseDate,
    paymentType: e.paymentType,
    paymentMode: paymentModeLabels[e.paymentMode] || e.paymentMode,
    category: e.category,
    bank: e.bankName || "---",
    description: e.description || "",
    receipt: e.receiptRef || "---",
    currency: e.currency,
    amount: e.amount,
    chequeNumber: e.chequeNumber,
    chequeDate: e.chequeDate,
  }));

  const handleAddExpense = (expenseData: {
    date: string;
    paymentType: string;
    paymentMode: string;
    category: string;
    bankId?: number;
    description: string;
    receipt: string;
    currency: string;
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
      currency: expenseData.currency,
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
    currency: string;
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
        currency: expenseData.currency,
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

  if (showPrintView) {
    return (
      <ExpensePrintView
        expenses={printExpenses}
        startDate={startDate}
        endDate={endDate}
        onClose={() => setShowPrintView(false)}
      />
    );
  }

  return (
    <MainLayout>
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-foreground">All Expenses</h1>
          <Button onClick={openAddModal} className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Add New
          </Button>
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
              <Select value={selectedBank} onValueChange={setSelectedBank}>
                <SelectTrigger>
                  <SelectValue placeholder="Select All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Select All</SelectItem>
                  {bankNames.map((bank) => (
                    <SelectItem key={bank} value={bank}>{bank}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Expense Type</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Select All</SelectItem>
                  {expenseCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button className="bg-primary hover:bg-primary/90">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
              <Button onClick={() => setShowPrintView(true)} variant="outline">
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
            </div>
          </div>
        </div>

        {/* Search and Table */}
        <div className="bg-card rounded-lg border">
          <div className="p-4 flex justify-end">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Search:</span>
              <Input
                placeholder=""
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
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Date</TableHead>
                  <TableHead className="font-semibold">Payment Type/Mode</TableHead>
                  <TableHead className="font-semibold">Category</TableHead>
                  <TableHead className="font-semibold">Bank</TableHead>
                  <TableHead className="font-semibold">Description</TableHead>
                  <TableHead className="font-semibold">Receipt</TableHead>
                  <TableHead className="font-semibold text-right">Payment</TableHead>
                  <TableHead className="font-semibold text-center">Action</TableHead>
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
                    <TableRow key={expense.id} className="hover:bg-muted/30">
                      <TableCell className="whitespace-nowrap">{formatDate(expense.expenseDate)}</TableCell>
                      <TableCell>{expense.paymentType} || {paymentModeLabels[expense.paymentMode] || expense.paymentMode}</TableCell>
                      <TableCell>{expense.category}</TableCell>
                      <TableCell>{expense.bankName || "---"}</TableCell>
                      <TableCell className="max-w-md">{expense.description}</TableCell>
                      <TableCell>{expense.receiptRef || "---"}</TableCell>
                      <TableCell className="text-right whitespace-nowrap">{formatAmount(expense.currency, expense.amount)}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-primary/80">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-primary hover:text-primary/80"
                            onClick={() => openEditModal(expense)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive/80"
                            onClick={() => handleDeleteExpense(expense.id)}
                            disabled={deleteExpense.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          <div className="p-4 flex justify-end">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled>Previous</Button>
              <Button variant="default" size="sm" className="bg-primary">1</Button>
              <Button variant="outline" size="sm" disabled>Next</Button>
            </div>
          </div>
        </div>
      </div>

      <ExpenseModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingExpense(null);
        }}
        onSubmit={editingExpense ? handleEditExpense : handleAddExpense}
        expense={editingExpense}
        banks={banks}
        isSubmitting={createExpense.isPending || updateExpense.isPending}
      />
    </MainLayout>
  );
}
