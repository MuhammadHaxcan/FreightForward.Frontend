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
import { getTodayDateOnly } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ShipmentParty, CurrencyType, CostingUnit, settingsApi } from "@/services/api";
import { useCurrencyTypes } from "@/hooks/useSettings";
import { useQuery } from "@tanstack/react-query";

interface CostingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parties: ShipmentParty[];
  costing?: any;
  onSave: (costing: any) => void;
}

const ppccOptions = ["Prepaid", "Postpaid"];
const taxOptions = ["0%", "5%", "10%", "15%"];

// Default local currency (UAE)
const LOCAL_CURRENCY = "AED";

export function CostingModal({ open, onOpenChange, parties, costing, onSave }: CostingModalProps) {
  const [activeTab, setActiveTab] = useState("cost");

  // Fetch currency types from settings
  const { data: currencyTypesData } = useCurrencyTypes({ pageSize: 100 });
  const currencyTypes = useMemo(() => currencyTypesData?.items || [], [currencyTypesData]);

  // Fetch charge items from settings
  const { data: chargeItemsResponse } = useQuery({
    queryKey: ['chargeItems', 'all'],
    queryFn: () => settingsApi.getAllChargeItems(),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
  const chargeItems = useMemo(() => chargeItemsResponse?.data || [], [chargeItemsResponse?.data]);

  // Fetch costing units from settings
  const { data: costingUnitsResponse } = useQuery({
    queryKey: ['costingUnits', 'all'],
    queryFn: () => settingsApi.getAllCostingUnits(),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
  const costingUnits = useMemo(() => costingUnitsResponse?.data || [], [costingUnitsResponse?.data]);

  // Filter parties by master type
  const creditorParties = useMemo(() =>
    parties.filter(p => p.masterType === 'Creditors'),
    [parties]
  );

  const debtorParties = useMemo(() =>
    parties.filter(p => p.masterType === 'Debtors'),
    [parties]
  );

  const getDefaultFormData = () => ({
    charge: "",
    description: "",
    ppcc: "Prepaid",
    unitId: undefined as number | undefined,
    unit: "",
    remarks: "",
    costCurrency: LOCAL_CURRENCY,
    costExRate: "1.000",
    costNoOfUnit: "",
    costPerUnit: "",
    costLCYAmount: "0.00",
    costFCYAmount: "0.00",
    costVendor: "",
    costVendorName: "",
    costVendorCustomerId: "",
    costReferenceNo: "",
    costDate: getTodayDateOnly(),
    costTax: "0%",
    saleCurrency: LOCAL_CURRENCY,
    saleExRate: "1.000",
    saleNoOfUnit: "",
    salePerUnit: "",
    saleLCYAmount: "0.00",
    saleFCYAmount: "0.00",
    saleBillTo: "",
    saleBillToName: "",
    saleBillToCustomerId: "",
    saleGP: "0.00",
    saleTax: "0%",
  });

  const [formData, setFormData] = useState(getDefaultFormData());

  // Populate form when editing
  useEffect(() => {
    if (open && costing) {
      // Find the party that matches the vendorCustomerId or billToCustomerId
      const vendorParty = creditorParties.find(p => p.customerId === costing.vendorCustomerId);
      const billToParty = debtorParties.find(p => p.customerId === costing.billToCustomerId);
      
      setFormData({
        charge: costing.description || "",
        description: costing.chargeDescription || costing.description || "", // Use chargeDescription if available, fallback to description
        ppcc: costing.ppcc || "Prepaid",
        unitId: costing.unitId || undefined,
        unit: costing.unitName || "",
        remarks: costing.remarks || "",
        costCurrency: costing.costCurrency || LOCAL_CURRENCY,
        costExRate: costing.costExRate?.toString() || "1.000",
        costNoOfUnit: costing.costQty?.toString() || "",
        costPerUnit: costing.costUnit?.toString() || "",
        costLCYAmount: costing.costLCY?.toString() || "0.00",
        costFCYAmount: costing.costFCY?.toString() || "0.00",
        costVendor: vendorParty?.id?.toString() || "",
        costVendorName: costing.vendorName || "",
        costVendorCustomerId: costing.vendorCustomerId?.toString() || "",
        costReferenceNo: costing.costReferenceNo || "",
        costDate: costing.costDate?.split('T')[0] || getTodayDateOnly(),
        costTax: "0%",
        saleCurrency: costing.saleCurrency || LOCAL_CURRENCY,
        saleExRate: costing.saleExRate?.toString() || "1.000",
        saleNoOfUnit: costing.saleQty?.toString() || "",
        salePerUnit: costing.saleUnit?.toString() || "",
        saleLCYAmount: costing.saleLCY?.toString() || "0.00",
        saleFCYAmount: costing.saleFCY?.toString() || "0.00",
        saleBillTo: billToParty?.id?.toString() || "",
        saleBillToName: costing.billToName || "",
        saleBillToCustomerId: costing.billToCustomerId?.toString() || "",
        saleGP: costing.gp?.toString() || "0.00",
        saleTax: "0%",
      });
    } else if (open && !costing) {
      setFormData(getDefaultFormData());
    }
  }, [open, costing, creditorParties, debtorParties]);

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

  // Handle charge selection - auto-populate description with charge name
  const handleChargeChange = (chargeName: string) => {
    setFormData(prev => ({
      ...prev,
      charge: chargeName,
      // Auto-populate description with charge name if description is empty or matches previous charge
      description: prev.description === "" || prev.description === prev.charge ? chargeName : prev.description
    }));
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
      costVendorName: party?.customerName || "",
      // Store the actual customer ID for saving
      costVendorCustomerId: party?.customerId?.toString() || partyId
    }));
  };

  // Handle bill-to selection (Debtors)
  const handleBillToSelect = (partyId: string) => {
    const party = debtorParties.find(p => p.id.toString() === partyId);
    setFormData(prev => ({
      ...prev,
      saleBillTo: partyId,
      saleBillToName: party?.customerName || "",
      // Store the actual customer ID for saving
      saleBillToCustomerId: party?.customerId?.toString() || partyId
    }));
  };

  const handleSave = () => {
    // Get the actual customer IDs - prefer the stored customer ID, fallback to party ID
    const vendorCustomerId = formData.costVendorCustomerId 
      ? parseInt(formData.costVendorCustomerId) 
      : (formData.costVendor ? parseInt(formData.costVendor) : undefined);
    
    const billToCustomerId = formData.saleBillToCustomerId
      ? parseInt(formData.saleBillToCustomerId)
      : (formData.saleBillTo ? parseInt(formData.saleBillTo) : undefined);

    onSave({
      id: costing?.id || Date.now(),
      description: formData.charge, // The charge name (used as description in backend)
      chargeDescription: formData.description, // The user-editable description field
      remarks: formData.remarks,
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
      unitId: formData.unitId,
      unitName: formData.unit,
      gp: formData.saleGP,
      vendorCustomerId: vendorCustomerId,
      vendorName: formData.costVendorName,
      billToCustomerId: billToCustomerId,
      billToName: formData.saleBillToName,
      costReferenceNo: formData.costReferenceNo || null,
      costDate: formData.costDate || null,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card border border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground text-lg bg-[#2c3e50] text-white p-3 -m-6 mb-0 rounded-t-lg">
            {costing ? "Edit Costing" : "Add Costing"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {/* Common Fields - Row 1 */}
          <div className="grid grid-cols-4 gap-3">
            <div className="col-span-2">
              <Label className="text-xs font-medium">Charge</Label>
              <Select value={formData.charge} onValueChange={handleChargeChange}>
                <SelectTrigger className="bg-background border-border h-9">
                  <SelectValue placeholder="Select charge type" />
                </SelectTrigger>
                <SelectContent className="bg-popover border border-border">
                  {chargeItems.length > 0 ? (
                    chargeItems.map(item => (
                      <SelectItem key={item.id} value={item.name}>{item.name}</SelectItem>
                    ))
                  ) : (
                    <SelectItem value="_none" disabled>No charge items available</SelectItem>
                  )}
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
              <Select
                value={formData.unitId?.toString() || ""}
                onValueChange={(v) => {
                  const selectedUnit = costingUnits.find(u => u.id.toString() === v);
                  setFormData(prev => ({
                    ...prev,
                    unitId: selectedUnit?.id,
                    unit: selectedUnit?.code || ""
                  }));
                }}
              >
                <SelectTrigger className="bg-background border-border h-9">
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent className="bg-popover border border-border">
                  {costingUnits.length > 0 ? (
                    costingUnits.map(unit => (
                      <SelectItem key={unit.id} value={unit.id.toString()}>{unit.name}</SelectItem>
                    ))
                  ) : (
                    <SelectItem value="_none" disabled>Loading...</SelectItem>
                  )}
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
                  <Label className="text-xs">LCY Amt</Label>
                  <Input
                    value={formData.costLCYAmount}
                    className="bg-muted border-border h-8 text-xs"
                    readOnly
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
                  <Label className="text-xs">LCY Amt</Label>
                  <Input
                    value={formData.saleLCYAmount}
                    className="bg-muted border-border h-8 text-xs"
                    readOnly
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
              {costing ? "Update" : "Add"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
