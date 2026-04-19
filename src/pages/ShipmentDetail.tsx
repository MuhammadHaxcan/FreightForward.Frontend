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
import { Edit, Trash2, Plus, Loader2, AlertTriangle, Eye, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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
import { ShipmentJourneyCalendar } from "@/components/shipments/ShipmentJourneyCalendar";
import { CustomsTab } from "@/components/shipments/CustomsTab";
import { DeleteConfirmationModal } from "@/components/ui/delete-confirmation-modal";
import { toast } from "sonner";
import { getTodayDateOnly } from "@/lib/utils";
import {
  useShipmentByIdentifier,
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
import { useAllCustomerCategoryTypes, useAllIncoTerms, useAllPackageTypes, useAllPorts } from "@/hooks/useSettings";
import { CargoContainerTab, CargoFormEntry } from "@/components/shipments/CargoContainerTab";
import { calculateCbm } from "@/lib/cargoCalculations";
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
  ShipmentType,
  BLServiceType,
  FreightType,
  PaymentStatus,
} from "@/services/api";
import { hrEmployeeApi } from "@/services/api/hr";
import { interactionAuditApi } from "@/services/api/interactionAudit";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { OfficeInteractionAuditEventRequest } from "@/types/auth";

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
    'Courier': 'Courier',
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
    'Courier': 'Courier',
  };
  return map[mode] || mode;
};

const mapDisplayToDirection = (direction: string): string => {
  return direction === 'Cross-Trade' ? 'CrossTrade' : direction;
};

const mapShipmentType = (type: string): ShipmentType => {
  const map: Record<string, ShipmentType> = {
    'Console Shipment': 'ConsoleShipment',
    'Non-Console Shipment': 'NonConsoleShipment',
  };
  return map[type] || 'NonConsoleShipment';
};

const mapShipmentTypeToDisplay = (type: string): string => {
  const map: Record<string, string> = {
    'ConsoleShipment': 'Console Shipment',
    'NonConsoleShipment': 'Non-Console Shipment',
  };
  return map[type] || type;
};

// Helper to format port label based on selected mode
const getPortLabel = (port: { seaPortName?: string; seaPortCode?: string; airPortName?: string; airPortCode?: string; city?: string; country?: string }, mode: string): string => {
  if (mode === 'Air Freight') {
    return `${port.airPortName || ''}${port.airPortCode ? ` (${port.airPortCode})` : ''} - ${port.city}, ${port.country}`;
  }
  return `${port.seaPortName || ''}${port.seaPortCode ? ` (${port.seaPortCode})` : ''} - ${port.city}, ${port.country}`;
};

const createAuditCorrelationId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
};

const getCurrentAuditRoute = (): string => {
  if (typeof window === "undefined") {
    return "/shipments";
  }
  return `${window.location.pathname}${window.location.search}`;
};

const postInteractionOutcome = (payload: OfficeInteractionAuditEventRequest): void => {
  void interactionAuditApi.postOfficeInteractionEvent(payload);
};

// Empty initial form data
const emptyFormData = {
  jobNumber: "",
  jobDate: "",
  jobStatus: "",
  direction: "",
  mode: "",
  shipmentType: "",
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
  salesperson: "",
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

const emptyCargoEntry: CargoFormEntry = {
  quantity: "",
  packageTypeId: "",
  loadType: "",
  length: "",
  width: "",
  height: "",
  volumeUnit: "cm",
  weight: "",
  weightUnit: "kg",
  totalCBM: "",
  totalWeight: "",
  description: "",
};


const ShipmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const queryClient = useQueryClient();

  // Fetch shipment data from API
  const { data: shipmentData, isLoading: isLoadingShipment, error: shipmentError, refetch: refetchShipment } = useShipmentByIdentifier(id || '');

  // Numeric ID for mutations — derived from loaded shipment data
  const shipmentId = shipmentData?.id ?? 0;

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
  const [newCargoEntry, setNewCargoEntry] = useState<CargoFormEntry>(emptyCargoEntry);
  const [cargoCalculationMode, setCargoCalculationMode] = useState("units");
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

  // Reports dialog state
  const [showReportsDialog, setShowReportsDialog] = useState(false);

  // Warning modal state
  const [warningModalOpen, setWarningModalOpen] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");

  // Reset transient UI state when route switches to a different shipment.
  useEffect(() => {
    setActiveTab("shipment-info");
    setSelectedCategoryId("");
    setSelectedCustomerId("");
    setContainerModalOpen(false);
    setCostingModalOpen(false);
    setInvoiceModalOpen(false);
    setPurchaseModalOpen(false);
    setDocumentModalOpen(false);
    setDocumentModalMode("add");
    setEditingDocument(null);
    setEditingContainer(null);
    setEditingCosting(null);
    setEditInvoiceId(null);
    setEditPurchaseInvoiceId(null);
    setDeleteModalOpen(false);
    setDeleteModalConfig(null);
    setWarningModalOpen(false);
    setWarningMessage("");
    setShowReportsDialog(false);
    setStatusLogModalOpen(false);
    setCargoCalculationMode("units");
    setNewCargoEntry(emptyCargoEntry);
    setIsSaving(false);
    setIsSavingCargo(false);
    setIsDeleting(false);
  }, [id]);

  // Fetch shipment invoices
  const { data: shipmentInvoicesResponse } = useQuery({
    queryKey: ['shipment-invoices', shipmentId],
    queryFn: () => shipmentApi.getInvoices(shipmentId),
    enabled: shipmentId > 0,
  });
  const shipmentInvoices = shipmentInvoicesResponse?.data;

  // Fetch customer category types
  const { data: categoryTypes = [] } = useAllCustomerCategoryTypes();

  // Fetch INCO terms
  const { data: incoTerms = [], isLoading: isLoadingIncoTerms } = useAllIncoTerms();

  // Fetch Package Types for cargo dropdown
  const { data: packageTypes = [] } = useAllPackageTypes();

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

  // Fetch Employees for Assign To dropdown
  const { data: employeesResponse, isLoading: isLoadingEmployees } = useQuery({
    queryKey: ['employees', 'dropdown'],
    queryFn: () => hrEmployeeApi.getDropdown(),
    staleTime: 60 * 60 * 1000,
  });
  const employees = useMemo(() => employeesResponse?.data ?? [], [employeesResponse?.data]);

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
  const { data: ports = [], isLoading: isLoadingPorts } = useAllPorts();

  // Get data from shipmentData
  const containers = shipmentData?.containers || [];
  const costings = shipmentData?.costings || [];
  const parties = shipmentData?.parties || [];

  // Parse selected category ID for customer filtering
  const parsedCategoryId = selectedCategoryId ? parseInt(selectedCategoryId) : undefined;

  // Fetch customers filtered by the selected category ID (only when a type is selected)
  const { data: customersData, isLoading: isLoadingCustomers } = useCustomers({
    pageSize: 1000,
    categoryId: parsedCategoryId,
    enabled: !!selectedCategoryId,
  });

  // Get the list of customers
  const customers = useMemo(
    () => (customersData?.items || []).filter((customer) => (customer.status || "Active").toLowerCase() !== "inactive"),
    [customersData]
  );

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
        shipmentType: mapShipmentTypeToDisplay(shipmentData.shipmentType || 'NonConsoleShipment'),
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
        salesperson: shipmentData.salesperson || '',
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

  const handleAddParty = async () => {
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

    const auditBase: OfficeInteractionAuditEventRequest = {
      eventType: "ActionAttempted",
      route: getCurrentAuditRoute(),
      targetType: "button",
      targetLabel: "Add Party",
      entityType: "ShipmentParty",
      entityReference: selectedCustomer.name,
      correlationId: createAuditCorrelationId(),
    };

    try {
      const partyId = await addPartyMutation.mutateAsync({
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

      postInteractionOutcome({
        ...auditBase,
        entityId: partyId.toString(),
        outcome: "Succeeded",
        outcomeStatusCode: 200,
        outcomeMessage: `Party added (${selectedCustomer.masterType})`,
      });

      setSelectedCustomerId("");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to add party";
      postInteractionOutcome({
        ...auditBase,
        outcome: "Failed",
        outcomeStatusCode: 500,
        outcomeMessage: errorMessage,
      });
    }
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
      const auditBase: OfficeInteractionAuditEventRequest = {
        eventType: "ActionAttempted",
        route: getCurrentAuditRoute(),
        targetType: "button",
        targetLabel: editingCosting ? "Update Costing" : "Add Costing",
        entityType: "ShipmentCosting",
        entityReference: costingData.description || undefined,
        correlationId: createAuditCorrelationId(),
      };

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

        postInteractionOutcome({
          ...auditBase,
          entityId: editingCosting.id.toString(),
          outcome: "Succeeded",
          outcomeStatusCode: 200,
          outcomeMessage: "Costing updated",
        });
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

        const costingId = await addCostingMutation.mutateAsync({ shipmentId, data });
        postInteractionOutcome({
          ...auditBase,
          entityId: costingId.toString(),
          outcome: "Succeeded",
          outcomeStatusCode: 200,
          outcomeMessage: "Costing added",
        });
      }
      setCostingModalOpen(false);
      setEditingCosting(null);
      refetchShipment();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to save costing";
      postInteractionOutcome({
        eventType: "ActionAttempted",
        route: getCurrentAuditRoute(),
        targetType: "button",
        targetLabel: editingCosting ? "Update Costing" : "Add Costing",
        entityType: "ShipmentCosting",
        entityId: editingCosting?.id?.toString(),
        entityReference: costingData.description || undefined,
        correlationId: createAuditCorrelationId(),
        outcome: "Failed",
        outcomeStatusCode: 500,
        outcomeMessage: errorMessage,
      });
      // Error toast already handled by mutation
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
      const qty = parseInt(newCargoEntry.quantity) || 0;
      const cbm = calculateCbm(
        parseFloat(newCargoEntry.length) || undefined,
        parseFloat(newCargoEntry.width) || undefined,
        parseFloat(newCargoEntry.height) || undefined,
        newCargoEntry.volumeUnit
      );
      const request: AddShipmentCargoRequest = {
        calculationMode: cargoCalculationMode,
        quantity: qty,
        packageTypeId: newCargoEntry.packageTypeId ? parseInt(newCargoEntry.packageTypeId) : null,
        loadType: newCargoEntry.loadType || undefined,
        length: parseFloat(newCargoEntry.length) || null,
        width: parseFloat(newCargoEntry.width) || null,
        height: parseFloat(newCargoEntry.height) || null,
        volumeUnit: newCargoEntry.volumeUnit || undefined,
        cbm: cbm ?? null,
        weight: parseFloat(newCargoEntry.weight) || null,
        weightUnit: newCargoEntry.weightUnit || undefined,
        totalCBM: cargoCalculationMode === "shipment"
          ? (parseFloat(newCargoEntry.totalCBM) || null)
          : (cbm != null ? cbm * qty : null),
        totalWeight: parseFloat(newCargoEntry.totalWeight) || null,
        description: newCargoEntry.description || undefined,
      };

      const response = await shipmentApi.addCargo(shipmentId, request);
      if (response.data) {
        const newCargo: ShipmentCargo = {
          id: response.data,
          calculationMode: request.calculationMode,
          quantity: request.quantity,
          packageTypeId: request.packageTypeId || undefined,
          packageTypeName: selectedPackageType?.name,
          loadType: request.loadType,
          length: request.length || undefined,
          width: request.width || undefined,
          height: request.height || undefined,
          volumeUnit: request.volumeUnit,
          cbm: request.cbm || undefined,
          weight: request.weight || undefined,
          weightUnit: request.weightUnit,
          totalCBM: request.totalCBM || undefined,
          totalWeight: request.totalWeight || undefined,
          description: request.description,
        };
        setCargoDetails(prev => [...prev, newCargo]);
        setNewCargoEntry({
          quantity: "", packageTypeId: "", loadType: "", length: "", width: "", height: "",
          volumeUnit: "cm", weight: "", weightUnit: "kg", totalCBM: "", totalWeight: "", description: "",
        });
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
          break;
        case 'purchaseInvoice':
          await deletePurchaseInvoiceMutation.mutateAsync(deleteModalConfig.id);
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
          shipmentType: mapShipmentType(formData.shipmentType),
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
          salesperson: formData.salesperson || undefined,
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

  const isFCL = formData.mode === 'Sea Freight FCL';
  const isLCL = formData.mode === 'Sea Freight LCL';

  const totalContainerQty = containers.reduce((sum, c) => sum + (c.noOfPcs || 0), 0);
  const containerSummary = containers.length > 0
    ? (() => {
        const typeCount: Record<string, number> = {};
        containers.forEach(c => {
          const typeName = c.containerTypeName || 'N/A';
          typeCount[typeName] = (typeCount[typeName] || 0) + 1;
        });
        const typeSummary = Object.entries(typeCount)
          .map(([type, count]) => `${count} x ${type}`)
          .join(', ');
        return `${typeSummary}, Total Quantity: ${totalContainerQty}`;
      })()
    : "No containers";

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
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => setShowReportsDialog(true)}
            >
              <FileText className="h-4 w-4 mr-2" />
              Reports
            </Button>
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
              value="cargo-containers"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6 py-2.5"
            >
              {(isFCL || isLCL) ? "Cargo & Containers" : "Cargo Details"}
            </TabsTrigger>
            <TabsTrigger
              value="costing"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6 py-2.5"
            >
              Costing
            </TabsTrigger>
            <TabsTrigger 
              value="documents"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6 py-2.5"
            >
              Documents
            </TabsTrigger>
            <TabsTrigger
              value="customs"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6 py-2.5"
            >
              Customs
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
                <div className="grid grid-cols-7 gap-4">
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
                        { value: "Courier", label: "Courier" },
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
                    <Label className="text-sm">Shipment Type</Label>
                    <SearchableSelect
                      options={[
                        { value: "Console Shipment", label: "Console Shipment" },
                        { value: "Non-Console Shipment", label: "Non-Console Shipment" },
                      ]}
                      value={formData.shipmentType}
                      onValueChange={(v) => handleInputChange("shipmentType", v)}
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
                <div className="grid grid-cols-5 gap-4 pt-2">
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
                  <div>
                    <Label className="text-sm">Salesperson</Label>
                    <SearchableSelect
                      options={employees.map(emp => ({
                        value: emp.fullName,
                        label: `${emp.employeeCode} - ${emp.fullName}`,
                      }))}
                      value={formData.salesperson}
                      onValueChange={(v) => handleInputChange("salesperson", v)}
                      placeholder="Select"
                      searchPlaceholder="Search employees..."
                      emptyMessage={isLoadingEmployees ? "Loading..." : "No employees found"}
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
                          label: getPortLabel(port, formData.mode),
                        }))}
                        value={formData.placeOfReceipt}
                        onValueChange={(v) => {
                          handleInputChange("placeOfReceipt", v);
                          const selectedPort = ports.find(p => p.id.toString() === v);
                          setFormData(prev => ({ ...prev, placeOfReceiptId: selectedPort?.id }));
                        }}
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
                          label: getPortLabel(port, formData.mode),
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
                          label: getPortLabel(port, formData.mode),
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
                          label: getPortLabel(port, formData.mode),
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
                          label: getPortLabel(port, formData.mode),
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
                          label: getPortLabel(port, formData.mode),
                        }))}
                        value={formData.placeOfDelivery}
                        onValueChange={(v) => {
                          handleInputChange("placeOfDelivery", v);
                          const selectedPort = ports.find(p => p.id.toString() === v);
                          setFormData(prev => ({ ...prev, placeOfDeliveryId: selectedPort?.id }));
                        }}
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
                    options={selectedCategoryId ? customers.map(customer => ({
                      value: customer.id.toString(),
                      label: `${customer.name} (${customer.code})`,
                    })) : []}
                    value={selectedCustomerId}
                    onValueChange={setSelectedCustomerId}
                    disabled={!selectedCategoryId || isLoadingCustomers}
                    placeholder={
                      !selectedCategoryId ? "Select a customer type first" :
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
                    data-audit-track="action"
                    data-audit-entity="ShipmentParty"
                    data-audit-label="Add Party"
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
                              className="h-8 w-8 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded"
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

          {/* Cargo & Containers Tab */}
          <TabsContent value="cargo-containers" className="mt-0">
            <CargoContainerTab
              showContainers={isFCL || isLCL}
              containers={containers}
              containerSummary={containerSummary}
              onAddContainer={() => { setEditingContainer(null); setContainerModalOpen(true); }}
              onEditContainer={handleEditContainer}
              onDeleteContainer={handleDeleteContainer}
              cargoDetails={cargoDetails}
              newCargoEntry={newCargoEntry}
              onNewCargoEntryChange={setNewCargoEntry}
              cargoCalculationMode={cargoCalculationMode}
              onCargoCalculationModeChange={setCargoCalculationMode}
              onAddCargo={handleAddCargo}
              onDeleteCargo={handleDeleteCargo}
              isSavingCargo={isSavingCargo}
              isShipmentSaved={true}
              packageTypesByCategory={packageTypesByCategory}
            />
          </TabsContent>

          {/* Costing Tab */}
          <TabsContent value="costing" className="mt-0">
            <div className="bg-card border border-border rounded-lg p-6 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-emerald-600 font-semibold text-lg">Costing</h3>
                <div className="flex gap-2">
                  <Button
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
                      <TableHead className="text-table-header-foreground">Sale (Qty × Unit)</TableHead>
                      <TableHead className="text-table-header-foreground">Currency</TableHead>
                      <TableHead className="text-table-header-foreground">Ex.Rate</TableHead>
                      <TableHead className="text-table-header-foreground">FCY Amount</TableHead>
                      <TableHead className="text-table-header-foreground">LCY Amount</TableHead>
                      <TableHead className="text-table-header-foreground">Cost (Qty × Unit)</TableHead>
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
                        <TableCell colSpan={15} className="text-center text-muted-foreground py-8">No costing entries</TableCell>
                      </TableRow>
                    ) : (
                      costings.map((cost, index) => {
                        const bothInvoiced = cost.saleInvoiced && cost.purchaseInvoiced;
                        const saleHighlight = bothInvoiced ? "bg-violet-100 dark:bg-violet-900/30" : cost.saleInvoiced ? "bg-emerald-100 dark:bg-emerald-900/30" : "";
                        const costHighlight = bothInvoiced ? "bg-violet-100 dark:bg-violet-900/30" : cost.purchaseInvoiced ? "bg-orange-100 dark:bg-orange-900/30" : "";
                        return (
                        <TableRow key={cost.id} className={index % 2 === 0 ? "bg-card" : "bg-secondary/30"}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell className="text-emerald-600">{cost.description}</TableCell>
                          <TableCell className={saleHighlight}>{cost.saleQty} × {cost.saleUnit}</TableCell>
                          <TableCell className={saleHighlight}>{cost.saleCurrencyCode}</TableCell>
                          <TableCell className={saleHighlight}>{cost.saleExRate}</TableCell>
                          <TableCell className={saleHighlight}>{cost.saleFCY?.toFixed(2)}</TableCell>
                          <TableCell className={`${saleHighlight} text-emerald-600`}>{cost.saleLCY?.toFixed(2)}</TableCell>
                          <TableCell className={costHighlight}>{cost.costQty} × {cost.costUnit}</TableCell>
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
                                className={`h-8 w-8 rounded ${cost.saleInvoiced && cost.purchaseInvoiced ? "bg-slate-500 hover:bg-slate-600 text-white" : "btn-success"}`}
                                onClick={() => handleEditCosting(cost)}
                              >
                                {cost.saleInvoiced && cost.purchaseInvoiced ? <Eye className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded"
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
                                      onClick={() => window.open(`/accounts/invoices/${encodeURIComponent(inv.invoiceNo)}/edit`, "_blank")}
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
                              className="h-8 w-8 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded"
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
          {/* Customs Tab */}
          <TabsContent value="customs" className="mt-0">
            <CustomsTab shipmentId={shipmentId} />
          </TabsContent>

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

              {/* Journey Calendar */}
              <ShipmentJourneyCalendar
                etd={formData.etd || undefined}
                eta={formData.eta || undefined}
              />

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

      {/* Reports Dialog */}
      <Dialog open={showReportsDialog} onOpenChange={setShowReportsDialog}>
        <DialogContent className="max-w-md p-0 bg-card">
          <DialogHeader className="bg-modal-header text-white p-4 rounded-t-lg">
            <DialogTitle className="text-white text-lg">Shipment Reports</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2 text-sm font-semibold w-12">No.</th>
                  <th className="text-left py-2 px-2 text-sm font-semibold">Report Name</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { no: 1, name: "CARGO MANIFEST", slug: "cargo-manifest" },
                  { no: 2, name: "PROOF OF DELIVERY", slug: "proof-of-delivery" },
                  { no: 3, name: "CARGO ARRIVAL", slug: "cargo-arrival-notice" },
                  { no: 4, name: "FREIGHT CERTIFICATE", slug: "freight-certificate" },
                  { no: 5, name: "MBL SHIPPING", slug: "mbl-shipping-instruction" },
                  { no: 6, name: "CUSTOMS DECLARATION", slug: "customs-declaration" },
                ].map((report) => (
                  <tr key={report.slug} className="border-b hover:bg-muted/50">
                    <td className="py-2 px-2 text-sm">{report.no}</td>
                    <td className="py-2 px-2">
                      <button
                        className="text-emerald-600 hover:text-emerald-700 hover:underline font-medium text-sm"
                        onClick={() => window.open(`/shipments/${id}/reports/${report.slug}`, '_blank')}
                      >
                        {report.name}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <DialogFooter className="p-4 pt-0">
            <Button variant="outline" onClick={() => setShowReportsDialog(false)} className="mx-auto">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default ShipmentDetail;
