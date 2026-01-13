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
import { Plus, Printer, Search, Eye, Pencil, Trash2 } from "lucide-react";
import { DateInput } from "@/components/ui/date-input";
import { ExpenseModal } from "@/components/expenses/ExpenseModal";
import { ExpensePrintView } from "@/components/expenses/ExpensePrintView";
import { useAllExpenseTypes } from "@/hooks/useSettings";
import { useBanks } from "@/hooks/useBanks";

interface Expense {
  id: string;
  date: string;
  paymentType: string;
  paymentMode: string;
  category: string;
  bank: string;
  description: string;
  receipt: string;
  currency: string;
  amount: number;
  chequeNumber?: string;
  chequeDate?: string;
}

const mockExpenses: Expense[] = [
  {
    id: "1",
    date: "2025-09-15",
    paymentType: "Outwards",
    paymentMode: "BANK WIRE",
    category: "NETWORK MEMBERSHIP",
    bank: "---",
    description: "AMOUNT OF USD 2700/- PAID TO IFC8 InFinite Connection Annual Membership Fees - Renewal for September 19, 2025 through September 18, 2026. For Doha.",
    receipt: "---",
    currency: "USD",
    amount: 2700.00,
  },
  {
    id: "2",
    date: "2025-07-15",
    paymentType: "Outwards",
    paymentMode: "CHEQUE",
    category: "OFFICE RENT EXPENSE",
    bank: "EMIRATES ISLAMIC BANK",
    description: "C/NO. 000245 DATED 15-JUL-2025 FOR AED 6,250/- PAID TO SHROOQ BUSINESS FOR OFFICE RENT.",
    receipt: "---",
    currency: "AED",
    amount: 6250.00,
  },
  {
    id: "3",
    date: "2025-04-15",
    paymentType: "Outwards",
    paymentMode: "CHEQUE",
    category: "OFFICE RENT EXPENSE",
    bank: "EMIRATES ISLAMIC BANK",
    description: "C/NO. 000244 DATED 15-APR-2025 FOR AED 6,250/- PAID TO SHROOQ BUSINESS FOR OFFICE RENT.",
    receipt: "---",
    currency: "AED",
    amount: 6250.00,
  },
  {
    id: "4",
    date: "2025-01-15",
    paymentType: "Outwards",
    paymentMode: "CHEQUE",
    category: "OFFICE RENT EXPENSE",
    bank: "EMIRATES ISLAMIC BANK",
    description: "C/NO. 000243 DATED 15-JAN-2025 FOR AED 6,250/- PAID TO SHROOQ BUSINESS FOR OFFICE RENT.",
    receipt: "---",
    currency: "AED",
    amount: 6250.00,
  },
  {
    id: "5",
    date: "2024-10-15",
    paymentType: "Outwards",
    paymentMode: "CHEQUE",
    category: "OFFICE RENT EXPENSE",
    bank: "EMIRATES ISLAMIC BANK",
    description: "C/NO. 000242 DATED 15-OCT-2024 FOR AED 3,250/- PAID TO SHROOQ BUSINESS FOR OFFICE RENT.",
    receipt: "---",
    currency: "AED",
    amount: 3250.00,
  },
  {
    id: "6",
    date: "2024-09-10",
    paymentType: "Outwards",
    paymentMode: "CHEQUE",
    category: "OFFICE RENT EXPENSE",
    bank: "EMIRATES ISLAMIC BANK",
    description: "C/NO. 000241 DATED 10-SEPT-2024 FOR AED 4,250/- PAID TO SHROOQ BUSINESS FOR OFFICE RENT.",
    receipt: "---",
    currency: "AED",
    amount: 4250.00,
  },
  {
    id: "7",
    date: "2025-07-09",
    paymentType: "Outwards",
    paymentMode: "CASH",
    category: "Car Repair & Maintenance",
    bank: "---",
    description: "CASH PAID FOR CAR PARKING CHGS OF BMW OF BABAR BHAI FOR JULY-2025",
    receipt: "---",
    currency: "AED",
    amount: 300.00,
  },
];


export default function DailyExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>(mockExpenses);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("2025-01-01");
  const [endDate, setEndDate] = useState("2025-12-31");
  const [selectedBank, setSelectedBank] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [showPrintView, setShowPrintView] = useState(false);

  // Fetch expense types from Settings API
  const { data: expenseTypesData } = useAllExpenseTypes();
  const { data: banksData } = useBanks({ pageSize: 100 });

  // Map expense types to category names
  const expenseCategories = useMemo(() => {
    if (!expenseTypesData) return [];
    return expenseTypesData.map((et) => et.name);
  }, [expenseTypesData]);

  // Map banks to bank names
  const banks = useMemo(() => {
    if (!banksData?.items) return [];
    return banksData.items.map((b) => b.bankName);
  }, [banksData]);

  // Using formatDate from utils with "dd MMM yyyy" format

  const formatAmount = (currency: string, amount: number) => {
    return `${currency} ${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const filteredExpenses = expenses.filter((expense) => {
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBank = selectedBank === "all" || expense.bank === selectedBank;
    const matchesCategory = selectedCategory === "all" || expense.category === selectedCategory;
    const expenseDate = new Date(expense.date);
    const matchesDateRange = expenseDate >= new Date(startDate) && expenseDate <= new Date(endDate);
    return matchesSearch && matchesBank && matchesCategory && matchesDateRange;
  });

  const handleAddExpense = (expenseData: Omit<Expense, "id">) => {
    const newExpense: Expense = {
      ...expenseData,
      id: Date.now().toString(),
    };
    setExpenses([newExpense, ...expenses]);
    setIsModalOpen(false);
  };

  const handleEditExpense = (expenseData: Omit<Expense, "id">) => {
    if (editingExpense) {
      setExpenses(expenses.map(e => 
        e.id === editingExpense.id ? { ...expenseData, id: e.id } : e
      ));
      setEditingExpense(null);
      setIsModalOpen(false);
    }
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses(expenses.filter(e => e.id !== id));
  };

  const openEditModal = (expense: Expense) => {
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
        expenses={filteredExpenses} 
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
                  {banks.map((bank) => (
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
              {filteredExpenses.map((expense) => (
                <TableRow key={expense.id} className="hover:bg-muted/30">
                  <TableCell className="whitespace-nowrap">{formatDate(expense.date)}</TableCell>
                  <TableCell>{expense.paymentType} || {expense.paymentMode}</TableCell>
                  <TableCell>{expense.category}</TableCell>
                  <TableCell>{expense.bank}</TableCell>
                  <TableCell className="max-w-md">{expense.description}</TableCell>
                  <TableCell>{expense.receipt}</TableCell>
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
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

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
      />
    </MainLayout>
  );
}
