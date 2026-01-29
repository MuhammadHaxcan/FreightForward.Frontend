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
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Loader2, X } from "lucide-react";
import { ShipmentParty, ShipmentCosting, CreateInvoiceItemRequest, invoiceApi, customerApi, settingsApi, CurrencyType } from "@/services/api";
import { useCreateInvoice } from "@/hooks/useInvoices";

// Result type for the onSave callback
interface InvoiceSaveResult {
  invoiceId: string;
  companyName: string;
  customerId: string;
  invoiceDate: string;
  currencyId: number;
  charges: number[];
}

interface InvoiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shipmentId: number | null;
  chargesDetails: ShipmentCosting[];
  parties: ShipmentParty[];
  onSave: (invoice: InvoiceSaveResult) => void;
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

export function InvoiceModal({ open, onOpenChange, shipmentId, chargesDetails, parties, onSave }: InvoiceModalProps) {
  const createInvoiceMutation = useCreateInvoice();

  // Filter parties to only show Debtors and deduplicate by customerId
  const debtorParties = useMemo(() =>
    deduplicateByCustomerId(parties.filter(p => p.masterType === 'Debtors')),
    [parties]
  );

  const [currencies, setCurrencies] = useState<CurrencyType[]>([]);

  const [formData, setFormData] = useState({
    invoiceId: "",
    companyName: "",
    customerId: "",
    invoiceDate: getTodayDateOnly(),
    currencyId: 1, // Default to AED (ID 1)
    currencyCode: "AED",
    selectedCharges: [] as number[],
  });

  // Reset form and fetch next invoice number when modal opens
  useEffect(() => {
    if (open) {
      // Reset form data first
      setFormData({
        invoiceId: "",
        companyName: "",
        customerId: "",
        invoiceDate: getTodayDateOnly(),
        currencyId: 1,
        currencyCode: "AED",
        selectedCharges: [],
      });
      // Fetch next invoice number
      invoiceApi.getNextInvoiceNumber().then(response => {
        if (response.data) {
          setFormData(prev => ({ ...prev, invoiceId: response.data as string }));
        }
      });
      // Fetch currency types
      settingsApi.getAllCurrencyTypes().then(response => {
        if (response.data) {
          setCurrencies(response.data);
        }
      });
    }
  }, [open]);

  // Filter charges to only show items with sale quantity > 0, not already invoiced,
  // and assigned to the selected debtor
  const filteredCharges = useMemo(() => {
    const selectedParty = debtorParties.find(p => p.id.toString() === formData.customerId);
    const selectedCustomerId = selectedParty?.customerId;

    return chargesDetails.filter(c => {
      const hasValidSale = parseFloat(c.saleQty || 0) > 0 && !c.saleInvoiced;
      // Only show costings explicitly assigned to this debtor (exclude null)
      const matchesCustomer = selectedCustomerId
        ? c.billToCustomerId === selectedCustomerId
        : false;
      return hasValidSale && matchesCustomer;
    });
  }, [chargesDetails, formData.customerId, debtorParties]);

  // Update currency when company selection changes
  useEffect(() => {
    if (formData.customerId) {
      const selectedParty = debtorParties.find(p => p.id.toString() === formData.customerId);
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
  }, [formData.customerId, debtorParties, currencies]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCompanySelect = (partyId: string) => {
    const selectedParty = debtorParties.find(p => p.id.toString() === partyId);
    if (selectedParty) {
      setFormData(prev => ({
        ...prev,
        customerId: partyId,
        companyName: selectedParty.customerName,
        selectedCharges: [], // Reset selections when debtor changes
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

    const selectedParty = debtorParties.find(p => p.id.toString() === formData.customerId);
    if (!selectedParty?.customerId) {
      return;
    }

    // Determine baseCurrencyId from the first selected charge's sale currency
    const selectedCharges = filteredCharges
      .filter(c => formData.selectedCharges.includes(c.id))
      .filter((charge, index, self) =>
        index === self.findIndex(c => c.id === charge.id)
      );
    const baseCurrencyId = selectedCharges.length > 0 ? (selectedCharges[0].saleCurrencyId || 1) : 1;

    // Map selected charges to invoice items with currency conversion
    const items: CreateInvoiceItemRequest[] = selectedCharges
      .map(charge => {
        const chargeRoe = parseFloat(charge.saleExRate || 1);
        const customerCurrency = currencies.find(c => c.id === formData.currencyId);
        const customerRoe = customerCurrency?.roe || 1;
        // If same currency, no conversion needed
        const sameCurrency = (charge.saleCurrencyId || 1) === formData.currencyId;
        const exRate = sameCurrency ? 1 : chargeRoe / customerRoe;
        const saleFCY = parseFloat(charge.saleFCY || 0);
        const localAmount = saleFCY * exRate;
        const saleTaxAmount = parseFloat(charge.saleTaxAmount || 0);
        const taxAmount = saleTaxAmount * exRate;

        return {
          shipmentCostingId: charge.id,
          chargeDetails: charge.description || '',
          noOfUnit: charge.saleQty || 1,
          ppcc: charge.ppcc || 'PP',
          salePerUnit: charge.saleUnit || 0,
          currencyId: charge.saleCurrencyId || 1,
          fcyAmount: saleFCY,
          exRate: exRate,
          localAmount: localAmount,
          taxPercentage: charge.saleTaxPercentage || 0,
          taxAmount: taxAmount,
        };
      });

    try {
      await createInvoiceMutation.mutateAsync({
        shipmentId,
        customerId: selectedParty.customerId,
        invoiceDate: formData.invoiceDate,
        currencyId: formData.currencyId,
        baseCurrencyId,
        remarks: '',
        items,
      });

      onSave({
        invoiceId: formData.invoiceId,
        companyName: formData.companyName,
        customerId: formData.customerId,
        invoiceDate: formData.invoiceDate,
        currencyId: formData.currencyId,
        charges: formData.selectedCharges,
      });
      onOpenChange(false);
    } catch (error) {
      // Error is handled by the mutation's onError callback
    }
  };

  const selectedChargesData = filteredCharges.filter(c => formData.selectedCharges.includes(c.id));

  // Convert totals to customer currency
  const convertToCustomerCurrency = (amount: number, chargeCurrencyId: number, chargeRoe: number) => {
    if (chargeCurrencyId === formData.currencyId) return amount;
    const customerCurrency = currencies.find(c => c.id === formData.currencyId);
    const customerRoe = customerCurrency?.roe || 1;
    const exRate = chargeRoe / customerRoe;
    return amount * exRate;
  };

  const totalSale = selectedChargesData.reduce((sum, c) => {
    const saleFCY = parseFloat(c.saleFCY || 0);
    return sum + convertToCustomerCurrency(saleFCY, c.saleCurrencyId || 1, parseFloat(c.saleExRate || 1));
  }, 0);
  const totalTax = selectedChargesData.reduce((sum, c) => {
    const taxAmount = parseFloat(c.saleTaxAmount || 0);
    return sum + convertToCustomerCurrency(taxAmount, c.saleCurrencyId || 1, parseFloat(c.saleExRate || 1));
  }, 0);
  const totalCost = selectedChargesData.reduce((sum, c) => {
    const costFCY = parseFloat(c.costFCY || 0);
    return sum + convertToCustomerCurrency(costFCY, c.costCurrencyId || 1, parseFloat(c.costExRate || 1));
  }, 0);
  const totalWithTax = totalSale + totalTax;
  const profit = totalSale - totalCost;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-card border border-border p-0">
        <DialogHeader className="bg-modal-header text-white p-4 rounded-t-lg">
          <DialogTitle className="text-white text-lg font-semibold">
            New Invoice
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 p-6 pt-4">
          {/* Invoice Section Header */}
          <h3 className="text-primary font-semibold">Invoice</h3>

          {/* Invoice Details */}
          <div className="grid grid-cols-4 gap-3">
            <div>
              <Label className="text-xs font-medium">Invoice ID</Label>
              <Input
                value={formData.invoiceId}
                className="bg-muted h-9"
                readOnly
              />
            </div>
            <div>
              <Label className="text-xs font-medium">Company Name (Debtors)</Label>
              <SearchableSelect
                options={debtorParties.map(party => ({ value: party.id.toString(), label: party.customerName }))}
                value={formData.customerId}
                onValueChange={handleCompanySelect}
                placeholder="Select debtor"
                searchPlaceholder="Search debtors..."
                triggerClassName="bg-background border-border h-9"
                emptyMessage="No debtors in parties"
              />
            </div>
            <div>
              <Label className="text-xs font-medium">* Invoice Date</Label>
              <DateInput
                value={formData.invoiceDate}
                onChange={(v) => handleInputChange("invoiceDate", v)}
                className="h-9"
              />
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Label className="text-xs font-medium">* Base Currency</Label>
                <Input
                  value={formData.currencyCode}
                  className="bg-muted h-9"
                  readOnly
                />
              </div>
              <Button
                size="sm"
                onClick={handleSubmit}
                className="btn-success h-9"
              >
                <Search className="h-4 w-4 mr-1" />
                Submit
              </Button>
            </div>
          </div>

          {/* Charges Details */}
          <div className="space-y-3">
            <h3 className="text-primary font-semibold text-sm">Charges Details</h3>
            <div className="flex items-center gap-2">
              <Checkbox
                id="checkAll"
                checked={formData.selectedCharges.length === filteredCharges.length && filteredCharges.length > 0}
                onCheckedChange={(checked) => handleCheckAll(checked as boolean)}
              />
              <Label htmlFor="checkAll" className="text-xs">Check All</Label>
            </div>

            <Table>
              <TableHeader>
                <TableRow className="bg-table-header">
                  <TableHead className="text-table-header-foreground w-10"></TableHead>
                  <TableHead className="text-table-header-foreground text-xs">Sl.No</TableHead>
                  <TableHead className="text-table-header-foreground text-xs">Charges Details</TableHead>
                  <TableHead className="text-table-header-foreground text-xs">No of unit</TableHead>
                  <TableHead className="text-table-header-foreground text-xs">PP/CC</TableHead>
                  <TableHead className="text-table-header-foreground text-xs">Sale/Unit</TableHead>
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
                        ? "Select a debtor to see available charges"
                        : "No uninvoiced charges assigned to this debtor"}
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
                      <TableCell className="text-xs py-2">{charge.saleQty}</TableCell>
                      <TableCell className="text-xs py-2">{charge.ppcc || "Postpaid"}</TableCell>
                      <TableCell className="text-xs py-2">{charge.saleUnit}</TableCell>
                      <TableCell className="text-xs py-2">{currencies.find(c => c.id === charge.saleCurrencyId)?.code || charge.saleCurrencyCode || ""}</TableCell>
                      <TableCell className="text-xs py-2">{charge.saleFCY}</TableCell>
                      <TableCell className="text-xs py-2">{charge.saleExRate}</TableCell>
                      <TableCell className="text-xs py-2">{charge.saleLCY}</TableCell>
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
                <div className="text-foreground font-semibold text-sm">{formData.currencyCode} {totalSale.toFixed(2)}</div>
              </div>
              <div>
                <Label className="text-xs font-semibold">VAT</Label>
                <div className="text-foreground font-semibold text-sm">{formData.currencyCode} {totalTax.toFixed(2)}</div>
              </div>
              <div>
                <Label className="text-xs font-semibold">Total Sale</Label>
                <div className="text-primary font-semibold text-sm">{formData.currencyCode} {totalWithTax.toFixed(2)}</div>
              </div>
              <div>
                <Label className="text-xs font-semibold">Total Cost</Label>
                <div className="text-foreground font-semibold text-sm">{formData.currencyCode} {totalCost.toFixed(2)}</div>
              </div>
              <div>
                <Label className="text-xs font-semibold">Profit (GP)</Label>
                <div className={`font-semibold text-sm ${profit >= 0 ? 'text-primary' : 'text-destructive'}`}>
                  {formData.currencyCode} {profit.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createInvoiceMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              className="btn-success"
              onClick={handleSave}
              disabled={!shipmentId || !formData.customerId || formData.selectedCharges.length === 0 || createInvoiceMutation.isPending}
            >
              {createInvoiceMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
