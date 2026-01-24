import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { DateInput } from "@/components/ui/date-input";
import { getTodayDateOnly } from "@/lib/utils";
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
import { Search, Loader2 } from "lucide-react";
import { ShipmentParty, ShipmentCosting, CreatePurchaseInvoiceItemRequest, invoiceApi, customerApi, settingsApi, CurrencyType } from "@/services/api";
import { useCreatePurchaseInvoice } from "@/hooks/useInvoices";

// Result type for the onSave callback
interface PurchaseSaveResult {
  purchaseId: string;
  companyName: string;
  customerId: string;
  invoiceDate: string;
  invoiceNo: string;
  vDate: string;
  currencyId: number;
  remarks: string;
  charges: number[];
}

interface PurchaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shipmentId: number | null;
  jobNumber?: string;
  chargesDetails: ShipmentCosting[];
  parties: ShipmentParty[];
  onSave: (purchase: PurchaseSaveResult) => void;
}

// Helper function to deduplicate parties by customerId
const deduplicateByCustomerId = (partyList: ShipmentParty[]): ShipmentParty[] => {
  const seen = new Set<number>();
  return partyList.filter(p => {
    if (p.customerId === undefined) return true;
    if (seen.has(p.customerId)) return false;
    seen.add(p.customerId);
    return true;
  });
};

export function PurchaseModal({ open, onOpenChange, shipmentId, jobNumber, chargesDetails, parties, onSave }: PurchaseModalProps) {
  const createPurchaseInvoiceMutation = useCreatePurchaseInvoice();

  // Filter parties to only show Creditors and deduplicate by customerId
  const creditorParties = useMemo(() =>
    deduplicateByCustomerId(parties.filter(p => p.masterType === 'Creditors')),
    [parties]
  );

  const [currencies, setCurrencies] = useState<CurrencyType[]>([]);

  const [formData, setFormData] = useState({
    purchaseId: "",
    companyName: "",
    customerId: "",
    invoiceDate: getTodayDateOnly(),
    invoiceNo: "",
    vDate: getTodayDateOnly(),
    currencyId: 1, // Default to AED (ID 1)
    currencyCode: "AED",
    remarks: "",
    selectedCharges: [] as number[],
  });

  // Reset form and fetch next purchase number when modal opens
  useEffect(() => {
    if (open) {
      setFormData({
        purchaseId: "",
        companyName: "",
        customerId: "",
        invoiceDate: getTodayDateOnly(),
        invoiceNo: "",
        vDate: getTodayDateOnly(),
        currencyId: 1,
        currencyCode: "AED",
        remarks: "",
        selectedCharges: [],
      });
      invoiceApi.getNextPurchaseNumber().then(response => {
        if (response.data) {
          setFormData(prev => ({ ...prev, purchaseId: response.data as string }));
        }
      });
      settingsApi.getAllCurrencyTypes().then(response => {
        if (response.data) {
          setCurrencies(response.data);
        }
      });
    }
  }, [open]);

  // Filter charges to only show items with cost quantity > 0, not already purchase invoiced,
  // and assigned to the selected creditor
  const filteredCharges = useMemo(() => {
    const selectedParty = creditorParties.find(p => p.id.toString() === formData.customerId);
    const selectedCustomerId = selectedParty?.customerId;

    return chargesDetails.filter(c => {
      const hasValidCost = parseFloat(c.costQty || 0) > 0 && !c.purchaseInvoiced;
      // Only show costings explicitly assigned to this creditor (exclude null)
      const matchesVendor = selectedCustomerId
        ? c.vendorCustomerId === selectedCustomerId
        : false;
      return hasValidCost && matchesVendor;
    });
  }, [chargesDetails, formData.customerId, creditorParties]);

  // Update currency when company selection changes
  useEffect(() => {
    if (formData.customerId) {
      const selectedParty = creditorParties.find(p => p.id.toString() === formData.customerId);
      if (selectedParty?.customerId) {
        setFormData(prev => ({ ...prev, companyName: selectedParty.customerName }));
        // Fetch customer's default currency and resolve currency code
        customerApi.getById(selectedParty.customerId).then(customerResponse => {
          if (customerResponse.data) {
            const custCurrencyId = customerResponse.data.currencyId || 1;
            const currency = currencies.find(c => c.id === custCurrencyId);
            setFormData(prev => ({
              ...prev,
              currencyId: custCurrencyId,
              currencyCode: currency?.code || "AED",
            }));
          }
        });
      }
    }
  }, [formData.customerId, creditorParties, currencies]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCompanySelect = (partyId: string) => {
    const selectedParty = creditorParties.find(p => p.id.toString() === partyId);
    if (selectedParty) {
      setFormData(prev => ({
        ...prev,
        customerId: partyId,
        companyName: selectedParty.customerName,
        selectedCharges: [], // Reset selections when creditor changes
      }));
    }
  };

  const handleCheckCharge = (chargeId: number, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      selectedCharges: checked
        ? [...prev.selectedCharges, chargeId]
        : prev.selectedCharges.filter(id => id !== chargeId)
    }));
  };

  const handleCheckAll = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      selectedCharges: checked ? filteredCharges.map(c => c.id) : []
    }));
  };

  const handleSubmit = () => {
    // Filter and load selected charges
  };

  const handleSave = async () => {
    if (!shipmentId) {
      return;
    }

    const selectedParty = creditorParties.find(p => p.id.toString() === formData.customerId);
    if (!selectedParty?.customerId) {
      return;
    }

    // Map selected charges to purchase invoice items and deduplicate by id
    const items: CreatePurchaseInvoiceItemRequest[] = filteredCharges
      .filter(c => formData.selectedCharges.includes(c.id))
      .filter((charge, index, self) =>
        index === self.findIndex(c => c.id === charge.id)
      )
      .map(charge => ({
        shipmentCostingId: charge.id,
        chargeDetails: charge.description || '',
        noOfUnit: charge.costQty || 1,
        ppcc: charge.ppcc || 'PP',
        costPerUnit: charge.costUnit || 0,
        currencyId: charge.costCurrencyId || 1, // Default to AED (ID 1)
        fcyAmount: charge.costFCY || 0,
        exRate: charge.costExRate || 1,
        localAmount: charge.costLCY || 0,
        taxPercentage: charge.costTaxPercentage || 0,
        taxAmount: charge.costTaxAmount || 0,
      }));

    try {
      await createPurchaseInvoiceMutation.mutateAsync({
        shipmentId,
        vendorId: selectedParty.customerId,
        purchaseDate: formData.invoiceDate,
        vendorInvoiceNo: formData.invoiceNo || undefined,
        vendorInvoiceDate: formData.vDate || undefined,
        jobNo: jobNumber || undefined,
        currencyId: formData.currencyId,
        remarks: formData.remarks || undefined,
        items,
      });

      onSave({
        purchaseId: formData.purchaseId,
        companyName: formData.companyName,
        customerId: formData.customerId,
        invoiceDate: formData.invoiceDate,
        invoiceNo: formData.invoiceNo,
        vDate: formData.vDate,
        currencyId: formData.currencyId,
        remarks: formData.remarks,
        charges: formData.selectedCharges,
      });
      onOpenChange(false);
    } catch (error) {
      // Error is handled by the mutation's onError callback
    }
  };

  const selectedChargesData = filteredCharges.filter(c => formData.selectedCharges.includes(c.id));

  const totalSale = selectedChargesData.reduce((sum, c) => sum + parseFloat(c.saleLCY || 0), 0);
  const totalCost = selectedChargesData.reduce((sum, c) => sum + parseFloat(c.costLCY || 0), 0);
  const totalTax = selectedChargesData.reduce((sum, c) => sum + parseFloat(c.costTaxAmount || 0), 0);
  const totalWithTax = totalCost + totalTax;
  const profit = totalSale - totalCost;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-card border border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground text-lg bg-[#2c3e50] text-white p-3 -m-6 mb-0 rounded-t-lg">
            New Purchase Invoice
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {/* Purchase Section Header */}
          <div className="flex justify-between items-center">
            <h3 className="text-emerald-600 font-semibold">Purchase</h3>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="bg-emerald-500 hover:bg-emerald-600 text-white h-9"
                onClick={handleSave}
                disabled={!shipmentId || !formData.customerId || formData.selectedCharges.length === 0 || createPurchaseInvoiceMutation.isPending}
              >
                {createPurchaseInvoiceMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save'
                )}
              </Button>
              <Button size="sm" variant="outline" onClick={() => onOpenChange(false)} className="h-9" disabled={createPurchaseInvoiceMutation.isPending}>
                Back
              </Button>
            </div>
          </div>

          {/* Purchase Details Row 1 */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs font-medium">Purchase ID</Label>
              <Input
                value={formData.purchaseId}
                className="bg-muted h-9"
                readOnly
              />
            </div>
            <div>
              <Label className="text-xs font-medium">Company Name (Creditors)</Label>
              <Select value={formData.customerId} onValueChange={handleCompanySelect}>
                <SelectTrigger className="bg-background border-border h-9">
                  <SelectValue placeholder="Select creditor" />
                </SelectTrigger>
                <SelectContent className="bg-popover border border-border">
                  {creditorParties.length === 0 ? (
                    <SelectItem value="_none" disabled>No creditors in parties</SelectItem>
                  ) : (
                    creditorParties.map(party => (
                      <SelectItem key={party.id} value={party.id.toString()}>
                        {party.customerName}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-medium">* Invoice Date</Label>
              <DateInput
                value={formData.invoiceDate}
                onChange={(v) => handleInputChange("invoiceDate", v)}
                className="h-9"
              />
            </div>
          </div>

          {/* Purchase Details Row 2 */}
          <div className="grid grid-cols-4 gap-3 items-end">
            <div>
              <Label className="text-xs font-medium">* Invoice No</Label>
              <Input
                value={formData.invoiceNo}
                onChange={(e) => handleInputChange("invoiceNo", e.target.value)}
                className="bg-background border-border h-9"
              />
            </div>
            <div>
              <Label className="text-xs font-medium">* V.Date</Label>
              <DateInput
                value={formData.vDate}
                onChange={(v) => handleInputChange("vDate", v)}
                className="h-9"
              />
            </div>
            <div>
              <Label className="text-xs font-medium">* Base Currency</Label>
              <Input
                value={formData.currencyCode}
                className="bg-muted h-9"
                readOnly
              />
            </div>
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Label className="text-xs font-medium">Remarks</Label>
                <Input
                  value={formData.remarks}
                  onChange={(e) => handleInputChange("remarks", e.target.value)}
                  className="bg-background border-border h-9"
                  placeholder="Remarks"
                />
              </div>
              <Button
                size="sm"
                onClick={handleSubmit}
                className="bg-emerald-500 hover:bg-emerald-600 text-white h-9"
              >
                <Search className="h-4 w-4 mr-1" />
                Submit
              </Button>
            </div>
          </div>

          {/* Charges Details */}
          <div className="space-y-3">
            <h3 className="text-emerald-600 font-semibold text-sm">Charges Details</h3>
            <div className="flex items-center gap-2">
              <Checkbox
                id="checkAllPurchase"
                checked={formData.selectedCharges.length === filteredCharges.length && filteredCharges.length > 0}
                onCheckedChange={(checked) => handleCheckAll(checked as boolean)}
              />
              <Label htmlFor="checkAllPurchase" className="text-xs">Check All</Label>
            </div>

            <Table>
              <TableHeader>
                <TableRow className="bg-table-header">
                  <TableHead className="text-table-header-foreground w-10"></TableHead>
                  <TableHead className="text-table-header-foreground text-xs">Sl.No</TableHead>
                  <TableHead className="text-table-header-foreground text-xs">Charges Details</TableHead>
                  <TableHead className="text-table-header-foreground text-xs">No of unit</TableHead>
                  <TableHead className="text-table-header-foreground text-xs">PP/CC</TableHead>
                  <TableHead className="text-table-header-foreground text-xs">Cost/Unit</TableHead>
                  <TableHead className="text-table-header-foreground text-xs">Currency</TableHead>
                  <TableHead className="text-table-header-foreground text-xs">FCY Amount</TableHead>
                  <TableHead className="text-table-header-foreground text-xs">Ex.Rate</TableHead>
                  <TableHead className="text-table-header-foreground text-xs">Local Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCharges.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground text-xs py-4">
                      {!formData.customerId
                        ? "Select a creditor to see available charges"
                        : "No uninvoiced charges assigned to this creditor"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCharges.map((charge, index) => (
                    <TableRow key={charge.id} className={index % 2 === 0 ? "bg-card" : "bg-secondary/30"}>
                      <TableCell className="py-2">
                        <Checkbox
                          checked={formData.selectedCharges.includes(charge.id)}
                          onCheckedChange={(checked) => handleCheckCharge(charge.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell className="text-xs py-2">{(index + 1) * 10}</TableCell>
                      <TableCell className="text-xs py-2">{charge.description}</TableCell>
                      <TableCell className="text-xs py-2">{charge.costQty}</TableCell>
                      <TableCell className="text-xs py-2">{charge.ppcc || "Postpaid"}</TableCell>
                      <TableCell className="text-xs py-2">{charge.costUnit}</TableCell>
                      <TableCell className="text-xs py-2">{currencies.find(c => c.id === charge.costCurrencyId)?.code || charge.costCurrencyCode || ""}</TableCell>
                      <TableCell className="text-xs py-2">{charge.costFCY}</TableCell>
                      <TableCell className="text-xs py-2">{charge.costExRate}</TableCell>
                      <TableCell className="text-xs py-2">{charge.costLCY}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="grid grid-cols-5 gap-4 bg-secondary/30 p-3 rounded-lg">
              <div>
                <Label className="text-xs font-semibold">Sub Total</Label>
                <div className="text-foreground font-semibold text-sm">AED {totalCost.toFixed(2)}</div>
              </div>
              <div>
                <Label className="text-xs font-semibold">VAT</Label>
                <div className="text-foreground font-semibold text-sm">AED {totalTax.toFixed(2)}</div>
              </div>
              <div>
                <Label className="text-xs font-semibold">Total Cost</Label>
                <div className="text-red-600 font-semibold text-sm">AED {totalWithTax.toFixed(2)}</div>
              </div>
              <div>
                <Label className="text-xs font-semibold">Total Sale</Label>
                <div className="text-emerald-600 font-semibold text-sm">AED {totalSale.toFixed(2)}</div>
              </div>
              <div>
                <Label className="text-xs font-semibold">Profit (GP)</Label>
                <div className={`font-semibold text-sm ${profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  AED {profit.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
