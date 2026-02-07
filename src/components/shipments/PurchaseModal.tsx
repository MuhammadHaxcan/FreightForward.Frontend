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
import { Loader2, Plus } from "lucide-react";
import { ShipmentParty, ShipmentCosting, CreatePurchaseInvoiceItemRequest, UpdatePurchaseInvoiceItemRequest, invoiceApi, customerApi, settingsApi, CurrencyType, AccountPurchaseInvoiceDetail, shipmentApi, AddShipmentCostingRequest, UpdateShipmentCostingRequest } from "@/services/api";
import { useBaseCurrency } from "@/hooks/useBaseCurrency";
import { useCreatePurchaseInvoice, useUpdatePurchaseInvoice } from "@/hooks/useInvoices";
import { useAddShipmentCosting, useUpdateShipmentCosting } from "@/hooks/useShipments";
import { useToast } from "@/hooks/use-toast";
import { CostingModal, type CostingModalData } from "@/components/shipments/CostingModal";
import { useQueryClient } from "@tanstack/react-query";

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
  onSave: (purchase: PurchaseSaveResult) => void | Promise<void>;
  editPurchaseInvoiceId?: number | null;
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

export function PurchaseModal({ open, onOpenChange, shipmentId, jobNumber, chargesDetails, parties, onSave, editPurchaseInvoiceId }: PurchaseModalProps) {
  const baseCurrencyCode = useBaseCurrency();
  const createPurchaseInvoiceMutation = useCreatePurchaseInvoice();
  const updatePurchaseInvoiceMutation = useUpdatePurchaseInvoice();
  const addCostingMutation = useAddShipmentCosting();
  const updateCostingMutation = useUpdateShipmentCosting();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const isEditMode = !!editPurchaseInvoiceId;

  // Filter parties to only show Creditors and deduplicate by customerId
  const creditorParties = useMemo(() =>
    deduplicateByCustomerId(parties.filter(p => p.masterType === 'Creditors')),
    [parties]
  );

  const [currencies, setCurrencies] = useState<CurrencyType[]>([]);
  const [editInvoiceData, setEditInvoiceData] = useState<AccountPurchaseInvoiceDetail | null>(null);
  const [isLoadingEdit, setIsLoadingEdit] = useState(false);
  // Map of costing id -> existing purchase invoice item id (for updates)
  const [existingItemIds, setExistingItemIds] = useState<Map<number, number>>(new Map());

  // Costing integration state (edit mode)
  const [localCostings, setLocalCostings] = useState<ShipmentCosting[]>([]);
  const [costingModalOpen, setCostingModalOpen] = useState(false);
  const [editingCostingForModal, setEditingCostingForModal] = useState<CostingModalData | undefined>(undefined);
  const [pendingAutoSelect, setPendingAutoSelect] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    purchaseId: "",
    companyName: "",
    customerId: "",
    invoiceDate: getTodayDateOnly(),
    invoiceNo: "",
    vDate: getTodayDateOnly(),
    currencyId: 1,
    currencyCode: baseCurrencyCode,
    remarks: "",
    selectedCharges: [] as number[],
  });

  // Reset form and fetch data when modal opens
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
        currencyCode: baseCurrencyCode,
        remarks: "",
        selectedCharges: [],
      });
      setEditInvoiceData(null);
      setExistingItemIds(new Map());
      setLocalCostings(chargesDetails);
      setCostingModalOpen(false);
      setEditingCostingForModal(undefined);
      setPendingAutoSelect(null);

      // Fetch currency types
      settingsApi.getAllCurrencyTypes().then(response => {
        if (response.data) {
          setCurrencies(response.data);
        }
      });

      if (isEditMode && editPurchaseInvoiceId) {
        // Edit mode: fetch existing purchase invoice data
        setIsLoadingEdit(true);
        invoiceApi.getPurchaseInvoiceById(editPurchaseInvoiceId).then(response => {
          if (response.data) {
            const inv = response.data;
            setEditInvoiceData(inv);

            // Build map of costingId -> purchaseInvoiceItemId
            const itemIdMap = new Map<number, number>();
            inv.items.forEach(item => {
              if (item.shipmentCostingId) {
                itemIdMap.set(item.shipmentCostingId, item.id);
              }
            });
            setExistingItemIds(itemIdMap);

            // Find the party matching the vendor
            const matchingParty = creditorParties.find(p => p.customerId === inv.vendorId);
            const costingIds = inv.items
              .filter(item => item.shipmentCostingId)
              .map(item => item.shipmentCostingId!);

            settingsApi.getAllCurrencyTypes().then(currResponse => {
              if (currResponse.data) {
                setCurrencies(currResponse.data);
                const currency = currResponse.data.find(c => c.id === inv.currencyId);
                setFormData({
                  purchaseId: inv.purchaseNo,
                  companyName: inv.vendorName || "",
                  customerId: matchingParty ? matchingParty.id.toString() : "",
                  invoiceDate: inv.purchaseDate,
                  invoiceNo: inv.vendorInvoiceNo || "",
                  vDate: inv.vendorInvoiceDate || getTodayDateOnly(),
                  currencyId: inv.currencyId || 1,
                  currencyCode: currency?.code || baseCurrencyCode,
                  remarks: inv.remarks || "",
                  selectedCharges: costingIds,
                });
              }
            });
          }
          setIsLoadingEdit(false);
        });
      } else {
        // Create mode: fetch next purchase number
        invoiceApi.getNextPurchaseNumber().then(response => {
          if (response.data) {
            setFormData(prev => ({ ...prev, purchaseId: response.data as string }));
          }
        });
      }
    }
  }, [open, editPurchaseInvoiceId]);

  // Filter charges: show uninvoiced charges + charges from this purchase invoice
  const filteredCharges = useMemo(() => {
    const selectedParty = creditorParties.find(p => p.id.toString() === formData.customerId);
    const selectedCustomerId = selectedParty?.customerId;

    // Get costing IDs that belong to this purchase invoice (for edit mode)
    const invoiceCostingIds = new Set(
      editInvoiceData?.items
        .filter(item => item.shipmentCostingId)
        .map(item => item.shipmentCostingId!) || []
    );

    return localCostings.filter(c => {
      // Only show costings assigned to this creditor
      const matchesVendor = selectedCustomerId
        ? c.vendorCustomerId === selectedCustomerId
        : false;
      if (!matchesVendor) return false;

      // In edit mode: show uninvoiced charges OR charges from this invoice
      const isFromThisInvoice = invoiceCostingIds.has(c.id);
      const hasValidCost = parseFloat(c.costQty || 0) > 0 && !c.purchaseInvoiced;

      return hasValidCost || isFromThisInvoice;
    });
  }, [localCostings, formData.customerId, creditorParties, editInvoiceData]);

  // Update currency when company selection changes (only in create mode)
  useEffect(() => {
    if (formData.customerId && !isEditMode) {
      const selectedParty = creditorParties.find(p => p.id.toString() === formData.customerId);
      if (selectedParty?.customerId) {
        setFormData(prev => ({ ...prev, companyName: selectedParty.customerName }));
        customerApi.getById(selectedParty.customerId).then(customerResponse => {
          if (customerResponse.data) {
            const custCurrencyId = customerResponse.data.currencyId || 1;
            const currency = currencies.find(c => c.id === custCurrencyId);
            setFormData(prev => ({
              ...prev,
              currencyId: custCurrencyId,
              currencyCode: currency?.code || baseCurrencyCode,
            }));
          }
        });
      }
    }
  }, [formData.customerId, creditorParties, currencies, isEditMode]);

  // Sale-only charges: costings that have sale data but no cost data (edit mode only)
  const saleOnlyCharges = useMemo(() => {
    if (!isEditMode) return [];
    const selectedParty = creditorParties.find(p => p.id.toString() === formData.customerId);
    const selectedCustomerId = selectedParty?.customerId;
    if (!selectedCustomerId) return [];
    return localCostings.filter(c => {
      const hasSale = parseFloat(c.saleQty || 0) > 0;
      const hasCost = parseFloat(c.costQty || 0) > 0;
      const matchesOrUnassigned = !c.vendorCustomerId || c.vendorCustomerId === selectedCustomerId;
      return hasSale && !hasCost && matchesOrUnassigned && !c.purchaseInvoiced;
    });
  }, [localCostings, formData.customerId, creditorParties, isEditMode]);

  // Refetch costings from server after adding/updating a costing
  const refetchCostings = async () => {
    if (!shipmentId) return;
    try {
      await queryClient.invalidateQueries({ queryKey: ['shipments', shipmentId] });
      const response = await shipmentApi.getById(shipmentId);
      if (response.data) {
        setLocalCostings(response.data.costings);
      }
    } catch {
      // silent
    }
  };

  // Handle saving a costing from the nested CostingModal
  const handleCostingModalSave = async (costingData: CostingModalData) => {
    if (!shipmentId) return;

    // Force vendorCustomerId to match the purchase vendor
    const selectedParty = creditorParties.find(p => p.id.toString() === formData.customerId);
    const purchaseVendorCustomerId = selectedParty?.customerId;

    const saleLCY = parseFloat(costingData.saleLCY as string) || 0;
    const costLCY = parseFloat(costingData.costLCY as string) || 0;

    try {
      if (editingCostingForModal?.id && typeof editingCostingForModal.id === 'number' && editingCostingForModal.id < 1e12) {
        // Update existing costing (adding cost side)
        const data: UpdateShipmentCostingRequest = {
          id: editingCostingForModal.id,
          shipmentId,
          description: costingData.description || "",
          remarks: costingData.remarks,
          saleQty: parseFloat(costingData.saleQty as string) || 0,
          saleUnit: parseFloat(costingData.saleUnit as string) || 0,
          saleCurrencyId: costingData.saleCurrencyId,
          saleExRate: parseFloat(costingData.saleExRate as string) || 1,
          saleFCY: parseFloat(costingData.saleFCY as string) || 0,
          saleLCY,
          saleTaxPercentage: parseFloat(costingData.saleTaxPercentage as string) || 0,
          saleTaxAmount: parseFloat(costingData.saleTaxAmount as string) || 0,
          costQty: parseFloat(costingData.costQty as string) || 0,
          costUnit: parseFloat(costingData.costUnit as string) || 0,
          costCurrencyId: costingData.costCurrencyId,
          costExRate: parseFloat(costingData.costExRate as string) || 1,
          costFCY: parseFloat(costingData.costFCY as string) || 0,
          costLCY,
          costTaxPercentage: parseFloat(costingData.costTaxPercentage as string) || 0,
          costTaxAmount: parseFloat(costingData.costTaxAmount as string) || 0,
          unitId: costingData.unitId,
          gp: saleLCY - costLCY,
          billToCustomerId: costingData.billToCustomerId,
          vendorCustomerId: purchaseVendorCustomerId || costingData.vendorCustomerId,
          costReferenceNo: costingData.costReferenceNo || undefined,
          costDate: costingData.costDate || undefined,
          ppcc: costingData.ppcc || undefined,
        };
        await updateCostingMutation.mutateAsync({ shipmentId, costingId: editingCostingForModal.id, data });
        setPendingAutoSelect(editingCostingForModal.id);
      } else {
        // Add new costing
        const data: AddShipmentCostingRequest = {
          shipmentId,
          description: costingData.description || "",
          remarks: costingData.remarks,
          saleQty: parseFloat(costingData.saleQty as string) || 0,
          saleUnit: parseFloat(costingData.saleUnit as string) || 0,
          saleCurrencyId: costingData.saleCurrencyId,
          saleExRate: parseFloat(costingData.saleExRate as string) || 1,
          saleFCY: parseFloat(costingData.saleFCY as string) || 0,
          saleLCY,
          saleTaxPercentage: parseFloat(costingData.saleTaxPercentage as string) || 0,
          saleTaxAmount: parseFloat(costingData.saleTaxAmount as string) || 0,
          costQty: parseFloat(costingData.costQty as string) || 0,
          costUnit: parseFloat(costingData.costUnit as string) || 0,
          costCurrencyId: costingData.costCurrencyId,
          costExRate: parseFloat(costingData.costExRate as string) || 1,
          costFCY: parseFloat(costingData.costFCY as string) || 0,
          costLCY,
          costTaxPercentage: parseFloat(costingData.costTaxPercentage as string) || 0,
          costTaxAmount: parseFloat(costingData.costTaxAmount as string) || 0,
          unitId: costingData.unitId,
          gp: saleLCY - costLCY,
          billToCustomerId: costingData.billToCustomerId,
          vendorCustomerId: purchaseVendorCustomerId || costingData.vendorCustomerId,
          costReferenceNo: costingData.costReferenceNo || undefined,
          costDate: costingData.costDate || undefined,
          ppcc: costingData.ppcc || undefined,
        };
        const newCostingId = await addCostingMutation.mutateAsync({ shipmentId, data });
        if (newCostingId) {
          setPendingAutoSelect(newCostingId);
        }
      }
      await refetchCostings();
      setCostingModalOpen(false);
      setEditingCostingForModal(undefined);
    } catch {
      // Error handled by mutation
    }
  };

  // Auto-select newly created/updated costing
  useEffect(() => {
    if (pendingAutoSelect !== null) {
      const exists = localCostings.find(c => c.id === pendingAutoSelect);
      if (exists) {
        setFormData(prev => ({
          ...prev,
          selectedCharges: prev.selectedCharges.includes(pendingAutoSelect)
            ? prev.selectedCharges
            : [...prev.selectedCharges, pendingAutoSelect],
        }));
        setPendingAutoSelect(null);
      }
    }
  }, [localCostings, pendingAutoSelect]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCompanySelect = (partyId: string) => {
    if (isEditMode) return; // Don't allow changing vendor in edit mode
    const selectedParty = creditorParties.find(p => p.id.toString() === partyId);
    if (selectedParty) {
      setFormData(prev => ({
        ...prev,
        customerId: partyId,
        companyName: selectedParty.customerName,
        selectedCharges: [],
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

  const isSaving = createPurchaseInvoiceMutation.isPending || updatePurchaseInvoiceMutation.isPending;

  const handleSave = async () => {
    if (!shipmentId) {
      return;
    }

    const selectedParty = creditorParties.find(p => p.id.toString() === formData.customerId);
    if (!selectedParty?.customerId) {
      return;
    }

    if (isEditMode && editPurchaseInvoiceId) {
      // Update existing purchase invoice
      const items: UpdatePurchaseInvoiceItemRequest[] = localCostings
        .filter(c => formData.selectedCharges.includes(c.id))
        .filter((charge, index, self) =>
          index === self.findIndex(c => c.id === charge.id)
        )
        .map(charge => ({
          id: existingItemIds.get(charge.id) || undefined,
          shipmentCostingId: charge.id,
          chargeDetails: charge.description || '',
          ppcc: charge.ppcc || 'PP',
          currencyId: charge.costCurrencyId || 1,
          noOfUnit: parseFloat(charge.costQty) || 1,
          costPerUnit: parseFloat(charge.costUnit) || 0,
          fcyAmount: parseFloat(charge.costFCY) || 0,
          exRate: parseFloat(charge.costExRate) || 1,
          localAmount: parseFloat(charge.costLCY) || 0,
          taxPercentage: parseFloat(charge.costTaxPercentage) || 0,
          taxAmount: parseFloat(charge.costTaxAmount) || 0,
        }));

      try {
        await updatePurchaseInvoiceMutation.mutateAsync({
          id: editPurchaseInvoiceId,
          data: {
            purchaseDate: formData.invoiceDate,
            vendorId: selectedParty.customerId,
            vendorInvoiceNo: formData.invoiceNo || undefined,
            vendorInvoiceDate: formData.vDate && formData.vDate.trim() !== '' ? formData.vDate : undefined,
            shipmentId,
            currencyId: formData.currencyId,
            remarks: formData.remarks || undefined,
            items,
          },
        });

        await onSave({
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
    } else {
      // Create new purchase invoice
      const items: CreatePurchaseInvoiceItemRequest[] = localCostings
        .filter(c => formData.selectedCharges.includes(c.id))
        .filter((charge, index, self) =>
          index === self.findIndex(c => c.id === charge.id)
        )
        .map(charge => ({
          shipmentCostingId: charge.id,
          chargeDetails: charge.description || '',
          noOfUnit: parseFloat(charge.costQty) || 1,
          ppcc: charge.ppcc || 'PP',
          costPerUnit: parseFloat(charge.costUnit) || 0,
          currencyId: charge.costCurrencyId || 1,
          fcyAmount: parseFloat(charge.costFCY) || 0,
          exRate: parseFloat(charge.costExRate) || 1,
          localAmount: parseFloat(charge.costLCY) || 0,
          taxPercentage: parseFloat(charge.costTaxPercentage) || 0,
          taxAmount: parseFloat(charge.costTaxAmount) || 0,
        }));

      try {
        await createPurchaseInvoiceMutation.mutateAsync({
          shipmentId,
          vendorId: selectedParty.customerId,
          purchaseDate: formData.invoiceDate,
          vendorInvoiceNo: formData.invoiceNo || undefined,
          vendorInvoiceDate: formData.vDate && formData.vDate.trim() !== '' ? formData.vDate : undefined,
          jobNo: jobNumber || undefined,
          currencyId: formData.currencyId,
          remarks: formData.remarks || undefined,
          items,
        });

        await onSave({
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
    }
  };

  const selectedChargesData = localCostings.filter(c => formData.selectedCharges.includes(c.id));

  // Convert totals to vendor currency
  const convertToVendorCurrency = (amount: number, chargeCurrencyId: number, chargeRoe: number) => {
    if (chargeCurrencyId === formData.currencyId) return amount;
    const vendorCurrency = currencies.find(c => c.id === formData.currencyId);
    const vendorRoe = vendorCurrency?.roe || 1;
    const exRate = chargeRoe / vendorRoe;
    return amount * exRate;
  };

  const totalCost = selectedChargesData.reduce((sum, c) => {
    const costFCY = parseFloat(c.costFCY || 0);
    return sum + convertToVendorCurrency(costFCY, c.costCurrencyId || 1, parseFloat(c.costExRate || 1));
  }, 0);
  const totalTax = selectedChargesData.reduce((sum, c) => {
    return sum + parseFloat(c.costTaxAmount || 0);
  }, 0);
  const totalWithTax = totalCost + totalTax;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-card border border-border p-0">
        <DialogHeader className="bg-modal-header text-white p-4 rounded-t-lg">
          <DialogTitle className="text-white text-lg font-semibold">
            {isEditMode ? "Edit Purchase Invoice" : "New Purchase Invoice"}
          </DialogTitle>
        </DialogHeader>

        {isLoadingEdit ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
        <div className="space-y-4 p-6 pt-4">
          {/* Purchase Section Header */}
          <h3 className="text-primary font-semibold">Purchase</h3>

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
              {isEditMode ? (
                <Input
                  value={formData.companyName}
                  className="bg-muted h-9"
                  readOnly
                />
              ) : (
                <SearchableSelect
                  options={creditorParties.map(party => ({ value: party.id.toString(), label: party.customerName }))}
                  value={formData.customerId}
                  onValueChange={handleCompanySelect}
                  placeholder="Select creditor"
                  searchPlaceholder="Search creditors..."
                  triggerClassName="bg-background border-border h-9"
                  emptyMessage="No creditors in parties"
                />
              )}
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
              <Label className="text-xs font-medium">* Vendor Invoice Date</Label>
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
            </div>
          </div>

          {/* Charges Details */}
          <div className="space-y-3">
            <h3 className="text-primary font-semibold text-sm">Charges Details</h3>
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

          {/* Sale-Only Charges (edit mode) */}
          {isEditMode && saleOnlyCharges.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-orange-600 font-semibold text-sm">Sale-Only Charges (No Cost)</h3>
              <Table>
                <TableHeader>
                  <TableRow className="bg-table-header">
                    <TableHead className="text-table-header-foreground text-xs">Sl.No</TableHead>
                    <TableHead className="text-table-header-foreground text-xs">Description</TableHead>
                    <TableHead className="text-table-header-foreground text-xs">Sale Qty</TableHead>
                    <TableHead className="text-table-header-foreground text-xs">Sale/Unit</TableHead>
                    <TableHead className="text-table-header-foreground text-xs">Sale FCY</TableHead>
                    <TableHead className="text-table-header-foreground text-xs">Bill To</TableHead>
                    <TableHead className="text-table-header-foreground text-xs">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {saleOnlyCharges.map((charge, index) => (
                    <TableRow key={charge.id} className={index % 2 === 0 ? "bg-card" : "bg-secondary/30"}>
                      <TableCell className="text-xs py-2">{(index + 1) * 10}</TableCell>
                      <TableCell className="text-xs py-2">{charge.description}</TableCell>
                      <TableCell className="text-xs py-2">{charge.saleQty}</TableCell>
                      <TableCell className="text-xs py-2">{charge.saleUnit}</TableCell>
                      <TableCell className="text-xs py-2">{charge.saleFCY}</TableCell>
                      <TableCell className="text-xs py-2">{charge.billToName || "-"}</TableCell>
                      <TableCell className="text-xs py-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => {
                            setEditingCostingForModal(charge as CostingModalData);
                            setCostingModalOpen(true);
                          }}
                        >
                          Add Cost
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Add New Charge button (edit mode) */}
          {isEditMode && formData.customerId && (
            <div>
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs"
                onClick={() => {
                  setEditingCostingForModal(undefined);
                  setCostingModalOpen(true);
                }}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add New Charge
              </Button>
            </div>
          )}

          {/* Totals */}
          <div className="flex justify-end">
            <div className="grid grid-cols-3 gap-4 bg-secondary/30 p-3 rounded-lg">
              <div>
                <Label className="text-xs font-semibold">Sub Total</Label>
                <div className="text-foreground font-semibold text-sm">{formData.currencyCode} {totalCost.toFixed(2)}</div>
              </div>
              <div>
                <Label className="text-xs font-semibold">VAT</Label>
                <div className="text-foreground font-semibold text-sm">{formData.currencyCode} {totalTax.toFixed(2)}</div>
              </div>
              <div>
                <Label className="text-xs font-semibold">Total Cost</Label>
                <div className="text-destructive font-semibold text-sm">{formData.currencyCode} {totalWithTax.toFixed(2)}</div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              className="btn-success"
              onClick={handleSave}
              disabled={!shipmentId || !formData.customerId || formData.selectedCharges.length === 0 || isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                isEditMode ? 'Update' : 'Save'
              )}
            </Button>
          </div>
        </div>
        )}
      </DialogContent>

      {isEditMode && (
        <CostingModal
          open={costingModalOpen}
          onOpenChange={(open) => {
            setCostingModalOpen(open);
            if (!open) setEditingCostingForModal(undefined);
          }}
          parties={parties}
          costing={editingCostingForModal}
          onSave={handleCostingModalSave}
          defaultVendorCustomerId={
            !editingCostingForModal
              ? creditorParties.find(p => p.id.toString() === formData.customerId)?.customerId
              : undefined
          }
          defaultActiveTab={editingCostingForModal ? "cost" : undefined}
        />
      )}
    </Dialog>
  );
}
