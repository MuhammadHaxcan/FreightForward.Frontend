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
import { Search } from "lucide-react";
import { ShipmentParty, Currency } from "@/services/api";

interface InvoiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chargesDetails: any[];
  parties: ShipmentParty[];
  onSave: (invoice: any) => void;
}

// Map customer IDs to their currencies (this would ideally come from the customer data)
// For now we'll use a default, but the parties prop should include customer currency info
const currencyMap: Record<string, Currency> = {
  default: "AED",
};

export function InvoiceModal({ open, onOpenChange, chargesDetails, parties, onSave }: InvoiceModalProps) {
  // Filter parties to only show Debtors
  const debtorParties = useMemo(() =>
    parties.filter(p => p.masterType === 'Debtors'),
    [parties]
  );

  const [formData, setFormData] = useState({
    invoiceId: `INVAE${Date.now().toString().slice(-6)}`,
    companyName: "",
    customerId: "",
    invoiceDate: new Date().toISOString().split('T')[0],
    baseCurrency: "AED" as Currency,
    selectedCharges: [] as number[],
  });

  // Update currency when company selection changes
  useEffect(() => {
    if (formData.customerId) {
      const selectedParty = debtorParties.find(p => p.id.toString() === formData.customerId);
      if (selectedParty) {
        // In a real implementation, you would fetch the customer's baseCurrency
        // For now, we'll use AED as default
        setFormData(prev => ({
          ...prev,
          companyName: selectedParty.customerName,
          baseCurrency: currencyMap[selectedParty.customerId?.toString() || ''] || "AED"
        }));
      }
    }
  }, [formData.customerId, debtorParties]);

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
      selectedCharges: checked ? chargesDetails.map(c => c.id) : []
    }));
  };

  const handleSubmit = () => {
    // Filter and load selected charges
  };

  const handleSave = () => {
    onSave({
      invoiceId: formData.invoiceId,
      companyName: formData.companyName,
      customerId: formData.customerId,
      invoiceDate: formData.invoiceDate,
      baseCurrency: formData.baseCurrency,
      charges: formData.selectedCharges,
    });
    onOpenChange(false);
  };

  const totalSale = chargesDetails
    .filter(c => formData.selectedCharges.includes(c.id))
    .reduce((sum, c) => sum + parseFloat(c.saleLCY || 0), 0);

  const totalCost = chargesDetails
    .filter(c => formData.selectedCharges.includes(c.id))
    .reduce((sum, c) => sum + parseFloat(c.costLCY || 0), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-card border border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground text-lg bg-[#2c3e50] text-white p-3 -m-6 mb-0 rounded-t-lg">
            New Invoice
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {/* Invoice Section Header */}
          <div className="flex justify-between items-center">
            <h3 className="text-emerald-600 font-semibold">Invoice</h3>
            <div className="flex gap-2">
              <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white h-9">
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={() => onOpenChange(false)} className="h-9">
                Back
              </Button>
            </div>
          </div>

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
              <Select value={formData.customerId} onValueChange={handleCompanySelect}>
                <SelectTrigger className="bg-background border-border h-9">
                  <SelectValue placeholder="Select debtor" />
                </SelectTrigger>
                <SelectContent className="bg-popover border border-border">
                  {debtorParties.length === 0 ? (
                    <SelectItem value="_none" disabled>No debtors in parties</SelectItem>
                  ) : (
                    debtorParties.map(party => (
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
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Label className="text-xs font-medium">* Base Currency</Label>
                <Input
                  value={formData.baseCurrency}
                  className="bg-muted h-9"
                  readOnly
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
                id="checkAll"
                checked={formData.selectedCharges.length === chargesDetails.length && chargesDetails.length > 0}
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
                {chargesDetails.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground text-xs py-4">
                      No data available in table
                    </TableCell>
                  </TableRow>
                ) : (
                  chargesDetails.map((charge, index) => (
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
                      <TableCell className="text-xs py-2">{charge.saleCurrency}</TableCell>
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
            <div className="grid grid-cols-3 gap-6 bg-secondary/30 p-3 rounded-lg">
              <div>
                <Label className="text-xs font-semibold">Total Sale</Label>
                <div className="text-emerald-600 font-semibold text-sm">AED {totalSale.toFixed(2)}</div>
              </div>
              <div>
                <Label className="text-xs font-semibold">Total Cost</Label>
                <div className="text-foreground font-semibold text-sm">AED {totalCost.toFixed(2)}</div>
              </div>
              <div>
                <Label className="text-xs font-semibold">Profit</Label>
                <div className="text-foreground font-semibold text-sm">AED {(totalSale - totalCost).toFixed(2)}</div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
