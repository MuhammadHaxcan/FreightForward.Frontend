import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateInput } from "@/components/ui/date-input";
import { format } from "date-fns";
import { useExpenseTypesByDirection, useAllCurrencyTypes } from "@/hooks/useSettings";
import { Expense as ApiExpense, Bank } from "@/services/api";
import { Loader2 } from "lucide-react";

// Map PaymentMode enum values to display labels
const paymentModeLabels: Record<string, string> = {
  "Cash": "CASH",
  "Cheque": "CHEQUE",
  "BankWire": "BANK WIRE",
  "BankTransfer": "BANK TRANSFER",
  "Card": "CARD",
};

// Map display labels back to enum values
const paymentModeToEnum: Record<string, string> = {
  "CASH": "Cash",
  "CHEQUE": "Cheque",
  "BANK WIRE": "BankWire",
  "BANK TRANSFER": "BankTransfer",
  "CARD": "Card",
};

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (expense: {
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
  }) => void;
  expense: ApiExpense | null;
  banks: Bank[];
  isSubmitting?: boolean;
}

const paymentModeConfig: Record<string, { requiresBank: boolean; requiresChequeDetails: boolean }> = {
  "CASH": { requiresBank: false, requiresChequeDetails: false },
  "CHEQUE": { requiresBank: true, requiresChequeDetails: true },
  "BANK WIRE": { requiresBank: true, requiresChequeDetails: false },
  "BANK TRANSFER": { requiresBank: true, requiresChequeDetails: false },
  "CARD": { requiresBank: true, requiresChequeDetails: false },
};

const paymentTypes = ["Inwards", "Outwards"] as const;
const paymentModes = ["CASH", "CHEQUE", "BANK WIRE", "BANK TRANSFER", "CARD"];

export function ExpenseModal({
  isOpen,
  onClose,
  onSubmit,
  expense,
  banks,
  isSubmitting = false,
}: ExpenseModalProps) {
  const [formData, setFormData] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    paymentType: "" as "" | "Inwards" | "Outwards",
    paymentMode: "",
    category: "",
    bankId: undefined as number | undefined,
    description: "",
    receipt: "---",
    currencyCode: "AED",
    amount: 0,
    chequeNumber: "",
    chequeDate: "",
  });

  // Fetch expense categories based on selected payment type
  const { data: expenseTypesData, isLoading: isLoadingCategories } = useExpenseTypesByDirection(
    formData.paymentType || null
  );

  // Fetch currency types from database
  const { data: currencyTypesData, isLoading: isLoadingCurrencies } = useAllCurrencyTypes();

  // Map expense types to category names
  const categories = expenseTypesData?.map((et) => et.name) || [];

  // Map currency types to currency codes
  const currencies = currencyTypesData?.map((ct) => ct.code) || [];

  useEffect(() => {
    if (expense) {
      // Find bankId from bank name if not available
      const bankId = expense.bankId || banks.find(b => b.bankName === expense.bankName)?.id;
      setFormData({
        date: expense.expenseDate,
        paymentType: expense.paymentType as "" | "Inwards" | "Outwards",
        paymentMode: paymentModeLabels[expense.paymentMode] || expense.paymentMode,
        category: expense.category,
        bankId: bankId,
        description: expense.description || "",
        receipt: expense.receiptRef || "---",
        currencyCode: expense.currencyCode || "AED",
        amount: expense.amount,
        chequeNumber: expense.chequeNumber || "",
        chequeDate: expense.chequeDate || "",
      });
    } else {
      setFormData({
        date: format(new Date(), "yyyy-MM-dd"),
        paymentType: "",
        paymentMode: "",
        category: "",
        bankId: undefined,
        description: "",
        receipt: "---",
        currencyCode: "AED",
        amount: 0,
        chequeNumber: "",
        chequeDate: "",
      });
    }
  }, [expense, isOpen, banks]);

  const requiresBank = paymentModeConfig[formData.paymentMode]?.requiresBank ?? false;
  const requiresChequeDetails = paymentModeConfig[formData.paymentMode]?.requiresChequeDetails ?? false;

  const handlePaymentTypeChange = (value: "Inwards" | "Outwards") => {
    // Clear category when payment type changes since categories are different per type
    setFormData({ ...formData, paymentType: value, category: "" });
  };

  const handleBankChange = (value: string) => {
    const bankId = value ? parseInt(value, 10) : undefined;
    setFormData({ ...formData, bankId });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const currencyId = currencyTypesData?.find(ct => ct.code === formData.currencyCode)?.id;
    const expenseTypeId = expenseTypesData?.find(et => et.name === formData.category)?.id;
    onSubmit({
      date: formData.date,
      paymentType: formData.paymentType,
      paymentMode: formData.paymentMode,
      category: formData.category,
      bankId: formData.bankId,
      description: formData.description,
      receipt: formData.receipt,
      currencyId,
      expenseTypeId,
      amount: formData.amount,
      chequeNumber: formData.chequeNumber || undefined,
      chequeDate: formData.chequeDate || undefined,
    });
  };

  // Get selected bank name for display
  const selectedBankName = formData.bankId
    ? banks.find(b => b.id === formData.bankId)?.bankName
    : "";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{expense ? "Edit Record" : "New Record"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Payment Type</label>
              <Select
                value={formData.paymentType}
                onValueChange={handlePaymentTypeChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select One" />
                </SelectTrigger>
                <SelectContent>
                  {paymentTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Category</label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
                disabled={!formData.paymentType || isLoadingCategories}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    !formData.paymentType
                      ? "Select Payment Type first"
                      : isLoadingCategories
                        ? "Loading..."
                        : "Select Category"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {categories.length === 0 && !isLoadingCategories && formData.paymentType ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">No categories found</div>
                  ) : (
                    categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Description</label>
              <Textarea
                placeholder="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Currency</label>
              <Select
                value={formData.currencyCode}
                onValueChange={(value) => setFormData({ ...formData, currencyCode: value })}
                disabled={isLoadingCurrencies}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingCurrencies ? "Loading..." : "Select Currency"} />
                </SelectTrigger>
                <SelectContent>
                  {currencies.length === 0 && !isLoadingCurrencies ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">No currencies found</div>
                  ) : (
                    currencies.map((cur) => (
                      <SelectItem key={cur} value={cur}>{cur}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Amount</label>
              <Input
                type="number"
                placeholder="Paid Amount"
                value={formData.amount || ""}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Bill Copy</label>
              <Input type="file" className="cursor-pointer" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Payment Mode</label>
              <Select
                value={formData.paymentMode}
                onValueChange={(value) => {
                  const config = paymentModeConfig[value];
                  setFormData({
                    ...formData,
                    paymentMode: value,
                    bankId: config?.requiresBank ? formData.bankId : undefined,
                    chequeNumber: config?.requiresChequeDetails ? formData.chequeNumber : "",
                    chequeDate: config?.requiresChequeDetails ? formData.chequeDate : "",
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Payment Type" />
                </SelectTrigger>
                <SelectContent>
                  {paymentModes.map((mode) => (
                    <SelectItem key={mode} value={mode}>{mode}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Bank</label>
              <Select
                value={formData.bankId?.toString() || ""}
                onValueChange={handleBankChange}
                disabled={!requiresBank}
              >
                <SelectTrigger className={!requiresBank ? "bg-muted" : ""}>
                  <SelectValue placeholder="Select Bank">
                    {selectedBankName || "Select Bank"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {banks.map((bank) => (
                    <SelectItem key={bank.id} value={bank.id.toString()}>{bank.bankName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Expense Date</label>
              <DateInput
                value={formData.date}
                onChange={(value) => setFormData({ ...formData, date: value })}
              />
            </div>
          </div>

          {/* Cheque-specific fields - only shown when CHEQUE is selected */}
          {requiresChequeDetails && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg border">
              <div>
                <label className="text-sm font-medium mb-1 block">Cheque Number</label>
                <Input
                  placeholder="Enter cheque number"
                  value={formData.chequeNumber}
                  onChange={(e) => setFormData({ ...formData, chequeNumber: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Cheque Date</label>
                <DateInput
                  value={formData.chequeDate}
                  onChange={(value) => setFormData({ ...formData, chequeDate: value })}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Submit
            </Button>
            <Button type="button" variant="ghost" onClick={onClose}>
              Close
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
