import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Loader2, ArrowLeft, Trash2 } from "lucide-react";
import {
  useQuotation,
  useCreateQuotation,
  useUpdateQuotation,
  useRateRequestForConversion,
} from "@/hooks/useSales";
import { useAllDebtors, useCustomer } from "@/hooks/useCustomers";
import {
  useAllIncoTerms,
  useAllPorts,
  useAllPackageTypes,
  useAllCurrencyTypes,
  useAllChargeItems,
  useAllContainerTypes,
  useAllCostingUnits,
} from "@/hooks/useSettings";
import { CreateQuotationRequest } from "@/services/api";

interface CargoRow {
  id: number;
  calculationMode: string;
  quantity: number;
  packageTypeId?: number;
  loadType?: string;
  length?: number;
  width?: number;
  height?: number;
  volumeUnit?: string;
  cbm?: number;
  weight?: number;
  weightUnit?: string;
  totalCbm?: number;
  totalWeight?: number;
  cargoDescription?: string;
}

interface ChargeRow {
  id: number;
  chargeType: string;
  chargeItemId?: number;
  costingUnitId?: number;
  currency: string;
  currencyId?: number;
  rate: string;
  roe: string;
  quantity: string;
  amount: string;
  costCurrency: string;
  costCurrencyId?: number;
  costRate: string;
  costRoe: string;
  costQuantity: string;
  costAmount: string;
}

interface FormData {
  customerId?: number;
  customerName: string;
  contactPersonId?: number;
  customerRefCode?: string;
  quotationBookingNo?: string;
  mode?: string;
  quotationDate: string;
  quoteExpiryDate?: string;
  incoTermId?: number;
  status?: string;
  loadingPortId?: number;
  destinationPortId?: number;
  pickupAddress?: string;
  deliveryAddress?: string;
  remarks?: string;
  cfs?: string;
  documentRequired?: string;
  notes?: string;
  notesForBooking?: string;
  cargoCalculationMode: string;
}

export default function QuotationForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();

  // Determine mode from URL path
  const isViewMode = location.pathname.endsWith("/view-details");
  const quotationId = id ? parseInt(id) : null;
  const isEditing = !!quotationId && !isViewMode;
  const isReadOnly = isViewMode;

  // Get rateRequestId from location state (when converting from Rate Request)
  const rateRequestIdFromState = (location.state as { rateRequestId?: number })?.rateRequestId;
  const [conversionRateRequestId] = useState<number | null>(rateRequestIdFromState || null);

  // Form state
  const [formData, setFormData] = useState<FormData>({
    customerName: "",
    quotationDate: new Date().toISOString().split("T")[0],
    cargoCalculationMode: "units",
    status: "Pending",
  });

  const [cargoRows, setCargoRows] = useState<CargoRow[]>([
    { id: 1, calculationMode: "units", quantity: 1, volumeUnit: "cm", weightUnit: "kg" },
  ]);

  const [chargeRows, setChargeRows] = useState<ChargeRow[]>([
    { id: 1, chargeType: "", currency: "", rate: "", roe: "", quantity: "", amount: "", costCurrency: "", costRate: "", costRoe: "", costQuantity: "", costAmount: "" },
  ]);

  // Queries
  const { data: conversionData } = useRateRequestForConversion(conversionRateRequestId || 0);
  const { data: quotationDetail, isLoading: isQuotationLoading } = useQuotation(quotationId || 0);

  // Dropdown data queries
  const { data: debtorsData } = useAllDebtors();
  const { data: selectedCustomer } = useCustomer(formData.customerId || 0);
  const { data: incoTermsData } = useAllIncoTerms();
  const { data: portsData } = useAllPorts();
  const { data: packageTypesData } = useAllPackageTypes();
  const { data: currencyTypesData } = useAllCurrencyTypes();
  const { data: chargeItemsData } = useAllChargeItems();
  const { data: containerTypesData } = useAllContainerTypes();
  const { data: costingUnitsData } = useAllCostingUnits();

  const debtors = useMemo(() => Array.isArray(debtorsData) ? debtorsData : [], [debtorsData]);
  const incoTerms = useMemo(() => Array.isArray(incoTermsData) ? incoTermsData : [], [incoTermsData]);
  const ports = useMemo(() => Array.isArray(portsData) ? portsData : [], [portsData]);
  const packageTypes = useMemo(() => Array.isArray(packageTypesData) ? packageTypesData : [], [packageTypesData]);
  const currencyTypes = useMemo(() => Array.isArray(currencyTypesData) ? currencyTypesData : [], [currencyTypesData]);
  const chargeItems = useMemo(() => Array.isArray(chargeItemsData) ? chargeItemsData : [], [chargeItemsData]);
  const containerTypes = useMemo(() => Array.isArray(containerTypesData) ? containerTypesData : [], [containerTypesData]);
  const costingUnits = useMemo(() => Array.isArray(costingUnitsData) ? costingUnitsData : [], [costingUnitsData]);

  // Mutations
  const createMutation = useCreateQuotation();
  const updateMutation = useUpdateQuotation();

  // Handle conversion pre-fill from Rate Request
  useEffect(() => {
    if (conversionRateRequestId && conversionData && packageTypesData) {
      let mode = "";
      const freightMode = conversionData.freightMode?.toLowerCase() || "";
      const shippingType = conversionData.shippingType || "";

      if (freightMode.includes("sea")) {
        mode = shippingType === "FTL" ? "SeaFreightFCL" : "SeaFreightLCL";
      } else if (freightMode.includes("air")) {
        mode = "AirFreight";
      } else if (freightMode.includes("land")) {
        mode = "LandFreight";
      }

      const cargoCalculationMode = shippingType === "FTL" ? "shipment" : "units";

      setFormData({
        customerId: conversionData.customerId,
        customerName: conversionData.customerName || conversionData.fullName || "",
        quotationDate: new Date().toISOString().split("T")[0],
        loadingPortId: conversionData.loadingPortId,
        destinationPortId: conversionData.destinationPortId,
        pickupAddress: conversionData.pickupAddress || "",
        deliveryAddress: conversionData.deliveryAddress || "",
        incoTermId: conversionData.incoTermId,
        cargoCalculationMode,
        mode,
        status: "Pending",
        customerRefCode: conversionData.customerReferenceNo || "",
      });

      if (conversionData.leadDetails && conversionData.leadDetails.length > 0) {
        if (cargoCalculationMode === "shipment") {
          const totalQuantity = conversionData.leadDetails.reduce((sum, d) => sum + (d.quantity || 0), 0);
          const totalWeight = conversionData.leadDetails.reduce((sum, d) => sum + ((d.weight || 0) * (d.quantity || 1)), 0);
          const totalVolume = conversionData.leadDetails.reduce((sum, d) => sum + ((d.volume || 0) * (d.quantity || 1)), 0);
          const firstDetail = conversionData.leadDetails[0];
          const loadType = firstDetail?.containerTypeName || firstDetail?.packageTypeName || "";

          setCargoRows([{
            id: Date.now(),
            calculationMode: "shipment",
            quantity: totalQuantity,
            loadType,
            totalCbm: totalVolume,
            totalWeight,
            weightUnit: "kg",
            volumeUnit: "cm",
            cargoDescription: conversionData.productDescription || "GENERAL CARGO",
          }]);
        } else {
          const cargoFromLead = conversionData.leadDetails.map((detail, index) => ({
            id: Date.now() + index,
            calculationMode: "units",
            quantity: detail.quantity || 1,
            packageTypeId: detail.packageTypeId,
            length: detail.length,
            width: detail.width,
            height: detail.height,
            weight: detail.weight,
            weightUnit: "kg",
            volumeUnit: "cm",
            cbm: detail.volume,
            cargoDescription: "",
          }));
          setCargoRows(cargoFromLead.length > 0 ? cargoFromLead : [
            { id: 1, calculationMode: "units", quantity: 1, volumeUnit: "cm", weightUnit: "kg" },
          ]);
        }
      } else {
        if (cargoCalculationMode === "shipment") {
          setCargoRows([{
            id: 1,
            calculationMode: "shipment",
            quantity: 1,
            weightUnit: "kg",
            volumeUnit: "cm",
            cargoDescription: conversionData.productDescription || "",
          }]);
        } else {
          setCargoRows([
            { id: 1, calculationMode: "units", quantity: 1, volumeUnit: "cm", weightUnit: "kg" },
          ]);
        }
      }

      // Clear the location state to prevent re-triggering
      window.history.replaceState({}, document.title);
    }
  }, [conversionRateRequestId, conversionData, packageTypesData]);

  // Handle edit/view mode pre-fill
  useEffect(() => {
    if (quotationId && quotationDetail) {
      setFormData({
        customerId: quotationDetail.customerId,
        customerName: quotationDetail.customerName || "",
        contactPersonId: quotationDetail.contactPersonId,
        customerRefCode: quotationDetail.customerRefCode || "",
        quotationBookingNo: quotationDetail.quotationBookingNo || "",
        mode: quotationDetail.mode,
        quotationDate: quotationDetail.quotationDate,
        quoteExpiryDate: quotationDetail.quoteExpiryDate || "",
        incoTermId: quotationDetail.incoTermId,
        status: quotationDetail.status || "Pending",
        loadingPortId: quotationDetail.loadingPortId,
        destinationPortId: quotationDetail.destinationPortId,
        pickupAddress: quotationDetail.pickupAddress || "",
        deliveryAddress: quotationDetail.deliveryAddress || "",
        remarks: quotationDetail.remarks || "",
        cfs: quotationDetail.cfs || "",
        documentRequired: quotationDetail.documentRequired || "",
        notes: quotationDetail.notes || "",
        notesForBooking: quotationDetail.notesForBooking || "",
        cargoCalculationMode: quotationDetail.cargoCalculationMode || "units",
      });

      if (quotationDetail.cargoDetails && quotationDetail.cargoDetails.length > 0) {
        setCargoRows(
          quotationDetail.cargoDetails.map((cd) => ({
            id: cd.id,
            calculationMode: cd.calculationMode,
            quantity: cd.quantity,
            packageTypeId: cd.packageTypeId,
            loadType: cd.loadType,
            length: cd.length,
            width: cd.width,
            height: cd.height,
            volumeUnit: cd.volumeUnit || "cm",
            cbm: cd.cbm,
            weight: cd.weight,
            weightUnit: cd.weightUnit || "kg",
            totalCbm: cd.totalCbm,
            totalWeight: cd.totalWeight,
            cargoDescription: cd.cargoDescription,
          }))
        );
      }

      if (quotationDetail.charges && quotationDetail.charges.length > 0) {
        setChargeRows(
          quotationDetail.charges.map((ch) => ({
            id: ch.id,
            chargeType: ch.chargeType || "",
            chargeItemId: ch.chargeItemId,
            costingUnitId: ch.costingUnitId,
            currency: ch.currencyCode || "",
            currencyId: ch.currencyId,
            rate: ch.rate?.toString() || "",
            roe: ch.roe?.toString() || "",
            quantity: ch.quantity?.toString() || "",
            amount: ch.amount?.toString() || "",
            costCurrency: ch.costCurrencyCode || "",
            costCurrencyId: ch.costCurrencyId,
            costRate: ch.costRate?.toString() || "",
            costRoe: ch.costRoe?.toString() || "",
            costQuantity: ch.costQuantity?.toString() || "",
            costAmount: ch.costAmount?.toString() || "",
          }))
        );
      }
    }
  }, [quotationId, quotationDetail]);

  // Cargo row helpers
  const addCargoRow = () => {
    setCargoRows([
      ...cargoRows,
      {
        id: Date.now(),
        calculationMode: formData.cargoCalculationMode,
        quantity: 1,
        volumeUnit: "cm",
        weightUnit: "kg",
      },
    ]);
  };

  const deleteCargoRow = (rowId: number) => {
    if (cargoRows.length > 1) {
      setCargoRows(cargoRows.filter((row) => row.id !== rowId));
    }
  };

  const updateCargoRow = (rowId: number, field: keyof CargoRow, value: CargoRow[keyof CargoRow]) => {
    setCargoRows(
      cargoRows.map((row) => (row.id === rowId ? { ...row, [field]: value } : row))
    );
  };

  // Charge row helpers
  const addChargeRow = () => {
    setChargeRows([
      ...chargeRows,
      { id: Date.now(), chargeType: "", currency: "", rate: "", roe: "", quantity: "", amount: "", costCurrency: "", costRate: "", costRoe: "", costQuantity: "", costAmount: "" },
    ]);
  };

  const deleteChargeRow = (rowId: number) => {
    if (chargeRows.length > 1) {
      setChargeRows(chargeRows.filter((row) => row.id !== rowId));
    }
  };

  const updateChargeRow = (rowId: number, field: keyof ChargeRow, value: string | number | undefined) => {
    setChargeRows(
      chargeRows.map((row) => {
        if (row.id === rowId) {
          const updated = { ...row, [field]: value };

          if (field === "currency" && currencyTypes) {
            const selectedCurrency = currencyTypes.find((ct) => ct.code === value);
            if (selectedCurrency) {
              updated.roe = selectedCurrency.roe.toString();
              updated.currencyId = selectedCurrency.id;
            }
          }

          if (field === "costCurrency" && currencyTypes) {
            const selectedCurrency = currencyTypes.find((ct) => ct.code === value);
            if (selectedCurrency) {
              updated.costRoe = selectedCurrency.roe.toString();
              updated.costCurrencyId = selectedCurrency.id;
            }
          }

          if (field === "rate" || field === "roe" || field === "quantity" || field === "currency") {
            const rate = parseFloat(updated.rate) || 0;
            const roe = parseFloat(updated.roe) || 1;
            const qty = parseFloat(updated.quantity) || 0;
            updated.amount = (rate * roe * qty).toFixed(2);
          }

          if (field === "costRate" || field === "costRoe" || field === "costQuantity" || field === "costCurrency") {
            const rate = parseFloat(updated.costRate) || 0;
            const roe = parseFloat(updated.costRoe) || 1;
            const qty = parseFloat(updated.costQuantity) || 0;
            updated.costAmount = (rate * roe * qty).toFixed(2);
          }
          return updated;
        }
        return row;
      })
    );
  };

  const handleSave = async () => {
    const request: CreateQuotationRequest = {
      quotationDate: formData.quotationDate,
      rateRequestId: conversionRateRequestId || undefined,
      customerId: formData.customerId,
      customerName: formData.customerName || "",
      contactPersonId: formData.contactPersonId,
      customerRefCode: formData.customerRefCode || undefined,
      loadingPortId: formData.loadingPortId,
      destinationPortId: formData.destinationPortId,
      pickupAddress: formData.pickupAddress || undefined,
      deliveryAddress: formData.deliveryAddress || undefined,
      incoTermId: formData.incoTermId,
      quoteExpiryDate: formData.quoteExpiryDate || undefined,
      cargoCalculationMode: formData.cargoCalculationMode,
      status: formData.status,
      remarks: formData.remarks || undefined,
      cfs: formData.cfs || undefined,
      documentRequired: formData.documentRequired || undefined,
      notes: formData.notes || undefined,
      notesForBooking: formData.notesForBooking || undefined,
      charges: chargeRows
        .filter((row) => row.chargeType || row.rate)
        .map((row) => ({
          chargeType: row.chargeType || undefined,
          chargeItemId: row.chargeItemId,
          costingUnitId: row.costingUnitId || undefined,
          currencyId: row.currencyId,
          rate: parseFloat(row.rate) || 0,
          roe: parseFloat(row.roe) || 1,
          quantity: parseFloat(row.quantity) || 0,
          amount: parseFloat(row.amount) || 0,
          costCurrencyId: row.costCurrencyId || undefined,
          costRate: parseFloat(row.costRate) || undefined,
          costRoe: parseFloat(row.costRoe) || undefined,
          costQuantity: parseFloat(row.costQuantity) || undefined,
          costAmount: parseFloat(row.costAmount) || undefined,
        })),
      cargoDetails: cargoRows.map((row) => ({
        calculationMode: row.calculationMode || "units",
        quantity: row.quantity || 1,
        packageTypeId: row.packageTypeId,
        loadType: row.loadType || undefined,
        length: row.length,
        width: row.width,
        height: row.height,
        volumeUnit: row.volumeUnit || undefined,
        cbm: row.cbm,
        weight: row.weight,
        weightUnit: row.weightUnit || undefined,
        totalCbm: row.totalCbm,
        totalWeight: row.totalWeight,
        cargoDescription: row.cargoDescription || undefined,
      })),
    };

    try {
      if (isEditing && quotationId) {
        await updateMutation.mutateAsync({ id: quotationId, data: request });
      } else {
        await createMutation.mutateAsync(request);
      }
      navigate("/sales/quotations");
    } catch {
      // Error handled by mutation
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  // Calculate totals for cargo
  const totalVolume = cargoRows.reduce((sum, row) => sum + (row.cbm || 0) * row.quantity, 0);
  const totalCbm = cargoRows.reduce((sum, row) => sum + (row.totalCbm || row.cbm || 0), 0);
  const totalWeight = cargoRows.reduce((sum, row) => sum + (row.totalWeight || (row.weight || 0) * row.quantity), 0);

  const getTitle = () => {
    if (isViewMode) return "View Quotation";
    if (isEditing) return "Edit Quotation";
    if (conversionRateRequestId) return "Convert Rate Request to Quotation";
    return "Add New Quotation";
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate("/sales/quotations")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-semibold text-foreground">{getTitle()}</h1>
        </div>

        {(isEditing || isViewMode) && isQuotationLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading quotation data...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Quotation Details */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg text-primary">Quotation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-6 gap-4">
                  <div className="space-y-2">
                    <Label>Quotation ID</Label>
                    <Input
                      value={quotationDetail?.quotationNo || "Auto-generated"}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Company Name</Label>
                    <SearchableSelect
                      disabled={isReadOnly}
                      options={debtors.map((customer) => ({
                        value: customer.id.toString(),
                        label: customer.name,
                      }))}
                      value={formData.customerId?.toString() || ""}
                      onValueChange={(value) => {
                        const customer = debtors.find((c) => c.id === parseInt(value));
                        setFormData({
                          ...formData,
                          customerId: parseInt(value),
                          customerName: customer?.name || "",
                          contactPersonId: undefined,
                        });
                      }}
                      placeholder="Select Company"
                      searchPlaceholder="Search..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Contact Person</Label>
                    <SearchableSelect
                      disabled={isReadOnly || !formData.customerId}
                      options={selectedCustomer?.contacts?.map((contact) => ({
                        value: contact.id.toString(),
                        label: contact.name,
                      })) || []}
                      value={formData.contactPersonId?.toString() || ""}
                      onValueChange={(value) =>
                        setFormData({ ...formData, contactPersonId: parseInt(value) })
                      }
                      placeholder="Select Contact"
                      searchPlaceholder="Search..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Customer Reference Code</Label>
                    <Input
                      value={formData.customerRefCode || ""}
                      onChange={(e) => setFormData({ ...formData, customerRefCode: e.target.value })}
                      disabled={isReadOnly}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Quotation Booking No</Label>
                    <Input
                      value={formData.quotationBookingNo || "Auto-generated"}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Mode</Label>
                    <SearchableSelect
                      disabled={isReadOnly}
                      options={[
                        { value: "AirFreight", label: "Air Freight" },
                        { value: "SeaFreightFCL", label: "FCL-Sea Freight" },
                        { value: "SeaFreightLCL", label: "LCL-Sea Freight" },
                        { value: "BreakBulk", label: "Break-Bulk" },
                        { value: "RoRo", label: "RO-RO" },
                      ]}
                      value={formData.mode || ""}
                      onValueChange={(value) => setFormData({ ...formData, mode: value })}
                      placeholder="Select Mode"
                      searchPlaceholder="Search..."
                    />
                  </div>
                </div>
                <div className="grid grid-cols-6 gap-4">
                  <div className="space-y-2">
                    <Label>Date Of Issue</Label>
                    <Input
                      type="date"
                      value={formData.quotationDate}
                      onChange={(e) => setFormData({ ...formData, quotationDate: e.target.value })}
                      disabled={isReadOnly}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Validity</Label>
                    <Input
                      type="date"
                      value={formData.quoteExpiryDate || ""}
                      onChange={(e) => setFormData({ ...formData, quoteExpiryDate: e.target.value })}
                      disabled={isReadOnly}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Incoterm</Label>
                    <SearchableSelect
                      disabled={isReadOnly}
                      options={incoTerms.map((incoTerm) => ({
                        value: incoTerm.id.toString(),
                        label: `${incoTerm.code} - ${incoTerm.name}`,
                      }))}
                      value={formData.incoTermId?.toString() || ""}
                      onValueChange={(value) =>
                        setFormData({ ...formData, incoTermId: parseInt(value) })
                      }
                      placeholder="Select Incoterm"
                      searchPlaceholder="Search..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <SearchableSelect
                      disabled={isReadOnly}
                      options={[
                        { value: "Pending", label: "Pending" },
                        { value: "Approved", label: "Approved" },
                        { value: "Rejected", label: "Rejected" },
                      ]}
                      value={formData.status || "Pending"}
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
                      placeholder="Pending"
                      searchPlaceholder="Search..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Origin/Loading Port</Label>
                    <SearchableSelect
                      disabled={isReadOnly}
                      options={ports.map((port) => ({
                        value: port.id.toString(),
                        label: `${port.seaPortName}${port.seaPortCode ? ` (${port.seaPortCode})` : ''} / ${port.airPortName}${port.airPortCode ? ` (${port.airPortCode})` : ''} - ${port.city}, ${port.country}`,
                      }))}
                      value={formData.loadingPortId?.toString() || ""}
                      onValueChange={(value) =>
                        setFormData({ ...formData, loadingPortId: parseInt(value) })
                      }
                      placeholder="Select Port"
                      searchPlaceholder="Search..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Destination/Discharge Port</Label>
                    <SearchableSelect
                      disabled={isReadOnly}
                      options={ports.map((port) => ({
                        value: port.id.toString(),
                        label: `${port.seaPortName}${port.seaPortCode ? ` (${port.seaPortCode})` : ''} / ${port.airPortName}${port.airPortCode ? ` (${port.airPortCode})` : ''} - ${port.city}, ${port.country}`,
                      }))}
                      value={formData.destinationPortId?.toString() || ""}
                      onValueChange={(value) =>
                        setFormData({ ...formData, destinationPortId: parseInt(value) })
                      }
                      placeholder="Select Port"
                      searchPlaceholder="Search..."
                    />
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Pick-Up Address</Label>
                    <Textarea
                      placeholder="Pick-Up Address"
                      value={formData.pickupAddress || ""}
                      onChange={(e) => setFormData({ ...formData, pickupAddress: e.target.value })}
                      disabled={isReadOnly}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Delivery Address</Label>
                    <Textarea
                      placeholder="Delivery Address"
                      value={formData.deliveryAddress || ""}
                      onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
                      disabled={isReadOnly}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Remarks</Label>
                    <Textarea
                      placeholder="Remarks"
                      value={formData.remarks || ""}
                      onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                      disabled={isReadOnly}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>CFS</Label>
                    <Textarea
                      placeholder="CFS"
                      value={formData.cfs || ""}
                      onChange={(e) => setFormData({ ...formData, cfs: e.target.value })}
                      disabled={isReadOnly}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Document Required</Label>
                    <Textarea
                      placeholder="Document Required"
                      value={formData.documentRequired || ""}
                      onChange={(e) => setFormData({ ...formData, documentRequired: e.target.value })}
                      disabled={isReadOnly}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Textarea
                      placeholder="Notes"
                      value={formData.notes || ""}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      disabled={isReadOnly}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Notes (For Booking)</Label>
                    <Textarea
                      placeholder="Notes for Booking"
                      value={formData.notesForBooking || ""}
                      onChange={(e) => setFormData({ ...formData, notesForBooking: e.target.value })}
                      disabled={isReadOnly}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cargo Details */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg text-primary">Cargo Details</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Cargo Calculation Mode Tabs */}
                <div className="flex gap-2 mb-4">
                  <Button
                    className={
                      formData.cargoCalculationMode === "units"
                        ? "btn-success"
                        : "bg-transparent text-primary hover:bg-primary/10"
                    }
                    variant={formData.cargoCalculationMode === "units" ? "default" : "ghost"}
                    onClick={() =>
                      !isReadOnly && setFormData({ ...formData, cargoCalculationMode: "units" })
                    }
                    disabled={isReadOnly}
                  >
                    Calculate by Units
                  </Button>
                  <Button
                    className={
                      formData.cargoCalculationMode === "shipment"
                        ? "btn-success"
                        : "bg-transparent text-primary hover:bg-primary/10"
                    }
                    variant={formData.cargoCalculationMode === "shipment" ? "default" : "ghost"}
                    onClick={() =>
                      !isReadOnly && setFormData({ ...formData, cargoCalculationMode: "shipment" })
                    }
                    disabled={isReadOnly}
                  >
                    Calculate by Total Shipment
                  </Button>
                </div>

                {/* Calculate by Units View */}
                {formData.cargoCalculationMode === "units" && (
                  <>
                    <div className="grid grid-cols-11 gap-2 mb-2 text-sm font-medium">
                      <div>Qty</div>
                      <div>Package Type</div>
                      <div>Length</div>
                      <div>Width</div>
                      <div>Height</div>
                      <div>Unit</div>
                      <div>CBM</div>
                      <div>Weight</div>
                      <div>Unit</div>
                      <div>Description</div>
                      <div></div>
                    </div>
                    {cargoRows.map((row, index) => (
                      <div key={row.id} className="grid grid-cols-11 gap-2 mb-2">
                        <Input
                          type="number"
                          value={row.quantity}
                          onChange={(e) =>
                            updateCargoRow(row.id, "quantity", parseInt(e.target.value) || 0)
                          }
                          disabled={isReadOnly}
                        />
                        <SearchableSelect
                          disabled={isReadOnly}
                          options={packageTypes.map((pt) => ({
                            value: pt.id.toString(),
                            label: pt.name,
                          }))}
                          value={row.packageTypeId?.toString() || ""}
                          onValueChange={(value) =>
                            updateCargoRow(row.id, "packageTypeId", parseInt(value))
                          }
                          placeholder="Select"
                          searchPlaceholder="Search..."
                        />
                        <Input
                          type="number"
                          placeholder="L"
                          value={row.length || ""}
                          onChange={(e) =>
                            updateCargoRow(row.id, "length", parseFloat(e.target.value) || undefined)
                          }
                          disabled={isReadOnly}
                        />
                        <Input
                          type="number"
                          placeholder="W"
                          value={row.width || ""}
                          onChange={(e) =>
                            updateCargoRow(row.id, "width", parseFloat(e.target.value) || undefined)
                          }
                          disabled={isReadOnly}
                        />
                        <Input
                          type="number"
                          placeholder="H"
                          value={row.height || ""}
                          onChange={(e) =>
                            updateCargoRow(row.id, "height", parseFloat(e.target.value) || undefined)
                          }
                          disabled={isReadOnly}
                        />
                        <SearchableSelect
                          disabled={isReadOnly}
                          options={[
                            { value: "cm", label: "CM" },
                            { value: "inch", label: "INCH" },
                          ]}
                          value={row.volumeUnit || "cm"}
                          onValueChange={(value) => updateCargoRow(row.id, "volumeUnit", value)}
                          placeholder="CM"
                          searchPlaceholder="Search..."
                        />
                        <Input
                          type="number"
                          placeholder="CBM"
                          value={row.cbm || ""}
                          onChange={(e) =>
                            updateCargoRow(row.id, "cbm", parseFloat(e.target.value) || undefined)
                          }
                          disabled={isReadOnly}
                        />
                        <Input
                          type="number"
                          placeholder="Weight"
                          value={row.weight || ""}
                          onChange={(e) =>
                            updateCargoRow(row.id, "weight", parseFloat(e.target.value) || undefined)
                          }
                          disabled={isReadOnly}
                        />
                        <SearchableSelect
                          disabled={isReadOnly}
                          options={[
                            { value: "kg", label: "KG" },
                            { value: "lb", label: "LB" },
                          ]}
                          value={row.weightUnit || "kg"}
                          onValueChange={(value) => updateCargoRow(row.id, "weightUnit", value)}
                          placeholder="KG"
                          searchPlaceholder="Search..."
                        />
                        <Input
                          placeholder="Description"
                          value={row.cargoDescription || ""}
                          onChange={(e) =>
                            updateCargoRow(row.id, "cargoDescription", e.target.value)
                          }
                          disabled={isReadOnly}
                        />
                        <div>
                          {!isReadOnly &&
                            (index === cargoRows.length - 1 ? (
                              <Button
                                onClick={addCargoRow}
                                className="btn-success w-full"
                              >
                                +
                              </Button>
                            ) : (
                              <Button
                                variant="destructive"
                                size="icon"
                                className="h-10 w-full bg-red-500 hover:bg-red-600"
                                onClick={() => deleteCargoRow(row.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            ))}
                        </div>
                      </div>
                    ))}
                    <div className="grid grid-cols-4 gap-4 mt-4">
                      <div className="space-y-2">
                        <Label>Total Volume</Label>
                        <Input value={totalVolume.toFixed(2)} readOnly className="bg-muted" />
                      </div>
                      <div className="space-y-2">
                        <Label>Total CBM</Label>
                        <Input value={totalCbm.toFixed(2)} readOnly className="bg-muted" />
                      </div>
                      <div className="space-y-2">
                        <Label>Total Weight</Label>
                        <Input value={totalWeight.toFixed(2)} readOnly className="bg-muted" />
                      </div>
                    </div>
                  </>
                )}

                {/* Calculate by Total Shipment View */}
                {formData.cargoCalculationMode === "shipment" && (
                  <>
                    <div className="grid grid-cols-5 gap-4 mb-4">
                      <div className="space-y-2">
                        <Label>Qty</Label>
                        <Input
                          type="number"
                          value={cargoRows[0]?.quantity || ""}
                          onChange={(e) =>
                            updateCargoRow(cargoRows[0]?.id || 1, "quantity", parseInt(e.target.value) || 0)
                          }
                          disabled={isReadOnly}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Load Type</Label>
                        <SearchableSelect
                          disabled={isReadOnly}
                          options={containerTypes.map((ct) => ({
                            value: ct.name,
                            label: ct.name,
                          }))}
                          value={cargoRows[0]?.loadType || ""}
                          onValueChange={(value) =>
                            updateCargoRow(cargoRows[0]?.id || 1, "loadType", value)
                          }
                          placeholder="Select"
                          searchPlaceholder="Search..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Total CBM</Label>
                        <Input
                          type="number"
                          value={cargoRows[0]?.totalCbm || ""}
                          onChange={(e) =>
                            updateCargoRow(
                              cargoRows[0]?.id || 1,
                              "totalCbm",
                              parseFloat(e.target.value) || undefined
                            )
                          }
                          disabled={isReadOnly}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Total Weight</Label>
                        <Input
                          type="number"
                          value={cargoRows[0]?.totalWeight || ""}
                          onChange={(e) =>
                            updateCargoRow(
                              cargoRows[0]?.id || 1,
                              "totalWeight",
                              parseFloat(e.target.value) || undefined
                            )
                          }
                          disabled={isReadOnly}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Weight Type</Label>
                        <SearchableSelect
                          disabled={isReadOnly}
                          options={[
                            { value: "kg", label: "KG" },
                            { value: "lb", label: "LB" },
                          ]}
                          value={cargoRows[0]?.weightUnit || "kg"}
                          onValueChange={(value) =>
                            updateCargoRow(cargoRows[0]?.id || 1, "weightUnit", value)
                          }
                          placeholder="KG"
                          searchPlaceholder="Search..."
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Cargo Description</Label>
                      <Input
                        placeholder="GENERAL CARGO"
                        value={cargoRows[0]?.cargoDescription || ""}
                        onChange={(e) =>
                          updateCargoRow(cargoRows[0]?.id || 1, "cargoDescription", e.target.value)
                        }
                        disabled={isReadOnly}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Charges Details */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg text-primary">Charges Details</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Group sub-headers */}
                <div className="grid gap-1 mb-1" style={{ gridTemplateColumns: '2fr 1fr 5fr 5fr 0.5fr' }}>
                  <div></div>
                  <div></div>
                  <div className="text-center text-sm font-semibold text-blue-600 bg-blue-50 rounded px-1 py-0.5">Sale</div>
                  <div className="text-center text-sm font-semibold text-green-600 bg-green-50 rounded px-1 py-0.5">Cost</div>
                  <div></div>
                </div>
                {/* Column headers */}
                <div className="grid gap-1 mb-2 text-sm font-medium" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 0.5fr' }}>
                  <div>Charge Type</div>
                  <div>Unit</div>
                  <div>Currency</div>
                  <div>Rate</div>
                  <div>ROE</div>
                  <div>Qty</div>
                  <div>Amount</div>
                  <div>Currency</div>
                  <div>Rate</div>
                  <div>ROE</div>
                  <div>Qty</div>
                  <div>Amount</div>
                  <div></div>
                </div>
                {chargeRows.map((row, index) => (
                  <div key={row.id} className="grid gap-1 mb-2" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 0.5fr' }}>
                    <SearchableSelect
                      disabled={isReadOnly}
                      options={chargeItems.map((ci) => ({
                        value: ci.id.toString(),
                        label: ci.name,
                      }))}
                      value={row.chargeItemId?.toString() || ""}
                      onValueChange={(value) => {
                        const chargeItem = chargeItems.find((ci) => ci.id === parseInt(value));
                        setChargeRows(
                          chargeRows.map((r) =>
                            r.id === row.id
                              ? {
                                  ...r,
                                  chargeItemId: parseInt(value),
                                  chargeType: chargeItem?.name || "",
                                }
                              : r
                          )
                        );
                      }}
                      placeholder="Select Charge"
                      searchPlaceholder="Search..."
                    />
                    <SearchableSelect
                      disabled={isReadOnly}
                      options={costingUnits.map((u) => ({
                        value: u.id.toString(),
                        label: u.name,
                      }))}
                      value={row.costingUnitId?.toString() || ""}
                      onValueChange={(value) =>
                        updateChargeRow(row.id, "costingUnitId", parseInt(value))
                      }
                      placeholder="Unit"
                      searchPlaceholder="Search..."
                    />
                    {/* Sale columns */}
                    <SearchableSelect
                      disabled={isReadOnly}
                      options={currencyTypes.map((ct) => ({
                        value: ct.code,
                        label: ct.code,
                      }))}
                      value={row.currency}
                      onValueChange={(value) => updateChargeRow(row.id, "currency", value)}
                      placeholder="Cur"
                      searchPlaceholder="Search..."
                    />
                    <Input
                      type="number"
                      placeholder="Rate"
                      value={row.rate}
                      onChange={(e) => updateChargeRow(row.id, "rate", e.target.value)}
                      disabled={isReadOnly}
                    />
                    <Input
                      type="number"
                      placeholder="ROE"
                      value={row.roe}
                      onChange={(e) => updateChargeRow(row.id, "roe", e.target.value)}
                      disabled={isReadOnly}
                    />
                    <Input
                      type="number"
                      placeholder="Qty"
                      value={row.quantity}
                      onChange={(e) => updateChargeRow(row.id, "quantity", e.target.value)}
                      disabled={isReadOnly}
                    />
                    <Input
                      type="number"
                      placeholder="Amount"
                      value={row.amount}
                      readOnly
                      className="bg-muted"
                    />
                    {/* Cost columns */}
                    <SearchableSelect
                      disabled={isReadOnly}
                      options={currencyTypes.map((ct) => ({
                        value: ct.code,
                        label: ct.code,
                      }))}
                      value={row.costCurrency}
                      onValueChange={(value) => updateChargeRow(row.id, "costCurrency", value)}
                      placeholder="Cur"
                      searchPlaceholder="Search..."
                    />
                    <Input
                      type="number"
                      placeholder="Rate"
                      value={row.costRate}
                      onChange={(e) => updateChargeRow(row.id, "costRate", e.target.value)}
                      disabled={isReadOnly}
                    />
                    <Input
                      type="number"
                      placeholder="ROE"
                      value={row.costRoe}
                      onChange={(e) => updateChargeRow(row.id, "costRoe", e.target.value)}
                      disabled={isReadOnly}
                    />
                    <Input
                      type="number"
                      placeholder="Qty"
                      value={row.costQuantity}
                      onChange={(e) => updateChargeRow(row.id, "costQuantity", e.target.value)}
                      disabled={isReadOnly}
                    />
                    <Input
                      type="number"
                      placeholder="Amount"
                      value={row.costAmount}
                      readOnly
                      className="bg-muted"
                    />
                    <div>
                      {!isReadOnly &&
                        (index === chargeRows.length - 1 ? (
                          <Button
                            onClick={addChargeRow}
                            className="btn-success w-full"
                          >
                            +
                          </Button>
                        ) : (
                          <Button
                            variant="destructive"
                            size="icon"
                            className="h-10 w-full bg-red-500 hover:bg-red-600"
                            onClick={() => deleteChargeRow(row.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-2 pb-6">
              <Button variant="outline" onClick={() => navigate("/sales/quotations")}>
                {isReadOnly ? "Close" : "Cancel"}
              </Button>
              {!isReadOnly && (
                <Button
                  className="btn-success"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {isEditing ? "Update" : "Save"}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
