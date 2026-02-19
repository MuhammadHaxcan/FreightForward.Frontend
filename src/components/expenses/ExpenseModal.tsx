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
import { SearchableSelect } from "@/components/ui/searchable-select";
import { DateInput } from "@/components/ui/date-input";
import { format } from "date-fns";
import { useExpenseTypesByDirection, useAllCurrencyTypes } from "@/hooks/useSettings";
import { useBaseCurrency } from "@/hooks/useBaseCurrency";
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
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
  open,
  onOpenChange,
  onSubmit,
  expense,
  banks,
  isSubmitting = false,
}: ExpenseModalProps) {
  const baseCurrencyCode = useBaseCurrency();
  const [formData, setFormData] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    paymentType: "" as "" | "Inwards" | "Outwards",
    paymentMode: "",
    category: "",
    bankId: undefined as number | undefined,
    description: "",
    receipt: "---",
    currencyCode: baseCurrencyCode,
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
  const categories = Array.isArray(expenseTypesData) ? expenseTypesData.map((et) => et.name) : [];

  // Map currency types to currency codes
  const currencies = Array.isArray(currencyTypesData) ? currencyTypesData.map((ct) => ct.code) : [];

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
        currencyCode: expense.currencyCode || baseCurrencyCode,
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
        currencyCode: baseCurrencyCode,
        amount: 0,
        chequeNumber: "",
        chequeDate: "",
      });
    }
  }, [expense, open, banks]);

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
    const currencyId = Array.isArray(currencyTypesData) ? currencyTypesData.find(ct => ct.code === formData.currencyCode)?.id : undefined;
    const expenseTypeId = Array.isArray(expenseTypesData) ? expenseTypesData.find(et => et.name === formData.category)?.id : undefined;
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0">
        <DialogHeader className="bg-modal-header text-white p-4 rounded-t-lg">
          <DialogTitle className="text-white text-lg font-semibold">{expense ? "Edit Record" : "New Record"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="form-label">Payment Type</label>
              <SearchableSelect
                options={paymentTypes.map((type) => ({ value: type, label: type }))}
                value={formData.paymentType}
                onValueChange={handlePaymentTypeChange}
                placeholder="Select One"
                searchPlaceholder="Search..."
              />
            </div>
            <div>
              <label className="form-label">Expense Type</label>
              <SearchableSelect
                options={categories.map((cat) => ({ value: cat, label: cat }))}
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
                disabled={!formData.paymentType || isLoadingCategories}
                placeholder={
                  !formData.paymentType
                    ? "Select Payment Type first"
                    : isLoadingCategories
                      ? "Loading..."
                      : "Select Category"
                }
                searchPlaceholder="Search..."
                emptyMessage={isLoadingCategories ? "Loading..." : "No categories found"}
              />
            </div>
            <div>
              <label className="form-label">Description</label>
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
              <label className="form-label">Currency</label>
              <SearchableSelect
                options={currencies.map((cur) => ({ value: cur, label: cur }))}
                value={formData.currencyCode}
                onValueChange={(value) => setFormData({ ...formData, currencyCode: value })}
                disabled={isLoadingCurrencies}
                placeholder={isLoadingCurrencies ? "Loading..." : "Select Currency"}
                searchPlaceholder="Search..."
                emptyMessage={isLoadingCurrencies ? "Loading..." : "No currencies found"}
              />
            </div>
            <div>
              <label className="form-label">Amount</label>
              <Input
                type="number"
                placeholder="Paid Amount"
                value={formData.amount || ""}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label className="form-label">Bill Copy</label>
              <Input type="file" className="cursor-pointer" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="form-label">Payment Mode</label>
              <SearchableSelect
                options={paymentModes.map((mode) => ({ value: mode, label: mode }))}
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
                placeholder="Select Payment Type"
                searchPlaceholder="Search..."
              />
            </div>
            <div>
              <label className="form-label">Bank</label>
              <SearchableSelect
                options={banks.map((bank) => ({ value: bank.id.toString(), label: bank.bankName }))}
                value={formData.bankId?.toString() || ""}
                onValueChange={handleBankChange}
                disabled={!requiresBank}
                triggerClassName={!requiresBank ? "bg-muted" : ""}
                placeholder="Select Bank"
                searchPlaceholder="Search..."
              />
            </div>
            <div>
              <label className="form-label">Expense Date</label>
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
                <label className="form-label">Cheque Number</label>
                <Input
                  placeholder="Enter cheque number"
                  value={formData.chequeNumber}
                  onChange={(e) => setFormData({ ...formData, chequeNumber: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">Cheque Date</label>
                <DateInput
                  value={formData.chequeDate}
                  onChange={(value) => setFormData({ ...formData, chequeDate: value })}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="btn-success" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Submit
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
