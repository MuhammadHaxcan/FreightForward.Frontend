import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { DateInput } from "@/components/ui/date-input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Edit, Trash2, Plus, Loader2, AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ContainerModal } from "@/components/shipments/ContainerModal";
import { CostingModal } from "@/components/shipments/CostingModal";
import { InvoiceModal } from "@/components/shipments/InvoiceModal";
import { PurchaseModal } from "@/components/shipments/PurchaseModal";
import { DocumentModal } from "@/components/shipments/DocumentModal";
import { StatusLogModal } from "@/components/shipments/StatusLogModal";
import { StatusTimeline } from "@/components/shipments/StatusTimeline";
import { DeleteConfirmationModal } from "@/components/ui/delete-confirmation-modal";
import { toast } from "sonner";
import { getTodayDateOnly } from "@/lib/utils";
import {
  useShipment,
  useUpdateShipment,
  useAddShipmentParty,
  useDeleteShipmentParty,
  useAddShipmentContainer,
  useUpdateShipmentContainer,
  useDeleteShipmentContainer,
  useAddShipmentCosting,
  useUpdateShipmentCosting,
  useDeleteShipmentCosting,
} from "@/hooks/useShipments";
import { useDeleteInvoice, useDeletePurchaseInvoice } from "@/hooks/useInvoices";
import { useCustomers } from "@/hooks/useCustomers";
import {
  MasterType,
  Customer,
  shipmentApi,
  settingsApi,
  fileApi,
  ShipmentInvoicesResult,
  AddShipmentContainerRequest,
  UpdateShipmentContainerRequest,
  AddShipmentCostingRequest,
  UpdateShipmentCostingRequest,
  AddShipmentCargoRequest,
  AddShipmentDocumentRequest,
  AddShipmentStatusLogRequest,
  ShipmentContainer,
  ShipmentCosting,
  ShipmentCargo,
  ShipmentDocument,
  ShipmentStatusLog,
  PackageType,
  ShipmentStatus,
  ShipmentDirection,
  ShipmentMode,
  BLServiceType,
  FreightType,
  PaymentStatus,
} from "@/services/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useBaseCurrency } from "@/hooks/useBaseCurrency";

// Helper function to get payment status display and styling
const getPaymentStatusDisplay = (status: PaymentStatus) => {
  switch (status) {
    case 'Pending':
      return { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' };
    case 'PartiallyPaid':
      return { label: 'Partially Paid', className: 'bg-orange-100 text-orange-800' };
    case 'Paid':
      return { label: 'Paid', className: 'bg-green-100 text-green-800' };
    case 'Overdue':
      return { label: 'Overdue', className: 'bg-red-100 text-red-800' };
    case 'Closed':
      return { label: 'Closed', className: 'bg-gray-100 text-gray-800' };
    default:
      return { label: status, className: 'bg-gray-100 text-gray-800' };
  }
};

// Helper functions for enum mapping
const mapModeToDisplay = (mode: string): string => {
  const modeMap: Record<string, string> = {
    'SeaFreightFCL': 'Sea Freight FCL',
    'SeaFreightLCL': 'Sea Freight LCL',
    'AirFreight': 'Air Freight',
    'BreakBulk': 'Break-Bulk',
    'RoRo': 'RO-RO',
  };
  return modeMap[mode] || mode;
};

const mapDirectionToDisplay = (direction: string): string => {
  return direction === 'CrossTrade' ? 'Cross-Trade' : direction;
};

const mapDisplayToMode = (mode: string): string => {
  const map: Record<string, string> = {
    'Sea Freight FCL': 'SeaFreightFCL',
    'Sea Freight LCL': 'SeaFreightLCL',
    'Air Freight': 'AirFreight',
    'Break-Bulk': 'BreakBulk',
    'RO-RO': 'RoRo',
  };
  return map[mode] || mode;
};

const mapDisplayToDirection = (direction: string): string => {
  return direction === 'Cross-Trade' ? 'CrossTrade' : direction;
};

// Empty initial form data
const emptyFormData = {
  jobNumber: "",
  jobDate: "",
  jobStatus: "",
  direction: "",
  mode: "",
  incoTermId: "",
  houseBLNo: "",
  houseBLDate: "",
  houseBLStatus: "",
  hblServiceType: "",
  hblNoBLIssued: "",
  hblFreight: "",
  mblNumber: "",
  mblDate: "",
  mblStatus: "",
  mblServiceType: "",
  mblNoBLIssued: "",
  mblFreight: "",
  placeOfBLIssue: "",
  carrier: "",
  freeTime: "",
  networkPartnerId: undefined as number | undefined,
  assignedTo: "",
  placeOfReceiptId: undefined as number | undefined,
  placeOfReceiptName: "",
  placeOfDeliveryId: undefined as number | undefined,
  placeOfDeliveryName: "",
  portOfReceiptId: undefined as number | undefined,
  portOfReceipt: "",
  portOfLoadingId: undefined as number | undefined,
  portOfLoading: "",
  portOfDischargeId: undefined as number | undefined,
  portOfDischarge: "",
  portOfFinalDestinationId: undefined as number | undefined,
  portOfFinalDestination: "",
  placeOfReceipt: "",
  placeOfDelivery: "",
  vessel: "",
  voyage: "",
  etd: "",
  eta: "",
  secondLegVessel: false,
  secondLegVesselName: "",
  secondLegVoyage: "",
  secondLegETD: "",
  secondLegETA: "",
  marksNumbers: "",
  notes: "",
  internalNotes: "",
};


const ShipmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const shipmentId = parseInt(id || '0');
  const baseCurrencyCode = useBaseCurrency();

  const queryClient = useQueryClient();

  // Fetch shipment data from API
  const { data: shipmentData, isLoading: isLoadingShipment, error: shipmentError, refetch: refetchShipment } = useShipment(shipmentId);

  // Mutations
  const updateShipmentMutation = useUpdateShipment();
  const addPartyMutation = useAddShipmentParty();
  const deletePartyMutation = useDeleteShipmentParty();
  const addContainerMutation = useAddShipmentContainer();
  const updateContainerMutation = useUpdateShipmentContainer();
  const deleteContainerMutation = useDeleteShipmentContainer();
  const addCostingMutation = useAddShipmentCosting();
  const updateCostingMutation = useUpdateShipmentCosting();
  const deleteCostingMutation = useDeleteShipmentCosting();

  // State
  const [activeTab, setActiveTab] = useState("shipment-info");
  const [formData, setFormData] = useState(emptyFormData);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [cargoDetails, setCargoDetails] = useState<ShipmentCargo[]>([]);
  const [newCargoEntry, setNewCargoEntry] = useState({ quantity: "", packageTypeId: "", totalCBM: "", totalWeight: "", description: "" });
  const [isSavingCargo, setIsSavingCargo] = useState(false);
  const [documents, setDocuments] = useState<ShipmentDocument[]>([]);
  const [documentModalOpen, setDocumentModalOpen] = useState(false);
  const [documentModalMode, setDocumentModalMode] = useState<"add" | "edit">("add");
  const [editingDocument, setEditingDocument] = useState<ShipmentDocument | null>(null);
  const [statusLogs, setStatusLogs] = useState<ShipmentStatusLog[]>([]);
  const [statusLogModalOpen, setStatusLogModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Modal states
  const [containerModalOpen, setContainerModalOpen] = useState(false);
  const [costingModalOpen, setCostingModalOpen] = useState(false);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [editingContainer, setEditingContainer] = useState<ShipmentContainer | null>(null);
  const [editingCosting, setEditingCosting] = useState<ShipmentCosting | null>(null);
  const [editInvoiceId, setEditInvoiceId] = useState<number | null>(null);
  const [editPurchaseInvoiceId, setEditPurchaseInvoiceId] = useState<number | null>(null);

  // Invoice delete hooks
  const deleteInvoiceMutation = useDeleteInvoice();
  const deletePurchaseInvoiceMutation = useDeletePurchaseInvoice();

  // Delete confirmation modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteModalConfig, setDeleteModalConfig] = useState<{
    type: 'party' | 'container' | 'costing' | 'cargo' | 'document' | 'statusLog' | 'invoice' | 'purchaseInvoice';
    id: number;
    name?: string;
    filePath?: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Warning modal state
  const [warningModalOpen, setWarningModalOpen] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");

  // Fetch shipment invoices
  const { data: shipmentInvoicesResponse } = useQuery({
    queryKey: ['shipment-invoices', shipmentId],
    queryFn: () => shipmentApi.getInvoices(shipmentId),
    enabled: shipmentId > 0,
  });
  const shipmentInvoices = shipmentInvoicesResponse?.data;

  // Fetch customer category types
  const { data: categoryTypesResponse } = useQuery({
    queryKey: ['customerCategoryTypes', 'all'],
    queryFn: () => settingsApi.getAllCustomerCategoryTypes(),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
  const categoryTypes = useMemo(() => categoryTypesResponse?.data ?? [], [categoryTypesResponse?.data]);

  // Fetch INCO terms
  const { data: incoTermsResponse, isLoading: isLoadingIncoTerms } = useQuery({
    queryKey: ['incoTerms', 'all'],
    queryFn: () => settingsApi.getAllIncoTerms(),
    staleTime: 60 * 60 * 1000, // Cache for 1 hour (INCO terms rarely change)
  });
  const incoTerms = useMemo(() => incoTermsResponse?.data ?? [], [incoTermsResponse?.data]);

  // Fetch Package Types for cargo dropdown
  const { data: packageTypesResponse } = useQuery({
    queryKey: ['packageTypes', 'all'],
    queryFn: () => settingsApi.getAllPackageTypes(),
    staleTime: 60 * 60 * 1000, // Cache for 1 hour
  });
  const packageTypes = useMemo(() => packageTypesResponse?.data ?? [], [packageTypesResponse?.data]);

  // Group package types by category
  const packageTypesByCategory = useMemo(() => {
    const grouped: Record<string, PackageType[]> = {};
    packageTypes.forEach(pt => {
      const category = pt.category || 'Other';
      if (!grouped[category]) grouped[category] = [];
      grouped[category].push(pt);
    });
    return grouped;
  }, [packageTypes]);

  // Fetch Network Partners
  const { data: networkPartnersResponse, isLoading: isLoadingNetworkPartners } = useQuery({
    queryKey: ['networkPartners', 'all'],
    queryFn: () => settingsApi.getAllNetworkPartners(),
    staleTime: 60 * 60 * 1000, // Cache for 1 hour
  });
  const networkPartners = useMemo(() => networkPartnersResponse?.data ?? [], [networkPartnersResponse?.data]);

  // Fetch BL Types
  const { data: blTypesResponse } = useQuery({
    queryKey: ['blTypes', 'all'],
    queryFn: () => settingsApi.getAllBLTypes(),
    staleTime: 60 * 60 * 1000, // Cache for 1 hour
  });
  const blTypes = useMemo(() => blTypesResponse?.data ?? [], [blTypesResponse?.data]);

  // Filter BL types based on selected transport mode
  const filteredBLTypes = useMemo(() => {
    const isAirFreight = formData.mode === 'Air Freight';
    return blTypes.filter(bt =>
      bt.category === 'Common' ||
      (isAirFreight ? bt.category === 'Air' : bt.category === 'Sea')
    );
  }, [blTypes, formData.mode]);

  // Fetch Ports
  const { data: portsResponse, isLoading: isLoadingPorts } = useQuery({
    queryKey: ['ports', 'all'],
    queryFn: () => settingsApi.getAllPorts(),
    staleTime: 60 * 60 * 1000, // Cache for 1 hour
  });
  const ports = useMemo(() => portsResponse?.data ?? [], [portsResponse?.data]);

  // Get data from shipmentData
  const containers = shipmentData?.containers || [];
  const costings = shipmentData?.costings || [];
  const parties = shipmentData?.parties || [];

  // Parse selected category ID for customer filtering
  const parsedCategoryId = selectedCategoryId ? parseInt(selectedCategoryId) : undefined;

  // Fetch customers filtered by the selected category ID
  const { data: customersData, isLoading: isLoadingCustomers } = useCustomers({
    pageSize: 100,
    categoryId: parsedCategoryId,
  });

  // Get the list of customers
  const customers = useMemo(() => customersData?.items || [], [customersData]);

  // Get the selected customer details
  const selectedCustomer = useMemo(() =>
    customers.find(c => c.id.toString() === selectedCustomerId),
    [customers, selectedCustomerId]
  );

  // Update form data when shipment data is loaded
  useEffect(() => {
    if (shipmentData) {
      setFormData({
        jobNumber: shipmentData.jobNumber,
        jobDate: shipmentData.jobDate?.split('T')[0] || '',
        jobStatus: shipmentData.jobStatus,
        direction: mapDirectionToDisplay(shipmentData.direction),
        mode: mapModeToDisplay(shipmentData.mode),
        incoTermId: shipmentData.incoTermId?.toString() || '',
        houseBLNo: shipmentData.houseBLNo || '',
        // Use correct field names from backend DTO (camelCase of HblDate, HblStatus, etc.)
        houseBLDate: shipmentData.hblDate?.split('T')[0] || '',
        houseBLStatus: shipmentData.hblStatus || '',
        hblServiceType: shipmentData.hblServiceType || '',
        hblNoBLIssued: shipmentData.hblNoBLIssued || '',
        hblFreight: shipmentData.hblFreight || '',
        mblNumber: shipmentData.mblNumber || '',
        mblDate: shipmentData.mblDate?.split('T')[0] || '',
        mblStatus: shipmentData.mblStatus || '',
        mblServiceType: shipmentData.mblServiceType || '',
        mblNoBLIssued: shipmentData.mblNoBLIssued || '',
        mblFreight: shipmentData.mblFreight || '',
        placeOfBLIssue: shipmentData.placeOfBLIssue || '',
        carrier: shipmentData.carrier || '',
        freeTime: shipmentData.freeTime || '',
        networkPartnerId: shipmentData.networkPartnerId,
        assignedTo: shipmentData.assignedTo || '',
        placeOfReceiptId: shipmentData.placeOfReceiptId,
        placeOfReceiptName: shipmentData.placeOfReceiptName || '',
        placeOfDeliveryId: shipmentData.placeOfDeliveryId,
        placeOfDeliveryName: shipmentData.placeOfDeliveryName || '',
        portOfReceiptId: shipmentData.portOfReceiptId,
        portOfReceipt: shipmentData.portOfReceiptId?.toString() || '',
        portOfLoadingId: shipmentData.portOfLoadingId,
        portOfLoading: shipmentData.portOfLoadingId?.toString() || '',
        portOfDischargeId: shipmentData.portOfDischargeId,
        portOfDischarge: shipmentData.portOfDischargeId?.toString() || '',
        portOfFinalDestinationId: shipmentData.portOfFinalDestinationId,
        portOfFinalDestination: shipmentData.portOfFinalDestinationId?.toString() || '',
        placeOfReceipt: shipmentData.placeOfReceiptId?.toString() || '',
        placeOfDelivery: shipmentData.placeOfDeliveryId?.toString() || '',
        vessel: shipmentData.vessel || '',
        voyage: shipmentData.voyage || '',
        etd: shipmentData.etd?.split('T')[0] || '',
        eta: shipmentData.eta?.split('T')[0] || '',
        secondLegVessel: shipmentData.secondLegVessel || false,
        secondLegVesselName: shipmentData.secondLegVesselName || '',
        secondLegVoyage: shipmentData.secondLegVoyage || '',
        secondLegETD: shipmentData.secondLegEtd?.split('T')[0] || '',
        secondLegETA: shipmentData.secondLegEta?.split('T')[0] || '',
        marksNumbers: shipmentData.marksNumbers || '',
        notes: shipmentData.notes || '',
        internalNotes: shipmentData.internalNotes || '',
      });
      // Load cargo details from API
      if (shipmentData.cargos) {
        setCargoDetails(shipmentData.cargos);
      }
      // Load documents from API
      if (shipmentData.documents) {
        setDocuments(shipmentData.documents);
      }
      // Load status logs from API
      if (shipmentData.statusLogs) {
        setStatusLogs(shipmentData.statusLogs);
      }
    }
  }, [shipmentData]);

  // Reset selected customer when party type changes
  useEffect(() => {
    setSelectedCustomerId("");
  }, [selectedCategoryId]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddParty = () => {
    if (!selectedCustomer) {
      toast.error("Please select a customer");
      return;
    }
    if (!shipmentId) {
      toast.error("Shipment ID is missing");
      return;
    }

    // Check if customer is already added with the SAME category
    const existingParty = parties.find(
      p => p.customerId === selectedCustomer.id && p.customerCategoryId === parsedCategoryId
    );
    if (existingParty) {
      const partyLabel = categoryTypes.find(c => c.id.toString() === selectedCategoryId)?.name || "this category";
      toast.error(`${selectedCustomer.name} is already added as ${partyLabel}`);
      return;
    }

    addPartyMutation.mutate({
      shipmentId,
      data: {
        shipmentId,
        masterType: selectedCustomer.masterType,
        customerCategoryId: parsedCategoryId,
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        mobile: '',
        phone: selectedCustomer.phone || '',
        email: selectedCustomer.email || '',
      }
    });

    setSelectedCustomerId("");
  };

  const handleDeleteParty = (partyId: number, partyName?: string) => {
    if (!shipmentId) return;
    setDeleteModalConfig({ type: 'party', id: partyId, name: partyName });
    setDeleteModalOpen(true);
  };

  // Container handlers
  const handleSaveContainer = async (containerData: Partial<ShipmentContainer> & { sNo?: number | string }) => {
    if (!shipmentId) {
      toast.error("Please save the shipment first");
      return;
    }

    try {
      if (editingContainer) {
        // Update existing container
        const data: UpdateShipmentContainerRequest = {
          id: editingContainer.id,
          shipmentId,
          containerNumber: containerData.containerNumber,
          containerTypeId: containerData.containerTypeId || null,
          sealNo: containerData.sealNo,
          noOfPcs: parseInt(containerData.noOfPcs) || 0,
          packageTypeId: containerData.packageTypeId || null,
          grossWeight: parseFloat(containerData.grossWeight) || 0,
          volume: parseFloat(containerData.volume) || 0,
          description: containerData.description || null,
        };

        await updateContainerMutation.mutateAsync({ shipmentId, containerId: editingContainer.id, data });
      } else {
        // Add new container
        const data: AddShipmentContainerRequest = {
          shipmentId,
          containerNumber: containerData.containerNumber,
          containerTypeId: containerData.containerTypeId || null,
          sealNo: containerData.sealNo,
          noOfPcs: parseInt(containerData.noOfPcs) || 0,
          packageTypeId: containerData.packageTypeId || null,
          grossWeight: parseFloat(containerData.grossWeight) || 0,
          volume: parseFloat(containerData.volume) || 0,
          description: containerData.description || null,
        };

        await addContainerMutation.mutateAsync({ shipmentId, data });
      }
      setContainerModalOpen(false);
      setEditingContainer(null);
      refetchShipment();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const [editingContainerIndex, setEditingContainerIndex] = useState<number | null>(null);

  const handleEditContainer = (container: ShipmentContainer, index: number) => {
    setEditingContainer(container);
    setEditingContainerIndex(index);
    setContainerModalOpen(true);
  };

  const handleDeleteContainer = (containerId: number, containerNumber?: string) => {
    if (!shipmentId) return;
    setDeleteModalConfig({ type: 'container', id: containerId, name: containerNumber });
    setDeleteModalOpen(true);
  };

  // Costing handlers
  const handleSaveCosting = async (costingData: Partial<ShipmentCosting>) => {
    if (!shipmentId) {
      toast.error("Please save the shipment first");
      return;
    }

    try {
      const saleLCY = parseFloat(costingData.saleLCY) || 0;
      const costLCY = parseFloat(costingData.costLCY) || 0;

      if (editingCosting) {
        // Update existing costing
        const data: UpdateShipmentCostingRequest = {
          id: editingCosting.id,
          shipmentId,
          description: costingData.description,
          remarks: costingData.remarks,
          saleQty: parseFloat(costingData.saleQty) || 0,
          saleUnit: parseFloat(costingData.saleUnit) || 0,
          saleCurrencyId: costingData.saleCurrencyId,
          saleExRate: parseFloat(costingData.saleExRate) || 1,
          saleFCY: parseFloat(costingData.saleFCY) || 0,
          saleLCY,
          saleTaxPercentage: parseFloat(costingData.saleTaxPercentage) || 0,
          saleTaxAmount: parseFloat(costingData.saleTaxAmount) || 0,
          costQty: parseFloat(costingData.costQty) || 0,
          costUnit: parseFloat(costingData.costUnit) || 0,
          costCurrencyId: costingData.costCurrencyId,
          costExRate: parseFloat(costingData.costExRate) || 1,
          costFCY: parseFloat(costingData.costFCY) || 0,
          costLCY,
          costTaxPercentage: parseFloat(costingData.costTaxPercentage) || 0,
          costTaxAmount: parseFloat(costingData.costTaxAmount) || 0,
          unitId: costingData.unitId,
          gp: saleLCY - costLCY,
          billToCustomerId: costingData.billToCustomerId,
          vendorCustomerId: costingData.vendorCustomerId,
          costReferenceNo: costingData.costReferenceNo || undefined,
          costDate: costingData.costDate || undefined,
          ppcc: costingData.ppcc || undefined,
        };

        await updateCostingMutation.mutateAsync({ shipmentId, costingId: editingCosting.id, data });
      } else {
        // Add new costing
        const data: AddShipmentCostingRequest = {
          shipmentId,
          description: costingData.description,
          remarks: costingData.remarks,
          saleQty: parseFloat(costingData.saleQty) || 0,
          saleUnit: parseFloat(costingData.saleUnit) || 0,
          saleCurrencyId: costingData.saleCurrencyId,
          saleExRate: parseFloat(costingData.saleExRate) || 1,
          saleFCY: parseFloat(costingData.saleFCY) || 0,
          saleLCY,
          saleTaxPercentage: parseFloat(costingData.saleTaxPercentage) || 0,
          saleTaxAmount: parseFloat(costingData.saleTaxAmount) || 0,
          costQty: parseFloat(costingData.costQty) || 0,
          costUnit: parseFloat(costingData.costUnit) || 0,
          costCurrencyId: costingData.costCurrencyId,
          costExRate: parseFloat(costingData.costExRate) || 1,
          costFCY: parseFloat(costingData.costFCY) || 0,
          costLCY,
          costTaxPercentage: parseFloat(costingData.costTaxPercentage) || 0,
          costTaxAmount: parseFloat(costingData.costTaxAmount) || 0,
          unitId: costingData.unitId,
          gp: saleLCY - costLCY,
          billToCustomerId: costingData.billToCustomerId,
          vendorCustomerId: costingData.vendorCustomerId,
          costReferenceNo: costingData.costReferenceNo || undefined,
          costDate: costingData.costDate || undefined,
          ppcc: costingData.ppcc || undefined,
        };

        await addCostingMutation.mutateAsync({ shipmentId, data });
      }
      setCostingModalOpen(false);
      setEditingCosting(null);
      refetchShipment();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleEditCosting = (costing: ShipmentCosting) => {
    setEditingCosting(costing);
    setCostingModalOpen(true);
  };

  const handleDeleteCosting = (costingId: number, description?: string) => {
    if (!shipmentId) return;
    setDeleteModalConfig({ type: 'costing', id: costingId, name: description });
    setDeleteModalOpen(true);
  };

  const handleDeleteCargo = (cargoId: number, description?: string) => {
    if (!shipmentId) return;
    setDeleteModalConfig({ type: 'cargo', id: cargoId, name: description || `Cargo #${cargoId}` });
    setDeleteModalOpen(true);
  };

  const handleAddCargo = async () => {
    if (!shipmentId) return;
    if (!newCargoEntry.quantity) {
      toast.error("Quantity is required");
      return;
    }

    setIsSavingCargo(true);
    try {
      const selectedPackageType = packageTypes.find(pt => pt.id.toString() === newCargoEntry.packageTypeId);
      const request: AddShipmentCargoRequest = {
        quantity: parseInt(newCargoEntry.quantity) || 0,
        packageTypeId: newCargoEntry.packageTypeId ? parseInt(newCargoEntry.packageTypeId) : null,
        totalCBM: newCargoEntry.totalCBM ? parseFloat(newCargoEntry.totalCBM) : null,
        totalWeight: newCargoEntry.totalWeight ? parseFloat(newCargoEntry.totalWeight) : null,
        description: newCargoEntry.description || undefined,
      };

      const response = await shipmentApi.addCargo(shipmentId, request);
      if (response.data) {
        // Add the new cargo to the local state
        const newCargo: ShipmentCargo = {
          id: response.data,
          quantity: request.quantity,
          packageTypeId: request.packageTypeId || undefined,
          packageTypeName: selectedPackageType?.name,
          totalCBM: request.totalCBM || undefined,
          totalWeight: request.totalWeight || undefined,
          description: request.description,
        };
        setCargoDetails(prev => [...prev, newCargo]);
        setNewCargoEntry({ quantity: "", packageTypeId: "", totalCBM: "", totalWeight: "", description: "" });
        toast.success("Cargo added successfully");
      }
    } catch (error) {
      toast.error("Failed to add cargo");
    } finally {
      setIsSavingCargo(false);
    }
  };

  // Handle delete confirmation
  const handleConfirmDelete = async () => {
    if (!shipmentId || !deleteModalConfig) return;
    setIsDeleting(true);

    try {
      switch (deleteModalConfig.type) {
        case 'party':
          try {
            await deletePartyMutation.mutateAsync({ partyId: deleteModalConfig.id, shipmentId });
          } catch (error: unknown) {
            // Show warning modal for party deletion errors (e.g., costings assigned)
            const message = error instanceof Error ? error.message : 'Failed to delete party';
            setWarningMessage(message);
            setWarningModalOpen(true);
            setDeleteModalOpen(false);
            setDeleteModalConfig(null);
            return;
          }
          break;
        case 'container':
          await deleteContainerMutation.mutateAsync({ containerId: deleteModalConfig.id, shipmentId });
          break;
        case 'costing':
          try {
            await deleteCostingMutation.mutateAsync({ costingId: deleteModalConfig.id, shipmentId });
          } catch (error: unknown) {
            // Show warning modal for costing deletion errors (e.g., invoices created)
            const message = error instanceof Error ? error.message : 'Failed to delete costing';
            setWarningMessage(message);
            setWarningModalOpen(true);
            setDeleteModalOpen(false);
            setDeleteModalConfig(null);
            return;
          }
          break;
        case 'cargo':
          await shipmentApi.deleteCargo(deleteModalConfig.id);
          setCargoDetails(prev => prev.filter(c => c.id !== deleteModalConfig.id));
          toast.success("Cargo deleted successfully");
          break;
        case 'document':
          await shipmentApi.deleteDocument(deleteModalConfig.id);
          // Also delete the file from server if it exists
          if (deleteModalConfig.filePath) {
            try {
              await fileApi.delete(deleteModalConfig.filePath);
            } catch (fileError) {
              console.error("Failed to delete file:", fileError);
            }
          }
          setDocuments(prev => prev.filter(d => d.id !== deleteModalConfig.id));
          toast.success("Document deleted successfully");
          break;
        case 'statusLog':
          await shipmentApi.deleteStatusLog(deleteModalConfig.id);
          setStatusLogs(prev => prev.filter(l => l.id !== deleteModalConfig.id));
          toast.success("Status log deleted successfully");
          break;
        case 'invoice':
          await deleteInvoiceMutation.mutateAsync(deleteModalConfig.id);
          queryClient.invalidateQueries({ queryKey: ['shipment-invoices', shipmentId] });
          break;
        case 'purchaseInvoice':
          await deletePurchaseInvoiceMutation.mutateAsync(deleteModalConfig.id);
          queryClient.invalidateQueries({ queryKey: ['shipment-invoices', shipmentId] });
          break;
      }
      refetchShipment();
      setDeleteModalOpen(false);
      setDeleteModalConfig(null);
    } catch (error) {
      // Error handled by mutation
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle add/update document
  const handleSaveDocument = async (documentData: AddShipmentDocumentRequest) => {
    if (!shipmentId) {
      toast.error("Please save the shipment first");
      return;
    }

    try {
      if (documentModalMode === "edit" && editingDocument) {
        const result = await shipmentApi.updateDocument(editingDocument.id, documentData);
        if (result.error) throw new Error(result.error);
        refetchShipment();
        toast.success("Document updated successfully");
      } else {
        const newDocumentId = await shipmentApi.addDocument(shipmentId, documentData);
        if (newDocumentId.data) {
          refetchShipment();
          toast.success("Document added successfully");
        }
      }
    } catch (error) {
      console.error("Failed to save document:", error);
      toast.error(documentModalMode === "edit" ? "Failed to update document" : "Failed to add document");
      throw error;
    }
  };

  const handleEditDocument = (doc: ShipmentDocument) => {
    setEditingDocument(doc);
    setDocumentModalMode("edit");
    setDocumentModalOpen(true);
  };

  // Handle delete document
  const handleDeleteDocument = (doc: ShipmentDocument) => {
    setDeleteModalConfig({
      type: 'document',
      id: doc.id,
      name: doc.documentNo,
      filePath: doc.filePath,
    });
    setDeleteModalOpen(true);
  };

  // Handle add status log from modal
  const handleAddStatusLogFromModal = async (statusLogData: AddShipmentStatusLogRequest) => {
    if (!shipmentId) {
      toast.error("Please save the shipment first");
      return;
    }

    try {
      const response = await shipmentApi.addStatusLog(shipmentId, statusLogData);
      if (response.data) {
        // Refetch shipment to get updated status logs
        refetchShipment();
        toast.success("Status log added successfully");
      }
    } catch (error) {
      console.error("Failed to add status log:", error);
      toast.error("Failed to add status log");
      throw error;
    }
  };

  // Handle delete status log
  const handleDeleteStatusLog = (statusLog: ShipmentStatusLog) => {
    setDeleteModalConfig({
      type: 'statusLog',
      id: statusLog.id,
      name: statusLog.eventDescription || statusLog.remarks || 'Status Event',
    });
    setDeleteModalOpen(true);
  };

  // Handle delete status log by ID (for StatusTimeline)
  const handleDeleteStatusLogById = (statusLogId: number) => {
    const statusLog = statusLogs.find(log => log.id === statusLogId);
    if (statusLog) {
      handleDeleteStatusLog(statusLog);
    }
  };

  // Handle save shipment
  const handleSaveShipment = async () => {
    if (!shipmentId) return;
    setIsSaving(true);
    try {
      await updateShipmentMutation.mutateAsync({
        id: shipmentId,
        data: {
          id: shipmentId,
          jobDate: formData.jobDate,
          jobStatus: (formData.jobStatus || 'Opened') as ShipmentStatus,
          direction: mapDisplayToDirection(formData.direction) as ShipmentDirection,
          mode: mapDisplayToMode(formData.mode) as ShipmentMode,
          incoTermId: formData.incoTermId ? parseInt(formData.incoTermId) : undefined,
          hblNo: formData.houseBLNo || undefined,
          hblDate: formData.houseBLDate || undefined,
          hblStatus: formData.houseBLStatus || undefined,
          hblServiceType: (formData.hblServiceType || undefined) as BLServiceType | undefined,
          hblNoBLIssued: formData.hblNoBLIssued || undefined,
          hblFreight: (formData.hblFreight || undefined) as FreightType | undefined,
          mblNo: formData.mblNumber || undefined,
          mblDate: formData.mblDate || undefined,
          mblStatus: formData.mblStatus || undefined,
          mblServiceType: (formData.mblServiceType || undefined) as BLServiceType | undefined,
          mblNoBLIssued: formData.mblNoBLIssued || undefined,
          mblFreight: (formData.mblFreight || undefined) as FreightType | undefined,
          placeOfBLIssue: formData.placeOfBLIssue || undefined,
          carrier: formData.carrier || undefined,
          freeTime: formData.freeTime || undefined,
          networkPartnerId: formData.networkPartnerId,
          assignedTo: formData.assignedTo || undefined,
          placeOfReceiptId: formData.placeOfReceiptId,
          placeOfDeliveryId: formData.placeOfDeliveryId,
          portOfReceiptId: formData.portOfReceiptId,
          portOfLoadingId: formData.portOfLoadingId,
          portOfDischargeId: formData.portOfDischargeId,
          portOfFinalDestinationId: formData.portOfFinalDestinationId,
          placeOfReceipt: formData.placeOfReceipt || undefined,
          placeOfDelivery: formData.placeOfDelivery || undefined,
          vessel: formData.vessel || undefined,
          voyage: formData.voyage || undefined,
          etd: formData.etd || undefined,
          eta: formData.eta || undefined,
          secondLegVessel: formData.secondLegVessel,
          secondLegVesselName: formData.secondLegVesselName || undefined,
          secondLegVoyage: formData.secondLegVoyage || undefined,
          secondLegEtd: formData.secondLegETD || undefined,
          secondLegEta: formData.secondLegETA || undefined,
          marksNumbers: formData.marksNumbers || undefined,
          notes: formData.notes || undefined,
          internalNotes: formData.internalNotes || undefined,
        }
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate totals for costings
  const totalSale = costings.reduce((sum, c) => sum + (c.saleLCY || 0), 0);
  const totalCost = costings.reduce((sum, c) => sum + (c.costLCY || 0), 0);

  return (
    <MainLayout>
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-foreground">
            Edit Shipment - Job No : <span className="font-bold">{formData.jobNumber}</span>
          </h1>
          <div className="flex gap-2">
            <Button
              className="btn-success"
              onClick={handleSaveShipment}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
            <Button variant="outline" className="bg-modal-header hover:bg-modal-header/80 text-modal-header-foreground border-modal-header" onClick={() => navigate("/shipments")}>
              Back
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {isLoadingShipment && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            <span className="ml-2 text-muted-foreground">Loading shipment...</span>
          </div>
        )}

        {/* Error State */}
        {shipmentError && !isLoadingShipment && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
            <p className="text-red-600 dark:text-red-400">
              Failed to load shipment: {shipmentError instanceof Error ? shipmentError.message : 'Unknown error'}
            </p>
            <Button
              onClick={() => refetchShipment()}
              variant="outline"
              className="mt-4"
            >
              Try Again
            </Button>
          </div>
        )}

        {/* Tabs - Only show when data is loaded */}
        {!isLoadingShipment && !shipmentError && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start mb-4 bg-card border border-border rounded-lg p-1 h-auto flex-wrap">
            <TabsTrigger
              value="shipment-info"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6 py-2.5"
            >
              Shipment Info
            </TabsTrigger>
            <TabsTrigger 
              value="parties"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6 py-2.5"
            >
              Parties
            </TabsTrigger>
            <TabsTrigger 
              value="containers"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6 py-2.5"
            >
              Containers
            </TabsTrigger>
            <TabsTrigger 
              value="costing"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6 py-2.5"
            >
              Costing
            </TabsTrigger>
            <TabsTrigger 
              value="cargo-details"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6 py-2.5"
            >
              Cargo Details
            </TabsTrigger>
            <TabsTrigger 
              value="documents"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6 py-2.5"
            >
              Documents
            </TabsTrigger>
            <TabsTrigger 
              value="shipment-status"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6 py-2.5"
            >
              Shipment Status
            </TabsTrigger>
          </TabsList>

          {/* Shipment Info Tab */}
          <TabsContent value="shipment-info" className="mt-0">
            <div className="space-y-6">
              {/* Section 1: Basic Shipment Details */}
              <div className="bg-card border border-border rounded-lg p-6 space-y-4">
                <h3 className="text-emerald-600 font-semibold text-lg border-b border-border pb-2">Basic Shipment Details</h3>
                <div className="grid grid-cols-6 gap-4">
                  <div>
                    <Label className="text-sm">Job Number</Label>
                    <Input value={formData.jobNumber} readOnly className="bg-muted" />
                  </div>
                  <div>
                    <Label className="text-sm">Date</Label>
                    <DateInput value={formData.jobDate} onChange={(v) => handleInputChange("jobDate", v)} />
                  </div>
                  <div>
                    <Label className="text-sm">Job Status</Label>
                    <SearchableSelect
                      options={[
                        { value: "Opened", label: "Opened" },
                        { value: "Closed", label: "Closed" },
                        { value: "Cancelled", label: "Cancelled" },
                      ]}
                      value={formData.jobStatus}
                      onValueChange={(v) => handleInputChange("jobStatus", v)}
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Direction</Label>
                    <SearchableSelect
                      options={[
                        { value: "Import", label: "Import" },
                        { value: "Export", label: "Export" },
                        { value: "Cross-Trade", label: "Cross-Trade" },
                      ]}
                      value={formData.direction}
                      onValueChange={(v) => handleInputChange("direction", v)}
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Mode</Label>
                    <SearchableSelect
                      options={[
                        { value: "Air Freight", label: "Air Freight" },
                        { value: "Sea Freight FCL", label: "Sea Freight FCL" },
                        { value: "Sea Freight LCL", label: "Sea Freight LCL" },
                        { value: "Break-Bulk", label: "Break-Bulk" },
                        { value: "RO-RO", label: "RO-RO" },
                      ]}
                      value={formData.mode}
                      onValueChange={(v) => {
                        handleInputChange("mode", v);
                        const isAir = v === 'Air Freight';
                        setFormData(prev => ({
                          ...prev,
                          mode: v,
                          houseBLStatus: isAir ? "HAWB" : "HBL",
                          mblStatus: isAir ? "MAWB" : "MBL",
                        }));
                      }}
                      searchPlaceholder="Search modes..."
                    />
                  </div>
                  <div>
                    <Label className="text-sm">INCO Terms</Label>
                    <SearchableSelect
                      options={incoTerms.map(term => ({
                        value: term.id.toString(),
                        label: `${term.code} - ${term.name}`,
                      }))}
                      value={formData.incoTermId}
                      onValueChange={(v) => handleInputChange("incoTermId", v)}
                      placeholder="Select"
                      searchPlaceholder="Search incoterms..."
                      emptyMessage={isLoadingIncoTerms ? "Loading..." : "No incoterms found"}
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Bill of Lading Details */}
              <div className="bg-card border border-border rounded-lg p-6 space-y-4">
                <h3 className="text-emerald-600 font-semibold text-lg border-b border-border pb-2">Bill of Lading Details</h3>

                {/* House B/L */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">House B/L</h4>
                  <div className="grid grid-cols-6 gap-4">
                    <div>
                      <Label className="text-sm">House B/L No</Label>
                      <Input value={formData.houseBLNo} onChange={(e) => handleInputChange("houseBLNo", e.target.value)} placeholder="B/L No" />
                    </div>
                    <div>
                      <Label className="text-sm">Date</Label>
                      <DateInput value={formData.houseBLDate} onChange={(v) => handleInputChange("houseBLDate", v)} />
                    </div>
                    <div>
                      <Label className="text-sm">{formData.mode === 'Air Freight' ? 'AWB Status' : 'BL Status'}</Label>
                      <SearchableSelect
                        options={
                          filteredBLTypes.length > 0
                            ? filteredBLTypes
                                .filter(bt => bt.code === 'HBL' || bt.code === 'HAWB' || bt.code === 'EXPRESS')
                                .map(bt => ({ value: bt.code, label: `${bt.code} - ${bt.name}` }))
                            : [
                                { value: "HBL", label: "HBL - House Bill of Lading" },
                                { value: "EXPRESS", label: "Express Release" },
                              ]
                        }
                        value={formData.houseBLStatus}
                        onValueChange={(v) => handleInputChange("houseBLStatus", v)}
                        placeholder="Select"
                        searchPlaceholder="Search..."
                      />
                    </div>
                    <div>
                      <Label className="text-sm">BL Service Type</Label>
                      <SearchableSelect
                        options={[
                          { value: "FCLFCL", label: "FCL/FCL" },
                          { value: "LCLLCL", label: "LCL/LCL" },
                          { value: "LCLFCL", label: "LCL/FCL" },
                          { value: "FCLLCL", label: "FCL/LCL" },
                        ]}
                        value={formData.hblServiceType}
                        onValueChange={(v) => handleInputChange("hblServiceType", v)}
                      />
                    </div>
                    <div>
                      <Label className="text-sm">No BL Issued</Label>
                      <Input value={formData.hblNoBLIssued} onChange={(e) => handleInputChange("hblNoBLIssued", e.target.value)} placeholder="No BL Issued" />
                    </div>
                    <div>
                      <Label className="text-sm">Freight</Label>
                      <SearchableSelect
                        options={[
                          { value: "Prepaid", label: "Prepaid" },
                          { value: "Collect", label: "Collect" },
                        ]}
                        value={formData.hblFreight}
                        onValueChange={(v) => handleInputChange("hblFreight", v)}
                      />
                    </div>
                  </div>
                </div>

                {/* Master B/L */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Master B/L</h4>
                  <div className="grid grid-cols-6 gap-4">
                    <div>
                      <Label className="text-sm">MBL Number</Label>
                      <Input value={formData.mblNumber} onChange={(e) => handleInputChange("mblNumber", e.target.value)} placeholder="MBL Number" />
                    </div>
                    <div>
                      <Label className="text-sm">Date</Label>
                      <DateInput value={formData.mblDate} onChange={(v) => handleInputChange("mblDate", v)} />
                    </div>
                    <div>
                      <Label className="text-sm">{formData.mode === 'Air Freight' ? 'AWB Status' : 'BL Status'}</Label>
                      <SearchableSelect
                        options={
                          filteredBLTypes.length > 0
                            ? filteredBLTypes
                                .filter(bt => bt.code === 'MBL' || bt.code === 'MAWB' || bt.code === 'EXPRESS')
                                .map(bt => ({ value: bt.code, label: `${bt.code} - ${bt.name}` }))
                            : [
                                { value: "MBL", label: "MBL - Master Bill of Lading" },
                                { value: "EXPRESS", label: "Express Release" },
                              ]
                        }
                        value={formData.mblStatus}
                        onValueChange={(v) => handleInputChange("mblStatus", v)}
                        placeholder="Select"
                        searchPlaceholder="Search..."
                      />
                    </div>
                    <div>
                      <Label className="text-sm">BL Service Type</Label>
                      <SearchableSelect
                        options={[
                          { value: "FCLFCL", label: "FCL/FCL" },
                          { value: "LCLLCL", label: "LCL/LCL" },
                          { value: "LCLFCL", label: "LCL/FCL" },
                          { value: "FCLLCL", label: "FCL/LCL" },
                        ]}
                        value={formData.mblServiceType}
                        onValueChange={(v) => handleInputChange("mblServiceType", v)}
                      />
                    </div>
                    <div>
                      <Label className="text-sm">No BL Issued</Label>
                      <Input value={formData.mblNoBLIssued} onChange={(e) => handleInputChange("mblNoBLIssued", e.target.value)} placeholder="No BL Issued" />
                    </div>
                    <div>
                      <Label className="text-sm">Freight</Label>
                      <SearchableSelect
                        options={[
                          { value: "Prepaid", label: "Prepaid" },
                          { value: "Collect", label: "Collect" },
                        ]}
                        value={formData.mblFreight}
                        onValueChange={(v) => handleInputChange("mblFreight", v)}
                      />
                    </div>
                  </div>
                </div>

                {/* Additional B/L Info */}
                <div className="grid grid-cols-4 gap-4 pt-2">
                  <div>
                    <Label className="text-sm">Place of BL Issue</Label>
                    <Input value={formData.placeOfBLIssue} onChange={(e) => handleInputChange("placeOfBLIssue", e.target.value)} placeholder="Place of BL Issue" />
                  </div>
                  <div>
                    <Label className="text-sm">Carrier</Label>
                    <Input value={formData.carrier} onChange={(e) => handleInputChange("carrier", e.target.value)} placeholder="Carrier" />
                  </div>
                  <div>
                    <Label className="text-sm">Free Time</Label>
                    <Input value={formData.freeTime} onChange={(e) => handleInputChange("freeTime", e.target.value)} placeholder="Free Time" />
                  </div>
                  <div>
                    <Label className="text-sm">Network Partner</Label>
                    <SearchableSelect
                      options={networkPartners.map(partner => ({
                        value: partner.id.toString(),
                        label: `${partner.code} - ${partner.name}`,
                      }))}
                      value={formData.networkPartnerId?.toString() || ""}
                      onValueChange={(v) => setFormData(prev => ({ ...prev, networkPartnerId: v ? parseInt(v) : undefined }))}
                      placeholder="Select"
                      searchPlaceholder="Search partners..."
                      emptyMessage={isLoadingNetworkPartners ? "Loading..." : "No partners found"}
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Route & Schedule */}
              <div className="bg-card border border-border rounded-lg p-6 space-y-4">
                <h3 className="text-emerald-600 font-semibold text-lg border-b border-border pb-2">Route & Schedule</h3>

                {/* Origin Ports */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Origin</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm">Place of Receipt</Label>
                      <SearchableSelect
                        options={ports.map(port => ({
                          value: port.id.toString(),
                          label: `${port.seaPortName}${port.seaPortCode ? ` (${port.seaPortCode})` : ''} / ${port.airPortName}${port.airPortCode ? ` (${port.airPortCode})` : ''} - ${port.city}, ${port.country}`,
                        }))}
                        value={formData.placeOfReceipt}
                        onValueChange={(v) => handleInputChange("placeOfReceipt", v)}
                        placeholder="Select"
                        searchPlaceholder="Search ports..."
                        emptyMessage={isLoadingPorts ? "Loading..." : "No ports found"}
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Port of Receipt</Label>
                      <SearchableSelect
                        options={ports.map(port => ({
                          value: port.id.toString(),
                          label: `${port.seaPortName}${port.seaPortCode ? ` (${port.seaPortCode})` : ''} / ${port.airPortName}${port.airPortCode ? ` (${port.airPortCode})` : ''} - ${port.city}, ${port.country}`,
                        }))}
                        value={formData.portOfReceipt}
                        onValueChange={(v) => {
                          handleInputChange("portOfReceipt", v);
                          const selectedPort = ports.find(p => p.id.toString() === v);
                          setFormData(prev => ({ ...prev, portOfReceiptId: selectedPort?.id }));
                        }}
                        placeholder="Select"
                        searchPlaceholder="Search ports..."
                        emptyMessage={isLoadingPorts ? "Loading..." : "No ports found"}
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Port of Loading</Label>
                      <SearchableSelect
                        options={ports.map(port => ({
                          value: port.id.toString(),
                          label: `${port.seaPortName}${port.seaPortCode ? ` (${port.seaPortCode})` : ''} / ${port.airPortName}${port.airPortCode ? ` (${port.airPortCode})` : ''} - ${port.city}, ${port.country}`,
                        }))}
                        value={formData.portOfLoading}
                        onValueChange={(v) => {
                          handleInputChange("portOfLoading", v);
                          const selectedPort = ports.find(p => p.id.toString() === v);
                          setFormData(prev => ({ ...prev, portOfLoadingId: selectedPort?.id }));
                        }}
                        placeholder="Select"
                        searchPlaceholder="Search ports..."
                        emptyMessage={isLoadingPorts ? "Loading..." : "No ports found"}
                      />
                    </div>
                  </div>
                </div>

                {/* Destination Ports */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Destination</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm">Port of Discharge</Label>
                      <SearchableSelect
                        options={ports.map(port => ({
                          value: port.id.toString(),
                          label: `${port.seaPortName}${port.seaPortCode ? ` (${port.seaPortCode})` : ''} / ${port.airPortName}${port.airPortCode ? ` (${port.airPortCode})` : ''} - ${port.city}, ${port.country}`,
                        }))}
                        value={formData.portOfDischarge}
                        onValueChange={(v) => {
                          handleInputChange("portOfDischarge", v);
                          const selectedPort = ports.find(p => p.id.toString() === v);
                          setFormData(prev => ({ ...prev, portOfDischargeId: selectedPort?.id }));
                        }}
                        placeholder="Select"
                        searchPlaceholder="Search ports..."
                        emptyMessage={isLoadingPorts ? "Loading..." : "No ports found"}
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Port of Final Destination</Label>
                      <SearchableSelect
                        options={ports.map(port => ({
                          value: port.id.toString(),
                          label: `${port.seaPortName}${port.seaPortCode ? ` (${port.seaPortCode})` : ''} / ${port.airPortName}${port.airPortCode ? ` (${port.airPortCode})` : ''} - ${port.city}, ${port.country}`,
                        }))}
                        value={formData.portOfFinalDestination}
                        onValueChange={(v) => {
                          handleInputChange("portOfFinalDestination", v);
                          const selectedPort = ports.find(p => p.id.toString() === v);
                          setFormData(prev => ({ ...prev, portOfFinalDestinationId: selectedPort?.id }));
                        }}
                        placeholder="Select"
                        searchPlaceholder="Search ports..."
                        emptyMessage={isLoadingPorts ? "Loading..." : "No ports found"}
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Place of Delivery</Label>
                      <SearchableSelect
                        options={ports.map(port => ({
                          value: port.id.toString(),
                          label: `${port.seaPortName}${port.seaPortCode ? ` (${port.seaPortCode})` : ''} / ${port.airPortName}${port.airPortCode ? ` (${port.airPortCode})` : ''} - ${port.city}, ${port.country}`,
                        }))}
                        value={formData.placeOfDelivery}
                        onValueChange={(v) => handleInputChange("placeOfDelivery", v)}
                        placeholder="Select"
                        searchPlaceholder="Search ports..."
                        emptyMessage={isLoadingPorts ? "Loading..." : "No ports found"}
                      />
                    </div>
                  </div>
                </div>

                {/* Vessel & Schedule */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Vessel & Schedule</h4>
                  <div className="grid grid-cols-5 gap-4">
                    <div>
                      <Label className="text-sm">Vessel</Label>
                      <Input value={formData.vessel} onChange={(e) => handleInputChange("vessel", e.target.value)} placeholder="Vessel Name" />
                    </div>
                    <div>
                      <Label className="text-sm">Voyage</Label>
                      <Input value={formData.voyage} onChange={(e) => handleInputChange("voyage", e.target.value)} placeholder="Voyage No" />
                    </div>
                    <div>
                      <Label className="text-sm">ETD</Label>
                      <DateInput value={formData.etd} onChange={(v) => handleInputChange("etd", v)} />
                    </div>
                    <div>
                      <Label className="text-sm">ETA</Label>
                      <DateInput value={formData.eta} onChange={(v) => handleInputChange("eta", v)} />
                    </div>
                    <div className="flex items-end">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="2ndLeg"
                          checked={formData.secondLegVessel}
                          onCheckedChange={(checked) => handleInputChange("secondLegVessel", checked as boolean)}
                        />
                        <Label htmlFor="2ndLeg" className="text-sm">2nd Leg Vessel</Label>
                      </div>
                    </div>
                  </div>

                  {/* Conditional 2nd Leg */}
                  {formData.secondLegVessel && (
                    <div className="grid grid-cols-4 gap-4 pt-2">
                      <div>
                        <Label className="text-sm">2nd Leg Vessel</Label>
                        <Input
                          value={formData.secondLegVesselName}
                          onChange={(e) => handleInputChange("secondLegVesselName", e.target.value)}
                          placeholder="Vessel Name"
                        />
                      </div>
                      <div>
                        <Label className="text-sm">2nd Leg Voyage</Label>
                        <Input
                          value={formData.secondLegVoyage}
                          onChange={(e) => handleInputChange("secondLegVoyage", e.target.value)}
                          placeholder="Voyage No"
                        />
                      </div>
                      <div>
                        <Label className="text-sm">2nd Leg ETD</Label>
                        <DateInput
                          value={formData.secondLegETD}
                          onChange={(v) => handleInputChange("secondLegETD", v)}
                        />
                      </div>
                      <div>
                        <Label className="text-sm">2nd Leg ETA</Label>
                        <DateInput
                          value={formData.secondLegETA}
                          onChange={(v) => handleInputChange("secondLegETA", v)}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div className="space-y-2 pt-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Additional Notes</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm">Marks & Numbers</Label>
                      <Textarea value={formData.marksNumbers} onChange={(e) => handleInputChange("marksNumbers", e.target.value)} placeholder="Marks & Numbers" />
                    </div>
                    <div>
                      <Label className="text-sm">Notes</Label>
                      <Textarea value={formData.notes} onChange={(e) => handleInputChange("notes", e.target.value)} placeholder="Notes" />
                    </div>
                    <div>
                      <Label className="text-sm">Internal Notes</Label>
                      <Textarea value={formData.internalNotes} onChange={(e) => handleInputChange("internalNotes", e.target.value)} placeholder="Internal Notes" />
                    </div>
                  </div>
                </div>

                <Button
                  className="btn-success"
                  onClick={handleSaveShipment}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Update & Continue"
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Parties Tab */}
          <TabsContent value="parties" className="mt-0">
            <div className="bg-card border border-border rounded-lg p-6 space-y-6">
              <h3 className="text-emerald-600 font-semibold text-lg">Parties</h3>

              <div className="grid grid-cols-3 gap-4 items-end">
                <div>
                  <Label className="text-sm text-red-500">* Customer Type</Label>
                  <SearchableSelect
                    options={categoryTypes.map(ct => ({
                      value: ct.id.toString(),
                      label: ct.name,
                    }))}
                    value={selectedCategoryId}
                    onValueChange={(v) => setSelectedCategoryId(v)}
                    searchPlaceholder="Search types..."
                  />
                </div>
                <div>
                  <Label className="text-sm text-red-500">* Customer Name</Label>
                  <SearchableSelect
                    options={customers.map(customer => ({
                      value: customer.id.toString(),
                      label: `${customer.name} (${customer.code})`,
                    }))}
                    value={selectedCustomerId}
                    onValueChange={setSelectedCustomerId}
                    disabled={isLoadingCustomers}
                    placeholder={
                      isLoadingCustomers ? "Loading..." :
                      customers.length === 0 ? "No customers found" :
                      "Select a customer"
                    }
                    searchPlaceholder="Search customers..."
                  />
                </div>
                <div>
                  <Button
                    className="btn-success"
                    onClick={handleAddParty}
                    disabled={!selectedCustomer || addPartyMutation.isPending}
                  >
                    {addPartyMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Add Party
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-emerald-600 font-semibold">List All Parties</h4>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-table-header">
                      <TableHead className="text-table-header-foreground">Master Type</TableHead>
                      <TableHead className="text-table-header-foreground">Type</TableHead>
                      <TableHead className="text-table-header-foreground">Name</TableHead>
                      <TableHead className="text-table-header-foreground">Mobile</TableHead>
                      <TableHead className="text-table-header-foreground">Phone</TableHead>
                      <TableHead className="text-table-header-foreground">Email</TableHead>
                      <TableHead className="text-table-header-foreground">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parties.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No parties added yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      parties.map((party) => (
                        <TableRow
                          key={party.id}
                          className={
                            party.masterType === 'Debtors'
                              ? "bg-green-50 dark:bg-green-950/30"
                              : party.masterType === 'Creditors'
                                ? "bg-red-50 dark:bg-red-950/30"
                                : "bg-gray-50 dark:bg-gray-800/30"
                          }
                        >
                          <TableCell>{party.masterType}</TableCell>
                          <TableCell className="text-emerald-600">{party.customerCategoryName || "-"}</TableCell>
                          <TableCell className="text-emerald-600">{party.customerName}</TableCell>
                          <TableCell>{party.mobile || "-"}</TableCell>
                          <TableCell>{party.phone || "-"}</TableCell>
                          <TableCell className="text-emerald-600">{party.email || "-"}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 bg-red-500 hover:bg-red-600 text-white rounded"
                              onClick={() => handleDeleteParty(party.id, party.customerName)}
                              disabled={deletePartyMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          {/* Containers Tab */}
          <TabsContent value="containers" className="mt-0">
            <div className="bg-card border border-border rounded-lg p-6 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-emerald-600 font-semibold text-lg">Containers</h3>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">
                    {containers.length > 0
                      ? (() => {
                          const typeCount: Record<string, number> = {};
                          containers.forEach(c => {
                            const typeName = c.containerTypeName || 'N/A';
                            typeCount[typeName] = (typeCount[typeName] || 0) + 1;
                          });
                          const typeSummary = Object.entries(typeCount)
                            .map(([type, count]) => `${count} x ${type}`)
                            .join(', ');
                          const totalQty = containers.reduce((sum, c) => sum + (c.noOfPcs || 0), 0);
                          return `${typeSummary}, Total Quantity: ${totalQty}`;
                        })()
                      : 'No containers'}
                  </span>
                  <Button
                    className="btn-success"
                    onClick={() => {
                      setEditingContainer(null);
                      setContainerModalOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Container
                  </Button>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm">Show</span>
                  <SearchableSelect
                    options={[
                      { value: "10", label: "10" },
                      { value: "25", label: "25" },
                    ]}
                    value="10"
                    onValueChange={() => {}}
                    triggerClassName="w-[90px] h-8"
                  />
                  <span className="text-sm">entries</span>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-sm">Search:</Label>
                  <Input className="w-[200px] h-8" />
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow className="bg-table-header">
                    <TableHead className="text-table-header-foreground">S.No</TableHead>
                    <TableHead className="text-table-header-foreground">Container</TableHead>
                    <TableHead className="text-table-header-foreground">Type</TableHead>
                    <TableHead className="text-table-header-foreground">Seal No.</TableHead>
                    <TableHead className="text-table-header-foreground">No.of Pcs</TableHead>
                    <TableHead className="text-table-header-foreground">Type of Packages</TableHead>
                    <TableHead className="text-table-header-foreground">Gross Weight</TableHead>
                    <TableHead className="text-table-header-foreground">Volume</TableHead>
                    <TableHead className="text-table-header-foreground">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {containers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground py-8">No containers</TableCell>
                    </TableRow>
                  ) : (
                    containers.map((container, index) => (
                      <TableRow key={container.id} className={index % 2 === 0 ? "bg-card" : "bg-secondary/30"}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="text-emerald-600">{container.containerNumber}</TableCell>
                        <TableCell>{container.containerTypeName || '-'}</TableCell>
                        <TableCell className="text-emerald-600">{container.sealNo}</TableCell>
                        <TableCell>{container.noOfPcs}</TableCell>
                        <TableCell>{container.packageTypeName || '-'}</TableCell>
                        <TableCell>{container.grossWeight?.toFixed(3) || '0.000'}</TableCell>
                        <TableCell className="text-emerald-600">{container.volume?.toFixed(3) || '0.000'}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 btn-success rounded"
                              onClick={() => handleEditContainer(container, index)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 bg-red-500 hover:bg-red-600 text-white rounded"
                              onClick={() => handleDeleteContainer(container.id, container.containerNumber)}
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

              <div className="text-sm text-emerald-600">Showing {containers.length} entries</div>
            </div>
          </TabsContent>

          {/* Costing Tab */}
          <TabsContent value="costing" className="mt-0">
            <div className="bg-card border border-border rounded-lg p-6 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-emerald-600 font-semibold text-lg">Costing</h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="btn-success h-9 px-4"
                    onClick={() => {
                      setEditingCosting(null);
                      setCostingModalOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1.5" />
                    Create
                  </Button>
                  <Button
                    size="sm"
                    className="btn-success h-9 px-4"
                    onClick={() => setInvoiceModalOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-1.5" />
                    Generate Invoice
                  </Button>
                  <Button
                    size="sm"
                    className="btn-success h-9 px-4"
                    onClick={() => setPurchaseModalOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-1.5" />
                    Book Purchase Invoice
                  </Button>
                </div>
              </div>

              {/* Legend for color coding */}
              {costings.length > 0 && (
                <div className="flex gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 rounded bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-300"></div>
                    <span>Sale Invoiced</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 rounded bg-orange-100 dark:bg-orange-900/30 border border-orange-300"></div>
                    <span>Purchase Invoiced</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 rounded bg-violet-100 dark:bg-violet-900/30 border border-violet-300"></div>
                    <span>Both Invoiced</span>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-table-header">
                      <TableHead className="text-table-header-foreground">S.No</TableHead>
                      <TableHead className="text-table-header-foreground">Description</TableHead>
                      <TableHead className="text-table-header-foreground">Sale Quantity</TableHead>
                      <TableHead className="text-table-header-foreground">Sale Unit</TableHead>
                      <TableHead className="text-table-header-foreground">Currency</TableHead>
                      <TableHead className="text-table-header-foreground">Ex.Rate</TableHead>
                      <TableHead className="text-table-header-foreground">FCY Amount</TableHead>
                      <TableHead className="text-table-header-foreground">LCY Amount</TableHead>
                      <TableHead className="text-table-header-foreground">Cost Quantity</TableHead>
                      <TableHead className="text-table-header-foreground">Cost/Unit</TableHead>
                      <TableHead className="text-table-header-foreground">Currency</TableHead>
                      <TableHead className="text-table-header-foreground">Ex.Rate</TableHead>
                      <TableHead className="text-table-header-foreground">FCY Amount</TableHead>
                      <TableHead className="text-table-header-foreground">LCY Amount</TableHead>
                      <TableHead className="text-table-header-foreground">Unit</TableHead>
                      <TableHead className="text-table-header-foreground">GP</TableHead>
                      <TableHead className="text-table-header-foreground">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {costings.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={17} className="text-center text-muted-foreground py-8">No costing entries</TableCell>
                      </TableRow>
                    ) : (
                      costings.map((cost, index) => {
                        const saleHighlight = cost.saleInvoiced ? "bg-emerald-100 dark:bg-emerald-900/30" : "";
                        const costHighlight = cost.purchaseInvoiced ? "bg-orange-100 dark:bg-orange-900/30" : "";
                        return (
                        <TableRow key={cost.id} className={index % 2 === 0 ? "bg-card" : "bg-secondary/30"}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell className="text-emerald-600">{cost.description}</TableCell>
                          <TableCell className={saleHighlight}>{cost.saleQty}</TableCell>
                          <TableCell className={saleHighlight}>{cost.saleUnit}</TableCell>
                          <TableCell className={saleHighlight}>{cost.saleCurrencyCode}</TableCell>
                          <TableCell className={saleHighlight}>{cost.saleExRate}</TableCell>
                          <TableCell className={saleHighlight}>{cost.saleFCY?.toFixed(2)}</TableCell>
                          <TableCell className={`${saleHighlight} text-emerald-600`}>{cost.saleLCY?.toFixed(2)}</TableCell>
                          <TableCell className={costHighlight}>{cost.costQty}</TableCell>
                          <TableCell className={costHighlight}>{cost.costUnit}</TableCell>
                          <TableCell className={costHighlight}>{cost.costCurrencyCode}</TableCell>
                          <TableCell className={costHighlight}>{cost.costExRate}</TableCell>
                          <TableCell className={costHighlight}>{cost.costFCY?.toFixed(2)}</TableCell>
                          <TableCell className={costHighlight}>{cost.costLCY?.toFixed(2)}</TableCell>
                          <TableCell>{cost.unitName}</TableCell>
                          <TableCell className="text-emerald-600 font-semibold">{cost.gp?.toFixed(2)}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 btn-success rounded"
                                onClick={() => handleEditCosting(cost)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 bg-red-500 hover:bg-red-600 text-white rounded"
                                onClick={() => handleDeleteCosting(cost.id, cost.description)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Invoices Section */}
              <div className="mt-6 space-y-4">
                <h4 className="text-emerald-600 font-semibold">Invoices</h4>
                <div className="grid grid-cols-2 gap-6">
                  {/* Customer Invoices (Left) */}
                  <div className="border border-border rounded-lg p-4">
                    <h5 className="font-semibold mb-3 text-sm">Customer Invoices</h5>
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-table-header">
                          <TableHead className="text-table-header-foreground text-xs">Bill To</TableHead>
                          <TableHead className="text-table-header-foreground text-xs">P.Sale</TableHead>
                          <TableHead className="text-table-header-foreground text-xs">Voucher Number</TableHead>
                          <TableHead className="text-table-header-foreground text-xs">Status</TableHead>
                          <TableHead className="text-table-header-foreground text-xs w-20">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {!shipmentInvoices?.customerInvoices?.length ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground text-sm">No customer invoices</TableCell>
                          </TableRow>
                        ) : (
                          shipmentInvoices.customerInvoices.map((inv, index) => {
                            const statusDisplay = getPaymentStatusDisplay(inv.paymentStatus as PaymentStatus);
                            return (
                              <TableRow key={inv.id} className={index % 2 === 0 ? "bg-card" : "bg-secondary/30"}>
                                <TableCell className="text-xs">{inv.partyName || "-"}</TableCell>
                                <TableCell className="text-xs">{inv.currencyCode} {inv.amount.toFixed(2)}</TableCell>
                                <TableCell className="text-xs">
                                  <a href={`/accounts/invoices/${encodeURIComponent(inv.invoiceNo)}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                    {inv.invoiceNo}
                                  </a>
                                </TableCell>
                                <TableCell className="text-xs">
                                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${statusDisplay.className}`}>
                                    {statusDisplay.label}
                                  </span>
                                </TableCell>
                                <TableCell className="text-xs">
                                  <div className="flex gap-1">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={() => {
                                        setEditInvoiceId(inv.id);
                                        setInvoiceModalOpen(true);
                                      }}
                                    >
                                      <Edit className="h-3.5 w-3.5 text-primary" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={() => {
                                        setDeleteModalConfig({ type: 'invoice', id: inv.id, name: inv.invoiceNo });
                                        setDeleteModalOpen(true);
                                      }}
                                    >
                                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Vendor Invoices (Right) */}
                  <div className="border border-border rounded-lg p-4">
                    <h5 className="font-semibold mb-3 text-sm">Vendor Invoices</h5>
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-table-header">
                          <TableHead className="text-table-header-foreground text-xs">Vendor</TableHead>
                          <TableHead className="text-table-header-foreground text-xs">P.Cost</TableHead>
                          <TableHead className="text-table-header-foreground text-xs">Voucher Number</TableHead>
                          <TableHead className="text-table-header-foreground text-xs">Status</TableHead>
                          <TableHead className="text-table-header-foreground text-xs w-20">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {!shipmentInvoices?.vendorInvoices?.length ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground text-sm">No vendor invoices</TableCell>
                          </TableRow>
                        ) : (
                          shipmentInvoices.vendorInvoices.map((inv, index) => {
                            const statusDisplay = getPaymentStatusDisplay(inv.paymentStatus as PaymentStatus);
                            return (
                              <TableRow key={inv.id} className={index % 2 === 0 ? "bg-card" : "bg-secondary/30"}>
                                <TableCell className="text-xs">{inv.partyName || "-"}</TableCell>
                                <TableCell className="text-xs">{inv.currencyCode} {inv.amount.toFixed(2)}</TableCell>
                                <TableCell className="text-xs">
                                  <a href={`/accounts/purchase-invoices/${encodeURIComponent(inv.purchaseNo)}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                    {inv.purchaseNo}
                                  </a>
                                </TableCell>
                                <TableCell className="text-xs">
                                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${statusDisplay.className}`}>
                                    {statusDisplay.label}
                                  </span>
                                </TableCell>
                                <TableCell className="text-xs">
                                  <div className="flex gap-1">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={() => {
                                        setEditPurchaseInvoiceId(inv.id);
                                        setPurchaseModalOpen(true);
                                      }}
                                    >
                                      <Edit className="h-3.5 w-3.5 text-primary" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={() => {
                                        setDeleteModalConfig({ type: 'purchaseInvoice', id: inv.id, name: inv.purchaseNo });
                                        setDeleteModalOpen(true);
                                      }}
                                    >
                                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="flex justify-center">
                <div className="grid grid-cols-3 gap-8 bg-secondary/30 p-4 rounded-lg">
                  <div className="text-center">
                    <Label className="text-sm font-semibold">Total Sale</Label>
                    <div className="text-emerald-600 font-semibold">[ {baseCurrencyCode} {totalSale.toFixed(2)} ]</div>
                  </div>
                  <div className="text-center">
                    <Label className="text-sm font-semibold">Total Cost</Label>
                    <div className="text-foreground font-semibold">[ {baseCurrencyCode} {totalCost.toFixed(2)} ]</div>
                  </div>
                  <div className="text-center">
                    <Label className="text-sm font-semibold">Profit</Label>
                    <div className={`font-semibold ${(totalSale - totalCost) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      [ {baseCurrencyCode} {(totalSale - totalCost).toFixed(2)} ]
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Cargo Details Tab */}
          <TabsContent value="cargo-details" className="mt-0">
            <div className="bg-card border border-border rounded-lg p-6 space-y-6">
              <h3 className="text-emerald-600 font-semibold text-lg">Cargo Details</h3>

              {/* Add New Cargo Entry Form */}
              <div className="grid grid-cols-6 gap-4 items-end">
                <div>
                  <Label className="text-sm font-semibold">Quantity *</Label>
                  <Input
                    type="number"
                    value={newCargoEntry.quantity}
                    onChange={(e) => setNewCargoEntry(prev => ({ ...prev, quantity: e.target.value }))}
                    placeholder="Enter quantity"
                  />
                </div>
                <div>
                  <Label className="text-sm font-semibold">Package Type</Label>
                  <SearchableSelect
                    options={Object.entries(packageTypesByCategory).flatMap(([category, types]) =>
                      types.map(pt => ({
                        value: pt.id.toString(),
                        label: `${pt.code} - ${pt.name}`,
                      }))
                    )}
                    value={newCargoEntry.packageTypeId}
                    onValueChange={(v) => setNewCargoEntry(prev => ({ ...prev, packageTypeId: v }))}
                    placeholder="Select package type"
                    searchPlaceholder="Search package types..."
                  />
                </div>
                <div>
                  <Label className="text-sm font-semibold">Total CBM</Label>
                  <Input
                    type="number"
                    step="0.001"
                    value={newCargoEntry.totalCBM}
                    onChange={(e) => setNewCargoEntry(prev => ({ ...prev, totalCBM: e.target.value }))}
                    placeholder="0.000"
                  />
                </div>
                <div>
                  <Label className="text-sm font-semibold">Total Weight (KG)</Label>
                  <Input
                    type="number"
                    step="0.001"
                    value={newCargoEntry.totalWeight}
                    onChange={(e) => setNewCargoEntry(prev => ({ ...prev, totalWeight: e.target.value }))}
                    placeholder="0.000"
                  />
                </div>
                <div>
                  <Label className="text-sm font-semibold">Description</Label>
                  <Textarea value={newCargoEntry.description} onChange={(e) => setNewCargoEntry(prev => ({ ...prev, description: e.target.value }))} placeholder="Description" className="min-h-[40px]" />
                </div>
                <div>
                  <Button
                    className="btn-success"
                    onClick={handleAddCargo}
                    disabled={isSavingCargo}
                  >
                    {isSavingCargo ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Add Cargo
                  </Button>
                </div>
              </div>

              {/* Cargo List Table */}
              <Table>
                <TableHeader>
                  <TableRow className="bg-table-header">
                    <TableHead className="text-table-header-foreground">S.No</TableHead>
                    <TableHead className="text-table-header-foreground">Quantity</TableHead>
                    <TableHead className="text-table-header-foreground">Package Type</TableHead>
                    <TableHead className="text-table-header-foreground">Total CBM</TableHead>
                    <TableHead className="text-table-header-foreground">Total Weight</TableHead>
                    <TableHead className="text-table-header-foreground">Description</TableHead>
                    <TableHead className="text-table-header-foreground">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cargoDetails.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">No cargo details</TableCell>
                    </TableRow>
                  ) : (
                    cargoDetails.map((cargo, index) => (
                      <TableRow key={cargo.id || index} className={index % 2 === 0 ? "bg-card" : "bg-secondary/30"}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{cargo.quantity}</TableCell>
                        <TableCell>{cargo.packageTypeName || '-'}</TableCell>
                        <TableCell>{cargo.totalCBM?.toFixed(3) || '0.000'}</TableCell>
                        <TableCell>{cargo.totalWeight?.toFixed(3) || '0.000'}</TableCell>
                        <TableCell>{cargo.description || '-'}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 bg-red-500 hover:bg-red-600 text-white rounded"
                            onClick={() => handleDeleteCargo(cargo.id, cargo.description)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

            </div>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="mt-0">
            <div className="bg-card border border-border rounded-lg p-6 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-emerald-600 font-semibold text-lg">Documents</h3>
                <Button
                  className="btn-success"
                  onClick={() => {
                    setEditingDocument(null);
                    setDocumentModalMode("add");
                    setDocumentModalOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create
                </Button>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm">Show</span>
                  <SearchableSelect
                    options={[
                      { value: "10", label: "10" },
                      { value: "25", label: "25" },
                    ]}
                    value="10"
                    onValueChange={() => {}}
                    triggerClassName="w-[90px] h-8"
                  />
                  <span className="text-sm">entries</span>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-sm">Search:</Label>
                  <Input className="w-[200px] h-8" />
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow className="bg-table-header">
                    <TableHead className="text-table-header-foreground">S.No</TableHead>
                    <TableHead className="text-table-header-foreground">Document Type</TableHead>
                    <TableHead className="text-table-header-foreground">Document No</TableHead>
                    <TableHead className="text-table-header-foreground">Doc.Date</TableHead>
                    <TableHead className="text-table-header-foreground">File</TableHead>
                    <TableHead className="text-table-header-foreground">Remarks</TableHead>
                    <TableHead className="text-table-header-foreground">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">No data available in table</TableCell>
                    </TableRow>
                  ) : (
                    documents.map((doc, index) => (
                      <TableRow key={doc.id} className={index % 2 === 0 ? "bg-card" : "bg-secondary/30"}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{doc.documentTypeName || '-'}</TableCell>
                        <TableCell>{doc.documentNo}</TableCell>
                        <TableCell>{doc.docDate}</TableCell>
                        <TableCell>
                          {doc.filePath ? (
                            <a
                              href={fileApi.getDownloadUrl(doc.filePath)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:underline"
                            >
                              {doc.originalFileName || 'Download'}
                            </a>
                          ) : '-'}
                        </TableCell>
                        <TableCell>{doc.remarks || '-'}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 btn-success rounded"
                              onClick={() => handleEditDocument(doc)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 bg-red-500 hover:bg-red-600 text-white rounded"
                              onClick={() => handleDeleteDocument(doc)}
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

              <div className="text-sm text-muted-foreground">Showing 0 to 0 of 0 entries</div>
            </div>
          </TabsContent>

          {/* Shipment Status Tab */}
          <TabsContent value="shipment-status" className="mt-0">
            <div className="bg-card border border-border rounded-lg p-6 space-y-6">
              {/* Master Status Section */}
              <div className="flex justify-between items-center border-b border-border pb-4">
                <div className="flex items-center gap-4">
                  <Label className="text-sm font-semibold">Master Status:</Label>
                  <SearchableSelect
                    options={[
                      { value: "Opened", label: "Opened" },
                      { value: "Closed", label: "Closed" },
                      { value: "Cancelled", label: "Cancelled" },
                    ]}
                    value={formData.jobStatus || 'Opened'}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, jobStatus: value as ShipmentStatus }))}
                    triggerClassName="w-[180px] bg-background border-border"
                  />
                </div>
                <Button
                  className="btn-success"
                  onClick={handleSaveShipment}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Status"
                  )}
                </Button>
              </div>

              {/* Status History Header */}
              <div className="flex justify-between items-center">
                <h3 className="text-emerald-600 font-semibold text-lg">Status History / Tracking Events</h3>
                <Button
                  className="btn-success"
                  onClick={() => setStatusLogModalOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Event
                </Button>
              </div>

              {/* Status Timeline */}
              <StatusTimeline
                statusLogs={statusLogs}
                onDelete={handleDeleteStatusLogById}
              />
            </div>
          </TabsContent>
        </Tabs>
        )}
      </div>

      {/* Modals */}
      <ContainerModal
        open={containerModalOpen}
        onOpenChange={(open) => {
          setContainerModalOpen(open);
          if (!open) {
            setEditingContainer(null);
            setEditingContainerIndex(null);
          }
        }}
        container={editingContainer}
        onSave={handleSaveContainer}
        nextSNo={editingContainerIndex !== null ? editingContainerIndex + 1 : containers.length + 1}
      />

      <CostingModal
        open={costingModalOpen}
        onOpenChange={(open) => {
          setCostingModalOpen(open);
          if (!open) setEditingCosting(null);
        }}
        parties={parties}
        costing={editingCosting}
        onSave={handleSaveCosting}
      />

      <InvoiceModal
        open={invoiceModalOpen}
        onOpenChange={(open) => {
          setInvoiceModalOpen(open);
          if (!open) setEditInvoiceId(null);
        }}
        shipmentId={shipmentId}
        chargesDetails={costings}
        parties={parties}
        editInvoiceId={editInvoiceId}
        onSave={async () => {
          await queryClient.invalidateQueries({ queryKey: ['shipment-invoices', shipmentId] });
          await refetchShipment();
        }}
      />

      <PurchaseModal
        open={purchaseModalOpen}
        onOpenChange={(open) => {
          setPurchaseModalOpen(open);
          if (!open) setEditPurchaseInvoiceId(null);
        }}
        shipmentId={shipmentId}
        jobNumber={shipmentData?.jobNumber}
        chargesDetails={costings}
        parties={parties}
        editPurchaseInvoiceId={editPurchaseInvoiceId}
        onSave={async () => {
          await queryClient.invalidateQueries({ queryKey: ['shipment-invoices', shipmentId] });
          await refetchShipment();
        }}
      />

      <DocumentModal
        open={documentModalOpen}
        onOpenChange={setDocumentModalOpen}
        onSave={handleSaveDocument}
        document={editingDocument}
        mode={documentModalMode}
      />

      <StatusLogModal
        open={statusLogModalOpen}
        onOpenChange={setStatusLogModalOpen}
        onSave={handleAddStatusLogFromModal}
      />

      <DeleteConfirmationModal
        open={deleteModalOpen}
        onOpenChange={(open) => {
          setDeleteModalOpen(open);
          if (!open) setDeleteModalConfig(null);
        }}
        onConfirm={handleConfirmDelete}
        title={
          deleteModalConfig?.type === 'party' ? 'Delete Party' :
          deleteModalConfig?.type === 'container' ? 'Delete Container' :
          deleteModalConfig?.type === 'costing' ? 'Delete Costing' :
          deleteModalConfig?.type === 'cargo' ? 'Delete Cargo' :
          deleteModalConfig?.type === 'document' ? 'Delete Document' :
          deleteModalConfig?.type === 'statusLog' ? 'Delete Status Event' :
          deleteModalConfig?.type === 'invoice' ? 'Delete Invoice' :
          deleteModalConfig?.type === 'purchaseInvoice' ? 'Delete Purchase Invoice' : 'Delete Item'
        }
        itemName={deleteModalConfig?.name}
        isLoading={isDeleting}
      />

      {/* Warning Modal */}
      <AlertDialog open={warningModalOpen} onOpenChange={setWarningModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              Warning
            </AlertDialogTitle>
            <AlertDialogDescription>{warningMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setWarningModalOpen(false)}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
};

export default ShipmentDetail;
