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
import { Textarea } from "@/components/ui/textarea";
import { DateInput } from "@/components/ui/date-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CostingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (costing: any) => void;
}

const chargeTypes = [
  "ADDITIONAL PICK UP CHARGES",
  "HANDLING CHARGES",
  "BILL OF LADING CHARGES",
  "FREIGHT CHARGES",
  "CUSTOMS CLEARANCE",
  "DOCUMENTATION FEE",
  "TERMINAL HANDLING",
];

const currencies = ["AED", "USD", "EUR", "GBP", "INR"];
const units = ["BL", "Container", "Shipment", "CBM", "KG"];
const ppccOptions = ["Prepaid", "Postpaid"];
const taxOptions = ["0%", "5%", "10%", "15%"];

export function CostingModal({ open, onOpenChange, onSave }: CostingModalProps) {
  const [formData, setFormData] = useState({
    charge: "ADDITIONAL PICK UP CHARGES",
    description: "",
    ppcc: "Prepaid",
    unit: "BL",
    remarks: "",
    // Cost section
    costCurrency: "AED",
    costExRate: "1.000",
    costNoOfUnit: "",
    costPerUnit: "",
    costLCYAmount: "0.00",
    costFCYAmount: "0",
    costVendor: "",
    costReferenceNo: "",
    costDate: new Date().toISOString().split('T')[0],
    costTax: "0%",
    // Sale section
    saleCurrency: "AED",
    saleExRate: "1.000",
    saleNoOfUnit: "",
    salePerUnit: "",
    saleLCYAmount: "0.00",
    saleFCYAmount: "0",
    saleBillTo: "",
    saleGP: "0.00",
    saleTax: "0%",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSave({
      id: Date.now(),
      description: formData.charge,
      saleQty: formData.saleNoOfUnit || "0.000",
      saleUnit: formData.salePerUnit || "0.00",
      saleCurrency: formData.saleCurrency,
      saleExRate: formData.saleExRate,
      saleFCY: formData.saleFCYAmount,
      saleLCY: formData.saleLCYAmount,
      costQty: formData.costNoOfUnit || "0.000",
      costUnit: formData.costPerUnit || "0.00",
      costCurrency: formData.costCurrency,
      costExRate: formData.costExRate,
      costFCY: formData.costFCYAmount,
      costLCY: formData.costLCYAmount,
      unit: formData.unit,
      gp: formData.saleGP,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card border border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground text-lg bg-[#2c3e50] text-white p-4 -m-6 mb-0 rounded-t-lg">
            Costing
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 pt-6">
          {/* S.No */}
          <div className="text-sm text-muted-foreground">S.No</div>

          {/* Row 1 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm">Charge</Label>
              <Select value={formData.charge} onValueChange={(v) => handleInputChange("charge", v)}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border border-border">
                  {chargeTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Description</Label>
              <Input 
                value={formData.description} 
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Description"
                className="bg-background border-border"
              />
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm">PP/CC</Label>
              <Select value={formData.ppcc} onValueChange={(v) => handleInputChange("ppcc", v)}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border border-border">
                  {ppccOptions.map(opt => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Unit</Label>
              <Select value={formData.unit} onValueChange={(v) => handleInputChange("unit", v)}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border border-border">
                  {units.map(unit => (
                    <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Remarks */}
          <div>
            <Label className="text-sm">Remarks</Label>
            <Textarea 
              value={formData.remarks} 
              onChange={(e) => handleInputChange("remarks", e.target.value)}
              placeholder="Remarks"
              className="bg-background border-border"
            />
          </div>

          {/* Cost Section */}
          <div className="bg-secondary/30 p-4 rounded-lg space-y-4">
            <h4 className="font-semibold text-foreground">Cost</h4>
            <div className="grid grid-cols-6 gap-3">
              <div>
                <Label className="text-xs">Currency</Label>
                <Select value={formData.costCurrency} onValueChange={(v) => handleInputChange("costCurrency", v)}>
                  <SelectTrigger className="bg-background border-border h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border border-border">
                    {currencies.map(curr => (
                      <SelectItem key={curr} value={curr}>{curr}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Ex.Rate</Label>
                <Input 
                  value={formData.costExRate} 
                  onChange={(e) => handleInputChange("costExRate", e.target.value)}
                  className="bg-background border-border h-9"
                />
              </div>
              <div>
                <Label className="text-xs">No of Unit</Label>
                <Input 
                  value={formData.costNoOfUnit} 
                  onChange={(e) => handleInputChange("costNoOfUnit", e.target.value)}
                  placeholder="No of Unit"
                  className="bg-background border-border h-9"
                />
              </div>
              <div>
                <Label className="text-xs">Cost/Unit</Label>
                <Input 
                  value={formData.costPerUnit} 
                  onChange={(e) => handleInputChange("costPerUnit", e.target.value)}
                  placeholder="Cost/Unit"
                  className="bg-background border-border h-9"
                />
              </div>
              <div>
                <Label className="text-xs">LCY Amount</Label>
                <Input 
                  value={formData.costLCYAmount} 
                  className="bg-muted border-border h-9"
                  readOnly
                />
              </div>
              <div>
                <Label className="text-xs">FCY Amount</Label>
                <Input 
                  value={formData.costFCYAmount} 
                  className="bg-muted border-border h-9"
                  readOnly
                />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3">
              <div>
                <Label className="text-xs">Vendor</Label>
                <Select value={formData.costVendor} onValueChange={(v) => handleInputChange("costVendor", v)}>
                  <SelectTrigger className="bg-background border-border h-9">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border border-border">
                    <SelectItem value="vendor1">Vendor 1</SelectItem>
                    <SelectItem value="vendor2">Vendor 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Reference No</Label>
                <Input 
                  value={formData.costReferenceNo} 
                  onChange={(e) => handleInputChange("costReferenceNo", e.target.value)}
                  placeholder="Reference No"
                  className="bg-background border-border h-9"
                />
              </div>
              <div>
                <Label className="text-xs">Date</Label>
                <DateInput 
                  value={formData.costDate} 
                  onChange={(v) => handleInputChange("costDate", v)}
                  className="h-9"
                />
              </div>
              <div>
                <Label className="text-xs">Tax %</Label>
                <Select value={formData.costTax} onValueChange={(v) => handleInputChange("costTax", v)}>
                  <SelectTrigger className="bg-background border-border h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border border-border">
                    {taxOptions.map(tax => (
                      <SelectItem key={tax} value={tax}>{tax}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Sale Section */}
          <div className="bg-secondary/30 p-4 rounded-lg space-y-4">
            <h4 className="font-semibold text-foreground">Sale</h4>
            <div className="grid grid-cols-6 gap-3">
              <div>
                <Label className="text-xs">Currency</Label>
                <Select value={formData.saleCurrency} onValueChange={(v) => handleInputChange("saleCurrency", v)}>
                  <SelectTrigger className="bg-background border-border h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border border-border">
                    {currencies.map(curr => (
                      <SelectItem key={curr} value={curr}>{curr}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Ex.Rate</Label>
                <Input 
                  value={formData.saleExRate} 
                  onChange={(e) => handleInputChange("saleExRate", e.target.value)}
                  className="bg-background border-border h-9"
                />
              </div>
              <div>
                <Label className="text-xs">No of Unit</Label>
                <Input 
                  value={formData.saleNoOfUnit} 
                  onChange={(e) => handleInputChange("saleNoOfUnit", e.target.value)}
                  placeholder="No of Unit"
                  className="bg-background border-border h-9"
                />
              </div>
              <div>
                <Label className="text-xs">Cost/Unit</Label>
                <Input 
                  value={formData.salePerUnit} 
                  onChange={(e) => handleInputChange("salePerUnit", e.target.value)}
                  placeholder="Cost/Unit"
                  className="bg-background border-border h-9"
                />
              </div>
              <div>
                <Label className="text-xs">LCY Amount</Label>
                <Input 
                  value={formData.saleLCYAmount} 
                  className="bg-muted border-border h-9"
                  readOnly
                />
              </div>
              <div>
                <Label className="text-xs">FCY Amount</Label>
                <Input 
                  value={formData.saleFCYAmount} 
                  className="bg-muted border-border h-9"
                  readOnly
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Bill to *</Label>
                <Select value={formData.saleBillTo} onValueChange={(v) => handleInputChange("saleBillTo", v)}>
                  <SelectTrigger className="bg-background border-border h-9">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border border-border">
                    <SelectItem value="customer1">Customer 1</SelectItem>
                    <SelectItem value="customer2">Customer 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">GP</Label>
                <Input 
                  value={formData.saleGP} 
                  className="bg-muted border-border h-9"
                  readOnly
                />
              </div>
              <div>
                <Label className="text-xs">Tax %</Label>
                <Select value={formData.saleTax} onValueChange={(v) => handleInputChange("saleTax", v)}>
                  <SelectTrigger className="bg-background border-border h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border border-border">
                    {taxOptions.map(tax => (
                      <SelectItem key={tax} value={tax}>{tax}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-center gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="bg-[#34495e] hover:bg-[#4a5568] text-white border-[#4a5568] px-8"
            >
              Close
            </Button>
            <Button 
              onClick={handleSave}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-8"
            >
              Add
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
