import { useState, useEffect, useMemo, useRef } from "react";
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
import { SearchableSelect } from "@/components/ui/searchable-select";
import { ShipmentParty, ShipmentCosting, settingsApi } from "@/services/api";
import { useCurrencyTypes } from "@/hooks/useSettings";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";

// Extend ShipmentCosting with UI-specific fields for the modal
// The modal transforms between API format (currencyId) and display format (currency code)
type CostingModalData = Partial<ShipmentCosting> & {
  chargeDescription?: string;
  ppcc?: string;
  saleCurrency?: string;  // Currency code for display
  costCurrency?: string;  // Currency code for display
};

interface CostingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parties: ShipmentParty[];
  costing?: CostingModalData;
  onSave: (costing: CostingModalData) => void;
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

  // Helper to deduplicate parties by customerId
  const deduplicateByCustomerId = (partyList: ShipmentParty[]): ShipmentParty[] => {
    const seen = new Set<number>();
    return partyList.filter(p => {
      if (p.customerId === undefined) return true;
      if (seen.has(p.customerId)) return false;
      seen.add(p.customerId);
      return true;
    });
  };

  // Filter parties by master type and deduplicate by customerId
  // (same customer may appear with different party types)
  const creditorParties = useMemo(() =>
    deduplicateByCustomerId(parties.filter(p => p.masterType === 'Creditors')),
    [parties]
  );

  const debtorParties = useMemo(() =>
    deduplicateByCustomerId(parties.filter(p => p.masterType === 'Debtors')),
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
    costCurrencyId: undefined as number | undefined,
    costExRate: "1.000",
    costNoOfUnit: "",
    costPerUnit: "",
    costLCYAmount: "0.00",
    costFCYAmount: "0.00",
    costVendor: "_none",
    costVendorName: "",
    costVendorCustomerId: "",
    costReferenceNo: "",
    costDate: getTodayDateOnly(),
    costTax: "0%",
    saleCurrency: LOCAL_CURRENCY,
    saleCurrencyId: undefined as number | undefined,
    saleExRate: "1.000",
    saleNoOfUnit: "",
    salePerUnit: "",
    saleLCYAmount: "0.00",
    saleFCYAmount: "0.00",
    saleBillTo: "_none",
    saleBillToName: "",
    saleBillToCustomerId: "",
    saleGP: "0.00",
    saleTax: "0%",
  });

  const [formData, setFormData] = useState(getDefaultFormData());
  const formInitializedRef = useRef(false);

  // Reset ref when modal closes
  useEffect(() => {
    if (!open) {
      formInitializedRef.current = false;
    }
  }, [open]);

  // Set default currency IDs when currencyTypes load for new entries
  useEffect(() => {
    if (open && !costing && currencyTypes.length > 0) {
      const defaultCurrency = currencyTypes.find(c => c.code === LOCAL_CURRENCY);
      if (defaultCurrency) {
        // Use callback form to avoid stale closure and only update if IDs are not set
        setFormData(prev => {
          if (!prev.saleCurrencyId || !prev.costCurrencyId) {
            return {
              ...prev,
              saleCurrencyId: prev.saleCurrencyId || defaultCurrency.id,
              costCurrencyId: prev.costCurrencyId || defaultCurrency.id
            };
          }
          return prev;
        });
      }
    }
  }, [open, costing, currencyTypes]);

  // Set default unit to first unit when costingUnits load for new entries
  useEffect(() => {
    if (open && !costing && costingUnits.length > 0 && !formData.unitId) {
      const firstUnit = costingUnits[0];
      if (firstUnit) {
        setFormData(prev => ({
          ...prev,
          unitId: firstUnit.id,
          unit: firstUnit.code
        }));
      }
    }
  }, [open, costing, costingUnits]);

  // Populate form when editing (only on first open, not on subsequent dependency changes)
  useEffect(() => {
    if (open && costing && !formInitializedRef.current) {
      formInitializedRef.current = true;
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
        costCurrency: costing.costCurrency || costing.costCurrencyCode || LOCAL_CURRENCY,
        costCurrencyId: costing.costCurrencyId || undefined,
        costExRate: costing.costExRate?.toString() || "1.000",
        costNoOfUnit: costing.costQty?.toString() || "",
        costPerUnit: costing.costUnit?.toString() || "",
        costLCYAmount: costing.costLCY?.toString() || "0.00",
        costFCYAmount: costing.costFCY?.toString() || "0.00",
        costVendor: vendorParty?.id?.toString() || "_none",
        costVendorName: costing.vendorName || "",
        costVendorCustomerId: costing.vendorCustomerId?.toString() || "",
        costReferenceNo: costing.costReferenceNo || "",
        costDate: costing.costDate?.split('T')[0] || getTodayDateOnly(),
        costTax: costing.costTaxPercentage ? `${costing.costTaxPercentage}%` : "0%",
        saleCurrency: costing.saleCurrency || costing.saleCurrencyCode || LOCAL_CURRENCY,
        saleCurrencyId: costing.saleCurrencyId || undefined,
        saleExRate: costing.saleExRate?.toString() || "1.000",
        saleNoOfUnit: costing.saleQty?.toString() || "",
        salePerUnit: costing.saleUnit?.toString() || "",
        saleLCYAmount: costing.saleLCY?.toString() || "0.00",
        saleFCYAmount: costing.saleFCY?.toString() || "0.00",
        saleBillTo: billToParty?.id?.toString() || "_none",
        saleBillToName: costing.billToName || "",
        saleBillToCustomerId: costing.billToCustomerId?.toString() || "",
        saleGP: costing.gp?.toString() || "0.00",
        saleTax: costing.saleTaxPercentage ? `${costing.saleTaxPercentage}%` : "0%",
      });
    } else if (open && !costing && !formInitializedRef.current) {
      formInitializedRef.current = true;
      // Set default form data with currency IDs and unit if available
      const defaultFormData = getDefaultFormData();
      if (currencyTypes.length > 0) {
        const defaultCurrency = currencyTypes.find(c => c.code === LOCAL_CURRENCY);
        if (defaultCurrency) {
          defaultFormData.saleCurrencyId = defaultCurrency.id;
          defaultFormData.costCurrencyId = defaultCurrency.id;
        }
      }
      if (costingUnits.length > 0) {
        const firstUnit = costingUnits[0];
        defaultFormData.unitId = firstUnit.id;
        defaultFormData.unit = firstUnit.code;
      }
      setFormData(defaultFormData);
    }
  }, [open, costing, creditorParties, debtorParties, currencyTypes, costingUnits]);

  // Resolve missing currency IDs when editing existing records
  useEffect(() => {
    if (open && costing && currencyTypes.length > 0) {
      setFormData(prev => {
        let updated = false;
        const updates = { ...prev };
        if (!prev.costCurrencyId && prev.costCurrency) {
          const curr = currencyTypes.find(c => c.code === prev.costCurrency);
          if (curr) { updates.costCurrencyId = curr.id; updated = true; }
        }
        if (!prev.saleCurrencyId && prev.saleCurrency) {
          const curr = currencyTypes.find(c => c.code === prev.saleCurrency);
          if (curr) { updates.saleCurrencyId = curr.id; updated = true; }
        }
        return updated ? updates : prev;
      });
    }
  }, [open, costing, currencyTypes]);

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
    const currencyObj = currencyTypes.find(c => c.code === currency);

    setFormData(prev => ({
      ...prev,
      costCurrency: currency,
      costCurrencyId: currencyObj?.id,
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
    const currencyObj = currencyTypes.find(c => c.code === currency);

    setFormData(prev => ({
      ...prev,
      saleCurrency: currency,
      saleCurrencyId: currencyObj?.id,
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
    if (partyId === "_none") {
      setFormData(prev => ({
        ...prev,
        costVendor: "_none",
        costVendorName: "",
        costVendorCustomerId: ""
      }));
      return;
    }
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
    if (partyId === "_none") {
      setFormData(prev => ({
        ...prev,
        saleBillTo: "_none",
        saleBillToName: "",
        saleBillToCustomerId: ""
      }));
      return;
    }
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
    const vendorCustomerId = formData.costVendor === "_none" || !formData.costVendorCustomerId
      ? (formData.costVendor && formData.costVendor !== "_none" ? parseInt(formData.costVendor) : undefined)
      : parseInt(formData.costVendorCustomerId);

    const billToCustomerId = formData.saleBillTo === "_none" || !formData.saleBillToCustomerId
      ? (formData.saleBillTo && formData.saleBillTo !== "_none" ? parseInt(formData.saleBillTo) : undefined)
      : parseInt(formData.saleBillToCustomerId);

    // Parse tax percentages and calculate tax amounts
    const costTaxPercentage = parseFloat(formData.costTax.replace('%', '')) || 0;
    const saleTaxPercentage = parseFloat(formData.saleTax.replace('%', '')) || 0;
    const costLCYValue = parseFloat(formData.costLCYAmount) || 0;
    const saleLCYValue = parseFloat(formData.saleLCYAmount) || 0;

    onSave({
      id: costing?.id || Date.now(),
      description: formData.charge, // The charge name (used as description in backend)
      chargeDescription: formData.description, // The user-editable description field
      remarks: formData.remarks,
      ppcc: formData.ppcc,
      saleQty: formData.saleNoOfUnit || "0.000",
      saleUnit: formData.salePerUnit || "0.00",
      saleCurrency: formData.saleCurrency,
      saleCurrencyId: formData.saleCurrencyId,
      saleCurrencyCode: formData.saleCurrency,
      saleExRate: formData.saleExRate,
      saleFCY: formData.saleFCYAmount,
      saleLCY: formData.saleLCYAmount,
      saleTaxPercentage: saleTaxPercentage.toString(),
      saleTaxAmount: ((saleLCYValue * saleTaxPercentage) / 100).toFixed(2),
      costQty: formData.costNoOfUnit || "0.000",
      costUnit: formData.costPerUnit || "0.00",
      costCurrency: formData.costCurrency,
      costCurrencyId: formData.costCurrencyId,
      costCurrencyCode: formData.costCurrency,
      costExRate: formData.costExRate,
      costFCY: formData.costFCYAmount,
      costLCY: formData.costLCYAmount,
      costTaxPercentage: costTaxPercentage.toString(),
      costTaxAmount: ((costLCYValue * costTaxPercentage) / 100).toFixed(2),
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
      <DialogContent className="max-w-2xl bg-card border border-border p-0">
        <DialogHeader className="bg-modal-header text-white p-4 rounded-t-lg">
          <DialogTitle className="text-white text-lg font-semibold">
            {costing ? "Edit Costing" : "Add Costing"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 p-6 pt-4">
          {/* Common Fields - Row 1 */}
          <div className="grid grid-cols-4 gap-3">
            <div className="col-span-2">
              <Label className="text-xs font-medium">Charge</Label>
              <SearchableSelect
                options={chargeItems.map(item => ({ value: item.name, label: item.name }))}
                value={formData.charge}
                onValueChange={handleChargeChange}
                placeholder="Select charge type"
                searchPlaceholder="Search charges..."
                triggerClassName="bg-background border-border h-9"
                emptyMessage="No charge items available"
              />
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
              <SearchableSelect
                options={ppccOptions.map(opt => ({ value: opt, label: opt }))}
                value={formData.ppcc}
                onValueChange={(v) => handleInputChange("ppcc", v)}
                triggerClassName="bg-background border-border h-9"
                searchPlaceholder="Search..."
              />
            </div>
            <div>
              <Label className="text-xs font-medium">Unit</Label>
              <SearchableSelect
                options={costingUnits.map(unit => ({ value: unit.id.toString(), label: unit.name }))}
                value={formData.unitId?.toString() || ""}
                onValueChange={(v) => {
                  const selectedUnit = costingUnits.find(u => u.id.toString() === v);
                  setFormData(prev => ({
                    ...prev,
                    unitId: selectedUnit?.id,
                    unit: selectedUnit?.code || ""
                  }));
                }}
                placeholder="Select unit"
                searchPlaceholder="Search units..."
                triggerClassName="bg-background border-border h-9"
                emptyMessage="Loading..."
              />
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
                className="data-[state=active]:bg-modal-header data-[state=active]:text-white text-sm h-8"
              >
                Cost
              </TabsTrigger>
              <TabsTrigger
                value="sale"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-sm h-8"
              >
                Sale
              </TabsTrigger>
            </TabsList>

            {/* Cost Tab */}
            <TabsContent value="cost" className="mt-3 space-y-3">
              <div className="grid grid-cols-6 gap-2">
                <div>
                  <Label className="text-xs">Currency</Label>
                  <SearchableSelect
                    options={currencyTypes.length > 0
                      ? currencyTypes.map(curr => ({ value: curr.code, label: curr.code }))
                      : [{ value: "AED", label: "AED" }, { value: "USD", label: "USD" }, { value: "EUR", label: "EUR" }]
                    }
                    value={formData.costCurrency}
                    onValueChange={handleCostCurrencyChange}
                    triggerClassName="bg-background border-border h-8 text-xs"
                    searchPlaceholder="Search..."
                  />
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
                  <SearchableSelect
                    options={[
                      { value: "_none", label: "Select Creditor" },
                      ...creditorParties.map(party => ({ value: party.id.toString(), label: party.customerName }))
                    ]}
                    value={formData.costVendor}
                    onValueChange={handleVendorSelect}
                    placeholder="Select vendor"
                    searchPlaceholder="Search vendors..."
                    triggerClassName="bg-background border-border h-8 text-xs"
                  />
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
                  <SearchableSelect
                    options={taxOptions.map(tax => ({ value: tax, label: tax }))}
                    value={formData.costTax}
                    onValueChange={(v) => handleInputChange("costTax", v)}
                    triggerClassName="bg-background border-border h-8 text-xs"
                    searchPlaceholder="Search..."
                  />
                </div>
              </div>
            </TabsContent>

            {/* Sale Tab */}
            <TabsContent value="sale" className="mt-3 space-y-3">
              <div className="grid grid-cols-6 gap-2">
                <div>
                  <Label className="text-xs">Currency</Label>
                  <SearchableSelect
                    options={currencyTypes.length > 0
                      ? currencyTypes.map(curr => ({ value: curr.code, label: curr.code }))
                      : [{ value: "AED", label: "AED" }, { value: "USD", label: "USD" }, { value: "EUR", label: "EUR" }]
                    }
                    value={formData.saleCurrency}
                    onValueChange={handleSaleCurrencyChange}
                    triggerClassName="bg-background border-border h-8 text-xs"
                    searchPlaceholder="Search..."
                  />
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
                  <SearchableSelect
                    options={[
                      { value: "_none", label: "Select Debitor" },
                      ...debtorParties.map(party => ({ value: party.id.toString(), label: party.customerName }))
                    ]}
                    value={formData.saleBillTo}
                    onValueChange={handleBillToSelect}
                    placeholder="Select debtor"
                    searchPlaceholder="Search debtors..."
                    triggerClassName="bg-background border-border h-8 text-xs"
                  />
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
                  <SearchableSelect
                    options={taxOptions.map(tax => ({ value: tax, label: tax }))}
                    value={formData.saleTax}
                    onValueChange={(v) => handleInputChange("saleTax", v)}
                    triggerClassName="bg-background border-border h-8 text-xs"
                    searchPlaceholder="Search..."
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="px-6 h-9"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              className="btn-success px-6 h-9"
            >
              {costing ? "Update" : "Add"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
