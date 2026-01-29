import { useState, useEffect } from "react";
import { format } from "date-fns";
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
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  receiptApi,
  bankApi,
  type Bank,
  type PaymentType,
  type PaymentMode,
  type ReceiptDetail,
  type UpdateReceiptRequest,
} from "@/services/api";
import { toast } from "sonner";

interface UpdateReceiptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receiptId: number | null;
  onSuccess: () => void;
}

export function UpdateReceiptModal({
  open,
  onOpenChange,
  receiptId,
  onSuccess,
}: UpdateReceiptModalProps) {
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [paymentTypes, setPaymentTypes] = useState<PaymentType[]>([]);
  const [receipt, setReceipt] = useState<ReceiptDetail | null>(null);

  // Form state
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [invoiceNumbers, setInvoiceNumbers] = useState<string[]>([]);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("Cash");
  const [receiptNo, setReceiptNo] = useState("");
  const [receiptDate, setReceiptDate] = useState("");
  const [narration, setNarration] = useState("");
  const [remarks, setRemarks] = useState("");
  const [currencyId, setCurrencyId] = useState<number | null>(null);
  const [currencyCode, setCurrencyCode] = useState("");
  const [bankId, setBankId] = useState<number | null>(null);
  const [chequeNo, setChequeNo] = useState("");
  const [chequeDate, setChequeDate] = useState("");
  const [chequeBank, setChequeBank] = useState("");
  const [amount, setAmount] = useState<number>(0);

  // Get current payment type config
  const currentPaymentType = paymentTypes.find(pt => pt.code === paymentMode);
  const requiresBank = currentPaymentType?.requiresBank ?? false;
  const requiresChequeDetails = currentPaymentType?.requiresChequeDetails ?? false;

  // Fetch initial data
  useEffect(() => {
    if (open && receiptId) {
      fetchInitialData();
      fetchReceiptDetails();
    }
  }, [open, receiptId]);

  const fetchInitialData = async () => {
    try {
      const [banksRes, paymentTypesRes] = await Promise.all([
        bankApi.getAll(),
        receiptApi.getPaymentTypes(),
      ]);

      if (banksRes.data) setBanks(banksRes.data.items);
      if (paymentTypesRes.data) setPaymentTypes(paymentTypesRes.data);
    } catch (error) {
      console.error("Error fetching initial data:", error);
    }
  };

  const fetchReceiptDetails = async () => {
    if (!receiptId) return;
    setFetchingData(true);
    try {
      const response = await receiptApi.getById(receiptId);
      if (response.data) {
        const data = response.data;
        setReceipt(data);
        setCustomerId(data.customerId);
        setCustomerName(data.customerName || "");
        setPaymentMode(data.paymentMode);
        setReceiptNo(data.receiptNo);
        setReceiptDate(format(new Date(data.receiptDate), "yyyy-MM-dd"));
        setNarration(data.narration || "");
        setRemarks(data.narration || "");
        setCurrencyId(data.currencyId || null);
        setCurrencyCode(data.currencyCode || "");
        setBankId(data.bankId || null);
        setChequeNo(data.chequeNo || "");
        setChequeDate(data.chequeDate ? format(new Date(data.chequeDate), "yyyy-MM-dd") : "");
        setChequeBank(data.chequeBank || "");
        setAmount(data.amount);

        // Set all invoice numbers for display
        if (data.invoices && data.invoices.length > 0) {
          setInvoiceNumbers(
            data.invoices
              .map(inv => inv.invoiceNo)
              .filter((no): no is string => !!no)
          );
        }
      }
    } catch (error) {
      console.error("Error fetching receipt details:", error);
      toast.error("Failed to load receipt details");
    } finally {
      setFetchingData(false);
    }
  };

  const handleSubmit = async () => {
    if (!receiptId || !customerId) {
      toast.error("Invalid receipt data");
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
      const request: UpdateReceiptRequest = {
        customerId: customerId,
        paymentMode: paymentMode,
        receiptDate: receiptDate,
        narration: narration || undefined,
        remarks: remarks || undefined,
        currencyId: currencyId || undefined,
        bankId: requiresBank ? (bankId || undefined) : undefined,
        chequeNo: requiresChequeDetails ? (chequeNo || undefined) : undefined,
        chequeDate: requiresChequeDetails ? (chequeDate || undefined) : undefined,
        chequeBank: requiresChequeDetails ? (chequeBank || undefined) : undefined,
        amount: amount,
      };

      await receiptApi.update(receiptId, request);
      toast.success("Receipt updated successfully");
      onSuccess();
    } catch (error) {
      console.error("Error updating receipt:", error);
      toast.error("Failed to update receipt");
    } finally {
      setLoading(false);
    }
  };

  if (fetchingData) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl p-0">
          <DialogHeader className="bg-modal-header text-white p-4 rounded-t-lg">
            <DialogTitle className="text-white text-lg font-semibold">Update Receipt</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            Loading...
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0">
        <DialogHeader className="bg-modal-header text-white p-4 rounded-t-lg">
          <DialogTitle className="text-white text-lg font-semibold">Update Receipt</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-4 p-6">
          {/* Customer - Read Only */}
          <div className="space-y-2">
            <Label>Customer</Label>
            <Input value={customerName} readOnly className="bg-muted" />
          </div>

          {/* Invoices - Read Only (as chips) */}
          <div className="space-y-2">
            <Label>Invoice(s)</Label>
            <div className="flex flex-wrap gap-1 min-h-[40px] p-2 border rounded-md bg-muted">
              {invoiceNumbers.length > 0 ? (
                invoiceNumbers.map((no, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                  >
                    {no}
                  </span>
                ))
              ) : (
                <span className="text-muted-foreground text-sm">No invoices</span>
              )}
            </div>
          </div>

          {/* Payment Type */}
          <div className="space-y-2">
            <Label>Payment Type</Label>
            <SearchableSelect
              options={paymentTypes.map((pt) => ({
                value: pt.code,
                label: pt.name,
              }))}
              value={paymentMode}
              onValueChange={(v) => {
                setPaymentMode(v as PaymentMode);
                // Reset bank-related fields when changing payment type
                if (!paymentTypes.find(pt => pt.code === v)?.requiresBank) {
                  setBankId(null);
                }
                // Reset cheque fields when changing away from Cheque
                if (!paymentTypes.find(pt => pt.code === v)?.requiresChequeDetails) {
                  setChequeNo("");
                  setChequeDate("");
                  setChequeBank("");
                }
              }}
              placeholder="Select Payment Type"
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

          {/* Receipt Number - Read Only */}
          <div className="space-y-2">
            <Label>Receipt Number</Label>
            <Input value={receiptNo} readOnly className="bg-muted" />
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
            <Input
              value={narration}
              onChange={(e) => setNarration(e.target.value)}
              placeholder="Narration"
            />
          </div>

          {/* Remarks */}
          <div className="space-y-2">
            <Label>Remarks</Label>
            <Textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Remarks"
              rows={2}
            />
          </div>

          {/* Currency - Read Only */}
          <div className="space-y-2">
            <Label>Currency</Label>
            <Input value={currencyCode} readOnly className="bg-muted" />
          </div>

          {/* Bank Selection */}
          <div className="space-y-2">
            <Label>Bank</Label>
            <SearchableSelect
              options={banks.map((bank) => ({
                value: bank.id.toString(),
                label: `${bank.bankName} (${bank.accountNo || ""})`,
              }))}
              value={bankId?.toString() || ""}
              onValueChange={(v) => setBankId(v ? parseInt(v) : null)}
              placeholder="Select Bank"
              searchPlaceholder="Search banks..."
              disabled={!requiresBank}
              triggerClassName={!requiresBank ? "bg-muted" : ""}
            />
          </div>

          {/* Amount - Read Only */}
          <div className="space-y-2">
            <Label>Amount</Label>
            <Input
              type="number"
              value={amount}
              readOnly
              className="bg-muted"
            />
          </div>
        </div>

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
            {loading ? "Updating..." : "Update"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
