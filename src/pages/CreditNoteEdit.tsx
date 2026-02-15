import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { creditNoteApi, customerApi, settingsApi, AccountCreditNoteDetail, Customer, CurrencyType, ChargeItem, UnpaidInvoice } from "@/services/api";
import { useUpdateCreditNote } from "@/hooks/useCreditNotes";
import { format } from "date-fns";
import { toast } from "sonner";

interface EditChargeLine {
  id?: number;
  chargeDetails: string;
  bases: string;
  currencyId?: number;
  currencyCode?: string;
  rate: string;
  roe: string;
  quantity: string;
  amount: string;
}

export default function CreditNoteEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const updateMutation = useUpdateCreditNote();
  const [creditNote, setCreditNote] = useState<AccountCreditNoteDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [currencyTypes, setCurrencyTypes] = useState<CurrencyType[]>([]);
  const [chargeItems, setChargeItems] = useState<ChargeItem[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    customerId: "",
    creditNoteDate: null as Date | null,
    jobNumber: "",
    referenceNo: "",
    email: "",
    status: "Active",
    additionalContents: "",
  });
  const [chargeLines, setChargeLines] = useState<EditChargeLine[]>([]);
  const [newCharge, setNewCharge] = useState<Partial<EditChargeLine>>({
    chargeDetails: "", bases: "", currencyId: undefined, rate: "1", roe: "1", quantity: "", amount: ""
  });

  // Invoice allocation state
  const [unpaidInvoices, setUnpaidInvoices] = useState<UnpaidInvoice[]>([]);
  const [selectedInvoices, setSelectedInvoices] = useState<{
    invoiceId: number;
    invoiceNo: string;
    invoiceDate?: string;
    jobNo?: string;
    hblNo?: string;
    currencyId?: number;
    currencyCode?: string;
    pendingAmount: number;
    allocatedAmount: number;
  }[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const [cnRes, custRes, currRes, ciRes] = await Promise.all([
          creditNoteApi.getById(parseInt(id)),
          customerApi.getAll({ pageSize: 1000, masterType: 'Debtors' }),
          settingsApi.getAllCurrencyTypes(),
          settingsApi.getAllChargeItems(),
        ]);

        if (cnRes.data) {
          setCreditNote(cnRes.data);
          const cn = cnRes.data;
          setFormData({
            customerId: cn.customerId.toString(),
            creditNoteDate: cn.creditNoteDate ? new Date(cn.creditNoteDate) : null,
            jobNumber: cn.jobNumber || "",
            referenceNo: cn.referenceNo || "",
            email: cn.email || "",
            status: cn.status || "Active",
            additionalContents: cn.additionalContents || "",
          });
          setChargeLines(
            (cn.details || []).map(d => ({
              id: d.id,
              chargeDetails: d.chargeDetails || "",
              bases: d.bases || "",
              currencyId: d.currencyId,
              currencyCode: d.currencyCode,
              rate: (d.rate ?? 0).toString(),
              roe: (d.roe ?? 1).toString(),
              quantity: (d.quantity ?? 0).toString(),
              amount: (d.amount ?? 0).toString(),
            }))
          );

          // Populate existing invoice allocations
          if (cn.invoices && cn.invoices.length > 0) {
            setSelectedInvoices(
              cn.invoices.map(inv => ({
                invoiceId: inv.invoiceId,
                invoiceNo: inv.invoiceNo || "",
                invoiceDate: inv.invoiceDate,
                jobNo: inv.jobNo,
                hblNo: inv.hblNo,
                currencyId: inv.currencyId,
                currencyCode: inv.currencyCode,
                pendingAmount: inv.amount + inv.balance, // Original pending = what was allocated + remaining balance
                allocatedAmount: inv.amount,
              }))
            );
          }

          // Fetch unpaid invoices for this customer (excluding current CN)
          const unpaidRes = await creditNoteApi.getUnpaidInvoices(cn.customerId, parseInt(id));
          if (unpaidRes.data) {
            setUnpaidInvoices(unpaidRes.data);
          }
        }
        if (custRes.data) setCustomers(custRes.data.items);
        if (currRes.data) setCurrencyTypes(currRes.data);
        if (ciRes.data) setChargeItems(ciRes.data);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load credit note data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleAddCharge = () => {
    if (!newCharge.chargeDetails) return;
    setChargeLines([...chargeLines, {
      chargeDetails: newCharge.chargeDetails || "",
      bases: newCharge.bases || "",
      currencyId: newCharge.currencyId,
      rate: newCharge.rate || "0",
      roe: newCharge.roe || "1",
      quantity: newCharge.quantity || "0",
      amount: newCharge.amount || "0",
    }]);
    setNewCharge({ chargeDetails: "", bases: "", currencyId: undefined, rate: "1", roe: "1", quantity: "", amount: "" });
  };

  const handleRemoveCharge = (index: number) => {
    setChargeLines(chargeLines.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!id || !formData.customerId || !formData.creditNoteDate) {
      toast.error("Please fill in required fields (Customer, Date)");
      return;
    }

    setSaving(true);
    try {
      await updateMutation.mutateAsync({
        id: parseInt(id),
        data: {
          creditNoteDate: format(formData.creditNoteDate, "yyyy-MM-dd"),
          customerId: parseInt(formData.customerId),
          jobNumber: formData.jobNumber || undefined,
          referenceNo: formData.referenceNo || undefined,
          email: formData.email || undefined,
          additionalContents: formData.additionalContents || undefined,
          status: formData.status || undefined,
          details: chargeLines.map(line => ({
            id: line.id,
            chargeDetails: line.chargeDetails || undefined,
            bases: line.bases || undefined,
            currencyId: line.currencyId,
            rate: parseFloat(line.rate) || 0,
            roe: parseFloat(line.roe) || 1,
            quantity: parseFloat(line.quantity) || 0,
            amount: parseFloat(line.amount) || 0,
          })),
          invoices: selectedInvoices.map(inv => ({
            invoiceId: inv.invoiceId,
            amount: inv.allocatedAmount,
            currencyId: inv.currencyId,
          })),
        },
      });
      navigate(`/accounts/credit-notes/${id}`);
    } catch {
      // Error handled by mutation
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
          <span className="text-lg">Loading credit note...</span>
        </div>
      </MainLayout>
    );
  }

  if (!creditNote) {
    return (
      <MainLayout>
        <div className="p-6 flex flex-col items-center justify-center min-h-[400px]">
          <div className="text-lg mb-4">Credit Note not found</div>
          <Button onClick={() => navigate("/accounts/credit-notes")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Credit Notes
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Edit Credit Note - {creditNote.creditNoteNo}</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate(`/accounts/credit-notes/${id}`)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button className="btn-success" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>

        {/* Form */}
        <div className="bg-card border rounded-lg p-6 space-y-6">
          <h3 className="text-lg font-semibold text-primary">Credit Note Details</h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label className="text-sm">Credit Note #</Label>
              <Input value={creditNote.creditNoteNo} disabled className="bg-muted/50" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">*Customer</Label>
              <SearchableSelect
                options={customers.map(c => ({ value: c.id.toString(), label: c.name }))}
                value={formData.customerId}
                onValueChange={v => setFormData({...formData, customerId: v})}
                placeholder="Select customer"
                searchPlaceholder="Search customers..."
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">*Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.creditNoteDate ? format(formData.creditNoteDate, "dd-MM-yyyy") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-popover z-50">
                  <Calendar mode="single" selected={formData.creditNoteDate || undefined} onSelect={(d) => setFormData({...formData, creditNoteDate: d || null})} />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Status</Label>
              <SearchableSelect
                options={[
                  { value: "Active", label: "Active" },
                  { value: "Inactive", label: "Inactive" },
                ]}
                value={formData.status}
                onValueChange={v => setFormData({...formData, status: v})}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-sm">Job Number</Label>
              <Input value={formData.jobNumber} onChange={e => setFormData({...formData, jobNumber: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Reference #</Label>
              <Input value={formData.referenceNo} onChange={e => setFormData({...formData, referenceNo: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Email</Label>
              <Input value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
          </div>
        </div>

        {/* Charges Details */}
        <div className="bg-card border rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-semibold text-primary">Charge Details</h3>

          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-table-header text-table-header-foreground">
                  <th className="px-3 py-2 text-left text-sm font-semibold">Charge Details</th>
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
                {chargeLines.map((charge, i) => (
                  <tr key={i} className={`border-b border-border ${i % 2 === 0 ? "bg-card" : "bg-secondary/30"}`}>
                    <td className="px-3 py-2 text-sm">{charge.chargeDetails}</td>
                    <td className="px-3 py-2 text-sm">{charge.bases}</td>
                    <td className="px-3 py-2 text-sm">{charge.currencyCode || currencyTypes.find(c => c.id === charge.currencyId)?.code || "-"}</td>
                    <td className="px-3 py-2 text-sm">{charge.rate}</td>
                    <td className="px-3 py-2 text-sm">{charge.roe}</td>
                    <td className="px-3 py-2 text-sm">{charge.quantity}</td>
                    <td className="px-3 py-2 text-sm">{charge.amount}</td>
                    <td className="px-3 py-2">
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleRemoveCharge(i)}>
                        <Trash2 size={14} />
                      </Button>
                    </td>
                  </tr>
                ))}
                {/* Add new charge row */}
                <tr className="bg-card">
                  <td className="px-3 py-2">
                    <SearchableSelect
                      options={chargeItems.map(ci => ({ value: ci.name, label: ci.name }))}
                      value={newCharge.chargeDetails || ""}
                      onValueChange={v => setNewCharge({...newCharge, chargeDetails: v})}
                      placeholder="Select"
                      triggerClassName="h-8 text-xs bg-background"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input className="h-8 text-xs" placeholder="Bases" value={newCharge.bases || ""} onChange={e => setNewCharge({...newCharge, bases: e.target.value})} />
                  </td>
                  <td className="px-3 py-2">
                    <SearchableSelect
                      options={currencyTypes.map(c => ({ value: c.id.toString(), label: c.code }))}
                      value={newCharge.currencyId?.toString() || ""}
                      onValueChange={v => setNewCharge({...newCharge, currencyId: parseInt(v)})}
                      placeholder="Select"
                      triggerClassName="h-8 text-xs bg-background"
                      searchPlaceholder="Search currencies..."
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input className="h-8 text-xs" placeholder="1" value={newCharge.rate || ""} onChange={e => setNewCharge({...newCharge, rate: e.target.value})} />
                  </td>
                  <td className="px-3 py-2">
                    <Input className="h-8 text-xs" placeholder="1" value={newCharge.roe || ""} onChange={e => setNewCharge({...newCharge, roe: e.target.value})} />
                  </td>
                  <td className="px-3 py-2">
                    <Input className="h-8 text-xs" placeholder="Qty" value={newCharge.quantity || ""} onChange={e => setNewCharge({...newCharge, quantity: e.target.value})} />
                  </td>
                  <td className="px-3 py-2">
                    <Input className="h-8 text-xs" placeholder="Amount" value={newCharge.amount || ""} onChange={e => setNewCharge({...newCharge, amount: e.target.value})} />
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

        {/* Additional Contents */}
        <div className="bg-card border rounded-lg p-6 space-y-4">
          <div className="space-y-2">
            <Label className="text-sm">Additional Contents</Label>
            <Textarea
              className="min-h-[100px]"
              value={formData.additionalContents}
              onChange={e => setFormData({...formData, additionalContents: e.target.value})}
            />
          </div>
        </div>

        {/* Apply to Invoices */}
        <div className="bg-card border rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-semibold text-primary">Apply to Invoices</h3>

          {/* Selected invoices chips */}
          {selectedInvoices.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedInvoices.map(inv => (
                <span
                  key={inv.invoiceId}
                  className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-md text-xs"
                >
                  {inv.invoiceNo}
                  <button
                    type="button"
                    onClick={() => setSelectedInvoices(selectedInvoices.filter(si => si.invoiceId !== inv.invoiceId))}
                    className="text-primary/50 hover:text-primary"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Invoice picker */}
          <div className="max-w-md">
            <SearchableSelect
              options={unpaidInvoices
                .filter(ui => !selectedInvoices.some(si => si.invoiceId === ui.id))
                .map(ui => ({
                  value: ui.id.toString(),
                  label: `${ui.invoiceNo} - Pending: ${ui.currencyCode || ''} ${ui.pendingAmount.toFixed(2)}`,
                }))}
              value=""
              onValueChange={(v) => {
                const inv = unpaidInvoices.find(ui => ui.id === parseInt(v));
                if (inv) {
                  setSelectedInvoices([...selectedInvoices, {
                    invoiceId: inv.id,
                    invoiceNo: inv.invoiceNo,
                    invoiceDate: inv.invoiceDate,
                    jobNo: inv.jobNo,
                    hblNo: inv.hblNo,
                    currencyId: inv.currencyId,
                    currencyCode: inv.currencyCode,
                    pendingAmount: inv.pendingAmount,
                    allocatedAmount: inv.pendingAmount,
                  }]);
                }
              }}
              placeholder="Select invoice to apply..."
              searchPlaceholder="Search invoices..."
              emptyMessage={!formData.customerId ? "Select a customer first" : "No unpaid invoices"}
              disabled={!formData.customerId}
            />
          </div>

          {/* Selected invoices table */}
          {selectedInvoices.length > 0 && (
            <>
              <div className="border rounded-lg overflow-hidden">
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
                      <tr key={inv.invoiceId} className={`border-b border-border ${i % 2 === 0 ? "bg-card" : "bg-secondary/30"}`}>
                        <td className="px-3 py-2 text-sm text-blue-600">{inv.invoiceNo}</td>
                        <td className="px-3 py-2 text-sm">{inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString() : '-'}</td>
                        <td className="px-3 py-2 text-sm">{inv.jobNo || '-'}</td>
                        <td className="px-3 py-2 text-sm">{inv.currencyCode || '-'}</td>
                        <td className="px-3 py-2 text-sm text-right">{inv.pendingAmount.toFixed(2)}</td>
                        <td className="px-3 py-2">
                          <Input
                            type="number"
                            className="h-8 text-xs text-right w-28 ml-auto"
                            value={inv.allocatedAmount}
                            min={0}
                            max={inv.pendingAmount}
                            onChange={e => {
                              const val = Math.min(parseFloat(e.target.value) || 0, inv.pendingAmount);
                              setSelectedInvoices(selectedInvoices.map(si =>
                                si.invoiceId === inv.invoiceId ? { ...si, allocatedAmount: val } : si
                              ));
                            }}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setSelectedInvoices(selectedInvoices.filter(si => si.invoiceId !== inv.invoiceId))}>
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
                  <span className="font-bold">{selectedInvoices.reduce((sum, inv) => sum + inv.allocatedAmount, 0).toFixed(2)}</span>
                  <span className="text-muted-foreground ml-2">
                    / Credit Note Total: {chargeLines.reduce((sum, l) => sum + (parseFloat(l.amount) || 0), 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
