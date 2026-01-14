import { useState, useEffect } from "react";
import { format } from "date-fns";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  receiptApi,
  customerApi,
  bankApi,
  settingsApi,
  type Customer,
  type Bank,
  type UnpaidInvoice,
  type PaymentType,
  type PaymentMode,
  type Currency,
  type CurrencyType,
  type CreateReceiptRequest,
} from "@/services/api";
import { toast } from "sonner";

interface RecordReceiptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface SelectedInvoice {
  invoiceId: number;
  invoiceNo: string;
  totalAmount: number;
  pendingAmount: number;
  payingAmount: number;
  currency: Currency;
}

export default function RecordReceiptModal({
  open,
  onOpenChange,
  onSuccess,
}: RecordReceiptModalProps) {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [paymentTypes, setPaymentTypes] = useState<PaymentType[]>([]);
  const [currencies, setCurrencies] = useState<CurrencyType[]>([]);
  const [unpaidInvoices, setUnpaidInvoices] = useState<UnpaidInvoice[]>([]);
  const [nextReceiptNo, setNextReceiptNo] = useState("");

  // Form state
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [selectedInvoices, setSelectedInvoices] = useState<SelectedInvoice[]>([]);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("Cash");
  const [receiptDate, setReceiptDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [currency, setCurrency] = useState<Currency>("USD");
  const [bankId, setBankId] = useState<number | null>(null);
  const [chequeNo, setChequeNo] = useState("");
  const [chequeDate, setChequeDate] = useState("");
  const [chequeBank, setChequeBank] = useState("");
  const [remarks, setRemarks] = useState("");

  // Get current payment type config
  const currentPaymentType = paymentTypes.find(pt => pt.code === paymentMode);
  const requiresBank = currentPaymentType?.requiresBank ?? false;
  const requiresChequeDetails = currentPaymentType?.requiresChequeDetails ?? false;

  // Fetch initial data
  useEffect(() => {
    if (open) {
      fetchCustomers();
      fetchBanks();
      fetchPaymentTypes();
      fetchCurrencies();
      fetchNextReceiptNumber();
      resetForm();
    }
  }, [open]);

  // Fetch unpaid invoices and set customer's currency when customer changes
  useEffect(() => {
    if (customerId) {
      fetchUnpaidInvoices(customerId);
      // Set currency to customer's base currency
      const selectedCustomer = customers.find(c => c.id === customerId);
      if (selectedCustomer?.baseCurrency) {
        setCurrency(selectedCustomer.baseCurrency);
      }
    } else {
      setUnpaidInvoices([]);
      setSelectedInvoices([]);
    }
  }, [customerId, customers]);

  const fetchCustomers = async () => {
    try {
      const response = await customerApi.getAll({ pageSize: 1000, masterType: 'Debtors' });
      if (response.data) {
        setCustomers(response.data.items);
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  const fetchBanks = async () => {
    try {
      const response = await bankApi.getAll();
      if (response.data) {
        setBanks(response.data.items);
      }
    } catch (error) {
      console.error("Error fetching banks:", error);
    }
  };

  const fetchPaymentTypes = async () => {
    try {
      const response = await receiptApi.getPaymentTypes();
      if (response.data) {
        setPaymentTypes(response.data);
      }
    } catch (error) {
      console.error("Error fetching payment types:", error);
      // Fallback to default payment types
      setPaymentTypes([
        { id: 1, code: "Cash", name: "Cash", requiresBank: false, requiresChequeDetails: false, sortOrder: 1 },
        { id: 2, code: "Card", name: "Card", requiresBank: true, requiresChequeDetails: false, sortOrder: 2 },
        { id: 3, code: "Cheque", name: "Cheque", requiresBank: true, requiresChequeDetails: true, sortOrder: 3 },
        { id: 4, code: "BankWire", name: "Bank Wire", requiresBank: true, requiresChequeDetails: false, sortOrder: 4 },
      ]);
    }
  };

  const fetchCurrencies = async () => {
    try {
      const response = await settingsApi.getAllCurrencyTypes();
      if (response.data) {
        setCurrencies(response.data);
      }
    } catch (error) {
      console.error("Error fetching currencies:", error);
    }
  };

  const fetchNextReceiptNumber = async () => {
    try {
      const response = await receiptApi.getNextNumber();
      if (response.data) {
        setNextReceiptNo(response.data);
      }
    } catch (error) {
      console.error("Error fetching next receipt number:", error);
    }
  };

  const fetchUnpaidInvoices = async (custId: number) => {
    try {
      const response = await receiptApi.getUnpaidInvoices(custId);
      if (response.data) {
        setUnpaidInvoices(response.data);
      }
    } catch (error) {
      console.error("Error fetching unpaid invoices:", error);
    }
  };

  const resetForm = () => {
    setCustomerId(null);
    setSelectedInvoices([]);
    setPaymentMode("Cash");
    setReceiptDate(format(new Date(), "yyyy-MM-dd"));
    setCurrency("USD");
    setBankId(null);
    setChequeNo("");
    setChequeDate("");
    setChequeBank("");
    setRemarks("");
  };

  const handleInvoiceSelect = (invoice: UnpaidInvoice, isSelected: boolean) => {
    if (isSelected) {
      setSelectedInvoices([
        ...selectedInvoices,
        {
          invoiceId: invoice.id,
          invoiceNo: invoice.invoiceNo,
          totalAmount: invoice.totalAmount,
          pendingAmount: invoice.pendingAmount,
          payingAmount: invoice.pendingAmount, // Default to full pending amount
          currency: invoice.currency,
        },
      ]);
    } else {
      setSelectedInvoices(selectedInvoices.filter(si => si.invoiceId !== invoice.id));
    }
  };

  const handlePayingAmountChange = (invoiceId: number, amount: number) => {
    setSelectedInvoices(
      selectedInvoices.map(si =>
        si.invoiceId === invoiceId
          ? { ...si, payingAmount: Math.min(amount, si.pendingAmount) }
          : si
      )
    );
  };

  const totalAmount = selectedInvoices.reduce((sum, inv) => sum + inv.payingAmount, 0);

  const handleSubmit = async () => {
    if (!customerId) {
      toast.error("Please select a customer");
      return;
    }

    if (selectedInvoices.length === 0) {
      toast.error("Please select at least one invoice");
      return;
    }

    if (totalAmount <= 0) {
      toast.error("Total amount must be greater than 0");
      return;
    }

    if (requiresBank && !bankId) {
      toast.error("Please select a bank");
      return;
    }

    if (requiresChequeDetails && !chequeNo) {
      toast.error("Please enter cheque number");
      return;
    }

    setLoading(true);
    try {
      const request: CreateReceiptRequest = {
        receiptDate: receiptDate,
        customerId: customerId,
        paymentMode: paymentMode,
        currency: currency,
        amount: totalAmount,
        narration: remarks || undefined,
        bankId: requiresBank ? (bankId || undefined) : undefined,
        chequeNo: requiresChequeDetails ? (chequeNo || undefined) : undefined,
        chequeDate: requiresChequeDetails ? (chequeDate || undefined) : undefined,
        chequeBank: requiresChequeDetails ? (chequeBank || undefined) : undefined,
        invoices: selectedInvoices.map(inv => ({
          invoiceId: inv.invoiceId,
          amount: inv.payingAmount,
          currency: inv.currency,
        })),
      };

      await receiptApi.create(request);
      toast.success("Receipt recorded successfully");
      onSuccess();
    } catch (error) {
      console.error("Error creating receipt:", error);
      toast.error("Failed to record receipt");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Record Receipt</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-4 py-4">
          {/* Customer Selection */}
          <div className="space-y-2">
            <Label>Customers</Label>
            <Select
              value={customerId?.toString() || ""}
              onValueChange={(v) => setCustomerId(parseInt(v))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Customer" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id.toString()}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Invoice Selection (multi-select chips) */}
          <div className="space-y-2">
            <Label>Invoice</Label>
            <div className="border rounded-md p-2 min-h-[38px] bg-background">
              <div className="flex flex-wrap gap-1 mb-2">
                {selectedInvoices.map((inv) => (
                  <span
                    key={inv.invoiceId}
                    className="inline-flex items-center bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                  >
                    {inv.invoiceNo}
                    <X
                      className="h-3 w-3 ml-1 cursor-pointer"
                      onClick={() => handleInvoiceSelect(
                        unpaidInvoices.find(ui => ui.id === inv.invoiceId)!,
                        false
                      )}
                    />
                  </span>
                ))}
              </div>
              <Select
                value=""
                onValueChange={(v) => {
                  const invoice = unpaidInvoices.find(i => i.id === parseInt(v));
                  if (invoice) handleInvoiceSelect(invoice, true);
                }}
                disabled={!customerId}
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Select Invoice" />
                </SelectTrigger>
                <SelectContent>
                  {unpaidInvoices
                    .filter(inv => !selectedInvoices.some(si => si.invoiceId === inv.id))
                    .map((invoice) => (
                      <SelectItem key={invoice.id} value={invoice.id.toString()}>
                        {invoice.invoiceNo} - Pending: {invoice.currency} {invoice.pendingAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Payment Type */}
          <div className="space-y-2">
            <Label>Payment Type</Label>
            <Select
              value={paymentMode}
              onValueChange={(v) => {
                setPaymentMode(v as PaymentMode);
                // Reset bank-related fields when changing payment type
                if (!paymentTypes.find(pt => pt.code === v)?.requiresBank) {
                  setBankId(null);
                }
                if (!paymentTypes.find(pt => pt.code === v)?.requiresChequeDetails) {
                  setChequeNo("");
                  setChequeDate("");
                  setChequeBank("");
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Payment Type" />
              </SelectTrigger>
              <SelectContent>
                {paymentTypes.map((pt) => (
                  <SelectItem key={pt.code} value={pt.code}>
                    {pt.name.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cheque Details Row - Only show for Cheque payment type */}
          {requiresChequeDetails && (
            <>
              <div className="space-y-2">
                <Label>Cheque Number</Label>
                <Input
                  value={chequeNo}
                  onChange={(e) => setChequeNo(e.target.value)}
                  placeholder="Cheque Number"
                />
              </div>
              <div className="space-y-2">
                <Label>Cheque Date</Label>
                <Input
                  type="date"
                  value={chequeDate}
                  onChange={(e) => setChequeDate(e.target.value)}
                  placeholder="Cheque Date"
                />
              </div>
              <div className="space-y-2">
                <Label>Cheque Bank</Label>
                <Input
                  value={chequeBank}
                  onChange={(e) => setChequeBank(e.target.value)}
                  placeholder="Cheque Bank"
                />
              </div>
            </>
          )}

          {/* Receipt Number */}
          <div className="space-y-2">
            <Label>Receipt Number</Label>
            <Input value={nextReceiptNo} readOnly className="bg-muted" />
          </div>

          {/* Receipt Date */}
          <div className="space-y-2">
            <Label>Receipt Date</Label>
            <Input
              type="date"
              value={receiptDate}
              onChange={(e) => setReceiptDate(e.target.value)}
            />
          </div>

          {/* Narration */}
          <div className="space-y-2">
            <Label>Narration</Label>
            <Textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Narration"
              rows={1}
            />
          </div>

          {/* Currency - Locked to customer's base currency */}
          <div className="space-y-2">
            <Label>Currency</Label>
            <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)} disabled={!!customerId}>
              <SelectTrigger className={customerId ? "bg-muted" : ""}>
                <SelectValue placeholder="Select Currency" />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((curr) => (
                  <SelectItem key={curr.id} value={curr.code}>
                    {curr.code} - {curr.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Bank Selection - Only show for payment types that require bank */}
          <div className="space-y-2">
            <Label>Bank</Label>
            <Select
              value={bankId?.toString() || ""}
              onValueChange={(v) => setBankId(v ? parseInt(v) : null)}
              disabled={!requiresBank}
            >
              <SelectTrigger className={!requiresBank ? "bg-muted" : ""}>
                <SelectValue placeholder="Select Bank" />
              </SelectTrigger>
              <SelectContent>
                {banks.map((bank) => (
                  <SelectItem key={bank.id} value={bank.id.toString()}>
                    {bank.bankName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Total Amount */}
          <div className="space-y-2">
            <Label>Amount</Label>
            <Input
              value={isNaN(totalAmount) ? "0.00" : totalAmount.toFixed(2)}
              readOnly
              className="bg-muted font-semibold"
            />
          </div>
        </div>

        {/* Invoice Details Table */}
        {selectedInvoices.length > 0 && (
          <div className="border rounded-lg overflow-hidden mb-4">
            <Table>
              <TableHeader>
                <TableRow className="bg-green-700">
                  <TableHead className="text-white font-semibold">Invoice No</TableHead>
                  <TableHead className="text-white font-semibold">Total Amount</TableHead>
                  <TableHead className="text-white font-semibold">Pending Amount</TableHead>
                  <TableHead className="text-white font-semibold">Paying Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedInvoices.map((inv) => (
                  <TableRow key={inv.invoiceId}>
                    <TableCell>{inv.invoiceNo}</TableCell>
                    <TableCell>
                      {inv.currency} {inv.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      {inv.currency} {inv.pendingAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={inv.payingAmount}
                        onChange={(e) => handlePayingAmountChange(inv.invoiceId, parseFloat(e.target.value) || 0)}
                        className="w-32"
                        max={inv.pendingAmount}
                        step="0.01"
                      />
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50">
                  <TableCell colSpan={3} className="text-right font-semibold">
                    Total:
                  </TableCell>
                  <TableCell className="font-semibold">
                    {currency} {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button
            className="bg-green-500 hover:bg-green-600 text-white"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit"}
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
