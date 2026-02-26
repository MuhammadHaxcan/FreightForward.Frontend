import { useState, useEffect } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Plus, Trash2, CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  creditNoteApi,
  customerApi,
  settingsApi,
  type Customer,
  type CurrencyType,
  type ChargeItem,
  type UnpaidInvoice,
} from "@/services/api";

interface ChargeDetail {
  id: number;
  chargeDetails: string;
  bases: string;
  currencyId?: number;
  rate: string;
  roe: string;
  quantity: string;
  amount: string;
}

interface SelectedInvoice {
  invoiceId: number;
  invoiceNo: string;
  invoiceDate?: string;
  jobNo?: string;
  hblNo?: string;
  currencyId?: number;
  currencyCode?: string;
  pendingAmount: number;
  allocatedAmount: number;
}

interface AddCreditNoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const emptyCharge: Partial<ChargeDetail> = {
  chargeDetails: "",
  bases: "",
  currencyId: undefined,
  rate: "1",
  roe: "1",
  quantity: "",
  amount: "",
};

export function AddCreditNoteModal({ open, onOpenChange, onSuccess }: AddCreditNoteModalProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [currencyTypes, setCurrencyTypes] = useState<CurrencyType[]>([]);
  const [chargeItemsList, setChargeItemsList] = useState<ChargeItem[]>([]);

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [creditNoteForm, setCreditNoteForm] = useState({
    jobNumber: "",
    email: "",
    creditNoteDate: new Date() as Date | null,
    referenceNo: "",
    status: "Active",
  });

  const [chargeDetails, setChargeDetails] = useState<ChargeDetail[]>([]);
  const [newCharge, setNewCharge] = useState<Partial<ChargeDetail>>({ ...emptyCharge });
  const [additionalContents, setAdditionalContents] = useState("");
  const [saving, setSaving] = useState(false);

  const [unpaidInvoices, setUnpaidInvoices] = useState<UnpaidInvoice[]>([]);
  const [selectedInvoices, setSelectedInvoices] = useState<SelectedInvoice[]>([]);

  // Fetch customers, currencies, charge items on open
  useEffect(() => {
    if (!open) return;
    customerApi.getAll({ pageSize: 1000, masterType: "Debtors" }).then((res) => {
      if (res.data) setCustomers(res.data.items);
    });
    settingsApi.getAllCurrencyTypes().then((res) => {
      if (res.data) setCurrencyTypes(res.data);
    });
    settingsApi.getAllChargeItems().then((res) => {
      if (res.data) setChargeItemsList(res.data);
    });
  }, [open]);

  // Fetch unpaid invoices when customer changes
  useEffect(() => {
    if (!selectedCustomerId) {
      setUnpaidInvoices([]);
      setSelectedInvoices([]);
      return;
    }
    creditNoteApi.getUnpaidInvoices(parseInt(selectedCustomerId)).then((res) => {
      if (res.data) setUnpaidInvoices(res.data);
    });
    setSelectedInvoices([]);
  }, [selectedCustomerId]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setSelectedCustomerId("");
      setCreditNoteForm({ jobNumber: "", email: "", creditNoteDate: new Date(), referenceNo: "", status: "Active" });
      setChargeDetails([]);
      setNewCharge({ ...emptyCharge });
      setAdditionalContents("");
      setUnpaidInvoices([]);
      setSelectedInvoices([]);
    }
  }, [open]);

  const handleAddCharge = () => {
    if (newCharge.chargeDetails) {
      setChargeDetails([...chargeDetails, { ...newCharge, id: Date.now() } as ChargeDetail]);
      setNewCharge({ ...emptyCharge });
    }
  };

  const handleSave = async () => {
    if (!selectedCustomerId) {
      toast.error("Please select a customer");
      return;
    }
    if (!creditNoteForm.creditNoteDate) {
      toast.error("Please select a credit note date");
      return;
    }

    setSaving(true);
    try {
      // Auto-add pending charge if filled but not explicitly added
      let allCharges = [...chargeDetails];
      if (newCharge.chargeDetails && newCharge.amount) {
        allCharges.push({ ...newCharge, id: Date.now() } as ChargeDetail);
      }

      // Validate: total allocated cannot exceed total charges
      const totalCharges = allCharges.reduce((sum, d) => sum + (parseFloat(d.amount as any) || 0), 0);
      const totalAllocated = selectedInvoices.reduce((sum, inv) => sum + inv.allocatedAmount, 0);
      if (totalAllocated > totalCharges) {
        toast.error("Allocated amount cannot exceed credit note total");
        setSaving(false);
        return;
      }

      const response = await creditNoteApi.create({
        customerId: parseInt(selectedCustomerId),
        creditNoteDate: format(creditNoteForm.creditNoteDate, "yyyy-MM-dd"),
        jobNumber: creditNoteForm.jobNumber || undefined,
        referenceNo: creditNoteForm.referenceNo || undefined,
        email: creditNoteForm.email || undefined,
        additionalContents: additionalContents || undefined,
        status: creditNoteForm.status || "Active",
        details: allCharges.map((d) => ({
          chargeDetails: d.chargeDetails || undefined,
          bases: d.bases || undefined,
          currencyId: d.currencyId,
          rate: parseFloat(d.rate as any) || 0,
          roe: parseFloat(d.roe as any) || 1,
          quantity: parseFloat(d.quantity as any) || 0,
          amount: parseFloat(d.amount as any) || 0,
        })),
        invoices: selectedInvoices.map((inv) => ({
          invoiceId: inv.invoiceId,
          amount: inv.allocatedAmount,
          currencyId: inv.currencyId,
        })),
      });

      if (response.error) {
        toast.error(response.error);
      } else {
        toast.success("Credit note created successfully");
        onSuccess();
      }
    } catch {
      toast.error("Failed to create credit note");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 bg-card">
        <DialogHeader className="bg-modal-header text-white p-4 rounded-t-lg">
          <DialogTitle className="text-white text-xl">Add New Credit Note</DialogTitle>
        </DialogHeader>

        {/* Credit Note Section */}
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-primary">Credit Note</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-sm">*Customer</Label>
              <SearchableSelect
                options={customers.map((c) => ({ value: c.id.toString(), label: c.name }))}
                value={selectedCustomerId}
                onValueChange={setSelectedCustomerId}
                placeholder="Select customer..."
                searchPlaceholder="Search customers..."
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Job Number</Label>
              <Input
                value={creditNoteForm.jobNumber}
                onChange={(e) => setCreditNoteForm({ ...creditNoteForm, jobNumber: e.target.value })}
                placeholder="Enter job number"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Email</Label>
              <Input
                value={creditNoteForm.email}
                onChange={(e) => setCreditNoteForm({ ...creditNoteForm, email: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-sm">*Credit Note Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {creditNoteForm.creditNoteDate
                      ? format(creditNoteForm.creditNoteDate, "dd-MM-yyyy")
                      : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-popover z-50">
                  <Calendar
                    mode="single"
                    selected={creditNoteForm.creditNoteDate || undefined}
                    onSelect={(d) => setCreditNoteForm({ ...creditNoteForm, creditNoteDate: d || null })}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Reference #</Label>
              <Input
                value={creditNoteForm.referenceNo}
                onChange={(e) => setCreditNoteForm({ ...creditNoteForm, referenceNo: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Status</Label>
              <SearchableSelect
                options={[
                  { value: "Active", label: "Active" },
                  { value: "Inactive", label: "Inactive" },
                ]}
                value={creditNoteForm.status}
                onValueChange={(v) => setCreditNoteForm({ ...creditNoteForm, status: v })}
                triggerClassName="bg-background"
              />
            </div>
          </div>
        </div>

        {/* Charges Details Section */}
        <div className="px-6 space-y-4">
          <h3 className="text-lg font-semibold text-primary">Charges Details</h3>

          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-table-header text-table-header-foreground">
                  <th className="px-3 py-2 text-left text-sm font-semibold">Charges Details</th>
                  <th className="px-3 py-2 text-left text-sm font-semibold">Bases</th>
                  <th className="px-3 py-2 text-left text-sm font-semibold">Currency</th>
                  <th className="px-3 py-2 text-left text-sm font-semibold">Rate</th>
                  <th className="px-3 py-2 text-left text-sm font-semibold">ROE</th>
                  <th className="px-3 py-2 text-left text-sm font-semibold">Quantity</th>
                  <th className="px-3 py-2 text-left text-sm font-semibold">Amount</th>
                  <th className="px-3 py-2 text-left text-sm font-semibold"></th>
                </tr>
              </thead>
              <tbody>
                {chargeDetails.map((charge, i) => (
                  <tr key={charge.id} className={`border-b border-border ${i % 2 === 0 ? "bg-card" : "bg-secondary/30"}`}>
                    <td className="px-3 py-2 text-sm">{charge.chargeDetails}</td>
                    <td className="px-3 py-2 text-sm">{charge.bases}</td>
                    <td className="px-3 py-2 text-sm">
                      {currencyTypes.find((c) => c.id === charge.currencyId)?.code || "-"}
                    </td>
                    <td className="px-3 py-2 text-sm">{charge.rate}</td>
                    <td className="px-3 py-2 text-sm">{charge.roe}</td>
                    <td className="px-3 py-2 text-sm">{charge.quantity}</td>
                    <td className="px-3 py-2 text-sm">{charge.amount}</td>
                    <td className="px-3 py-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive"
                        onClick={() => setChargeDetails(chargeDetails.filter((c) => c.id !== charge.id))}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </td>
                  </tr>
                ))}
                {/* Add new charge row */}
                <tr className="bg-card">
                  <td className="px-3 py-2">
                    <SearchableSelect
                      options={chargeItemsList.map((ci) => ({ value: ci.name, label: ci.name }))}
                      value={newCharge.chargeDetails || ""}
                      onValueChange={(v) => setNewCharge({ ...newCharge, chargeDetails: v })}
                      placeholder="Select"
                      triggerClassName="h-8 text-xs bg-background"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      className="h-8 text-xs"
                      placeholder="Bases"
                      value={newCharge.bases || ""}
                      onChange={(e) => setNewCharge({ ...newCharge, bases: e.target.value })}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <SearchableSelect
                      options={currencyTypes.map((c) => ({ value: c.id.toString(), label: c.code }))}
                      value={newCharge.currencyId?.toString() || ""}
                      onValueChange={(v) => setNewCharge({ ...newCharge, currencyId: parseInt(v) })}
                      placeholder="Select"
                      triggerClassName="h-8 text-xs bg-background"
                      searchPlaceholder="Search currencies..."
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      className="h-8 text-xs"
                      placeholder="1"
                      value={newCharge.rate || ""}
                      onChange={(e) => setNewCharge({ ...newCharge, rate: e.target.value })}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      className="h-8 text-xs"
                      placeholder="1"
                      value={newCharge.roe || ""}
                      onChange={(e) => setNewCharge({ ...newCharge, roe: e.target.value })}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      className="h-8 text-xs"
                      placeholder="Quantity"
                      value={newCharge.quantity || ""}
                      onChange={(e) => setNewCharge({ ...newCharge, quantity: e.target.value })}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      className="h-8 text-xs"
                      placeholder="Amount"
                      value={newCharge.amount || ""}
                      onChange={(e) => setNewCharge({ ...newCharge, amount: e.target.value })}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Button size="sm" className="btn-success h-8 px-3 gap-1" onClick={handleAddCharge}>
                      <Plus size={14} /> Add
                    </Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Apply to Invoices */}
        <div className="px-6 space-y-4">
          <h3 className="text-lg font-semibold text-primary">Apply to Invoices</h3>

          {/* Selected invoices chips */}
          {selectedInvoices.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedInvoices.map((inv) => (
                <span
                  key={inv.invoiceId}
                  className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-md text-xs"
                >
                  {inv.invoiceNo}
                  <button
                    type="button"
                    onClick={() => setSelectedInvoices(selectedInvoices.filter((si) => si.invoiceId !== inv.invoiceId))}
                    className="text-primary/50 hover:text-primary"
                  >
                    <Trash2 size={10} />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Invoice picker */}
          <div className="max-w-md">
            <SearchableSelect
              options={unpaidInvoices
                .filter((ui) => !selectedInvoices.some((si) => si.invoiceId === ui.id))
                .map((ui) => ({
                  value: ui.id.toString(),
                  label: `${ui.invoiceNo} - Pending: ${ui.currencyCode || ""} ${ui.pendingAmount.toFixed(2)}`,
                }))}
              value=""
              onValueChange={(v) => {
                const inv = unpaidInvoices.find((ui) => ui.id === parseInt(v));
                if (inv) {
                  setSelectedInvoices([
                    ...selectedInvoices,
                    {
                      invoiceId: inv.id,
                      invoiceNo: inv.invoiceNo,
                      invoiceDate: inv.invoiceDate,
                      jobNo: inv.jobNo,
                      hblNo: inv.hblNo,
                      currencyId: inv.currencyId,
                      currencyCode: inv.currencyCode,
                      pendingAmount: inv.pendingAmount,
                      allocatedAmount: inv.pendingAmount,
                    },
                  ]);
                }
              }}
              placeholder={selectedCustomerId ? "Select invoice to apply..." : "Select a customer first"}
              searchPlaceholder="Search invoices..."
              emptyMessage="No unpaid invoices"
            />
          </div>

          {/* Selected invoices table */}
          {selectedInvoices.length > 0 && (
            <>
              <div className="bg-card rounded-lg border border-border overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-table-header text-table-header-foreground">
                      <th className="px-3 py-2 text-left text-sm font-semibold">Invoice No</th>
                      <th className="px-3 py-2 text-left text-sm font-semibold">Date</th>
                      <th className="px-3 py-2 text-left text-sm font-semibold">Job No</th>
                      <th className="px-3 py-2 text-left text-sm font-semibold">Currency</th>
                      <th className="px-3 py-2 text-right text-sm font-semibold">Pending</th>
                      <th className="px-3 py-2 text-right text-sm font-semibold">Allocating</th>
                      <th className="px-3 py-2 text-sm font-semibold"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInvoices.map((inv, i) => (
                      <tr
                        key={inv.invoiceId}
                        className={`border-b border-border ${i % 2 === 0 ? "bg-card" : "bg-secondary/30"}`}
                      >
                        <td className="px-3 py-2 text-sm text-blue-600">{inv.invoiceNo}</td>
                        <td className="px-3 py-2 text-sm">
                          {inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString() : "-"}
                        </td>
                        <td className="px-3 py-2 text-sm">{inv.jobNo || "-"}</td>
                        <td className="px-3 py-2 text-sm">{inv.currencyCode || "-"}</td>
                        <td className="px-3 py-2 text-sm text-right">{inv.pendingAmount.toFixed(2)}</td>
                        <td className="px-3 py-2">
                          <Input
                            type="number"
                            className="h-8 text-xs text-right w-28 ml-auto"
                            value={inv.allocatedAmount}
                            min={0}
                            max={inv.pendingAmount}
                            onChange={(e) => {
                              const val = Math.min(parseFloat(e.target.value) || 0, inv.pendingAmount);
                              setSelectedInvoices(
                                selectedInvoices.map((si) =>
                                  si.invoiceId === inv.invoiceId ? { ...si, allocatedAmount: val } : si
                                )
                              );
                            }}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive"
                            onClick={() =>
                              setSelectedInvoices(selectedInvoices.filter((si) => si.invoiceId !== inv.invoiceId))
                            }
                          >
                            <Trash2 size={14} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end">
                <div className="text-sm">
                  <span className="font-semibold">Total Allocated: </span>
                  <span className="font-bold">
                    {selectedInvoices.reduce((sum, inv) => sum + inv.allocatedAmount, 0).toFixed(2)}
                  </span>
                  <span className="text-muted-foreground ml-2">
                    / Credit Note Total: {chargeDetails.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Additional Contents */}
        <div className="px-6 pb-6 space-y-4">
          <div className="space-y-2">
            <Label className="text-sm">Additional Contents</Label>
            <Textarea
              className="min-h-[100px]"
              value={additionalContents}
              onChange={(e) => setAdditionalContents(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button className="btn-success" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
