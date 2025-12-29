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
import { DateInput } from "@/components/ui/date-input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ShipmentParty, CurrencyType } from "@/services/api";
import { useCurrencyTypes } from "@/hooks/useSettings";

interface CostingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parties: ShipmentParty[];
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

const units = ["BL", "Container", "Shipment", "CBM", "KG"];
const ppccOptions = ["Prepaid", "Postpaid"];
const taxOptions = ["0%", "5%", "10%", "15%"];

// Default local currency (UAE)
const LOCAL_CURRENCY = "AED";

export function CostingModal({ open, onOpenChange, parties, onSave }: CostingModalProps) {
  const [activeTab, setActiveTab] = useState("cost");

  // Fetch currency types from settings
  const { data: currencyTypesData } = useCurrencyTypes({ pageSize: 100 });
  const currencyTypes = useMemo(() => currencyTypesData?.items || [], [currencyTypesData]);

  // Filter parties by master type
  const creditorParties = useMemo(() =>
    parties.filter(p => p.masterType === 'Creditors'),
    [parties]
  );

  const debtorParties = useMemo(() =>
    parties.filter(p => p.masterType === 'Debtors'),
    [parties]
  );

  const [formData, setFormData] = useState({
    charge: "ADDITIONAL PICK UP CHARGES",
    description: "",
    ppcc: "Prepaid",
    unit: "BL",
    remarks: "",
    // Cost section
    costCurrency: LOCAL_CURRENCY,
    costExRate: "1.000",
    costNoOfUnit: "",
    costPerUnit: "",
    costLCYAmount: "0.00",
    costFCYAmount: "0.00",
    costVendor: "",
    costVendorName: "",
    costReferenceNo: "",
    costDate: new Date().toISOString().split('T')[0],
    costTax: "0%",
    // Sale section
    saleCurrency: LOCAL_CURRENCY,
    saleExRate: "1.000",
    saleNoOfUnit: "",
    salePerUnit: "",
    saleLCYAmount: "0.00",
    saleFCYAmount: "0.00",
    saleBillTo: "",
    saleBillToName: "",
    saleGP: "0.00",
    saleTax: "0%",
  });

  // Get ROE (Rate of Exchange) for a currency code
  const getROE = (currencyCode: string): number => {
    if (currencyCode === LOCAL_CURRENCY) return 1;
    const currency = currencyTypes.find(c => c.code === currencyCode);
    return currency?.roe || 1;
  };

  // Calculate amounts when currency, units, or rate changes
  const calculateCostAmounts = (currency: string, noOfUnit: string, perUnit: string, exRate: string) => {
    const units = parseFloat(noOfUnit) || 0;
    const unitPrice = parseFloat(perUnit) || 0;
    const rate = parseFloat(exRate) || 1;

    // FCY = No of Units * Cost per Unit (in foreign currency)
    const fcyAmount = units * unitPrice;

    // LCY = FCY * Exchange Rate (converted to local currency)
    const lcyAmount = fcyAmount * rate;

    return {
      fcy: fcyAmount.toFixed(2),
      lcy: lcyAmount.toFixed(2)
    };
  };

  const calculateSaleAmounts = (currency: string, noOfUnit: string, perUnit: string, exRate: string) => {
    const units = parseFloat(noOfUnit) || 0;
    const unitPrice = parseFloat(perUnit) || 0;
    const rate = parseFloat(exRate) || 1;

    // FCY = No of Units * Price per Unit (in foreign currency)
    const fcyAmount = units * unitPrice;

    // LCY = FCY * Exchange Rate (converted to local currency)
    const lcyAmount = fcyAmount * rate;

    return {
      fcy: fcyAmount.toFixed(2),
      lcy: lcyAmount.toFixed(2)
    };
  };

  // Calculate GP (Gross Profit)
  const calculateGP = (saleLCY: string, costLCY: string): string => {
    const sale = parseFloat(saleLCY) || 0;
    const cost = parseFloat(costLCY) || 0;
    return (sale - cost).toFixed(2);
  };

  // Handle cost currency change - update exchange rate from ROE
  const handleCostCurrencyChange = (currency: string) => {
    const roe = getROE(currency);
    const amounts = calculateCostAmounts(currency, formData.costNoOfUnit, formData.costPerUnit, roe.toFixed(3));

    setFormData(prev => ({
      ...prev,
      costCurrency: currency,
      costExRate: roe.toFixed(3),
      costFCYAmount: amounts.fcy,
      costLCYAmount: amounts.lcy,
      saleGP: calculateGP(prev.saleLCYAmount, amounts.lcy)
    }));
  };

  // Handle sale currency change - update exchange rate from ROE
  const handleSaleCurrencyChange = (currency: string) => {
    const roe = getROE(currency);
    const amounts = calculateSaleAmounts(currency, formData.saleNoOfUnit, formData.salePerUnit, roe.toFixed(3));

    setFormData(prev => ({
      ...prev,
      saleCurrency: currency,
      saleExRate: roe.toFixed(3),
      saleFCYAmount: amounts.fcy,
      saleLCYAmount: amounts.lcy,
      saleGP: calculateGP(amounts.lcy, prev.costLCYAmount)
    }));
  };

  // Handle cost input changes and recalculate
  const handleCostInputChange = (field: string, value: string) => {
    const newFormData = { ...formData, [field]: value };

    if (field === 'costNoOfUnit' || field === 'costPerUnit' || field === 'costExRate') {
      const amounts = calculateCostAmounts(
        newFormData.costCurrency,
        newFormData.costNoOfUnit,
        newFormData.costPerUnit,
        newFormData.costExRate
      );
      newFormData.costFCYAmount = amounts.fcy;
      newFormData.costLCYAmount = amounts.lcy;
      newFormData.saleGP = calculateGP(newFormData.saleLCYAmount, amounts.lcy);
    }

    setFormData(newFormData);
  };

  // Handle sale input changes and recalculate
  const handleSaleInputChange = (field: string, value: string) => {
    const newFormData = { ...formData, [field]: value };

    if (field === 'saleNoOfUnit' || field === 'salePerUnit' || field === 'saleExRate') {
      const amounts = calculateSaleAmounts(
        newFormData.saleCurrency,
        newFormData.saleNoOfUnit,
        newFormData.salePerUnit,
        newFormData.saleExRate
      );
      newFormData.saleFCYAmount = amounts.fcy;
      newFormData.saleLCYAmount = amounts.lcy;
      newFormData.saleGP = calculateGP(amounts.lcy, newFormData.costLCYAmount);
    }

    setFormData(newFormData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle vendor selection (Creditors)
  const handleVendorSelect = (partyId: string) => {
    const party = creditorParties.find(p => p.id.toString() === partyId);
    setFormData(prev => ({
      ...prev,
      costVendor: partyId,
      costVendorName: party?.customerName || ""
    }));
  };

  // Handle bill-to selection (Debtors)
  const handleBillToSelect = (partyId: string) => {
    const party = debtorParties.find(p => p.id.toString() === partyId);
    setFormData(prev => ({
      ...prev,
      saleBillTo: partyId,
      saleBillToName: party?.customerName || ""
    }));
  };

  const handleSave = () => {
    onSave({
      id: Date.now(),
      description: formData.charge,
      ppcc: formData.ppcc,
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
      vendorId: formData.costVendor,
      vendorName: formData.costVendorName,
      billToId: formData.saleBillTo,
      billToName: formData.saleBillToName,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card border border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground text-lg bg-[#2c3e50] text-white p-3 -m-6 mb-0 rounded-t-lg">
            Costing
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {/* Common Fields - Row 1 */}
          <div className="grid grid-cols-4 gap-3">
            <div className="col-span-2">
              <Label className="text-xs font-medium">Charge</Label>
              <Select value={formData.charge} onValueChange={(v) => handleInputChange("charge", v)}>
                <SelectTrigger className="bg-background border-border h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border border-border">
                  {chargeTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label className="text-xs font-medium">Description</Label>
              <Input
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Description"
                className="bg-background border-border h-9"
              />
            </div>
          </div>

          {/* Common Fields - Row 2 */}
          <div className="grid grid-cols-4 gap-3">
            <div>
              <Label className="text-xs font-medium">PP/CC</Label>
              <Select value={formData.ppcc} onValueChange={(v) => handleInputChange("ppcc", v)}>
                <SelectTrigger className="bg-background border-border h-9">
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
              <Label className="text-xs font-medium">Unit</Label>
              <Select value={formData.unit} onValueChange={(v) => handleInputChange("unit", v)}>
                <SelectTrigger className="bg-background border-border h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border border-border">
                  {units.map(unit => (
                    <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label className="text-xs font-medium">Remarks</Label>
              <Input
                value={formData.remarks}
                onChange={(e) => handleInputChange("remarks", e.target.value)}
                placeholder="Remarks"
                className="bg-background border-border h-9"
              />
            </div>
          </div>

          {/* Cost / Sale Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-9">
              <TabsTrigger
                value="cost"
                className="data-[state=active]:bg-[#2c3e50] data-[state=active]:text-white text-sm h-8"
              >
                Cost
              </TabsTrigger>
              <TabsTrigger
                value="sale"
                className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white text-sm h-8"
              >
                Sale
              </TabsTrigger>
            </TabsList>

            {/* Cost Tab */}
            <TabsContent value="cost" className="mt-3 space-y-3">
              <div className="grid grid-cols-6 gap-2">
                <div>
                  <Label className="text-xs">Currency</Label>
                  <Select value={formData.costCurrency} onValueChange={handleCostCurrencyChange}>
                    <SelectTrigger className="bg-background border-border h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border border-border">
                      {currencyTypes.length > 0 ? (
                        currencyTypes.map(curr => (
                          <SelectItem key={curr.id} value={curr.code}>{curr.code}</SelectItem>
                        ))
                      ) : (
                        <>
                          <SelectItem value="AED">AED</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Ex.Rate (ROE)</Label>
                  <Input
                    value={formData.costExRate}
                    onChange={(e) => handleCostInputChange("costExRate", e.target.value)}
                    className="bg-background border-border h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">No of Unit</Label>
                  <Input
                    value={formData.costNoOfUnit}
                    onChange={(e) => handleCostInputChange("costNoOfUnit", e.target.value)}
                    placeholder="0"
                    className="bg-background border-border h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">Cost/Unit</Label>
                  <Input
                    value={formData.costPerUnit}
                    onChange={(e) => handleCostInputChange("costPerUnit", e.target.value)}
                    placeholder="0.00"
                    className="bg-background border-border h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">FCY Amt</Label>
                  <Input
                    value={formData.costFCYAmount}
                    className="bg-muted border-border h-8 text-xs"
                    readOnly
                  />
                </div>
                <div>
                  <Label className="text-xs">LCY Amt</Label>
                  <Input
                    value={formData.costLCYAmount}
                    className="bg-muted border-border h-8 text-xs"
                    readOnly
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <Label className="text-xs">Vendor (Creditor)</Label>
                  <Select value={formData.costVendor} onValueChange={handleVendorSelect}>
                    <SelectTrigger className="bg-background border-border h-8 text-xs">
                      <SelectValue placeholder="Select vendor" />
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
                  <Label className="text-xs">Reference No</Label>
                  <Input
                    value={formData.costReferenceNo}
                    onChange={(e) => handleInputChange("costReferenceNo", e.target.value)}
                    placeholder="Ref No"
                    className="bg-background border-border h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">Date</Label>
                  <DateInput
                    value={formData.costDate}
                    onChange={(v) => handleInputChange("costDate", v)}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">Tax %</Label>
                  <Select value={formData.costTax} onValueChange={(v) => handleInputChange("costTax", v)}>
                    <SelectTrigger className="bg-background border-border h-8 text-xs">
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
            </TabsContent>

            {/* Sale Tab */}
            <TabsContent value="sale" className="mt-3 space-y-3">
              <div className="grid grid-cols-6 gap-2">
                <div>
                  <Label className="text-xs">Currency</Label>
                  <Select value={formData.saleCurrency} onValueChange={handleSaleCurrencyChange}>
                    <SelectTrigger className="bg-background border-border h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border border-border">
                      {currencyTypes.length > 0 ? (
                        currencyTypes.map(curr => (
                          <SelectItem key={curr.id} value={curr.code}>{curr.code}</SelectItem>
                        ))
                      ) : (
                        <>
                          <SelectItem value="AED">AED</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Ex.Rate (ROE)</Label>
                  <Input
                    value={formData.saleExRate}
                    onChange={(e) => handleSaleInputChange("saleExRate", e.target.value)}
                    className="bg-background border-border h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">No of Unit</Label>
                  <Input
                    value={formData.saleNoOfUnit}
                    onChange={(e) => handleSaleInputChange("saleNoOfUnit", e.target.value)}
                    placeholder="0"
                    className="bg-background border-border h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">Price/Unit</Label>
                  <Input
                    value={formData.salePerUnit}
                    onChange={(e) => handleSaleInputChange("salePerUnit", e.target.value)}
                    placeholder="0.00"
                    className="bg-background border-border h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">FCY Amt</Label>
                  <Input
                    value={formData.saleFCYAmount}
                    className="bg-muted border-border h-8 text-xs"
                    readOnly
                  />
                </div>
                <div>
                  <Label className="text-xs">LCY Amt</Label>
                  <Input
                    value={formData.saleLCYAmount}
                    className="bg-muted border-border h-8 text-xs"
                    readOnly
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs">Bill to (Debtor) <span className="text-red-500">*</span></Label>
                  <Select value={formData.saleBillTo} onValueChange={handleBillToSelect}>
                    <SelectTrigger className="bg-background border-border h-8 text-xs">
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
                  <Label className="text-xs">GP (Gross Profit)</Label>
                  <Input
                    value={formData.saleGP}
                    className="bg-muted border-border h-8 text-xs"
                    readOnly
                  />
                </div>
                <div>
                  <Label className="text-xs">Tax %</Label>
                  <Select value={formData.saleTax} onValueChange={(v) => handleInputChange("saleTax", v)}>
                    <SelectTrigger className="bg-background border-border h-8 text-xs">
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
            </TabsContent>
          </Tabs>

          {/* Actions */}
          <div className="flex justify-center gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="bg-[#34495e] hover:bg-[#4a5568] text-white border-[#4a5568] px-6 h-9"
            >
              Close
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 h-9"
            >
              Add
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
