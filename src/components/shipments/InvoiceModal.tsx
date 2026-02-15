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
import { ShipmentParty, ShipmentCosting, CreateInvoiceItemRequest, UpdateInvoiceItemRequest, invoiceApi, customerApi, settingsApi, CurrencyType, AccountInvoiceDetail, shipmentApi, AddShipmentCostingRequest, UpdateShipmentCostingRequest } from "@/services/api";
import { useBaseCurrency } from "@/hooks/useBaseCurrency";
import { useCreateInvoice, useUpdateInvoice } from "@/hooks/useInvoices";
import { useAddShipmentCosting, useUpdateShipmentCosting } from "@/hooks/useShipments";
import { useToast } from "@/hooks/use-toast";
import { CostingModal, type CostingModalData } from "@/components/shipments/CostingModal";
import { useQueryClient } from "@tanstack/react-query";

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
  onSave: (invoice: InvoiceSaveResult) => void | Promise<void>;
  editInvoiceId?: number | null;
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

export function InvoiceModal({ open, onOpenChange, shipmentId, chargesDetails, parties, onSave, editInvoiceId }: InvoiceModalProps) {
  const baseCurrencyCode = useBaseCurrency();
  const createInvoiceMutation = useCreateInvoice();
  const updateInvoiceMutation = useUpdateInvoice();
  const addCostingMutation = useAddShipmentCosting();
  const updateCostingMutation = useUpdateShipmentCosting();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const isEditMode = !!editInvoiceId;

  // Filter parties to only show Debtors and deduplicate by customerId
  const debtorParties = useMemo(() =>
    deduplicateByCustomerId(parties.filter(p => p.masterType === 'Debtors')),
    [parties]
  );

  const [currencies, setCurrencies] = useState<CurrencyType[]>([]);
  const [editInvoiceData, setEditInvoiceData] = useState<AccountInvoiceDetail | null>(null);
  const [isLoadingEdit, setIsLoadingEdit] = useState(false);
  // Map of costing id -> existing invoice item id (for updates)
  const [existingItemIds, setExistingItemIds] = useState<Map<number, number>>(new Map());

  // Costing integration state (edit mode)
  const [localCostings, setLocalCostings] = useState<ShipmentCosting[]>([]);
  const [costingModalOpen, setCostingModalOpen] = useState(false);
  const [editingCostingForModal, setEditingCostingForModal] = useState<CostingModalData | undefined>(undefined);
  const [pendingAutoSelect, setPendingAutoSelect] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    invoiceId: "",
    companyName: "",
    customerId: "",
    invoiceDate: getTodayDateOnly(),
    currencyId: 1,
    currencyCode: baseCurrencyCode,
    remarks: "",
    selectedCharges: [] as number[],
  });

  // Reset form and fetch data when modal opens
  useEffect(() => {
    if (open) {
      // Reset form data first
      setFormData({
        invoiceId: "",
        companyName: "",
        customerId: "",
        invoiceDate: getTodayDateOnly(),
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

      if (isEditMode && editInvoiceId) {
        // Edit mode: fetch existing invoice data
        setIsLoadingEdit(true);
        invoiceApi.getById(editInvoiceId).then(response => {
          if (response.data) {
            const inv = response.data;
            setEditInvoiceData(inv);

            // Build map of costingId -> invoiceItemId
            const itemIdMap = new Map<number, number>();
            inv.items.forEach(item => {
              if (item.shipmentCostingId) {
                itemIdMap.set(item.shipmentCostingId, item.id);
              }
            });
            setExistingItemIds(itemIdMap);

            // Find the party matching the invoice customer
            const matchingParty = debtorParties.find(p => p.customerId === inv.customerId);
            const costingIds = inv.items
              .filter(item => item.shipmentCostingId)
              .map(item => item.shipmentCostingId!);

            settingsApi.getAllCurrencyTypes().then(currResponse => {
              if (currResponse.data) {
                setCurrencies(currResponse.data);
                const currency = currResponse.data.find(c => c.id === inv.currencyId);
                setFormData({
                  invoiceId: inv.invoiceNo,
                  companyName: inv.customerName,
                  customerId: matchingParty ? matchingParty.id.toString() : "",
                  invoiceDate: inv.invoiceDate,
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
        // Create mode: fetch next invoice number
        invoiceApi.getNextInvoiceNumber().then(response => {
          if (response.data) {
            setFormData(prev => ({ ...prev, invoiceId: response.data as string }));
          }
        });
      }
    }
  }, [open, editInvoiceId]);

  // Filter charges: show uninvoiced charges + charges from this invoice
  const filteredCharges = useMemo(() => {
    const selectedParty = debtorParties.find(p => p.id.toString() === formData.customerId);
    const selectedCustomerId = selectedParty?.customerId;

    // Get costing IDs that belong to this invoice (for edit mode)
    const invoiceCostingIds = new Set(
      editInvoiceData?.items
        .filter(item => item.shipmentCostingId)
        .map(item => item.shipmentCostingId!) || []
    );

    return localCostings.filter(c => {
      // Only show costings assigned to this debtor
      const matchesCustomer = selectedCustomerId
        ? c.billToCustomerId === selectedCustomerId
        : false;
      if (!matchesCustomer) return false;

      // In edit mode: show uninvoiced charges OR charges from this invoice
      const isFromThisInvoice = invoiceCostingIds.has(c.id);
      const hasValidSale = parseFloat(c.saleQty || 0) > 0 && !c.saleInvoiced;

      return hasValidSale || isFromThisInvoice;
    });
  }, [localCostings, formData.customerId, debtorParties, editInvoiceData]);

  // Update currency when company selection changes (only in create mode)
  useEffect(() => {
    if (formData.customerId && !isEditMode) {
      const selectedParty = debtorParties.find(p => p.id.toString() === formData.customerId);
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
  }, [formData.customerId, debtorParties, currencies, isEditMode]);

  // Cost-only charges: costings that have cost data but no sale data (edit mode only)
  const costOnlyCharges = useMemo(() => {
    if (!isEditMode) return [];
    const selectedParty = debtorParties.find(p => p.id.toString() === formData.customerId);
    const selectedCustomerId = selectedParty?.customerId;
    if (!selectedCustomerId) return [];
    return localCostings.filter(c => {
      const hasCost = parseFloat(c.costQty || 0) > 0;
      const hasSale = parseFloat(c.saleQty || 0) > 0;
      const matchesOrUnassigned = !c.billToCustomerId || c.billToCustomerId === selectedCustomerId;
      return hasCost && !hasSale && matchesOrUnassigned && !c.saleInvoiced;
    });
  }, [localCostings, formData.customerId, debtorParties, isEditMode]);

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

    // Force billToCustomerId to match the invoice customer
    const selectedParty = debtorParties.find(p => p.id.toString() === formData.customerId);
    const invoiceCustomerId = selectedParty?.customerId;

    const saleLCY = parseFloat(costingData.saleLCY as string) || 0;
    const costLCY = parseFloat(costingData.costLCY as string) || 0;

    try {
      if (editingCostingForModal?.id && typeof editingCostingForModal.id === 'number' && editingCostingForModal.id < 1e12) {
        // Update existing costing (adding sale side)
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
          billToCustomerId: invoiceCustomerId || costingData.billToCustomerId,
          vendorCustomerId: costingData.vendorCustomerId,
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
          billToCustomerId: invoiceCustomerId || costingData.billToCustomerId,
          vendorCustomerId: costingData.vendorCustomerId,
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
    if (isEditMode) return; // Don't allow changing customer in edit mode
    const selectedParty = debtorParties.find(p => p.id.toString() === partyId);
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

  const isSaving = createInvoiceMutation.isPending || updateInvoiceMutation.isPending;

  const handleSave = async () => {
    if (!shipmentId) {
      return;
    }

    const selectedParty = debtorParties.find(p => p.id.toString() === formData.customerId);
    if (!selectedParty?.customerId) {
      return;
    }

    // Determine baseCurrencyId from the first selected charge's sale currency
    const selectedCharges = localCostings
      .filter(c => formData.selectedCharges.includes(c.id))
      .filter((charge, index, self) =>
        index === self.findIndex(c => c.id === charge.id)
      );
    const baseCurrencyId = selectedCharges.length > 0 ? (selectedCharges[0].saleCurrencyId || 1) : 1;

    if (isEditMode && editInvoiceId) {
      // Update existing invoice
      const items: UpdateInvoiceItemRequest[] = selectedCharges.map(charge => {
        const saleFCY = parseFloat(charge.saleFCY || 0);
        const exRate = getInvoiceExRate(charge.saleCurrencyId || 1);
        const localAmount = saleFCY * exRate;
        const taxAmount = (parseFloat(charge.saleTaxAmount) || 0) * exRate;

        return {
          id: existingItemIds.get(charge.id) || undefined,
          shipmentCostingId: charge.id,
          chargeDetails: charge.description || '',
          ppcc: charge.ppcc || 'PP',
          currencyId: charge.saleCurrencyId || 1,
          quantity: parseFloat(charge.saleQty) || 1,
          salePerUnit: parseFloat(charge.saleUnit) || 0,
          fcyAmount: saleFCY,
          exRate: exRate,
          localAmount: localAmount,
          taxPercentage: parseFloat(charge.saleTaxPercentage) || 0,
          taxAmount: taxAmount,
        };
      });

      try {
        await updateInvoiceMutation.mutateAsync({
          id: editInvoiceId,
          data: {
            invoiceDate: formData.invoiceDate,
            customerId: selectedParty.customerId,
            shipmentId,
            currencyId: formData.currencyId,
            baseCurrencyId,
            remarks: formData.remarks || undefined,
            items,
          },
        });

        await onSave({
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
    } else {
      // Create new invoice
      const items: CreateInvoiceItemRequest[] = selectedCharges.map(charge => {
        const saleFCY = parseFloat(charge.saleFCY || 0);
        const exRate = getInvoiceExRate(charge.saleCurrencyId || 1);
        const localAmount = saleFCY * exRate;
        const taxAmount = (parseFloat(charge.saleTaxAmount) || 0) * exRate;

        return {
          shipmentCostingId: charge.id,
          chargeDetails: charge.description || '',
          quantity: parseFloat(charge.saleQty) || 1,
          ppcc: charge.ppcc || 'PP',
          salePerUnit: parseFloat(charge.saleUnit) || 0,
          currencyId: charge.saleCurrencyId || 1,
          fcyAmount: saleFCY,
          exRate: exRate,
          localAmount: localAmount,
          taxPercentage: parseFloat(charge.saleTaxPercentage) || 0,
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
          remarks: formData.remarks || undefined,
          items,
        });

        await onSave({
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
    }
  };

  const selectedChargesData = localCostings.filter(c => formData.selectedCharges.includes(c.id));

  // Get cross rate to convert from charge currency to invoice base currency
  // ROE = how many base units per 1 unit of this currency (e.g. AED=1, PKR=0.013)
  // To convert chargeAmount → invoiceCurrency: chargeROE / invoiceROE
  const getInvoiceExRate = (chargeCurrencyId: number): number => {
    if (chargeCurrencyId === formData.currencyId) return 1;
    const chargeCurrency = currencies.find(c => c.id === chargeCurrencyId);
    const invoiceCurrency = currencies.find(c => c.id === formData.currencyId);
    if (!chargeCurrency || !invoiceCurrency) return 1;
    const invoiceRoe = invoiceCurrency.roe || 1;
    if (invoiceRoe === 0) return 1;
    return (chargeCurrency.roe || 1) / invoiceRoe;
  };

  const totalSale = selectedChargesData.reduce((sum, c) => {
    const fcy = parseFloat(c.saleFCY || 0);
    const exRate = getInvoiceExRate(c.saleCurrencyId || 1);
    return sum + fcy * exRate;
  }, 0);
  const totalTax = selectedChargesData.reduce((sum, c) => {
    const tax = parseFloat(c.saleTaxAmount || 0);
    const exRate = getInvoiceExRate(c.saleCurrencyId || 1);
    return sum + tax * exRate;
  }, 0);
  const totalWithTax = totalSale + totalTax;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-card border border-border p-0">
        <DialogHeader className="bg-modal-header text-white p-4 rounded-t-lg">
          <DialogTitle className="text-white text-lg font-semibold">
            {isEditMode ? "Edit Invoice" : "New Invoice"}
          </DialogTitle>
        </DialogHeader>

        {isLoadingEdit ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
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
              {isEditMode ? (
                <Input
                  value={formData.companyName}
                  className="bg-muted h-9"
                  readOnly
                />
              ) : (
                <SearchableSelect
                  options={debtorParties.map(party => ({ value: party.id.toString(), label: party.customerName }))}
                  value={formData.customerId}
                  onValueChange={handleCompanySelect}
                  placeholder="Select debtor"
                  searchPlaceholder="Search debtors..."
                  triggerClassName="bg-background border-border h-9"
                  emptyMessage="No debtors in parties"
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
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Label className="text-xs font-medium">* Base Currency</Label>
                <Input
                  value={formData.currencyCode}
                  className="bg-muted h-9"
                  readOnly
                />
              </div>
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
                      <TableCell className="text-xs py-2">{getInvoiceExRate(charge.saleCurrencyId || 1).toFixed(3)}</TableCell>
                      <TableCell className="text-xs py-2">{(parseFloat(charge.saleFCY || 0) * getInvoiceExRate(charge.saleCurrencyId || 1)).toFixed(2)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Cost-Only Charges (edit mode) */}
          {isEditMode && costOnlyCharges.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-orange-600 font-semibold text-sm">Cost-Only Charges (No Sale)</h3>
              <Table>
                <TableHeader>
                  <TableRow className="bg-table-header">
                    <TableHead className="text-table-header-foreground text-xs">Sl.No</TableHead>
                    <TableHead className="text-table-header-foreground text-xs">Description</TableHead>
                    <TableHead className="text-table-header-foreground text-xs">Cost Qty</TableHead>
                    <TableHead className="text-table-header-foreground text-xs">Cost/Unit</TableHead>
                    <TableHead className="text-table-header-foreground text-xs">Cost FCY</TableHead>
                    <TableHead className="text-table-header-foreground text-xs">Vendor</TableHead>
                    <TableHead className="text-table-header-foreground text-xs">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {costOnlyCharges.map((charge, index) => (
                    <TableRow key={charge.id} className={index % 2 === 0 ? "bg-card" : "bg-secondary/30"}>
                      <TableCell className="text-xs py-2">{(index + 1) * 10}</TableCell>
                      <TableCell className="text-xs py-2">{charge.description}</TableCell>
                      <TableCell className="text-xs py-2">{charge.costQty}</TableCell>
                      <TableCell className="text-xs py-2">{charge.costUnit}</TableCell>
                      <TableCell className="text-xs py-2">{charge.costFCY}</TableCell>
                      <TableCell className="text-xs py-2">{charge.vendorName || "-"}</TableCell>
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
                          Add Sale
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
                <Label className="text-xs font-semibold">Total Sale</Label>
                <div className="text-foreground font-semibold text-sm">{formData.currencyCode} {totalSale.toFixed(2)}</div>
              </div>
              <div>
                <Label className="text-xs font-semibold">VAT</Label>
                <div className="text-foreground font-semibold text-sm">{formData.currencyCode} {totalTax.toFixed(2)}</div>
              </div>
              <div>
                <Label className="text-xs font-semibold">Sub Total</Label>
                <div className="text-primary font-semibold text-sm">{formData.currencyCode} {totalWithTax.toFixed(2)}</div>
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
          defaultBillToCustomerId={
            !editingCostingForModal
              ? debtorParties.find(p => p.id.toString() === formData.customerId)?.customerId
              : undefined
          }
          defaultActiveTab={editingCostingForModal ? "sale" : undefined}
        />
      )}
    </Dialog>
  );
}
