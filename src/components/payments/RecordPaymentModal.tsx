import { useState, useEffect } from "react";
import { format } from "date-fns";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  customerApi,
  bankApi,
  settingsApi,
  type Customer,
  type Bank,
  type PaymentMode,
  type CurrencyType,
} from "@/services/api";
import {
  getNextPaymentNumber,
  getUnpaidPurchaseInvoices,
  getPaymentVoucherPaymentTypes,
  createPaymentVoucher,
  type UnpaidPurchaseInvoice,
  type PaymentType,
  type CreatePaymentVoucherRequest,
} from "@/services/api/payment";
import { toast } from "sonner";

interface RecordPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface SelectedInvoice {
  purchaseInvoiceId: number;
  purchaseNo: string;
  totalAmount: number;
  pendingAmount: number;
  payingAmount: number;
  currencyId: number;
  currencyCode: string;
}

export function RecordPaymentModal({
  open,
  onOpenChange,
  onSuccess,
}: RecordPaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [vendors, setVendors] = useState<Customer[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [paymentTypes, setPaymentTypes] = useState<PaymentType[]>([]);
  const [currencies, setCurrencies] = useState<CurrencyType[]>([]);
  const [unpaidInvoices, setUnpaidInvoices] = useState<UnpaidPurchaseInvoice[]>([]);
  const [nextPaymentNo, setNextPaymentNo] = useState("");

  // Form state
  const [vendorId, setVendorId] = useState<number | null>(null);
  const [selectedInvoices, setSelectedInvoices] = useState<SelectedInvoice[]>([]);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("Cash");
  const [paymentDate, setPaymentDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [currencyId, setCurrencyId] = useState<number | null>(null);
  const [bankId, setBankId] = useState<number | null>(null);
  const [chequeNo, setChequeNo] = useState("");
  const [chequeDate, setChequeDate] = useState("");
  const [chequeBank, setChequeBank] = useState("");
  const [narration, setNarration] = useState("");

  // Get current payment type config
  const currentPaymentType = paymentTypes.find(pt => pt.code === paymentMode);
  const requiresBank = currentPaymentType?.requiresBank ?? false;
  const requiresChequeDetails = currentPaymentType?.requiresChequeDetails ?? false;

  // Fetch initial data
  useEffect(() => {
    if (open) {
      fetchVendors();
      fetchBanks();
      fetchPaymentTypes();
      fetchCurrencies();
      fetchNextPaymentNumber();
      resetForm();
    }
  }, [open]);

  // Fetch unpaid invoices when vendor changes
  useEffect(() => {
    if (vendorId) {
      fetchUnpaidInvoices(vendorId);
      // Set currency to vendor's currency
      const selectedVendor = vendors.find(v => v.id === vendorId);
      if (selectedVendor?.currencyId) {
        setCurrencyId(selectedVendor.currencyId);
      }
    } else {
      setUnpaidInvoices([]);
      setSelectedInvoices([]);
    }
  }, [vendorId, vendors]);

  const fetchVendors = async () => {
    try {
      const response = await customerApi.getAll({ pageSize: 1000, masterType: 'Creditors' });
      if (response.data) {
        setVendors(response.data.items);
      }
    } catch (error) {
      toast.error("Failed to load vendors");
    }
  };

  const fetchBanks = async () => {
    try {
      const response = await bankApi.getAll();
      if (response.data) {
        setBanks(response.data.items);
      }
    } catch (error) {
      toast.error("Failed to load banks");
    }
  };

  const fetchPaymentTypes = async () => {
    try {
      const response = await getPaymentVoucherPaymentTypes();
      if (response.data) {
        setPaymentTypes(response.data);
      }
    } catch (error) {
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
      toast.error("Failed to load currencies");
    }
  };

  const fetchNextPaymentNumber = async () => {
    try {
      const response = await getNextPaymentNumber();
      if (response.data) {
        setNextPaymentNo(response.data);
      }
    } catch (error) {
      toast.error("Failed to get payment number");
    }
  };

  const fetchUnpaidInvoices = async (vId: number) => {
    try {
      const response = await getUnpaidPurchaseInvoices(vId);
      if (response.data) {
        setUnpaidInvoices(response.data);
      }
    } catch (error) {
      toast.error("Failed to load unpaid invoices");
    }
  };

  const resetForm = () => {
    setVendorId(null);
    setSelectedInvoices([]);
    setPaymentMode("Cash");
    setPaymentDate(format(new Date(), "yyyy-MM-dd"));
    setCurrencyId(null);
    setBankId(null);
    setChequeNo("");
    setChequeDate("");
    setChequeBank("");
    setNarration("");
  };

  const handleInvoiceSelect = (invoice: UnpaidPurchaseInvoice, isSelected: boolean) => {
    if (isSelected) {
      setSelectedInvoices([
        ...selectedInvoices,
        {
          purchaseInvoiceId: invoice.id,
          purchaseNo: invoice.purchaseNo,
          totalAmount: invoice.totalAmount,
          pendingAmount: invoice.pendingAmount,
          payingAmount: invoice.pendingAmount, // Default to full pending amount
          currencyId: invoice.currencyId || 0,
          currencyCode: invoice.currencyCode || "",
        },
      ]);
    } else {
      setSelectedInvoices(selectedInvoices.filter(si => si.purchaseInvoiceId !== invoice.id));
    }
  };

  const handlePayingAmountChange = (purchaseInvoiceId: number, amount: number) => {
    setSelectedInvoices(
      selectedInvoices.map(si =>
        si.purchaseInvoiceId === purchaseInvoiceId
          ? { ...si, payingAmount: Math.min(amount, si.pendingAmount) }
          : si
      )
    );
  };

  const totalAmount = selectedInvoices.reduce((sum, inv) => sum + inv.payingAmount, 0);

  const handleSubmit = async () => {
    if (!vendorId) {
      toast.error("Please select a vendor");
      return;
    }

    if (selectedInvoices.length === 0) {
      toast.error("Please select at least one purchase invoice");
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
      const request: CreatePaymentVoucherRequest = {
        paymentDate: paymentDate,
        vendorId: vendorId,
        paymentMode: paymentMode,
        currencyId: currencyId || 0,
        amount: totalAmount,
        narration: narration || undefined,
        bankId: bankId || undefined,
        chequeNo: chequeNo || undefined,
        chequeDate: chequeDate || undefined,
        chequeBank: chequeBank || undefined,
        purchaseInvoices: selectedInvoices.map(inv => ({
          purchaseInvoiceId: inv.purchaseInvoiceId,
          amount: inv.payingAmount,
          currencyId: inv.currencyId,
        })),
      };

      const response = await createPaymentVoucher(request);
      if (response.error) {
        throw new Error(response.error);
      }
      toast.success("Payment voucher recorded successfully");
      onSuccess();
    } catch (error) {
      toast.error("Failed to record payment voucher");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="bg-modal-header text-white p-4 rounded-t-lg">
          <DialogTitle className="text-white text-lg font-semibold">Record Purchase Payment</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-4 p-6">
          {/* Vendor Selection */}
          <div className="space-y-2">
            <Label>Vendors</Label>
            <SearchableSelect
              options={vendors.map((vendor) => ({
                value: vendor.id.toString(),
                label: vendor.name,
              }))}
              value={vendorId?.toString() || ""}
              onValueChange={(v) => setVendorId(parseInt(v))}
              placeholder="Select Vendor"
              searchPlaceholder="Search vendors..."
            />
          </div>

          {/* Purchase Invoice Selection (multi-select chips) */}
          <div className="space-y-2">
            <Label>Purchase Invoice</Label>
            <div className="border rounded-md p-2 min-h-[38px] bg-background">
              <div className="flex flex-wrap gap-1 mb-2">
                {selectedInvoices.map((inv) => (
                  <span
                    key={inv.purchaseInvoiceId}
                    className="inline-flex items-center bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                  >
                    {inv.purchaseNo}
                    <X
                      className="h-3 w-3 ml-1 cursor-pointer"
                      onClick={() => handleInvoiceSelect(
                        unpaidInvoices.find(ui => ui.id === inv.purchaseInvoiceId)!,
                        false
                      )}
                    />
                  </span>
                ))}
              </div>
              <SearchableSelect
                options={unpaidInvoices
                  .filter(inv => !selectedInvoices.some(si => si.purchaseInvoiceId === inv.id))
                  .map((invoice) => ({
                    value: invoice.id.toString(),
                    label: `${invoice.purchaseNo} - Pending: ${invoice.currencyCode} ${invoice.pendingAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                  }))}
                value=""
                onValueChange={(v) => {
                  const invoice = unpaidInvoices.find(i => i.id === parseInt(v));
                  if (invoice) handleInvoiceSelect(invoice, true);
                }}
                placeholder="Select Invoice"
                searchPlaceholder="Search invoices..."
                disabled={!vendorId}
                triggerClassName="h-8"
              />
            </div>
          </div>

          {/* Payment Type */}
          <div className="space-y-2">
            <Label>Payment Type</Label>
            <SearchableSelect
              options={paymentTypes.map((pt) => ({
                value: pt.code,
                label: pt.name.toUpperCase(),
              }))}
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
              placeholder="Select Type"
              searchPlaceholder="Search payment types..."
            />
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

          {/* Payment Voucher Number */}
          <div className="space-y-2">
            <Label>Payment Voucher No.</Label>
            <Input value={nextPaymentNo} readOnly className="bg-muted" />
          </div>

          {/* Payment Date */}
          <div className="space-y-2">
            <Label>Purchase Payment Date</Label>
            <Input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
            />
          </div>

          {/* Narration */}
          <div className="space-y-2">
            <Label>Narration</Label>
            <Input
              value={narration}
              onChange={(e) => setNarration(e.target.value)}
              placeholder="Narration"
            />
          </div>

          {/* Currency - Locked to vendor's base currency */}
          <div className="space-y-2">
            <Label>Currency</Label>
            <SearchableSelect
              options={currencies.map((curr) => ({
                value: curr.id.toString(),
                label: curr.code,
              }))}
              value={currencyId?.toString() || ""}
              onValueChange={(v) => setCurrencyId(parseInt(v))}
              placeholder="Select Currency"
              searchPlaceholder="Search currencies..."
              disabled={!!vendorId}
              triggerClassName={vendorId ? "bg-muted" : ""}
            />
          </div>

          {/* Bank Selection - Only show for payment types that require bank */}
          <div className="space-y-2">
            <Label>Bank</Label>
            <SearchableSelect
              options={banks.map((bank) => ({
                value: bank.id.toString(),
                label: bank.bankName,
              }))}
              value={bankId?.toString() || ""}
              onValueChange={(v) => setBankId(v ? parseInt(v) : null)}
              placeholder="Select Bank"
              searchPlaceholder="Search banks..."
              disabled={!requiresBank}
              triggerClassName={!requiresBank ? "bg-muted" : ""}
            />
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
          <div className="border rounded-lg overflow-hidden mx-6 mb-4">
            <Table>
              <TableHeader>
                <TableRow className="bg-table-header">
                  <TableHead className="text-table-header-foreground font-semibold">Purchase No</TableHead>
                  <TableHead className="text-table-header-foreground font-semibold">Total Amount</TableHead>
                  <TableHead className="text-table-header-foreground font-semibold">Pending Amount</TableHead>
                  <TableHead className="text-table-header-foreground font-semibold">Paying Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedInvoices.map((inv) => (
                  <TableRow key={inv.purchaseInvoiceId}>
                    <TableCell>{inv.purchaseNo}</TableCell>
                    <TableCell>
                      {inv.currencyCode} {inv.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      {inv.currencyCode} {inv.pendingAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={inv.payingAmount}
                        onChange={(e) => handlePayingAmountChange(inv.purchaseInvoiceId, parseFloat(e.target.value) || 0)}
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
                    {currencies.find(c => c.id === currencyId)?.code || ""} {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 px-6 pb-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="btn-success"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
