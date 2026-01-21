import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Edit, Plus, Eye, Download, Trash2, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  useQuotations,
  useQuotation,
  useCreateQuotation,
  useUpdateQuotation,
  useRateRequestForConversion,
} from "@/hooks/useSales";
import { useAllCustomers, useAllCreditors, useCustomer } from "@/hooks/useCustomers";
import {
  useAllIncoTerms,
  useAllPorts,
  useAllPackageTypes,
  useAllCurrencyTypes,
  useAllChargeItems,
} from "@/hooks/useSettings";
import { Quotation, CreateQuotationRequest, Currency } from "@/services/api";

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
  const { data: customers } = useAllCustomers();
  const { data: creditors } = useAllCreditors(); // Creditors for Company Name dropdown
  const { data: selectedCustomer } = useCustomer(formData.customerId || 0);
  const { data: incoTerms } = useAllIncoTerms();
  const { data: ports } = useAllPorts();
  const { data: packageTypes } = useAllPackageTypes();
  const { data: currencyTypes } = useAllCurrencyTypes();
  const { data: chargeItems } = useAllChargeItems();

  // Mutations
  const createMutation = useCreateQuotation();
  const updateMutation = useUpdateQuotation();

  const quotations = data?.items || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = data?.totalPages || 1;

  // Handle conversion pre-fill from Rate Request
  useEffect(() => {
    if (conversionRateRequestId && conversionData && packageTypes) {
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
  }, [conversionRateRequestId, conversionData, packageTypes]);

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
            currency: ch.currency?.toString() || "",
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

  const updateCargoRow = (id: number, field: keyof CargoRow, value: any) => {
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

  const updateChargeRow = (id: number, field: keyof ChargeRow, value: string) => {
    setChargeRows(
      chargeRows.map((row) => {
        if (row.id === id) {
          const updated = { ...row, [field]: value };

          // Auto-fill ROE when currency changes
          if (field === "currency" && currencyTypes) {
            const selectedCurrency = currencyTypes.find((ct) => ct.code === value);
            if (selectedCurrency) {
              updated.roe = selectedCurrency.roe.toString();
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
      customerName: formData.customerName,
      contactPersonId: formData.contactPersonId,
      customerRefCode: formData.customerRefCode,
      loadingPortId: formData.loadingPortId,
      destinationPortId: formData.destinationPortId,
      pickupAddress: formData.pickupAddress,
      deliveryAddress: formData.deliveryAddress,
      incoTermId: formData.incoTermId,
      quoteExpiryDate: formData.quoteExpiryDate,
      cargoCalculationMode: formData.cargoCalculationMode,
      status: formData.status,
      remarks: formData.remarks,
      cfs: formData.cfs,
      documentRequired: formData.documentRequired,
      notes: formData.notes,
      notesForBooking: formData.notesForBooking,
      charges: chargeRows
        .filter((row) => row.chargeType || row.rate)
        .map((row) => ({
          chargeType: row.chargeType,
          chargeItemId: row.chargeItemId,
          bases: row.bases,
          currency: (row.currency as Currency) || "AED",
          rate: parseFloat(row.rate) || 0,
          roe: parseFloat(row.roe) || 1,
          quantity: parseFloat(row.quantity) || 0,
          amount: parseFloat(row.amount) || 0,
        })),
      cargoDetails: cargoRows.map((row) => ({
        calculationMode: row.calculationMode,
        quantity: row.quantity,
        packageTypeId: row.packageTypeId,
        loadType: row.loadType,
        length: row.length,
        width: row.width,
        height: row.height,
        volumeUnit: row.volumeUnit,
        cbm: row.cbm,
        weight: row.weight,
        weightUnit: row.weightUnit,
        totalCbm: row.totalCbm,
        totalWeight: row.totalWeight,
        cargoDescription: row.cargoDescription,
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
          <Button
            onClick={() => openModal("add")}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Quotation
          </Button>
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
                  <Select
                    value={entriesPerPage}
                    onValueChange={(value) => {
                      setEntriesPerPage(value);
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
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
                    <TableRow className="bg-[#2c3e50]">
                      <TableHead className="text-white">Date</TableHead>
                      <TableHead className="text-white">Quotation No</TableHead>
                      <TableHead className="text-white">Customer Name</TableHead>
                      <TableHead className="text-white">Incoterms</TableHead>
                      <TableHead className="text-white">Mode</TableHead>
                      <TableHead className="text-white">POL</TableHead>
                      <TableHead className="text-white">POD</TableHead>
                      <TableHead className="text-white">Quote Expiry Date</TableHead>
                      <TableHead className="text-white">Status</TableHead>
                      <TableHead className="text-white">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quotations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                          No quotations found
                        </TableCell>
                      </TableRow>
                    ) : (
                      quotations.map((quotation) => (
                        <TableRow key={quotation.id} className="hover:bg-muted/50">
                          <TableCell>{formatDate(quotation.quotationDate, "dd-MM-yyyy")}</TableCell>
                          <TableCell className="font-medium">{quotation.quotationNo}</TableCell>
                          <TableCell className="text-green-600">{quotation.customerName}</TableCell>
                          <TableCell className="text-green-600">{quotation.incoTermCode || quotation.incoterms}</TableCell>
                          <TableCell>{quotation.mode}</TableCell>
                          <TableCell className="text-green-600">{quotation.loadingPortName || quotation.pol}</TableCell>
                          <TableCell className="text-green-600">{quotation.destinationPortName || quotation.pod}</TableCell>
                          <TableCell>{formatDate(quotation.quoteExpiryDate, "dd-MM-yyyy")}</TableCell>
                          <TableCell>{getStatusBadge(quotation.quotationStatus)}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 bg-green-500 hover:bg-green-600 text-white rounded"
                                onClick={() => openModal("edit", quotation)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
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
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 bg-red-500 hover:bg-red-600 text-white rounded"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}

              <div className="p-4 flex justify-between items-center border-t border-border">
                <span className="text-sm text-green-600">
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
                      className={page === currentPage ? "bg-green-600" : ""}
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
            <DialogTitle className="text-green-600 text-xl">{getModalTitle()}</DialogTitle>
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
              <h3 className="text-green-600 font-semibold mb-4">Quotation</h3>
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
                  <Select
                    disabled={isReadOnly}
                    value={formData.customerId?.toString() || ""}
                    onValueChange={(value) => {
                      const customer = creditors?.find((c) => c.id === parseInt(value));
                      setFormData({
                        ...formData,
                        customerId: parseInt(value),
                        customerName: customer?.name || "",
                        contactPersonId: undefined,
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Company" />
                    </SelectTrigger>
                    <SelectContent>
                      {creditors?.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id.toString()}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Contact Person</Label>
                  <Select
                    disabled={isReadOnly || !formData.customerId}
                    value={formData.contactPersonId?.toString() || ""}
                    onValueChange={(value) =>
                      setFormData({ ...formData, contactPersonId: parseInt(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Contact" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedCustomer?.contacts?.map((contact) => (
                        <SelectItem key={contact.id} value={contact.id.toString()}>
                          {contact.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  <Select
                    disabled={isReadOnly}
                    value={formData.mode || ""}
                    onValueChange={(value) => setFormData({ ...formData, mode: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AirFreight">Air Freight</SelectItem>
                      <SelectItem value="FCLSeaFreight">FCL-Sea Freight</SelectItem>
                      <SelectItem value="LCLSeaFreight">LCL-Sea Freight</SelectItem>
                      <SelectItem value="LandFreight">Land Freight</SelectItem>
                    </SelectContent>
                  </Select>
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
                  <Select
                    disabled={isReadOnly}
                    value={formData.incoTermId?.toString() || ""}
                    onValueChange={(value) =>
                      setFormData({ ...formData, incoTermId: parseInt(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Incoterm" />
                    </SelectTrigger>
                    <SelectContent>
                      {incoTerms?.map((incoTerm) => (
                        <SelectItem key={incoTerm.id} value={incoTerm.id.toString()}>
                          {incoTerm.code} - {incoTerm.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select
                    disabled={isReadOnly}
                    value={formData.status || "Pending"}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pending" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Approved">Approved</SelectItem>
                      <SelectItem value="Rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Origin/Loading Port</Label>
                  <Select
                    disabled={isReadOnly}
                    value={formData.loadingPortId?.toString() || ""}
                    onValueChange={(value) =>
                      setFormData({ ...formData, loadingPortId: parseInt(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Port" />
                    </SelectTrigger>
                    <SelectContent>
                      {ports?.map((port) => (
                        <SelectItem key={port.id} value={port.id.toString()}>
                          {port.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Destination/Discharge Port</Label>
                  <Select
                    disabled={isReadOnly}
                    value={formData.destinationPortId?.toString() || ""}
                    onValueChange={(value) =>
                      setFormData({ ...formData, destinationPortId: parseInt(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Port" />
                    </SelectTrigger>
                    <SelectContent>
                      {ports?.map((port) => (
                        <SelectItem key={port.id} value={port.id.toString()}>
                          {port.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
              <h3 className="text-green-600 font-semibold mb-4">Cargo Details</h3>

              {/* Cargo Calculation Mode Tabs */}
              <div className="flex gap-2 mb-4">
                <Button
                  className={
                    formData.cargoCalculationMode === "units"
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : "bg-transparent text-green-600 hover:bg-green-50"
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
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : "bg-transparent text-green-600 hover:bg-green-50"
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
                      <Select
                        disabled={isReadOnly}
                        value={row.packageTypeId?.toString() || ""}
                        onValueChange={(value) =>
                          updateCargoRow(row.id, "packageTypeId", parseInt(value))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {packageTypes?.map((pt) => (
                            <SelectItem key={pt.id} value={pt.id.toString()}>
                              {pt.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                      <Select
                        disabled={isReadOnly}
                        value={row.volumeUnit || "cm"}
                        onValueChange={(value) => updateCargoRow(row.id, "volumeUnit", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cm">CM</SelectItem>
                          <SelectItem value="inch">INCH</SelectItem>
                        </SelectContent>
                      </Select>
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
                      <Select
                        disabled={isReadOnly}
                        value={row.weightUnit || "kg"}
                        onValueChange={(value) => updateCargoRow(row.id, "weightUnit", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="kg">KG</SelectItem>
                          <SelectItem value="lb">LB</SelectItem>
                        </SelectContent>
                      </Select>
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
                              className="bg-green-600 hover:bg-green-700 text-white w-full"
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
                      <Select
                        disabled={isReadOnly}
                        value={cargoRows[0]?.loadType || ""}
                        onValueChange={(value) =>
                          updateCargoRow(cargoRows[0]?.id || 1, "loadType", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {packageTypes?.map((pt) => (
                            <SelectItem key={pt.id} value={pt.name}>
                              {pt.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                      <Select
                        disabled={isReadOnly}
                        value={cargoRows[0]?.weightUnit || "kg"}
                        onValueChange={(value) =>
                          updateCargoRow(cargoRows[0]?.id || 1, "weightUnit", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="kg">KG</SelectItem>
                          <SelectItem value="lb">LB</SelectItem>
                        </SelectContent>
                      </Select>
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
              <h3 className="text-green-600 font-semibold mb-4">Charges Details</h3>
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
                  <Select
                    disabled={isReadOnly}
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
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Charge" />
                    </SelectTrigger>
                    <SelectContent>
                      {chargeItems?.map((ci) => (
                        <SelectItem key={ci.id} value={ci.id.toString()}>
                          {ci.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Bases"
                    value={row.bases}
                    onChange={(e) => updateChargeRow(row.id, "bases", e.target.value)}
                    disabled={isReadOnly}
                  />
                  <Select
                    disabled={isReadOnly}
                    value={row.currency}
                    onValueChange={(value) => updateChargeRow(row.id, "currency", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {currencyTypes?.map((ct) => (
                        <SelectItem key={ct.id} value={ct.code}>
                          {ct.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                          className="bg-green-600 hover:bg-green-700 text-white w-full"
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
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={handleSave}
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Save
                </Button>
              )}
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
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
