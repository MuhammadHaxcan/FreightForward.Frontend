import { useState } from "react";
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

interface InvoiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chargesDetails: any[];
  onSave: (invoice: any) => void;
}

const companies = [
  "BLISS LOGISTICS & SHIPPING PVT LTD",
  "MMF GLOBAL TRADING LLC",
  "KADDAH BLDG CLEANING EQUIP. TR CO LLC",
];

export function InvoiceModal({ open, onOpenChange, chargesDetails, onSave }: InvoiceModalProps) {
  const [formData, setFormData] = useState({
    invoiceId: `INVAE${Date.now().toString().slice(-6)}`,
    companyName: "",
    invoiceDate: new Date().toISOString().split('T')[0],
    baseCurrency: "USD",
    selectedCharges: [] as number[],
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
          <DialogTitle className="text-foreground text-lg bg-[#2c3e50] text-white p-4 -m-6 mb-0 rounded-t-lg">
            New Invoice
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 pt-6">
          {/* Invoice Section Header */}
          <div className="flex justify-between items-center">
            <h3 className="text-emerald-600 font-semibold">Invoice</h3>
            <div className="flex gap-2">
              <Button className="bg-emerald-500 hover:bg-emerald-600 text-white">
                Save
              </Button>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Back
              </Button>
            </div>
          </div>

          {/* Invoice Details */}
          <div className="grid grid-cols-4 gap-4">
            <div>
              <Label className="text-sm">Invoice ID</Label>
              <Input 
                value={formData.invoiceId} 
                className="bg-muted"
                readOnly
              />
            </div>
            <div>
              <Label className="text-sm">Company Name</Label>
              <Select value={formData.companyName} onValueChange={(v) => handleInputChange("companyName", v)}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent className="bg-popover border border-border">
                  {companies.map(company => (
                    <SelectItem key={company} value={company}>{company}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">* Invoice Date</Label>
              <DateInput 
                value={formData.invoiceDate} 
                onChange={(v) => handleInputChange("invoiceDate", v)}
              />
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Label className="text-sm">* Base Currency</Label>
                <Input 
                  value={formData.baseCurrency} 
                  className="bg-muted"
                  readOnly
                />
              </div>
              <Button 
                onClick={handleSubmit}
                className="bg-emerald-500 hover:bg-emerald-600 text-white"
              >
                <Search className="h-4 w-4 mr-1" />
                Submit
              </Button>
            </div>
          </div>

          {/* Charges Details */}
          <div className="space-y-4">
            <h3 className="text-emerald-600 font-semibold">Charges Details</h3>
            <div className="flex items-center gap-2">
              <Checkbox 
                id="checkAll"
                checked={formData.selectedCharges.length === chargesDetails.length}
                onCheckedChange={(checked) => handleCheckAll(checked as boolean)}
              />
              <Label htmlFor="checkAll" className="text-sm">Check All</Label>
            </div>

            <Table>
              <TableHeader>
                <TableRow className="bg-table-header">
                  <TableHead className="text-table-header-foreground w-10"></TableHead>
                  <TableHead className="text-table-header-foreground">Sl.No</TableHead>
                  <TableHead className="text-table-header-foreground">Charges Details</TableHead>
                  <TableHead className="text-table-header-foreground">No of unit</TableHead>
                  <TableHead className="text-table-header-foreground">PP/CC</TableHead>
                  <TableHead className="text-table-header-foreground">Sale/Unit</TableHead>
                  <TableHead className="text-table-header-foreground">Currency</TableHead>
                  <TableHead className="text-table-header-foreground">FYC Amount</TableHead>
                  <TableHead className="text-table-header-foreground">Ex.Rate</TableHead>
                  <TableHead className="text-table-header-foreground">Local Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {chargesDetails.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground">
                      No data available in table
                    </TableCell>
                  </TableRow>
                ) : (
                  chargesDetails.map((charge, index) => (
                    <TableRow key={charge.id} className={index % 2 === 0 ? "bg-card" : "bg-secondary/30"}>
                      <TableCell>
                        <Checkbox 
                          checked={formData.selectedCharges.includes(charge.id)}
                          onCheckedChange={(checked) => handleCheckCharge(charge.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell>{(index + 1) * 10}</TableCell>
                      <TableCell>{charge.description}</TableCell>
                      <TableCell>{charge.saleQty}</TableCell>
                      <TableCell>{charge.ppcc || "Postpaid"}</TableCell>
                      <TableCell>{charge.saleUnit}</TableCell>
                      <TableCell>{charge.saleCurrency}</TableCell>
                      <TableCell>{charge.saleFCY}</TableCell>
                      <TableCell>{charge.saleExRate}</TableCell>
                      <TableCell>{charge.saleLCY}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="grid grid-cols-3 gap-8 bg-secondary/30 p-4 rounded-lg">
              <div>
                <Label className="text-sm font-semibold">Total Sale</Label>
                <div className="text-emerald-600 font-semibold">| AED {totalSale.toFixed(2)}|</div>
              </div>
              <div>
                <Label className="text-sm font-semibold">Total Cost</Label>
                <div className="text-foreground font-semibold">AED {totalCost.toFixed(2)}</div>
              </div>
              <div>
                <Label className="text-sm font-semibold">Profit</Label>
                <div className="text-foreground font-semibold">AED {(totalSale - totalCost).toFixed(2)}</div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
