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
  getPaymentVoucherById,
  getPaymentVoucherPaymentTypes,
  type PaymentVoucherDetail,
  type PaymentType,
  type UpdatePaymentVoucherRequest,
} from "@/services/api/payment";
import { bankApi, type Bank, type PaymentMode } from "@/services/api";
import { useUpdatePaymentVoucher } from "@/hooks/usePaymentVouchers";
import { toast } from "sonner";

interface UpdatePaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentId: number | null;
  onSuccess: () => void;
}

export function UpdatePaymentModal({
  open,
  onOpenChange,
  paymentId,
  onSuccess,
}: UpdatePaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [paymentTypes, setPaymentTypes] = useState<PaymentType[]>([]);
  const [payment, setPayment] = useState<PaymentVoucherDetail | null>(null);

  // Form state
  const [vendorId, setVendorId] = useState<number | null>(null);
  const [vendorName, setVendorName] = useState("");
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("Cash");
  const [paymentNo, setPaymentNo] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [narration, setNarration] = useState("");
  const [remarks, setRemarks] = useState("");
  const [currencyId, setCurrencyId] = useState<number | null>(null);
  const [currencyCode, setCurrencyCode] = useState("");
  const [bankId, setBankId] = useState<number | null>(null);
  const [chequeNo, setChequeNo] = useState("");
  const [chequeDate, setChequeDate] = useState("");
  const [chequeBank, setChequeBank] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [purchaseInvoiceNumbers, setPurchaseInvoiceNumbers] = useState<string[]>([]);

  const updatePaymentMutation = useUpdatePaymentVoucher();

  // Get current payment type config
  const currentPaymentType = paymentTypes.find(pt => pt.code === paymentMode);
  const requiresBank = currentPaymentType?.requiresBank ?? false;
  const requiresChequeDetails = currentPaymentType?.requiresChequeDetails ?? false;

  // Fetch initial data
  useEffect(() => {
    if (open && paymentId) {
      fetchInitialData();
      fetchPaymentDetails();
    }
  }, [open, paymentId]);

  const fetchInitialData = async () => {
    try {
      const [banksRes, paymentTypesRes] = await Promise.all([
        bankApi.getAll(),
        getPaymentVoucherPaymentTypes(),
      ]);

      if (banksRes.data) setBanks(banksRes.data.items);
      if (paymentTypesRes.data) setPaymentTypes(paymentTypesRes.data);
    } catch (error) {
      console.error("Error fetching initial data:", error);
    }
  };

  const fetchPaymentDetails = async () => {
    if (!paymentId) return;
    setFetchingData(true);
    try {
      const response = await getPaymentVoucherById(paymentId);
      if (response.data) {
        const data = response.data;
        setPayment(data);
        setVendorId(data.vendorId);
        setVendorName(data.vendorName || "");
        setPaymentMode(data.paymentMode);
        setPaymentNo(data.paymentNo);
        setPaymentDate(format(new Date(data.paymentDate), "yyyy-MM-dd"));
        setNarration(data.narration || "");
        setRemarks(data.narration || "");
        setCurrencyId(data.currencyId || null);
        setCurrencyCode(data.currencyCode || "");
        setBankId(data.bankId || null);
        setChequeNo(data.chequeNo || "");
        setChequeDate(data.chequeDate ? format(new Date(data.chequeDate), "yyyy-MM-dd") : "");
        setChequeBank(data.chequeBank || "");
        setAmount(data.amount);

        // Set purchase invoice numbers
        if (data.purchaseInvoices && data.purchaseInvoices.length > 0) {
          setPurchaseInvoiceNumbers(
            data.purchaseInvoices
              .map(pi => pi.purchaseNo)
              .filter((no): no is string => !!no)
          );
        }
      }
    } catch (error) {
      console.error("Error fetching payment details:", error);
      toast.error("Failed to load payment details");
    } finally {
      setFetchingData(false);
    }
  };

  const handleSubmit = async () => {
    if (!paymentId || !vendorId) {
      toast.error("Invalid payment data");
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
      const request: UpdatePaymentVoucherRequest = {
        vendorId: vendorId,
        paymentMode: paymentMode,
        paymentDate: paymentDate,
        narration: narration || undefined,
        remarks: remarks || undefined,
        currencyId: currencyId || undefined,
        bankId: requiresBank ? (bankId || undefined) : undefined,
        chequeNo: requiresChequeDetails ? (chequeNo || undefined) : undefined,
        chequeDate: requiresChequeDetails ? (chequeDate || undefined) : undefined,
        chequeBank: requiresChequeDetails ? (chequeBank || undefined) : undefined,
        amount: amount,
      };

      await updatePaymentMutation.mutateAsync({ id: paymentId, request });
      onSuccess();
    } catch (error) {
      console.error("Error updating payment:", error);
    } finally {
      setLoading(false);
    }
  };

  if (fetchingData) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl p-0">
          <DialogHeader className="bg-modal-header text-white p-4 rounded-t-lg">
            <DialogTitle className="text-white text-lg font-semibold">Update Payment Voucher</DialogTitle>
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
          <DialogTitle className="text-white text-lg font-semibold">Update Payment Voucher</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-4 p-6">
          {/* Vendor - Read Only */}
          <div className="space-y-2">
            <Label>Vendor</Label>
            <Input value={vendorName} readOnly className="bg-muted" />
          </div>

          {/* Purchase Invoices - Read Only */}
          <div className="space-y-2">
            <Label>Purchase Invoice(s)</Label>
            <div className="flex flex-wrap gap-1 min-h-[40px] p-2 border rounded-md bg-muted">
              {purchaseInvoiceNumbers.length > 0 ? (
                purchaseInvoiceNumbers.map((no, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded"
                  >
                    {no}
                  </span>
                ))
              ) : (
                <span className="text-muted-foreground text-sm">No purchases</span>
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

          {/* Payment Number - Read Only */}
          <div className="space-y-2">
            <Label>Payment Voucher No.</Label>
            <Input value={paymentNo} readOnly className="bg-muted" />
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
