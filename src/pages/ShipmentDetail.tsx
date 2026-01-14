import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { DateInput } from "@/components/ui/date-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Edit, Trash2, Plus, Loader2 } from "lucide-react";
import { ContainerModal } from "@/components/shipments/ContainerModal";
import { CostingModal } from "@/components/shipments/CostingModal";
import { InvoiceModal } from "@/components/shipments/InvoiceModal";
import { PurchaseModal } from "@/components/shipments/PurchaseModal";
import { DeleteConfirmationModal } from "@/components/ui/delete-confirmation-modal";
import { toast } from "sonner";
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
import { useCustomers } from "@/hooks/useCustomers";
import {
  PartyType,
  MasterType,
  Customer,
  shipmentApi,
  settingsApi,
  ShipmentInvoicesResult,
  AddShipmentContainerRequest,
  UpdateShipmentContainerRequest,
  AddShipmentCostingRequest,
  UpdateShipmentCostingRequest,
  ShipmentContainer,
  ShipmentCosting,
  Currency,
} from "@/services/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";

// Map PartyType to category code for finding category ID
const partyTypeToCategoryCode: Record<PartyType, string> = {
  // Primary Party Types
  Shipper: 'Shipper',
  Consignee: 'Consignee',
  Buyer: 'Buyer',
  Supplier: 'Supplier',
  Customer: 'Customer',
  BookingParty: 'BookingParty',
  NotifyParty: 'NotifyParty',
  // Agents & Forwarders
  Forwarder: 'Forwarder',
  CoLoader: 'CoLoader',
  Transporter: 'Transporter',
  Courier: 'Courier',
  ClearingAgent: 'ClearingAgent',
  DeliveryAgent: 'DeliveryAgent',
  OriginAgent: 'OriginAgent',
  OverseasAgents: 'OverseasAgents',
  // Carriers
  ShippingLine: 'ShippingLine',
  AirLine: 'AirLine',
  // Facilities
  Warehouse: 'Warehouse',
  CFS: 'CFS',
  Terminal: 'Terminal',
  // Government & Financial
  Customs: 'Customs',
  Bank: 'Bank',
  // Neutral Types
  Neutral: 'Neutral',
  ShipperNeutral: 'ShipperNeutral',
  ConsigneeNeutral: 'ConsigneeNeutral',
  BuyerNeutral: 'BuyerNeutral',
  SupplierNeutral: 'SupplierNeutral',
  NotifyPartyNeutral: 'NotifyPartyNeutral',
  CustomerNeutral: 'CustomerNeutral',
};

// Display labels for party types
const partyTypeLabels: Record<PartyType, string> = {
  // Primary Party Types
  Shipper: 'Shipper',
  Consignee: 'Consignee',
  Buyer: 'Buyer',
  Supplier: 'Supplier',
  Customer: 'Customer',
  BookingParty: 'Booking Party',
  NotifyParty: 'Notify Party',
  // Agents & Forwarders
  Forwarder: 'Forwarder',
  CoLoader: 'Co-loader',
  Transporter: 'Transporter',
  Courier: 'Courier',
  ClearingAgent: 'Clearing Agent',
  DeliveryAgent: 'Delivery Agent',
  OriginAgent: 'Origin Agent',
  OverseasAgents: 'Overseas Agents',
  // Carriers
  ShippingLine: 'Shipping Line',
  AirLine: 'Air Line',
  // Facilities
  Warehouse: 'Warehouse',
  CFS: 'CFS',
  Terminal: 'Terminal',
  // Government & Financial
  Customs: 'Customs',
  Bank: 'Bank',
  // Neutral Types
  Neutral: 'Neutral',
  ShipperNeutral: 'Shipper (Neutral)',
  ConsigneeNeutral: 'Consignee (Neutral)',
  BuyerNeutral: 'Buyer (Neutral)',
  SupplierNeutral: 'Supplier (Neutral)',
  NotifyPartyNeutral: 'Notify Party (Neutral)',
  CustomerNeutral: 'Customer (Neutral)',
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
  transportModeId: undefined as number | undefined,
  incoterms: "",
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


// All available party types (grouped logically)
const partyTypes: PartyType[] = [
  // Primary Party Types
  'Shipper',
  'Consignee',
  'Buyer',
  'Supplier',
  'Customer',
  'BookingParty',
  'NotifyParty',
  // Agents & Forwarders
  'Forwarder',
  'CoLoader',
  'Transporter',
  'Courier',
  'ClearingAgent',
  'DeliveryAgent',
  'OriginAgent',
  'OverseasAgents',
  // Carriers
  'ShippingLine',
  'AirLine',
  // Facilities
  'Warehouse',
  'CFS',
  'Terminal',
  // Government & Financial
  'Customs',
  'Bank',
  // Neutral Types
  'Neutral',
  'ShipperNeutral',
  'ConsigneeNeutral',
  'BuyerNeutral',
  'SupplierNeutral',
  'NotifyPartyNeutral',
  'CustomerNeutral',
];

const ShipmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const shipmentId = parseInt(id || '0');

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
  const [selectedPartyType, setSelectedPartyType] = useState<PartyType>('Shipper');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [cargoDetails, setCargoDetails] = useState<any[]>([]);
  const [newCargoEntry, setNewCargoEntry] = useState({ quantity: "", loadType: "", totalCBM: "", totalWeight: "", description: "" });
  const [documents, setDocuments] = useState<any[]>([]);
  const [shipmentStatus, setShipmentStatus] = useState({ date: "2025-12-26", remarks: "" });
  const [isSaving, setIsSaving] = useState(false);

  // Modal states
  const [containerModalOpen, setContainerModalOpen] = useState(false);
  const [costingModalOpen, setCostingModalOpen] = useState(false);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [editingContainer, setEditingContainer] = useState<ShipmentContainer | null>(null);
  const [editingCosting, setEditingCosting] = useState<ShipmentCosting | null>(null);

  // Delete confirmation modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteModalConfig, setDeleteModalConfig] = useState<{
    type: 'party' | 'container' | 'costing';
    id: number;
    name?: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
  const { data: incoTermsResponse } = useQuery({
    queryKey: ['incoTerms', 'all'],
    queryFn: () => settingsApi.getAllIncoTerms(),
    staleTime: 60 * 60 * 1000, // Cache for 1 hour (INCO terms rarely change)
  });
  const incoTerms = useMemo(() => incoTermsResponse?.data ?? [], [incoTermsResponse?.data]);

  // Fetch Network Partners
  const { data: networkPartnersResponse } = useQuery({
    queryKey: ['networkPartners', 'all'],
    queryFn: () => settingsApi.getAllNetworkPartners(),
    staleTime: 60 * 60 * 1000, // Cache for 1 hour
  });
  const networkPartners = useMemo(() => networkPartnersResponse?.data ?? [], [networkPartnersResponse?.data]);

  // Fetch Transport Modes
  const { data: transportModesResponse } = useQuery({
    queryKey: ['transportModes', 'all'],
    queryFn: () => settingsApi.getAllTransportModes(),
    staleTime: 60 * 60 * 1000, // Cache for 1 hour
  });
  const transportModes = useMemo(() => transportModesResponse?.data ?? [], [transportModesResponse?.data]);

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
  const { data: portsResponse } = useQuery({
    queryKey: ['ports', 'all'],
    queryFn: () => settingsApi.getAllPorts(),
    staleTime: 60 * 60 * 1000, // Cache for 1 hour
  });
  const ports = useMemo(() => portsResponse?.data ?? [], [portsResponse?.data]);

  // Get data from shipmentData
  const containers = shipmentData?.containers || [];
  const costings = shipmentData?.costings || [];
  const parties = shipmentData?.parties || [];

  // Get the category ID for the selected party type
  const selectedCategoryId = useMemo(() => {
    const categoryCode = partyTypeToCategoryCode[selectedPartyType];
    if (!categoryCode) return undefined;
    const category = categoryTypes.find(c => c.code === categoryCode || c.name === categoryCode);
    return category?.id;
  }, [selectedPartyType, categoryTypes]);

  // Fetch customers filtered by the selected category ID
  const { data: customersData, isLoading: isLoadingCustomers } = useCustomers({
    pageSize: 100,
    categoryId: selectedCategoryId,
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
        transportModeId: shipmentData.transportModeId,
        incoterms: shipmentData.incoterms || '',
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
        portOfReceipt: shipmentData.portOfReceiptName || '',
        portOfLoadingId: shipmentData.portOfLoadingId,
        portOfLoading: shipmentData.portOfLoadingName || '',
        portOfDischargeId: shipmentData.portOfDischargeId,
        portOfDischarge: shipmentData.portOfDischargeName || '',
        portOfFinalDestinationId: shipmentData.portOfFinalDestinationId,
        portOfFinalDestination: shipmentData.portOfFinalDestinationName || '',
        placeOfReceipt: shipmentData.placeOfReceipt || '',
        placeOfDelivery: shipmentData.placeOfDelivery || '',
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
    }
  }, [shipmentData]);

  // Reset selected customer when party type changes
  useEffect(() => {
    setSelectedCustomerId("");
  }, [selectedPartyType]);

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

    // Check if customer is already added (prevent duplicates)
    const existingParty = parties.find(p => p.customerId === selectedCustomer.id);
    if (existingParty) {
      toast.error(`${selectedCustomer.name} is already added as ${partyTypeLabels[existingParty.partyType]}`);
      return;
    }

    addPartyMutation.mutate({
      shipmentId,
      data: {
        shipmentId,
        masterType: selectedCustomer.masterType,
        partyType: selectedPartyType,
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
  const handleSaveContainer = async (containerData: any) => {
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
  const handleSaveCosting = async (costingData: any) => {
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
          saleCurrency: costingData.saleCurrency as Currency,
          saleExRate: parseFloat(costingData.saleExRate) || 1,
          saleFCY: parseFloat(costingData.saleFCY) || 0,
          saleLCY,
          saleTaxPercentage: parseFloat(costingData.saleTaxPercentage) || 0,
          saleTaxAmount: parseFloat(costingData.saleTaxAmount) || 0,
          costQty: parseFloat(costingData.costQty) || 0,
          costUnit: parseFloat(costingData.costUnit) || 0,
          costCurrency: costingData.costCurrency as Currency,
          costExRate: parseFloat(costingData.costExRate) || 1,
          costFCY: parseFloat(costingData.costFCY) || 0,
          costLCY,
          costTaxPercentage: parseFloat(costingData.costTaxPercentage) || 0,
          costTaxAmount: parseFloat(costingData.costTaxAmount) || 0,
          unitId: costingData.unitId,
          unit: costingData.unit,
          gp: saleLCY - costLCY,
          billToCustomerId: costingData.billToCustomerId,
          vendorCustomerId: costingData.vendorCustomerId,
          costReferenceNo: costingData.costReferenceNo || undefined,
          costDate: costingData.costDate || undefined,
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
          saleCurrency: costingData.saleCurrency as Currency,
          saleExRate: parseFloat(costingData.saleExRate) || 1,
          saleFCY: parseFloat(costingData.saleFCY) || 0,
          saleLCY,
          saleTaxPercentage: parseFloat(costingData.saleTaxPercentage) || 0,
          saleTaxAmount: parseFloat(costingData.saleTaxAmount) || 0,
          costQty: parseFloat(costingData.costQty) || 0,
          costUnit: parseFloat(costingData.costUnit) || 0,
          costCurrency: costingData.costCurrency as Currency,
          costExRate: parseFloat(costingData.costExRate) || 1,
          costFCY: parseFloat(costingData.costFCY) || 0,
          costLCY,
          costTaxPercentage: parseFloat(costingData.costTaxPercentage) || 0,
          costTaxAmount: parseFloat(costingData.costTaxAmount) || 0,
          unitId: costingData.unitId,
          unit: costingData.unit,
          gp: saleLCY - costLCY,
          billToCustomerId: costingData.billToCustomerId,
          vendorCustomerId: costingData.vendorCustomerId,
          costReferenceNo: costingData.costReferenceNo || undefined,
          costDate: costingData.costDate || undefined,
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

  // Handle delete confirmation
  const handleConfirmDelete = async () => {
    if (!shipmentId || !deleteModalConfig) return;
    setIsDeleting(true);

    try {
      switch (deleteModalConfig.type) {
        case 'party':
          await deletePartyMutation.mutateAsync({ partyId: deleteModalConfig.id, shipmentId });
          break;
        case 'container':
          await deleteContainerMutation.mutateAsync({ containerId: deleteModalConfig.id, shipmentId });
          break;
        case 'costing':
          await deleteCostingMutation.mutateAsync({ costingId: deleteModalConfig.id, shipmentId });
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
          jobStatus: (formData.jobStatus || 'Opened') as any,
          direction: mapDisplayToDirection(formData.direction) as any,
          mode: mapDisplayToMode(formData.mode) as any,
          transportModeId: formData.transportModeId,
          incoterms: (formData.incoterms || undefined) as any,
          hblNo: formData.houseBLNo || undefined,
          hblDate: formData.houseBLDate || undefined,
          hblStatus: (formData.houseBLStatus || undefined) as any,
          hblServiceType: (formData.hblServiceType || undefined) as any,
          hblNoBLIssued: formData.hblNoBLIssued || undefined,
          hblFreight: (formData.hblFreight || undefined) as any,
          mblNo: formData.mblNumber || undefined,
          mblDate: formData.mblDate || undefined,
          mblStatus: (formData.mblStatus || undefined) as any,
          mblServiceType: (formData.mblServiceType || undefined) as any,
          mblNoBLIssued: formData.mblNoBLIssued || undefined,
          mblFreight: (formData.mblFreight || undefined) as any,
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
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
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
            <Button variant="outline" className="bg-[#2c3e50] hover:bg-[#34495e] text-white border-[#2c3e50]" onClick={() => navigate("/shipments")}>
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
                    <Select value={formData.jobStatus} onValueChange={(v) => handleInputChange("jobStatus", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-popover border border-border">
                        <SelectItem value="Opened">Opened</SelectItem>
                        <SelectItem value="Closed">Closed</SelectItem>
                        <SelectItem value="Cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm">Direction</Label>
                    <Select value={formData.direction} onValueChange={(v) => handleInputChange("direction", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-popover border border-border">
                        <SelectItem value="Import">Import</SelectItem>
                        <SelectItem value="Export">Export</SelectItem>
                        <SelectItem value="Cross-Trade">Cross-Trade</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm">Mode</Label>
                    <Select value={formData.mode} onValueChange={(v) => handleInputChange("mode", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-popover border border-border">
                        {transportModes.length > 0 ? (
                          transportModes.map((mode) => (
                            <SelectItem key={mode.id} value={mode.name}>{mode.name}</SelectItem>
                          ))
                        ) : (
                          <>
                            <SelectItem value="Air Freight">Air Freight</SelectItem>
                            <SelectItem value="Sea Freight FCL">Sea Freight FCL</SelectItem>
                            <SelectItem value="Sea Freight LCL">Sea Freight LCL</SelectItem>
                            <SelectItem value="Break-Bulk">Break-Bulk</SelectItem>
                            <SelectItem value="RO-RO">RO-RO</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm">INCO Terms</Label>
                    <Select value={formData.incoterms} onValueChange={(v) => handleInputChange("incoterms", v)}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent className="bg-popover border border-border">
                        {incoTerms.length === 0 ? (
                          <SelectItem value="_loading" disabled>Loading...</SelectItem>
                        ) : (
                          incoTerms.map(term => (
                            <SelectItem key={term.id} value={term.code}>
                              {term.code} - {term.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
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
                      <Select value={formData.houseBLStatus} onValueChange={(v) => handleInputChange("houseBLStatus", v)}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent className="bg-popover border border-border">
                          {filteredBLTypes.length > 0 ? (
                            filteredBLTypes
                              .filter(bt => bt.code === 'HBL' || bt.code === 'HAWB' || bt.code === 'EXPRESS')
                              .map(bt => (
                                <SelectItem key={bt.id} value={bt.code}>{bt.code} - {bt.name}</SelectItem>
                              ))
                          ) : (
                            <>
                              <SelectItem value="HBL">HBL - House Bill of Lading</SelectItem>
                              <SelectItem value="Express">Express Release</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm">BL Service Type</Label>
                      <Select value={formData.hblServiceType} onValueChange={(v) => handleInputChange("hblServiceType", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-popover border border-border">
                          <SelectItem value="LCLLCL">LCL/LCL</SelectItem>
                          <SelectItem value="FCLFCL">FCL/FCL</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm">No BL Issued</Label>
                      <Input value={formData.hblNoBLIssued} onChange={(e) => handleInputChange("hblNoBLIssued", e.target.value)} placeholder="No BL Issued" />
                    </div>
                    <div>
                      <Label className="text-sm">Freight</Label>
                      <Select value={formData.hblFreight} onValueChange={(v) => handleInputChange("hblFreight", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-popover border border-border">
                          <SelectItem value="Prepaid">Prepaid</SelectItem>
                          <SelectItem value="Collect">Collect</SelectItem>
                        </SelectContent>
                      </Select>
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
                      <Select value={formData.mblStatus} onValueChange={(v) => handleInputChange("mblStatus", v)}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent className="bg-popover border border-border">
                          {filteredBLTypes.length > 0 ? (
                            filteredBLTypes
                              .filter(bt => bt.code === 'MBL' || bt.code === 'MAWB' || bt.code === 'EXPRESS')
                              .map(bt => (
                                <SelectItem key={bt.id} value={bt.code}>{bt.code} - {bt.name}</SelectItem>
                              ))
                          ) : (
                            <>
                              <SelectItem value="MBL">MBL - Master Bill of Lading</SelectItem>
                              <SelectItem value="Express">Express Release</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm">BL Service Type</Label>
                      <Select value={formData.mblServiceType} onValueChange={(v) => handleInputChange("mblServiceType", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-popover border border-border">
                          <SelectItem value="FCLFCL">FCL/FCL</SelectItem>
                          <SelectItem value="LCLLCL">LCL/LCL</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm">No BL Issued</Label>
                      <Input value={formData.mblNoBLIssued} onChange={(e) => handleInputChange("mblNoBLIssued", e.target.value)} placeholder="No BL Issued" />
                    </div>
                    <div>
                      <Label className="text-sm">Freight</Label>
                      <Select value={formData.mblFreight} onValueChange={(v) => handleInputChange("mblFreight", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-popover border border-border">
                          <SelectItem value="Prepaid">Prepaid</SelectItem>
                          <SelectItem value="Collect">Collect</SelectItem>
                        </SelectContent>
                      </Select>
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
                    <Select
                      value={formData.networkPartnerId?.toString() || ""}
                      onValueChange={(v) => setFormData(prev => ({ ...prev, networkPartnerId: v ? parseInt(v) : undefined }))}
                    >
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent className="bg-popover border border-border">
                        {networkPartners.length === 0 ? (
                          <SelectItem value="_loading" disabled>Loading...</SelectItem>
                        ) : (
                          networkPartners.map(partner => (
                            <SelectItem key={partner.id} value={partner.id.toString()}>
                              {partner.code} - {partner.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
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
                      <Select value={formData.placeOfReceipt} onValueChange={(v) => handleInputChange("placeOfReceipt", v)}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent className="bg-popover border border-border">
                          {ports.length === 0 ? (
                            <SelectItem value="_loading" disabled>Loading...</SelectItem>
                          ) : (
                            ports.map(port => (
                              <SelectItem key={port.id} value={port.name}>
                                {port.name}{port.code ? ` (${port.code})` : ''} - {port.country}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm">Port of Receipt</Label>
                      <Select
                        value={formData.portOfReceipt}
                        onValueChange={(v) => {
                          handleInputChange("portOfReceipt", v);
                          const selectedPort = ports.find(p => p.name === v);
                          setFormData(prev => ({ ...prev, portOfReceiptId: selectedPort?.id }));
                        }}
                      >
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent className="bg-popover border border-border">
                          {ports.length === 0 ? (
                            <SelectItem value="_loading" disabled>Loading...</SelectItem>
                          ) : (
                            ports.map(port => (
                              <SelectItem key={port.id} value={port.name}>
                                {port.name}{port.code ? ` (${port.code})` : ''} - {port.country}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm">Port of Loading</Label>
                      <Select
                        value={formData.portOfLoading}
                        onValueChange={(v) => {
                          handleInputChange("portOfLoading", v);
                          const selectedPort = ports.find(p => p.name === v);
                          setFormData(prev => ({ ...prev, portOfLoadingId: selectedPort?.id }));
                        }}
                      >
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent className="bg-popover border border-border">
                          {ports.length === 0 ? (
                            <SelectItem value="_loading" disabled>Loading...</SelectItem>
                          ) : (
                            ports.map(port => (
                              <SelectItem key={port.id} value={port.name}>
                                {port.name}{port.code ? ` (${port.code})` : ''} - {port.country}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Destination Ports */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Destination</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm">Port of Discharge</Label>
                      <Select
                        value={formData.portOfDischarge}
                        onValueChange={(v) => {
                          handleInputChange("portOfDischarge", v);
                          const selectedPort = ports.find(p => p.name === v);
                          setFormData(prev => ({ ...prev, portOfDischargeId: selectedPort?.id }));
                        }}
                      >
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent className="bg-popover border border-border">
                          {ports.length === 0 ? (
                            <SelectItem value="_loading" disabled>Loading...</SelectItem>
                          ) : (
                            ports.map(port => (
                              <SelectItem key={port.id} value={port.name}>
                                {port.name}{port.code ? ` (${port.code})` : ''} - {port.country}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm">Port of Final Destination</Label>
                      <Select
                        value={formData.portOfFinalDestination}
                        onValueChange={(v) => {
                          handleInputChange("portOfFinalDestination", v);
                          const selectedPort = ports.find(p => p.name === v);
                          setFormData(prev => ({ ...prev, portOfFinalDestinationId: selectedPort?.id }));
                        }}
                      >
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent className="bg-popover border border-border">
                          {ports.length === 0 ? (
                            <SelectItem value="_loading" disabled>Loading...</SelectItem>
                          ) : (
                            ports.map(port => (
                              <SelectItem key={port.id} value={port.name}>
                                {port.name}{port.code ? ` (${port.code})` : ''} - {port.country}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm">Place of Delivery</Label>
                      <Select value={formData.placeOfDelivery} onValueChange={(v) => handleInputChange("placeOfDelivery", v)}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent className="bg-popover border border-border">
                          {ports.length === 0 ? (
                            <SelectItem value="_loading" disabled>Loading...</SelectItem>
                          ) : (
                            ports.map(port => (
                              <SelectItem key={port.id} value={port.name}>
                                {port.name}{port.code ? ` (${port.code})` : ''} - {port.country}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
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
                  className="bg-emerald-500 hover:bg-emerald-600 text-white"
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
                  <Select value={selectedPartyType} onValueChange={(v) => setSelectedPartyType(v as PartyType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-popover border border-border">
                      {partyTypes.map(type => (
                        <SelectItem key={type} value={type}>{partyTypeLabels[type]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm text-red-500">* Customer Name</Label>
                  <Select
                    value={selectedCustomerId}
                    onValueChange={setSelectedCustomerId}
                    disabled={isLoadingCustomers}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        isLoadingCustomers ? "Loading..." :
                        customers.length === 0 ? "No customers found" :
                        "Select a customer"
                      } />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border border-border">
                      {customers.map(customer => (
                        <SelectItem key={customer.id} value={customer.id.toString()}>
                          {customer.name} ({customer.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {customers.length === 0 && !isLoadingCustomers && (
                    <p className="text-xs text-amber-600 mt-1">
                      No customers with category "{partyTypeLabels[selectedPartyType]}" found.
                    </p>
                  )}
                </div>
                <div>
                  <Button
                    className="bg-emerald-500 hover:bg-emerald-600 text-white"
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
                          <TableCell className="text-emerald-600">{partyTypeLabels[party.partyType] || party.partyType}</TableCell>
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
                    className="bg-emerald-500 hover:bg-emerald-600 text-white"
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
                  <Select defaultValue="10">
                    <SelectTrigger className="w-[70px] h-8"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-popover border border-border">
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                    </SelectContent>
                  </Select>
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
                              className="h-8 w-8 bg-emerald-500 hover:bg-emerald-600 text-white rounded"
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
                    className="bg-[#2c3e50] hover:bg-[#34495e] text-white border-[#2c3e50] h-9 px-4"
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
                    className="bg-emerald-500 hover:bg-emerald-600 text-white h-9 px-4"
                    onClick={() => setInvoiceModalOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-1.5" />
                    Generate Invoice
                  </Button>
                  <Button
                    size="sm"
                    className="bg-emerald-500 hover:bg-emerald-600 text-white h-9 px-4"
                    onClick={() => setPurchaseModalOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-1.5" />
                    Book Purchase Invoice
                  </Button>
                </div>
              </div>

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
                          <TableCell className={saleHighlight}>{cost.saleCurrency}</TableCell>
                          <TableCell className={saleHighlight}>{cost.saleExRate}</TableCell>
                          <TableCell className={saleHighlight}>{cost.saleFCY?.toFixed(2)}</TableCell>
                          <TableCell className={`${saleHighlight} text-emerald-600`}>{cost.saleLCY?.toFixed(2)}</TableCell>
                          <TableCell className={costHighlight}>{cost.costQty}</TableCell>
                          <TableCell className={costHighlight}>{cost.costUnit}</TableCell>
                          <TableCell className={costHighlight}>{cost.costCurrency}</TableCell>
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
                                className="h-8 w-8 bg-emerald-500 hover:bg-emerald-600 text-white rounded"
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
                          <TableHead className="text-table-header-foreground text-xs">Invoice No</TableHead>
                          <TableHead className="text-table-header-foreground text-xs">Party</TableHead>
                          <TableHead className="text-table-header-foreground text-xs text-right">Amount</TableHead>
                          <TableHead className="text-table-header-foreground text-xs text-right">Tax</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {!shipmentInvoices?.customerInvoices?.length ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground text-sm">No customer invoices</TableCell>
                          </TableRow>
                        ) : (
                          shipmentInvoices.customerInvoices.map((inv, index) => (
                            <TableRow key={inv.id} className={index % 2 === 0 ? "bg-card" : "bg-secondary/30"}>
                              <TableCell className="text-xs">{inv.invoiceNo}</TableCell>
                              <TableCell className="text-xs">{inv.partyName || "-"}</TableCell>
                              <TableCell className="text-xs text-right">{inv.amount.toFixed(2)}</TableCell>
                              <TableCell className="text-xs text-right">{inv.totalTax.toFixed(2)}</TableCell>
                            </TableRow>
                          ))
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
                          <TableHead className="text-table-header-foreground text-xs">Purchase No</TableHead>
                          <TableHead className="text-table-header-foreground text-xs">Party</TableHead>
                          <TableHead className="text-table-header-foreground text-xs text-right">Amount</TableHead>
                          <TableHead className="text-table-header-foreground text-xs text-right">Tax</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {!shipmentInvoices?.vendorInvoices?.length ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground text-sm">No vendor invoices</TableCell>
                          </TableRow>
                        ) : (
                          shipmentInvoices.vendorInvoices.map((inv, index) => (
                            <TableRow key={inv.id} className={index % 2 === 0 ? "bg-card" : "bg-secondary/30"}>
                              <TableCell className="text-xs">{inv.purchaseNo}</TableCell>
                              <TableCell className="text-xs">{inv.partyName || "-"}</TableCell>
                              <TableCell className="text-xs text-right">{inv.amount.toFixed(2)}</TableCell>
                              <TableCell className="text-xs text-right">{inv.totalTax.toFixed(2)}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="flex justify-end">
                <div className="grid grid-cols-3 gap-8 bg-secondary/30 p-4 rounded-lg">
                  <div>
                    <Label className="text-sm font-semibold">Total Sale</Label>
                    <div className="text-emerald-600 font-semibold">AED {totalSale.toFixed(2)}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">Total Cost</Label>
                    <div className="text-foreground font-semibold">AED {totalCost.toFixed(2)}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">Profit</Label>
                    <div className={`font-semibold ${(totalSale - totalCost) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      AED {(totalSale - totalCost).toFixed(2)}
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
                  <Label className="text-sm font-semibold">Quantity</Label>
                  <Input value={newCargoEntry.quantity} onChange={(e) => setNewCargoEntry(prev => ({ ...prev, quantity: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-sm font-semibold">Load Type</Label>
                  <Select value={newCargoEntry.loadType} onValueChange={(v) => setNewCargoEntry(prev => ({ ...prev, loadType: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent className="bg-popover border border-border">
                      <SelectItem value="FCL">FCL</SelectItem>
                      <SelectItem value="LCL">LCL</SelectItem>
                      <SelectItem value="Bulk">Bulk</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Total CBM</Label>
                  <Input value={newCargoEntry.totalCBM} onChange={(e) => setNewCargoEntry(prev => ({ ...prev, totalCBM: e.target.value }))} placeholder="Total CBM" />
                </div>
                <div>
                  <Label className="text-sm font-semibold">Total Weight</Label>
                  <Input value={newCargoEntry.totalWeight} onChange={(e) => setNewCargoEntry(prev => ({ ...prev, totalWeight: e.target.value }))} placeholder="Total Weight" />
                </div>
                <div>
                  <Label className="text-sm font-semibold">Description</Label>
                  <Textarea value={newCargoEntry.description} onChange={(e) => setNewCargoEntry(prev => ({ ...prev, description: e.target.value }))} placeholder="Description" className="min-h-[40px]" />
                </div>
                <div>
                  <Button className="bg-emerald-500 hover:bg-emerald-600 text-white">
                    <Plus className="h-4 w-4 mr-2" />
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
                    <TableHead className="text-table-header-foreground">Load Type</TableHead>
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
                        <TableCell>{cargo.loadType}</TableCell>
                        <TableCell>{cargo.totalCBM?.toFixed(3) || '0.000'}</TableCell>
                        <TableCell>{cargo.totalWeight?.toFixed(3) || '0.000'}</TableCell>
                        <TableCell>{cargo.description || '-'}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 bg-red-500 hover:bg-red-600 text-white rounded"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              <Button className="bg-emerald-500 hover:bg-emerald-600 text-white">
                Save and Continue
              </Button>
            </div>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="mt-0">
            <div className="bg-card border border-border rounded-lg p-6 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-emerald-600 font-semibold text-lg">Documents</h3>
                <Button className="bg-[#2c3e50] hover:bg-[#34495e] text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Create
                </Button>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm">Show</span>
                  <Select defaultValue="10">
                    <SelectTrigger className="w-[70px] h-8"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-popover border border-border">
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                    </SelectContent>
                  </Select>
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
                    <TableHead className="text-table-header-foreground">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">No data available in table</TableCell>
                    </TableRow>
                  ) : (
                    documents.map((doc, index) => (
                      <TableRow key={index} className={index % 2 === 0 ? "bg-card" : "bg-secondary/30"}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{doc.type}</TableCell>
                        <TableCell>{doc.number}</TableCell>
                        <TableCell>{doc.date}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 bg-emerald-500 hover:bg-emerald-600 text-white rounded">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 bg-red-500 hover:bg-red-600 text-white rounded">
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
              <div className="flex justify-between items-center">
                <h3 className="text-emerald-600 font-semibold text-lg">Shipment Status</h3>
                <Button className="bg-[#2c3e50] hover:bg-[#34495e] text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Create
                </Button>
              </div>
              
              <div className="grid grid-cols-3 gap-4 items-end">
                <div>
                  <Label className="text-sm font-semibold">Date</Label>
                  <DateInput value={shipmentStatus.date} onChange={(v) => setShipmentStatus(prev => ({ ...prev, date: v }))} />
                </div>
                <div>
                  <Label className="text-sm font-semibold">Text</Label>
                  <Input value={shipmentStatus.remarks} onChange={(e) => setShipmentStatus(prev => ({ ...prev, remarks: e.target.value }))} placeholder="Remarks" />
                </div>
                <div>
                  <Button className="bg-emerald-500 hover:bg-emerald-600 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Status
                  </Button>
                </div>
              </div>

              <Button className="bg-emerald-500 hover:bg-emerald-600 text-white">
                Save and Continue
              </Button>
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
        onOpenChange={setInvoiceModalOpen}
        shipmentId={shipmentId}
        chargesDetails={costings}
        parties={parties}
        onSave={() => {
          refetchShipment();
          queryClient.invalidateQueries({ queryKey: ['shipment-invoices', shipmentId] });
        }}
      />

      <PurchaseModal
        open={purchaseModalOpen}
        onOpenChange={setPurchaseModalOpen}
        shipmentId={shipmentId}
        jobNumber={shipmentData?.jobNumber}
        chargesDetails={costings}
        parties={parties}
        onSave={() => {
          refetchShipment();
          queryClient.invalidateQueries({ queryKey: ['shipment-invoices', shipmentId] });
        }}
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
          deleteModalConfig?.type === 'costing' ? 'Delete Costing' : 'Delete Item'
        }
        itemName={deleteModalConfig?.name}
        isLoading={isDeleting}
      />
    </MainLayout>
  );
};

export default ShipmentDetail;
