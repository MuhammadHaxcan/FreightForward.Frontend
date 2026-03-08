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
import { useBaseCurrency } from "@/hooks/useBaseCurrency";
import { useQuery } from "@tanstack/react-query";
import { X, Lock, Info } from "lucide-react";
import { toast } from "sonner";
import { FieldError, fieldErrorClass } from "@/components/ui/field-error";

// Extend ShipmentCosting with UI-specific fields for the modal
// The modal transforms between API format (currencyId) and display format (currency code)
export type CostingModalData = Partial<ShipmentCosting> & {
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
  defaultBillToCustomerId?: number;
  defaultVendorCustomerId?: number;
  defaultActiveTab?: "cost" | "sale";
}

const ppccOptions = ["Prepaid", "Postpaid"];
const taxOptions = ["0%", "5%", "10%", "15%", "Custom"];
const standardTaxValues = [0, 5, 10, 15];

export function CostingModal({ open, onOpenChange, parties, costing, onSave, defaultBillToCustomerId, defaultVendorCustomerId, defaultActiveTab }: CostingModalProps) {
  const baseCurrencyCode = useBaseCurrency();
  const LOCAL_CURRENCY = baseCurrencyCode;
  const isBaseCurrency = (currencyCode?: string): boolean =>
    (currencyCode || "").trim().toUpperCase() === (LOCAL_CURRENCY || "").trim().toUpperCase();
  const getFooterCurrency = (sideCurrency?: string): string => LOCAL_CURRENCY || sideCurrency || "USD";

  // Invoice lock states
  const isSaleLocked = !!costing?.saleInvoiced;
  const isCostLocked = !!costing?.purchaseInvoiced;
  const isFullyLocked = isSaleLocked && isCostLocked;

  const [activeTab, setActiveTab] = useState(defaultActiveTab || "cost");

  // Fetch currency types from settings
  const { data: currencyTypesData } = useCurrencyTypes({ pageSize: 100 });
  const currencyTypes = useMemo(() => currencyTypesData?.items || [], [currencyTypesData]);

  // Fetch charge items from settings
  const { data: chargeItemsResponse, isLoading: isLoadingChargeItems } = useQuery({
    queryKey: ['chargeItems', 'all'],
    queryFn: () => settingsApi.getAllChargeItems(),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
  const chargeItems = useMemo(() => chargeItemsResponse?.data || [], [chargeItemsResponse?.data]);

  // Fetch costing units from settings
  const { data: costingUnitsResponse, isLoading: isLoadingCostingUnits } = useQuery({
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
    costCustomTax: "",
    costCustomTaxAmount: "",
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
    saleCustomTax: "",
    saleCustomTaxAmount: "",
  });

  const [formData, setFormData] = useState(getDefaultFormData());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const formInitializedRef = useRef(false);

  // Reset ref when modal closes, set active tab when opening
  useEffect(() => {
    if (!open) {
      formInitializedRef.current = false;
    } else {
      setErrors({});
      setActiveTab(defaultActiveTab || "cost");
    }
  }, [open, defaultActiveTab]);

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
      const costCurrencyCode = costing.costCurrency || costing.costCurrencyCode || LOCAL_CURRENCY;
      const saleCurrencyCode = costing.saleCurrency || costing.saleCurrencyCode || LOCAL_CURRENCY;

      setFormData({
        charge: costing.description || "",
        description: costing.chargeDescription || costing.description || "", // Use chargeDescription if available, fallback to description
        ppcc: costing.ppcc || "Prepaid",
        unitId: costing.unitId || undefined,
        unit: costing.unitName || "",
        remarks: costing.remarks || "",
        costCurrency: costCurrencyCode,
        costCurrencyId: costing.costCurrencyId || undefined,
        costExRate: costing.costExRate?.toString() || "1.000",
        costNoOfUnit: costing.costQty?.toString() || "",
        costPerUnit: costing.costUnit?.toString() || "",
        costLCYAmount: costing.costLCY?.toString() || "0.00",
        costFCYAmount: isBaseCurrency(costCurrencyCode) ? "0.00" : (costing.costFCY?.toString() || "0.00"),
        costVendor: vendorParty?.id?.toString() || "_none",
        costVendorName: costing.vendorName || "",
        costVendorCustomerId: costing.vendorCustomerId?.toString() || "",
        costReferenceNo: costing.costReferenceNo || "",
        costDate: costing.costDate?.split('T')[0] || getTodayDateOnly(),
        costTax: (() => {
          const val = parseFloat(costing.costTaxPercentage as string) || 0;
          return standardTaxValues.includes(val) ? `${val}%` : "Custom";
        })(),
        costCustomTax: (() => {
          const val = parseFloat(costing.costTaxPercentage as string) || 0;
          return standardTaxValues.includes(val) ? "" : val.toString();
        })(),
        costCustomTaxAmount: (() => {
          const val = parseFloat(costing.costTaxPercentage as string) || 0;
          if (standardTaxValues.includes(val)) return "";
          const lcy = parseFloat(costing.costLCY as string) || 0;
          return ((lcy * val) / 100).toFixed(2);
        })(),
        saleCurrency: saleCurrencyCode,
        saleCurrencyId: costing.saleCurrencyId || undefined,
        saleExRate: costing.saleExRate?.toString() || "1.000",
        saleNoOfUnit: costing.saleQty?.toString() || "",
        salePerUnit: costing.saleUnit?.toString() || "",
        saleLCYAmount: costing.saleLCY?.toString() || "0.00",
        saleFCYAmount: isBaseCurrency(saleCurrencyCode) ? "0.00" : (costing.saleFCY?.toString() || "0.00"),
        saleBillTo: billToParty?.id?.toString() || "_none",
        saleBillToName: costing.billToName || "",
        saleBillToCustomerId: costing.billToCustomerId?.toString() || "",
        saleGP: costing.gp?.toString() || "0.00",
        saleTax: (() => {
          const val = parseFloat(costing.saleTaxPercentage as string) || 0;
          return standardTaxValues.includes(val) ? `${val}%` : "Custom";
        })(),
        saleCustomTax: (() => {
          const val = parseFloat(costing.saleTaxPercentage as string) || 0;
          return standardTaxValues.includes(val) ? "" : val.toString();
        })(),
        saleCustomTaxAmount: (() => {
          const val = parseFloat(costing.saleTaxPercentage as string) || 0;
          if (standardTaxValues.includes(val)) return "";
          const lcy = parseFloat(costing.saleLCY as string) || 0;
          return ((lcy * val) / 100).toFixed(2);
        })(),
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
      // Apply default billTo from parent (e.g. InvoiceModal)
      if (defaultBillToCustomerId) {
        const billToParty = debtorParties.find(p => p.customerId === defaultBillToCustomerId);
        if (billToParty) {
          defaultFormData.saleBillTo = billToParty.id.toString();
          defaultFormData.saleBillToName = billToParty.customerName;
          defaultFormData.saleBillToCustomerId = billToParty.customerId?.toString() || "";
        }
      }
      // Apply default vendor from parent (e.g. PurchaseModal)
      if (defaultVendorCustomerId) {
        const vendorParty = creditorParties.find(p => p.customerId === defaultVendorCustomerId);
        if (vendorParty) {
          defaultFormData.costVendor = vendorParty.id.toString();
          defaultFormData.costVendorName = vendorParty.customerName;
          defaultFormData.costVendorCustomerId = vendorParty.customerId?.toString() || "";
        }
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

    const baseAmount = units * unitPrice;
    const fcyAmount = isBaseCurrency(currency) ? 0 : baseAmount;
    const lcyAmount = baseAmount * rate;
    return { fcy: fcyAmount.toFixed(2), lcy: lcyAmount.toFixed(2) };
  };

  const calculateSaleAmounts = (currency: string, noOfUnit: string, perUnit: string, exRate: string) => {
    const units = parseFloat(noOfUnit) || 0;
    const unitPrice = parseFloat(perUnit) || 0;
    const rate = parseFloat(exRate) || 1;

    const baseAmount = units * unitPrice;
    const fcyAmount = isBaseCurrency(currency) ? 0 : baseAmount;
    const lcyAmount = baseAmount * rate;
    return { fcy: fcyAmount.toFixed(2), lcy: lcyAmount.toFixed(2) };
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

    setFormData(prev => {
      const updated = {
        ...prev,
        costCurrency: currency,
        costCurrencyId: currencyObj?.id,
        costExRate: roe.toFixed(3),
        costFCYAmount: amounts.fcy,
        costLCYAmount: amounts.lcy,
        saleGP: calculateGP(prev.saleLCYAmount, amounts.lcy),
      };
      recalcCostTax(updated, amounts.lcy);
      return updated;
    });
  };

  // Handle sale currency change - update exchange rate from ROE
  const handleSaleCurrencyChange = (currency: string) => {
    const roe = getROE(currency);
    const amounts = calculateSaleAmounts(currency, formData.saleNoOfUnit, formData.salePerUnit, roe.toFixed(3));
    const currencyObj = currencyTypes.find(c => c.code === currency);

    setFormData(prev => {
      const updated = {
        ...prev,
        saleCurrency: currency,
        saleCurrencyId: currencyObj?.id,
        saleExRate: roe.toFixed(3),
        saleFCYAmount: amounts.fcy,
        saleLCYAmount: amounts.lcy,
        saleGP: calculateGP(amounts.lcy, prev.costLCYAmount),
      };
      recalcSaleTax(updated, amounts.lcy);
      return updated;
    });
  };

  // Recalculate custom tax amount from percentage when LCY changes
  const recalcCostTax = (data: typeof formData, newLCY: string) => {
    if (data.costTax === "Custom" && data.costCustomTax) {
      const pct = parseFloat(data.costCustomTax) || 0;
      const lcy = parseFloat(newLCY) || 0;
      data.costCustomTaxAmount = ((lcy * pct) / 100).toFixed(2);
    }
  };

  const recalcSaleTax = (data: typeof formData, newLCY: string) => {
    if (data.saleTax === "Custom" && data.saleCustomTax) {
      const pct = parseFloat(data.saleCustomTax) || 0;
      const lcy = parseFloat(newLCY) || 0;
      data.saleCustomTaxAmount = ((lcy * pct) / 100).toFixed(2);
    }
  };

  // Handle cost input changes and recalculate
  const handleCostInputChange = (field: string, value: string) => {
    setFormData(prev => {
      const newFormData = { ...prev, [field]: value };

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
        recalcCostTax(newFormData, amounts.lcy);
      }

      return newFormData;
    });
  };

  // Handle sale input changes and recalculate
  const handleSaleInputChange = (field: string, value: string) => {
    setFormData(prev => {
      const newFormData = { ...prev, [field]: value };

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
        recalcSaleTax(newFormData, amounts.lcy);
      }

      return newFormData;
    });
  };

  // Handle charge selection - auto-populate description with charge name
  const handleChargeChange = (chargeName: string) => {
    setErrors(prev => { const next = { ...prev }; delete next.charge; return next; });
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
    // Validate charge selection
    if (!formData.charge) {
      setErrors({ charge: "Please select a charge" });
      return;
    }
    setErrors({});

    // Get the actual customer IDs - prefer the stored customer ID, fallback to party ID
    const vendorCustomerId = formData.costVendor === "_none" || !formData.costVendorCustomerId
      ? (formData.costVendor && formData.costVendor !== "_none" ? parseInt(formData.costVendor) : undefined)
      : parseInt(formData.costVendorCustomerId);

    const billToCustomerId = formData.saleBillTo === "_none" || !formData.saleBillToCustomerId
      ? (formData.saleBillTo && formData.saleBillTo !== "_none" ? parseInt(formData.saleBillTo) : undefined)
      : parseInt(formData.saleBillToCustomerId);

    // Parse tax percentages and calculate tax amounts
    const costTaxPercentage = formData.costTax === "Custom"
      ? (parseFloat(formData.costCustomTax) || 0)
      : (parseFloat(formData.costTax.replace('%', '')) || 0);
    const saleTaxPercentage = formData.saleTax === "Custom"
      ? (parseFloat(formData.saleCustomTax) || 0)
      : (parseFloat(formData.saleTax.replace('%', '')) || 0);
    const costLCYValue = parseFloat(formData.costLCYAmount) || 0;
    const saleLCYValue = parseFloat(formData.saleLCYAmount) || 0;

    // Use custom tax amount if user typed it directly, otherwise calculate from percentage
    const costTaxAmountFinal = formData.costTax === "Custom" && formData.costCustomTaxAmount
      ? parseFloat(formData.costCustomTaxAmount) || 0
      : (costLCYValue * costTaxPercentage) / 100;
    const saleTaxAmountFinal = formData.saleTax === "Custom" && formData.saleCustomTaxAmount
      ? parseFloat(formData.saleCustomTaxAmount) || 0
      : (saleLCYValue * saleTaxPercentage) / 100;
    const costFCYFinal = isBaseCurrency(formData.costCurrency) ? "0.00" : (parseFloat(formData.costFCYAmount) || 0).toFixed(2);
    const saleFCYFinal = isBaseCurrency(formData.saleCurrency) ? "0.00" : (parseFloat(formData.saleFCYAmount) || 0).toFixed(2);

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
      saleFCY: saleFCYFinal,
      saleLCY: formData.saleLCYAmount,
      saleTaxPercentage: saleTaxPercentage.toString(),
      saleTaxAmount: saleTaxAmountFinal.toFixed(2),
      costQty: formData.costNoOfUnit || "0.000",
      costUnit: formData.costPerUnit || "0.00",
      costCurrency: formData.costCurrency,
      costCurrencyId: formData.costCurrencyId,
      costCurrencyCode: formData.costCurrency,
      costExRate: formData.costExRate,
      costFCY: costFCYFinal,
      costLCY: formData.costLCYAmount,
      costTaxPercentage: costTaxPercentage.toString(),
      costTaxAmount: costTaxAmountFinal.toFixed(2),
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
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-card border border-border p-0">
        <DialogHeader className="bg-modal-header text-white p-4 rounded-t-lg">
          <DialogTitle className="text-white text-lg font-semibold">
            {isFullyLocked ? "View Costing" : costing ? "Edit Costing" : "Add Costing"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 p-6 pt-4">
          {/* Invoice Lock Banner */}
          {(isSaleLocked || isCostLocked) && (
            <div className="flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700 px-3 py-2 text-sm text-amber-800 dark:text-amber-300">
              <Info className="h-4 w-4 shrink-0" />
              <span>
                {isFullyLocked
                  ? "This costing is fully invoiced. Delete invoice(s) to enable editing."
                  : isSaleLocked
                    ? "Sale side is locked (invoiced). Delete the invoice to edit sale fields."
                    : "Cost side is locked (invoiced). Delete the purchase invoice to edit cost fields."}
              </span>
            </div>
          )}

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
                triggerClassName={`bg-background border-border h-9 ${fieldErrorClass(errors.charge)}`}
                emptyMessage={isLoadingChargeItems ? "Loading..." : "No charge items available"}
                disabled={isFullyLocked}
              />
              <FieldError message={errors.charge} />
            </div>
            <div className="col-span-2">
              <Label className="text-xs font-medium">Description</Label>
              <Input
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Description"
                className="bg-background border-border h-9"
                disabled={isFullyLocked}
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
                disabled={isFullyLocked}
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
                emptyMessage={isLoadingCostingUnits ? "Loading..." : "No units available"}
                disabled={isFullyLocked}
              />
            </div>
            <div className="col-span-2">
              <Label className="text-xs font-medium">Remarks</Label>
              <Input
                value={formData.remarks}
                onChange={(e) => handleInputChange("remarks", e.target.value)}
                placeholder="Remarks"
                className="bg-background border-border h-9"
                disabled={isFullyLocked}
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
                {isCostLocked && <Lock className="h-3 w-3 ml-1" />}
              </TabsTrigger>
              <TabsTrigger
                value="sale"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-sm h-8"
              >
                Sale
                {isSaleLocked && <Lock className="h-3 w-3 ml-1" />}
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
                    disabled={isCostLocked}
                  />
                </div>
                <div>
                  <Label className="text-xs">Ex.Rate (ROE)</Label>
                  <Input
                    value={formData.costExRate}
                    onChange={(e) => handleCostInputChange("costExRate", e.target.value)}
                    className="bg-background border-border h-8 text-xs"
                    disabled={isCostLocked}
                  />
                </div>
                <div>
                  <Label className="text-xs">No of Unit</Label>
                  <Input
                    value={formData.costNoOfUnit}
                    onChange={(e) => handleCostInputChange("costNoOfUnit", e.target.value)}
                    placeholder="0"
                    className="bg-background border-border h-8 text-xs"
                    disabled={isCostLocked}
                  />
                </div>
                <div>
                  <Label className="text-xs">Cost/Unit</Label>
                  <Input
                    value={formData.costPerUnit}
                    onChange={(e) => handleCostInputChange("costPerUnit", e.target.value)}
                    placeholder="0.00"
                    className="bg-background border-border h-8 text-xs"
                    disabled={isCostLocked}
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
                    disabled={isCostLocked}
                  />
                </div>
                <div>
                  <Label className="text-xs">Reference No</Label>
                  <Input
                    value={formData.costReferenceNo}
                    onChange={(e) => handleInputChange("costReferenceNo", e.target.value)}
                    placeholder="Ref No"
                    className="bg-background border-border h-8 text-xs"
                    disabled={isCostLocked}
                  />
                </div>
                <div>
                  <Label className="text-xs">Date</Label>
                  <DateInput
                    value={formData.costDate}
                    onChange={(v) => handleInputChange("costDate", v)}
                    className="h-8 text-xs"
                    disabled={isCostLocked}
                  />
                </div>
                <div>
                  <Label className="text-xs">Tax %</Label>
                  <div className="flex flex-col gap-1">
                    <SearchableSelect
                      options={taxOptions.map(tax => ({ value: tax, label: tax }))}
                      value={formData.costTax}
                      onValueChange={(v) => {
                        handleInputChange("costTax", v);
                        if (v !== "Custom") {
                          handleInputChange("costCustomTax", "");
                          handleInputChange("costCustomTaxAmount", "");
                        }
                      }}
                      triggerClassName="bg-background border-border h-8 text-xs"
                      searchPlaceholder="Search..."
                      disabled={isCostLocked}
                    />
                    {formData.costTax === "Custom" && (
                      <div className="flex gap-1">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={formData.costCustomTax}
                          onChange={(e) => {
                            const pct = parseFloat(e.target.value) || 0;
                            const lcy = parseFloat(formData.costLCYAmount) || 0;
                            setFormData(prev => ({
                              ...prev,
                              costCustomTax: e.target.value,
                              costCustomTaxAmount: lcy > 0 ? ((lcy * pct) / 100).toFixed(2) : "0.00",
                            }));
                          }}
                          placeholder="%"
                          className="bg-background border-border h-8 text-xs w-1/2"
                          disabled={isCostLocked}
                        />
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.costCustomTaxAmount}
                          onChange={(e) => {
                            const amt = parseFloat(e.target.value) || 0;
                            const lcy = parseFloat(formData.costLCYAmount) || 0;
                            setFormData(prev => ({
                              ...prev,
                              costCustomTaxAmount: e.target.value,
                              costCustomTax: lcy > 0 ? ((amt / lcy) * 100).toFixed(2) : "0.00",
                            }));
                          }}
                          placeholder="Amount"
                          className="bg-background border-border h-8 text-xs w-1/2"
                          disabled={isCostLocked}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {(() => {
                const lcy = parseFloat(formData.costLCYAmount) || 0;
                let vat = 0;
                if (formData.costTax === "Custom") {
                  if (formData.costCustomTaxAmount) vat = parseFloat(formData.costCustomTaxAmount) || 0;
                  else { const pct = parseFloat(formData.costCustomTax) || 0; vat = (lcy * pct) / 100; }
                } else {
                  const pct = parseFloat(formData.costTax?.replace('%', '') || '0') || 0;
                  vat = (lcy * pct) / 100;
                }
                const subTotal = lcy + vat;
                const curr = getFooterCurrency(formData.costCurrency);
                return (
                  <div className="flex items-center justify-end gap-6 pt-2 border-t border-border mt-2">
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground">Total Cost</div>
                      <div className="text-sm font-semibold">{curr} {lcy.toFixed(2)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground">VAT</div>
                      <div className="text-sm font-semibold">{curr} {vat.toFixed(2)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground">Sub Total</div>
                      <div className="text-sm font-bold text-emerald-600">{curr} {subTotal.toFixed(2)}</div>
                    </div>
                  </div>
                );
              })()}
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
                    disabled={isSaleLocked}
                  />
                </div>
                <div>
                  <Label className="text-xs">Ex.Rate (ROE)</Label>
                  <Input
                    value={formData.saleExRate}
                    onChange={(e) => handleSaleInputChange("saleExRate", e.target.value)}
                    className="bg-background border-border h-8 text-xs"
                    disabled={isSaleLocked}
                  />
                </div>
                <div>
                  <Label className="text-xs">No of Unit</Label>
                  <Input
                    value={formData.saleNoOfUnit}
                    onChange={(e) => handleSaleInputChange("saleNoOfUnit", e.target.value)}
                    placeholder="0"
                    className="bg-background border-border h-8 text-xs"
                    disabled={isSaleLocked}
                  />
                </div>
                <div>
                  <Label className="text-xs">Price/Unit</Label>
                  <Input
                    value={formData.salePerUnit}
                    onChange={(e) => handleSaleInputChange("salePerUnit", e.target.value)}
                    placeholder="0.00"
                    className="bg-background border-border h-8 text-xs"
                    disabled={isSaleLocked}
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
                    disabled={isSaleLocked}
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
                  <div className="flex flex-col gap-1">
                    <SearchableSelect
                      options={taxOptions.map(tax => ({ value: tax, label: tax }))}
                      value={formData.saleTax}
                      onValueChange={(v) => {
                        handleInputChange("saleTax", v);
                        if (v !== "Custom") {
                          handleInputChange("saleCustomTax", "");
                          handleInputChange("saleCustomTaxAmount", "");
                        }
                      }}
                      triggerClassName="bg-background border-border h-8 text-xs"
                      searchPlaceholder="Search..."
                      disabled={isSaleLocked}
                    />
                    {formData.saleTax === "Custom" && (
                      <div className="flex gap-1">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={formData.saleCustomTax}
                          onChange={(e) => {
                            const pct = parseFloat(e.target.value) || 0;
                            const lcy = parseFloat(formData.saleLCYAmount) || 0;
                            setFormData(prev => ({
                              ...prev,
                              saleCustomTax: e.target.value,
                              saleCustomTaxAmount: lcy > 0 ? ((lcy * pct) / 100).toFixed(2) : "0.00",
                            }));
                          }}
                          placeholder="%"
                          className="bg-background border-border h-8 text-xs w-1/2"
                          disabled={isSaleLocked}
                        />
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.saleCustomTaxAmount}
                          onChange={(e) => {
                            const amt = parseFloat(e.target.value) || 0;
                            const lcy = parseFloat(formData.saleLCYAmount) || 0;
                            setFormData(prev => ({
                              ...prev,
                              saleCustomTaxAmount: e.target.value,
                              saleCustomTax: lcy > 0 ? ((amt / lcy) * 100).toFixed(2) : "0.00",
                            }));
                          }}
                          placeholder="Amount"
                          className="bg-background border-border h-8 text-xs w-1/2"
                          disabled={isSaleLocked}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {(() => {
                const lcy = parseFloat(formData.saleLCYAmount) || 0;
                let vat = 0;
                if (formData.saleTax === "Custom") {
                  if (formData.saleCustomTaxAmount) vat = parseFloat(formData.saleCustomTaxAmount) || 0;
                  else { const pct = parseFloat(formData.saleCustomTax) || 0; vat = (lcy * pct) / 100; }
                } else {
                  const pct = parseFloat(formData.saleTax?.replace('%', '') || '0') || 0;
                  vat = (lcy * pct) / 100;
                }
                const subTotal = lcy + vat;
                const curr = getFooterCurrency(formData.saleCurrency);
                return (
                  <div className="flex items-center justify-end gap-6 pt-2 border-t border-border mt-2">
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground">Total Sale</div>
                      <div className="text-sm font-semibold">{curr} {lcy.toFixed(2)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground">VAT</div>
                      <div className="text-sm font-semibold">{curr} {vat.toFixed(2)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground">Sub Total</div>
                      <div className="text-sm font-bold text-emerald-600">{curr} {subTotal.toFixed(2)}</div>
                    </div>
                  </div>
                );
              })()}
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
              {isFullyLocked ? "Close" : "Cancel"}
            </Button>
            {!isFullyLocked && (
              <Button
                size="sm"
                onClick={handleSave}
                className="btn-success px-6 h-9"
              >
                {costing ? "Update" : "Add"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
