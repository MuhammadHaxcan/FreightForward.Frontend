import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
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
  type PaymentMode,
} from "@/services/api";
import {
  type UnpaidPurchaseInvoice,
  type CreatePaymentVoucherRequest,
} from "@/services/api/payment";
import {
  useCreatePaymentVoucher,
  usePaymentVoucherPaymentTypes,
  useNextPaymentNumber,
  useUnpaidPurchaseInvoices,
} from "@/hooks/usePaymentVouchers";
import { useAllCreditors } from "@/hooks/useCustomers";
import { useAllBanks } from "@/hooks/useBanks";
import { useAllCurrencyTypes } from "@/hooks/useSettings";
import { toast } from "sonner";
import type { PaymentAssistantDraft } from "@/services/api/assistant";

interface RecordPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialDraft?: PaymentAssistantDraft | null;
  initialDraftNonce?: string | null;
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
  initialDraft,
  initialDraftNonce,
  onSuccess,
}: RecordPaymentModalProps) {
  const createMutation = useCreatePaymentVoucher();

  // Data hooks (always fetch, caching handles efficiency)
  const { data: vendors = [] } = useAllCreditors();
  const { data: banksData } = useAllBanks();
  const banks = banksData ?? [];
  const { data: paymentTypes = [] } = usePaymentVoucherPaymentTypes();
  const { data: currencies = [] } = useAllCurrencyTypes();
  const { data: nextPaymentNo = "" } = useNextPaymentNumber();

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
  const [postDatedValidDate, setPostDatedValidDate] = useState("");
  const [narration, setNarration] = useState("");
  const appliedDraftNonceRef = useRef<string | null>(null);
  const applyingDraftRef = useRef(false);

  // Unpaid invoices — only fetch when vendorId is set
  const { data: unpaidInvoices = [] } = useUnpaidPurchaseInvoices(vendorId);

  // Get current payment type config
  const currentPaymentType = paymentTypes.find(pt => pt.code === paymentMode);
  const requiresBank = currentPaymentType?.requiresBank ?? false;
  const requiresChequeDetails = currentPaymentType?.requiresChequeDetails ?? false;

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      applyingDraftRef.current = false;
      setVendorId(null);
      setSelectedInvoices([]);
      setPaymentMode("Cash");
      setPaymentDate(format(new Date(), "yyyy-MM-dd"));
      setCurrencyId(null);
      setBankId(null);
      setChequeNo("");
      setChequeDate("");
      setChequeBank("");
      setPostDatedValidDate("");
      setNarration("");
    }
  }, [open]);

  // Set currency when vendor changes
  useEffect(() => {
    if (applyingDraftRef.current) {
      applyingDraftRef.current = false;
      return;
    }

    if (vendorId) {
      const selectedVendor = vendors.find(v => v.id === vendorId);
      if (selectedVendor?.currencyId) {
        setCurrencyId(selectedVendor.currencyId);
      }
      setSelectedInvoices([]);
    } else {
      setSelectedInvoices([]);
    }
  }, [vendorId, vendors]);

  useEffect(() => {
    if (!open || !initialDraft || !initialDraftNonce) return;
    if (appliedDraftNonceRef.current === initialDraftNonce) return;

    applyingDraftRef.current = true;
    appliedDraftNonceRef.current = initialDraftNonce;
    setVendorId(initialDraft.vendorId);
    setSelectedInvoices(initialDraft.selectedInvoices.map((invoice) => ({
      purchaseInvoiceId: invoice.purchaseInvoiceId,
      purchaseNo: invoice.purchaseNo,
      totalAmount: invoice.outstanding,
      pendingAmount: invoice.outstanding,
      payingAmount: invoice.payingAmount,
      currencyId: invoice.currencyId || initialDraft.currencyId || 0,
      currencyCode: invoice.currencyCode || initialDraft.currencyCode || "",
    })));
    setPaymentMode(initialDraft.paymentMode as PaymentMode);
    setPaymentDate(initialDraft.paymentDate || format(new Date(), "yyyy-MM-dd"));
    setCurrencyId(initialDraft.currencyId ?? null);
    setBankId(initialDraft.bankId ?? null);
    setChequeNo(initialDraft.chequeNo || "");
    setChequeDate(initialDraft.chequeDate || "");
    setChequeBank(initialDraft.chequeBank || "");
    setPostDatedValidDate(initialDraft.postDatedValidDate || "");
    setNarration(initialDraft.narration || "");
  }, [open, initialDraft, initialDraftNonce]);

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
      // Update form currency to match the invoice's currency
      if (invoice.currencyId) {
        setCurrencyId(invoice.currencyId);
      }
    } else {
      const remaining = selectedInvoices.filter(si => si.purchaseInvoiceId !== invoice.id);
      setSelectedInvoices(remaining);
      // If there are remaining invoices, use the first one's currency
      if (remaining.length > 0) {
        setCurrencyId(remaining[0].currencyId);
      }
    }
  };

  const handlePayingAmountChange = (purchaseInvoiceId: number, amount: number) => {
    setSelectedInvoices(
      selectedInvoices.map(si =>
        si.purchaseInvoiceId === purchaseInvoiceId
          ? { ...si, payingAmount: Math.max(0, Math.min(amount, si.pendingAmount)) }
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

    if (!currencyId) {
      toast.error("Please select a currency");
      return;
    }

    const request: CreatePaymentVoucherRequest = {
      paymentDate: paymentDate,
      vendorId: vendorId,
      paymentMode: paymentMode,
      currencyId: currencyId,
      amount: totalAmount,
      narration: narration || undefined,
      bankId: bankId || undefined,
      chequeNo: chequeNo || undefined,
      chequeDate: chequeDate || undefined,
      chequeBank: chequeBank || undefined,
      postDatedValidDate: paymentMode === "PostDatedCheque" ? (postDatedValidDate || undefined) : undefined,
      purchaseInvoices: selectedInvoices.map(inv => ({
        purchaseInvoiceId: inv.purchaseInvoiceId,
        amount: inv.payingAmount,
        currencyId: inv.currencyId,
      })),
    };

    createMutation.mutate(request, {
      onSuccess: () => onSuccess(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-modal-4xl max-h-[90vh] overflow-hidden p-0 flex flex-col gap-0">
        <DialogHeader className="bg-modal-header text-white p-4 rounded-t-lg">
          <DialogTitle className="text-white text-lg font-semibold">Record Purchase Payment</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0">
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
                      onClick={() => {
                        const invoice = unpaidInvoices.find(ui => ui.id === inv.purchaseInvoiceId);
                        if (invoice) handleInvoiceSelect(invoice, false);
                      }}
                    />
                  </span>
                ))}
              </div>
              <SearchableSelect
                options={unpaidInvoices
                  .filter(inv => !selectedInvoices.some(si => si.purchaseInvoiceId === inv.id))
                  .map((invoice) => ({
                    value: invoice.id.toString(),
                    label: `${invoice.purchaseNo} - Pending: ${invoice.currencyCode} ${(invoice.pendingAmount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
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
                if (v !== "PostDatedCheque") {
                  setPostDatedValidDate("");
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
              {paymentMode !== "PostDatedCheque" && (
                <div className="space-y-2">
                  <Label>Cheque Bank</Label>
                  <Input
                    value={chequeBank}
                    onChange={(e) => setChequeBank(e.target.value)}
                    placeholder="Cheque Bank"
                  />
                </div>
              )}
            </>
          )}

          {/* Post Dated Cheque Valid Date */}
          {paymentMode === "PostDatedCheque" && (
            <div className="space-y-2">
              <Label>Valid Date (Maturity)</Label>
              <Input
                type="date"
                value={postDatedValidDate}
                onChange={(e) => setPostDatedValidDate(e.target.value)}
                placeholder="Valid Date"
              />
            </div>
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
              title={narration || undefined}
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
                        {inv.currencyCode} {(inv.totalAmount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        {inv.currencyCode} {(inv.pendingAmount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={inv.payingAmount}
                          onChange={(e) => handlePayingAmountChange(inv.purchaseInvoiceId, parseFloat(e.target.value) || 0)}
                          className="w-32"
                          min="0"
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
        </div>

        {/* Actions */}
        <DialogFooter className="shrink-0 gap-2 border-t border-border bg-card px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="btn-success"
            onClick={handleSubmit}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? "Submitting..." : "Submit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
