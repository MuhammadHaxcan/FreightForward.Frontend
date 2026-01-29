import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PermissionGate } from "@/components/auth/PermissionGate";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Edit, Plus, Eye, Download, Trash2, Loader2, CheckCircle, Ship } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  useQuotations,
  useQuotation,
  useCreateQuotation,
  useUpdateQuotation,
  useRateRequestForConversion,
  useApproveQuotation,
} from "@/hooks/useSales";
import { useAllCustomers, useAllDebtors, useCustomer } from "@/hooks/useCustomers";
import {
  useAllIncoTerms,
  useAllPorts,
  useAllPackageTypes,
  useAllCurrencyTypes,
  useAllChargeItems,
  useAllContainerTypes,
} from "@/hooks/useSettings";
import { Quotation, CreateQuotationRequest } from "@/services/api";

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
  bases: string;
  currency: string;
  currencyId?: number;
  rate: string;
  roe: string;
  quantity: string;
  amount: string;
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

type ModalMode = "add" | "edit" | "view";

export default function Quotations() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState("10");
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("add");
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [editingQuotationId, setEditingQuotationId] = useState<number | null>(null);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [quotationToApprove, setQuotationToApprove] = useState<Quotation | null>(null);
  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [quotationToConvert, setQuotationToConvert] = useState<Quotation | null>(null);

  // Get rateRequestId from location state (when coming from Rate Requests)
  const rateRequestIdFromState = (location.state as { rateRequestId?: number })?.rateRequestId;
  const [conversionRateRequestId, setConversionRateRequestId] = useState<number | null>(
    rateRequestIdFromState || null
  );

  // Form state
  const [formData, setFormData] = useState<FormData>({
    customerName: "",
    quotationDate: new Date().toISOString().split("T")[0],
    cargoCalculationMode: "units",
    status: "Pending",
  });

  const [cargoRows, setCargoRows] = useState<CargoRow[]>([
    {
      id: 1,
      calculationMode: "units",
      quantity: 1,
      volumeUnit: "cm",
      weightUnit: "kg",
    },
  ]);

  const [chargeRows, setChargeRows] = useState<ChargeRow[]>([
    { id: 1, chargeType: "", bases: "", currency: "", rate: "", roe: "", quantity: "", amount: "" },
  ]);

  // Queries
  const { data, isLoading, error } = useQuotations({
    pageNumber: currentPage,
    pageSize: parseInt(entriesPerPage),
    searchTerm: searchTerm || undefined,
    status: activeTab === "pending" ? "Pending" : activeTab === "approved" ? "Approved" : undefined,
  });

  const { data: conversionData } = useRateRequestForConversion(conversionRateRequestId || 0);
  const { data: quotationDetail } = useQuotation(editingQuotationId || 0);

  // Dropdown data queries
  const { data: customersData } = useAllCustomers();
  const { data: debtorsData } = useAllDebtors(); // Debtors for Company Name dropdown
  const { data: selectedCustomer } = useCustomer(formData.customerId || 0);
  const { data: incoTermsData } = useAllIncoTerms();
  const { data: portsData } = useAllPorts();
  const { data: packageTypesData } = useAllPackageTypes();
  const { data: currencyTypesData } = useAllCurrencyTypes();
  const { data: chargeItemsData } = useAllChargeItems();
  const { data: containerTypesData } = useAllContainerTypes();

  // Ensure arrays are always defined to prevent .map() errors on first load
  const customers = useMemo(() => Array.isArray(customersData) ? customersData : [], [customersData]);
  const debtors = useMemo(() => Array.isArray(debtorsData) ? debtorsData : [], [debtorsData]);
  const incoTerms = useMemo(() => Array.isArray(incoTermsData) ? incoTermsData : [], [incoTermsData]);
  const ports = useMemo(() => Array.isArray(portsData) ? portsData : [], [portsData]);
  const packageTypes = useMemo(() => Array.isArray(packageTypesData) ? packageTypesData : [], [packageTypesData]);
  const currencyTypes = useMemo(() => Array.isArray(currencyTypesData) ? currencyTypesData : [], [currencyTypesData]);
  const chargeItems = useMemo(() => Array.isArray(chargeItemsData) ? chargeItemsData : [], [chargeItemsData]);
  const containerTypes = useMemo(() => Array.isArray(containerTypesData) ? containerTypesData : [], [containerTypesData]);

  // Mutations
  const createMutation = useCreateQuotation();
  const updateMutation = useUpdateQuotation();
  const approveMutation = useApproveQuotation();

  const quotations = data?.items || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = data?.totalPages || 1;

  // Handle conversion pre-fill from Rate Request
  useEffect(() => {
    if (conversionRateRequestId && conversionData && packageTypesData) {
      // Determine mode based on freightMode and shippingType
      let mode = "";
      const freightMode = conversionData.freightMode?.toLowerCase() || "";
      const shippingType = conversionData.shippingType || ""; // "FTL" or "LTL"

      if (freightMode.includes("sea")) {
        // Sea freight - determine FCL or LCL based on shippingType
        mode = shippingType === "FTL" ? "FCLSeaFreight" : "LCLSeaFreight";
      } else if (freightMode.includes("air")) {
        mode = "AirFreight";
      } else if (freightMode.includes("land")) {
        mode = "LandFreight";
      }

      // Determine cargo calculation mode based on shippingType
      // FTL (Equipment) -> "shipment" (Calculate by Total Shipment)
      // LTL (BoxPallet) -> "units" (Calculate by Units)
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

      // Pre-fill cargo rows from lead details if available
      if (conversionData.leadDetails && conversionData.leadDetails.length > 0) {
        if (cargoCalculationMode === "shipment") {
          // For FTL/Equipment - Calculate by Total Shipment (single row with totals)
          const totalQuantity = conversionData.leadDetails.reduce((sum, d) => sum + (d.quantity || 0), 0);
          const totalWeight = conversionData.leadDetails.reduce((sum, d) => sum + ((d.weight || 0) * (d.quantity || 1)), 0);
          const totalVolume = conversionData.leadDetails.reduce((sum, d) => sum + ((d.volume || 0) * (d.quantity || 1)), 0);

          // Get load type from first detail's container type or default
          const firstDetail = conversionData.leadDetails[0];
          const loadType = firstDetail?.containerTypeName || firstDetail?.packageTypeName || "";

          setCargoRows([{
            id: Date.now(),
            calculationMode: "shipment",
            quantity: totalQuantity,
            loadType: loadType,
            totalCbm: totalVolume,
            totalWeight: totalWeight,
            weightUnit: "kg",
            volumeUnit: "cm",
            cargoDescription: conversionData.productDescription || "GENERAL CARGO",
          }]);
        } else {
          // For LTL/BoxPallet - Calculate by Units (multiple rows)
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
        // No lead details - set default based on calculation mode
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

      // Open modal automatically
      setModalMode("add");
      setIsModalOpen(true);

      // Clear the location state to prevent re-triggering
      window.history.replaceState({}, document.title);
    }
  }, [conversionRateRequestId, conversionData, packageTypesData]);

  // Handle edit mode pre-fill
  useEffect(() => {
    if (editingQuotationId && quotationDetail) {
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

      // Pre-fill cargo rows
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

      // Pre-fill charge rows
      if (quotationDetail.charges && quotationDetail.charges.length > 0) {
        setChargeRows(
          quotationDetail.charges.map((ch) => ({
            id: ch.id,
            chargeType: ch.chargeType || "",
            chargeItemId: ch.chargeItemId,
            bases: ch.bases || "",
            currency: ch.currencyCode || "",
            currencyId: ch.currencyId,
            rate: ch.rate?.toString() || "",
            roe: ch.roe?.toString() || "",
            quantity: ch.quantity?.toString() || "",
            amount: ch.amount?.toString() || "",
          }))
        );
      }
    }
  }, [editingQuotationId, quotationDetail]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Approved":
        return <Badge className="bg-green-500 text-white">Approved</Badge>;
      case "Pending":
        return <Badge className="bg-yellow-500 text-white">Pending</Badge>;
      case "Rejected":
        return <Badge className="bg-red-500 text-white">Rejected</Badge>;
      default:
        return <Badge className="bg-gray-500 text-white">{status}</Badge>;
    }
  };

  const openModal = (mode: ModalMode, quotation?: Quotation) => {
    setModalMode(mode);
    setSelectedQuotation(quotation || null);

    if (mode === "edit" && quotation) {
      setEditingQuotationId(quotation.id);
    } else if (mode === "add") {
      // Reset form for add mode
      setEditingQuotationId(null);
      setFormData({
        customerName: "",
        quotationDate: new Date().toISOString().split("T")[0],
        cargoCalculationMode: "units",
        status: "Pending",
      });
      setCargoRows([
        { id: 1, calculationMode: "units", quantity: 1, volumeUnit: "cm", weightUnit: "kg" },
      ]);
      setChargeRows([
        { id: 1, chargeType: "", bases: "", currency: "", rate: "", roe: "", quantity: "", amount: "" },
      ]);
    } else if (mode === "view" && quotation) {
      setEditingQuotationId(quotation.id);
    }

    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setConversionRateRequestId(null);
    setEditingQuotationId(null);
    setSelectedQuotation(null);
  };

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

  const deleteCargoRow = (id: number) => {
    if (cargoRows.length > 1) {
      setCargoRows(cargoRows.filter((row) => row.id !== id));
    }
  };

  const updateCargoRow = (id: number, field: keyof CargoRow, value: CargoRow[keyof CargoRow]) => {
    setCargoRows(
      cargoRows.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const addChargeRow = () => {
    setChargeRows([
      ...chargeRows,
      { id: Date.now(), chargeType: "", bases: "", currency: "", rate: "", roe: "", quantity: "", amount: "" },
    ]);
  };

  const deleteChargeRow = (id: number) => {
    if (chargeRows.length > 1) {
      setChargeRows(chargeRows.filter((row) => row.id !== id));
    }
  };

  const updateChargeRow = (id: number, field: keyof ChargeRow, value: string | number | undefined) => {
    setChargeRows(
      chargeRows.map((row) => {
        if (row.id === id) {
          const updated = { ...row, [field]: value };

          // Auto-fill ROE and currencyId when currency code changes
          if (field === "currency" && currencyTypes) {
            const selectedCurrency = currencyTypes.find((ct) => ct.code === value);
            if (selectedCurrency) {
              updated.roe = selectedCurrency.roe.toString();
              updated.currencyId = selectedCurrency.id;
            }
          }

          // Auto-calculate amount (include currency in condition since it affects ROE)
          if (field === "rate" || field === "roe" || field === "quantity" || field === "currency") {
            const rate = parseFloat(updated.rate) || 0;
            const roe = parseFloat(updated.roe) || 1;
            const qty = parseFloat(updated.quantity) || 0;
            updated.amount = (rate * roe * qty).toFixed(2);
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
          bases: row.bases || undefined,
          currencyId: row.currencyId,
          rate: parseFloat(row.rate) || 0,
          roe: parseFloat(row.roe) || 1,
          quantity: parseFloat(row.quantity) || 0,
          amount: parseFloat(row.amount) || 0,
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
      if (modalMode === "edit" && editingQuotationId) {
        await updateMutation.mutateAsync({ id: editingQuotationId, data: request });
      } else {
        await createMutation.mutateAsync(request);
      }
      closeModal();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const isReadOnly = modalMode === "view";

  const getModalTitle = () => {
    switch (modalMode) {
      case "add":
        return conversionRateRequestId ? "Convert Rate Request to Quotation" : "Add New Quotation";
      case "edit":
        return "Edit Quotation";
      case "view":
        return "View Quotation";
    }
  };

  // Calculate totals for cargo
  const totalVolume = cargoRows.reduce((sum, row) => sum + (row.cbm || 0) * row.quantity, 0);
  const totalCbm = cargoRows.reduce((sum, row) => sum + (row.totalCbm || row.cbm || 0), 0);
  const totalWeight = cargoRows.reduce((sum, row) => sum + (row.totalWeight || (row.weight || 0) * row.quantity), 0);

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-foreground">Quotations</h1>
          <PermissionGate permission="quot_add">
            <Button
              onClick={() => openModal("add")}
              className="btn-success"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Quotation
            </Button>
          </PermissionGate>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(value) => {
            setActiveTab(value);
            setCurrentPage(1);
          }}
        >
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved (Booking List)</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            <div className="bg-card rounded-lg border border-border">
              <div className="p-4 flex justify-between items-center border-b border-border">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Show</span>
                  <SearchableSelect
                    options={[
                      { value: "10", label: "10" },
                      { value: "25", label: "25" },
                      { value: "50", label: "50" },
                      { value: "100", label: "100" },
                    ]}
                    value={entriesPerPage}
                    onValueChange={(value) => {
                      setEntriesPerPage(value);
                      setCurrentPage(1);
                    }}
                    placeholder="10"
                    searchPlaceholder="Search..."
                    triggerClassName="w-20"
                  />
                  <span className="text-sm text-muted-foreground">entries</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Search:</span>
                  <Input
                    placeholder=""
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-64"
                  />
                </div>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : error ? (
                <div className="flex items-center justify-center py-12 text-destructive">
                  Error loading quotations. Please try again.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-table-header">
                      <TableHead className="text-table-header-foreground">Date</TableHead>
                      <TableHead className="text-table-header-foreground">Quotation No</TableHead>
                      <TableHead className="text-table-header-foreground">Customer Name</TableHead>
                      <TableHead className="text-table-header-foreground">Incoterms</TableHead>
                      <TableHead className="text-table-header-foreground">Mode</TableHead>
                      <TableHead className="text-table-header-foreground">POL</TableHead>
                      <TableHead className="text-table-header-foreground">POD</TableHead>
                      <TableHead className="text-table-header-foreground">Quote Expiry Date</TableHead>
                      <TableHead className="text-table-header-foreground">Status</TableHead>
                      <TableHead className="text-table-header-foreground">Booking No</TableHead>
                      <TableHead className="text-table-header-foreground">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quotations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                          No quotations found
                        </TableCell>
                      </TableRow>
                    ) : (
                      quotations.map((quotation) => (
                        <TableRow key={quotation.id} className="hover:bg-table-row-hover">
                          <TableCell>{formatDate(quotation.quotationDate, "dd-MM-yyyy")}</TableCell>
                          <TableCell className="font-medium">{quotation.quotationNo}</TableCell>
                          <TableCell className="text-green-600">{quotation.customerName}</TableCell>
                          <TableCell className="text-green-600">{quotation.incoTermCode || quotation.incoterms}</TableCell>
                          <TableCell>{quotation.mode}</TableCell>
                          <TableCell className="text-green-600">{quotation.loadingPortName || quotation.pol}</TableCell>
                          <TableCell className="text-green-600">{quotation.destinationPortName || quotation.pod}</TableCell>
                          <TableCell>{formatDate(quotation.quoteExpiryDate, "dd-MM-yyyy")}</TableCell>
                          <TableCell>{getStatusBadge(quotation.quotationStatus)}</TableCell>
                          <TableCell className="text-purple-600 font-medium">{quotation.quotationBookingNo || "-"}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <PermissionGate permission="quot_edit">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 btn-success rounded"
                                  onClick={() => openModal("edit", quotation)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </PermissionGate>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 bg-blue-500 hover:bg-blue-600 text-white rounded"
                                onClick={() => openModal("view", quotation)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 bg-orange-500 hover:bg-orange-600 text-white rounded"
                                onClick={() => window.open(`/sales/quotations/${quotation.id}/view`, "_blank")}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              {quotation.quotationStatus === "Pending" && (
                                <PermissionGate permission="quot_approve">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 bg-purple-500 hover:bg-purple-600 text-white rounded"
                                    onClick={() => {
                                      setQuotationToApprove(quotation);
                                      setApproveModalOpen(true);
                                    }}
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                </PermissionGate>
                              )}
                              {quotation.quotationStatus === "Approved" && activeTab === "approved" && (
                                <PermissionGate permission="quot_convert">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 bg-teal-500 hover:bg-teal-600 text-white rounded"
                                    onClick={() => {
                                      setQuotationToConvert(quotation);
                                      setConvertModalOpen(true);
                                    }}
                                    title="Convert to Shipment"
                                  >
                                    <Ship className="h-4 w-4" />
                                  </Button>
                                </PermissionGate>
                              )}
                              <PermissionGate permission="quot_delete">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 bg-red-500 hover:bg-red-600 text-white rounded"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </PermissionGate>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}

              <div className="p-4 flex justify-between items-center border-t border-border">
                <span className="text-sm text-muted-foreground">
                  Showing{" "}
                  {quotations.length > 0 ? (currentPage - 1) * parseInt(entriesPerPage) + 1 : 0} to{" "}
                  {Math.min(currentPage * parseInt(entriesPerPage), totalCount)} of {totalCount} entries
                </span>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                  >
                    Previous
                  </Button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={page === currentPage ? "default" : "outline"}
                      size="sm"
                      className={page === currentPage ? "btn-success" : ""}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add/Edit/View Quotation Modal */}
      <Dialog open={isModalOpen} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-primary text-xl">{getModalTitle()}</DialogTitle>
            <DialogDescription>
              {modalMode === "view"
                ? "View quotation details"
                : "Fill in the quotation details below"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Header with Back and Update buttons for edit/view mode */}
            {(modalMode === "edit" || modalMode === "view") && (
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  className="bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500"
                  onClick={closeModal}
                >
                  Back
                </Button>
                {modalMode === "edit" && (
                  <Button
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                    onClick={handleSave}
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Update
                  </Button>
                )}
              </div>
            )}

            {/* Quotation Details */}
            <div className="border border-border rounded-lg p-4">
              <h3 className="text-primary font-semibold mb-4">Quotation</h3>
              <div className="grid grid-cols-6 gap-4 mb-4">
                <div>
                  <Label>Quotation ID</Label>
                  <Input
                    value={selectedQuotation?.quotationNo || "Auto-generated"}
                    readOnly
                    className="bg-muted"
                  />
                </div>
                <div>
                  <Label>Company Name</Label>
                  <SearchableSelect
                    disabled={isReadOnly}
                    options={debtors?.map((customer) => ({
                      value: customer.id.toString(),
                      label: customer.name,
                    })) || []}
                    value={formData.customerId?.toString() || ""}
                    onValueChange={(value) => {
                      const customer = debtors?.find((c) => c.id === parseInt(value));
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
                <div>
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
                <div>
                  <Label>Customer Reference Code</Label>
                  <Input
                    value={formData.customerRefCode || ""}
                    onChange={(e) => setFormData({ ...formData, customerRefCode: e.target.value })}
                    disabled={isReadOnly}
                  />
                </div>
                <div>
                  <Label>Quotation Booking No</Label>
                  <Input
                    value={formData.quotationBookingNo || "Auto-generated"}
                    readOnly
                    className="bg-muted"
                  />
                </div>
                <div>
                  <Label>Mode</Label>
                  <SearchableSelect
                    disabled={isReadOnly}
                    options={[
                      { value: "AirFreight", label: "Air Freight" },
                      { value: "FCLSeaFreight", label: "FCL-Sea Freight" },
                      { value: "LCLSeaFreight", label: "LCL-Sea Freight" },
                      { value: "LandFreight", label: "Land Freight" },
                    ]}
                    value={formData.mode || ""}
                    onValueChange={(value) => setFormData({ ...formData, mode: value })}
                    placeholder="Select Mode"
                    searchPlaceholder="Search..."
                  />
                </div>
              </div>
              <div className="grid grid-cols-6 gap-4 mb-4">
                <div>
                  <Label>Date Of Issue</Label>
                  <Input
                    type="date"
                    value={formData.quotationDate}
                    onChange={(e) => setFormData({ ...formData, quotationDate: e.target.value })}
                    disabled={isReadOnly}
                  />
                </div>
                <div>
                  <Label>Validity</Label>
                  <Input
                    type="date"
                    value={formData.quoteExpiryDate || ""}
                    onChange={(e) => setFormData({ ...formData, quoteExpiryDate: e.target.value })}
                    disabled={isReadOnly}
                  />
                </div>
                <div>
                  <Label>Incoterm</Label>
                  <SearchableSelect
                    disabled={isReadOnly}
                    options={incoTerms?.map((incoTerm) => ({
                      value: incoTerm.id.toString(),
                      label: `${incoTerm.code} - ${incoTerm.name}`,
                    })) || []}
                    value={formData.incoTermId?.toString() || ""}
                    onValueChange={(value) =>
                      setFormData({ ...formData, incoTermId: parseInt(value) })
                    }
                    placeholder="Select Incoterm"
                    searchPlaceholder="Search..."
                  />
                </div>
                <div>
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
                <div>
                  <Label>Origin/Loading Port</Label>
                  <SearchableSelect
                    disabled={isReadOnly}
                    options={ports?.map((port) => ({
                      value: port.id.toString(),
                      label: port.name,
                    })) || []}
                    value={formData.loadingPortId?.toString() || ""}
                    onValueChange={(value) =>
                      setFormData({ ...formData, loadingPortId: parseInt(value) })
                    }
                    placeholder="Select Port"
                    searchPlaceholder="Search..."
                  />
                </div>
                <div>
                  <Label>Destination/Discharge Port</Label>
                  <SearchableSelect
                    disabled={isReadOnly}
                    options={ports?.map((port) => ({
                      value: port.id.toString(),
                      label: port.name,
                    })) || []}
                    value={formData.destinationPortId?.toString() || ""}
                    onValueChange={(value) =>
                      setFormData({ ...formData, destinationPortId: parseInt(value) })
                    }
                    placeholder="Select Port"
                    searchPlaceholder="Search..."
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div>
                  <Label>Pick-Up Address</Label>
                  <Textarea
                    placeholder="Pick-Up Address"
                    value={formData.pickupAddress || ""}
                    onChange={(e) => setFormData({ ...formData, pickupAddress: e.target.value })}
                    disabled={isReadOnly}
                  />
                </div>
                <div>
                  <Label>Delivery Address</Label>
                  <Textarea
                    placeholder="Delivery Address"
                    value={formData.deliveryAddress || ""}
                    onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
                    disabled={isReadOnly}
                  />
                </div>
                <div>
                  <Label>Remarks</Label>
                  <Textarea
                    placeholder="Remarks"
                    value={formData.remarks || ""}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    disabled={isReadOnly}
                  />
                </div>
                <div>
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
                <div>
                  <Label>Document Required</Label>
                  <Textarea
                    placeholder="Document Required"
                    value={formData.documentRequired || ""}
                    onChange={(e) => setFormData({ ...formData, documentRequired: e.target.value })}
                    disabled={isReadOnly}
                  />
                </div>
                <div>
                  <Label>Notes</Label>
                  <Textarea
                    placeholder="Notes"
                    value={formData.notes || ""}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    disabled={isReadOnly}
                  />
                </div>
                <div>
                  <Label>Notes (For Booking)</Label>
                  <Textarea
                    placeholder="Notes for Booking"
                    value={formData.notesForBooking || ""}
                    onChange={(e) => setFormData({ ...formData, notesForBooking: e.target.value })}
                    disabled={isReadOnly}
                  />
                </div>
              </div>
            </div>

            {/* Cargo Details */}
            <div className="border border-border rounded-lg p-4">
              <h3 className="text-primary font-semibold mb-4">Cargo Details</h3>

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
                        options={packageTypes?.map((pt) => ({
                          value: pt.id.toString(),
                          label: pt.name,
                        })) || []}
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
                    <div>
                      <Label>Total Volume</Label>
                      <Input value={totalVolume.toFixed(2)} readOnly className="bg-muted" />
                    </div>
                    <div>
                      <Label>Total CBM</Label>
                      <Input value={totalCbm.toFixed(2)} readOnly className="bg-muted" />
                    </div>
                    <div>
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
                    <div>
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
                    <div>
                      <Label>Load Type</Label>
                      <SearchableSelect
                        disabled={isReadOnly}
                        options={containerTypes?.map((ct) => ({
                          value: ct.name,
                          label: ct.name,
                        })) || []}
                        value={cargoRows[0]?.loadType || ""}
                        onValueChange={(value) =>
                          updateCargoRow(cargoRows[0]?.id || 1, "loadType", value)
                        }
                        placeholder="Select"
                        searchPlaceholder="Search..."
                      />
                    </div>
                    <div>
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
                    <div>
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
                    <div>
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
                  <div>
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
            </div>

            {/* Charges Details */}
            <div className="border border-border rounded-lg p-4">
              <h3 className="text-primary font-semibold mb-4">Charges Details</h3>
              <div className="grid grid-cols-8 gap-2 mb-2 text-sm font-medium">
                <div>Charge Type</div>
                <div>Bases</div>
                <div>Currency</div>
                <div>Rate</div>
                <div>ROE</div>
                <div>Quantity</div>
                <div>Amount</div>
                <div></div>
              </div>
              {chargeRows.map((row, index) => (
                <div key={row.id} className="grid grid-cols-8 gap-2 mb-2">
                  <SearchableSelect
                    disabled={isReadOnly}
                    options={chargeItems?.map((ci) => ({
                      value: ci.id.toString(),
                      label: ci.name,
                    })) || []}
                    value={row.chargeItemId?.toString() || ""}
                    onValueChange={(value) => {
                      const chargeItem = chargeItems?.find((ci) => ci.id === parseInt(value));
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
                  <Input
                    placeholder="Bases"
                    value={row.bases}
                    onChange={(e) => updateChargeRow(row.id, "bases", e.target.value)}
                    disabled={isReadOnly}
                  />
                  <SearchableSelect
                    disabled={isReadOnly}
                    options={currencyTypes?.map((ct) => ({
                      value: ct.code,
                      label: ct.code,
                    })) || []}
                    value={row.currency}
                    onValueChange={(value) => updateChargeRow(row.id, "currency", value)}
                    placeholder="Currency"
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
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={closeModal}>
                {isReadOnly ? "Close" : "Cancel"}
              </Button>
              {modalMode === "add" && (
                <Button
                  className="btn-success"
                  onClick={handleSave}
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Save
                </Button>
              )}
              {modalMode === "edit" && (
                <Button
                  className="btn-success"
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Update
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Approve Confirmation Modal */}
      <AlertDialog open={approveModalOpen} onOpenChange={setApproveModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Quotation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve this quotation?
              {quotationToApprove && (
                <span className="block mt-2 font-medium text-foreground">
                  Quotation No: {quotationToApprove.quotationNo}
                </span>
              )}
              This will generate a Booking Number and change the status to "Approved".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setApproveModalOpen(false);
                setQuotationToApprove(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-purple-500 hover:bg-purple-600 text-white"
              onClick={async () => {
                if (quotationToApprove) {
                  await approveMutation.mutateAsync(quotationToApprove.id);
                  setApproveModalOpen(false);
                  setQuotationToApprove(null);
                }
              }}
              disabled={approveMutation.isPending}
            >
              {approveMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Yes, Approve
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Convert to Shipment Confirmation Modal */}
      <AlertDialog open={convertModalOpen} onOpenChange={setConvertModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Convert Booking to Shipment</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                Are you sure you want to convert this booking to shipment?
                {quotationToConvert && (
                  <div className="mt-4 space-y-2">
                    <div className="font-medium text-foreground">
                      Quotation No: {quotationToConvert.quotationNo}
                    </div>
                    <div className="font-medium text-foreground">
                      Booking No: {quotationToConvert.quotationBookingNo || "-"}
                    </div>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setConvertModalOpen(false);
                setQuotationToConvert(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-teal-500 hover:bg-teal-600 text-white"
              onClick={() => {
                if (quotationToConvert) {
                  setConvertModalOpen(false);
                  navigate("/shipments/add", { state: { quotationId: quotationToConvert.id } });
                }
              }}
            >
              Yes, Convert
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
