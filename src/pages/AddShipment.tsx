import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { getTodayDateOnly } from "@/lib/utils";
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
import { DocumentModal } from "@/components/shipments/DocumentModal";
import { InvoiceModal } from "@/components/shipments/InvoiceModal";
import { PurchaseModal } from "@/components/shipments/PurchaseModal";
import { DeleteConfirmationModal } from "@/components/ui/delete-confirmation-modal";
import { toast } from "sonner";
import { useCustomers } from "@/hooks/useCustomers";
import {
  PartyType,
  MasterType,
  settingsApi,
  shipmentApi,
  ShipmentDirection,
  ShipmentMode,
  BLStatus,
  BLServiceType,
  FreightType,
  Incoterms,
  CreateShipmentRequest,
  AddShipmentPartyRequest,
  AddShipmentContainerRequest,
  UpdateShipmentContainerRequest,
  AddShipmentCostingRequest,
  UpdateShipmentCostingRequest,
  ShipmentInvoicesResult,
  ShipmentContainer,
  ShipmentCosting,
  ShipmentDocument,
} from "@/services/api";
import { useQuery } from "@tanstack/react-query";
import {
  useCreateShipment,
  useUpdateShipment,
  useShipment,
  useAddShipmentParty,
  useDeleteShipmentParty,
  useAddShipmentContainer,
  useUpdateShipmentContainer,
  useDeleteShipmentContainer,
  useAddShipmentCosting,
  useUpdateShipmentCosting,
  useDeleteShipmentCosting,
} from "@/hooks/useShipments";

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

// Local party type for storing before API submission
interface LocalParty {
  id: number;
  masterType: MasterType;
  partyType: PartyType;
  customerId?: number;
  customerName: string;
  mobile?: string;
  phone?: string;
  email?: string;
}

// Helper to map frontend values to backend enums
const mapDirection = (dir: string): ShipmentDirection => {
  const map: Record<string, ShipmentDirection> = {
    'Import': 'Import',
    'Export': 'Export',
    'Cross-Trade': 'CrossTrade',
  };
  return map[dir] || 'Import';
};

const mapMode = (mode: string): ShipmentMode => {
  const map: Record<string, ShipmentMode> = {
    'Sea Freight FCL': 'SeaFreightFCL',
    'Sea Freight LCL': 'SeaFreightLCL',
    'Air Freight': 'AirFreight',
    'Break-Bulk': 'BreakBulk',
    'RO-RO': 'RoRo',
  };
  return map[mode] || 'AirFreight';
};

const mapBLStatus = (status: string): BLStatus => {
  const map: Record<string, BLStatus> = {
    'HBL': 'HBL',
    'MBL': 'MBL',
    'HAWB': 'HAWB',
    'MAWB': 'MAWB',
    'EXPRESS': 'Express',
    'Express': 'Express',
  };
  return map[status] || 'HBL';
};

const mapBLServiceType = (type: string): BLServiceType => {
  const map: Record<string, BLServiceType> = {
    'FCL/FCL': 'FCLFCL',
    'LCL/LCL': 'LCLLCL',
  };
  return map[type] || 'LCLLCL';
};

const mapFreightType = (type: string): FreightType => {
  const map: Record<string, FreightType> = {
    'Prepaid': 'Prepaid',
    'Collect': 'Collect',
  };
  return map[type] || 'Collect';
};

const mapIncoterms = (code: string): Incoterms | undefined => {
  if (!code) return undefined;
  const validCodes: Incoterms[] = ['EXW', 'FCA', 'FAS', 'FOB', 'CFR', 'CIF', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP'];
  return validCodes.includes(code as Incoterms) ? (code as Incoterms) : undefined;
};

const AddShipment = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("shipment-info");

  // Track if shipment has been saved (null = new shipment, number = saved shipment ID)
  const [savedShipmentId, setSavedShipmentId] = useState<number | null>(null);
  const [savedJobNumber, setSavedJobNumber] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  // API hooks for mutations
  const createShipmentMutation = useCreateShipment();
  const updateShipmentMutation = useUpdateShipment();
  const addPartyMutation = useAddShipmentParty();
  const deletePartyMutation = useDeleteShipmentParty();
  const addContainerMutation = useAddShipmentContainer();
  const updateContainerMutation = useUpdateShipmentContainer();
  const deleteContainerMutation = useDeleteShipmentContainer();
  const addCostingMutation = useAddShipmentCosting();
  const updateCostingMutation = useUpdateShipmentCosting();
  const deleteCostingMutation = useDeleteShipmentCosting();

  // Fetch shipment data when we have a saved ID (to get the job number and refresh data)
  const { data: savedShipmentData, refetch: refetchShipment } = useShipment(savedShipmentId || 0);

  // Fetch next job number for new shipments
  const { data: nextJobNumberData } = useQuery({
    queryKey: ['nextJobNumber'],
    queryFn: async () => {
      const response = await shipmentApi.getNextJobNumber();
      if (response.error) throw new Error(response.error);
      return response.data?.jobNumber;
    },
    enabled: !savedShipmentId, // Only fetch when creating a new shipment
  });

  const [formData, setFormData] = useState({
    jobNumber: "", // Will be generated by backend
    jobDate: getTodayDateOnly(),
    jobStatus: "Opened",
    direction: "Cross-Trade",
    mode: "Air Freight",
    transportModeId: undefined as number | undefined,
    incoterms: "",
    houseBLNo: "",
    houseBLDate: getTodayDateOnly(),
    houseBLStatus: "HBL",
    hblServiceType: "LCL/LCL",
    hblNoBLIssued: "0",
    hblFreight: "Collect",
    mblNumber: "",
    mblDate: getTodayDateOnly(),
    mblStatus: "HBL",
    mblServiceType: "LCL/LCL",
    mblNoBLIssued: "0",
    mblFreight: "Collect",
    placeOfBLIssue: "",
    carrier: "",
    freeTime: "0",
    networkPartnerId: undefined as number | undefined,
    placeOfReceipt: "",
    portOfReceiptId: undefined as number | undefined,
    portOfReceipt: "",
    portOfLoadingId: undefined as number | undefined,
    portOfLoading: "",
    portOfDischargeId: undefined as number | undefined,
    portOfDischarge: "",
    portOfFinalDestinationId: undefined as number | undefined,
    portOfFinalDestination: "",
    placeOfDelivery: "",
    vessel: "",
    voyage: "",
    etd: getTodayDateOnly(),
    eta: getTodayDateOnly(),
    secondLegVessel: false,
    secondLegVesselName: "",
    secondLegVoyage: "",
    secondLegETD: getTodayDateOnly(),
    secondLegETA: getTodayDateOnly(),
    marksNumbers: "",
    notes: "",
    internalNotes: "",
  });

  const [parties, setParties] = useState<LocalParty[]>([]);
  const [selectedPartyType, setSelectedPartyType] = useState<PartyType>('Shipper');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [containers, setContainers] = useState<Array<Partial<ShipmentContainer> & { sNo?: number | string }>>([]);
  const [costing, setCosting] = useState<Array<Partial<ShipmentCosting>>>([]);
  const [documents, setDocuments] = useState<Array<Partial<ShipmentDocument>>>([]);
  const [shipmentStatus, setShipmentStatus] = useState({ date: getTodayDateOnly(), remarks: "" });

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

  // Fetch shipment invoices when we have a saved shipment ID
  const { data: shipmentInvoicesResponse } = useQuery({
    queryKey: ['shipmentInvoices', savedShipmentId],
    queryFn: () => shipmentApi.getInvoices(savedShipmentId!),
    enabled: !!savedShipmentId,
    staleTime: 30 * 1000, // Cache for 30 seconds
  });
  const shipmentInvoices = useMemo(() => shipmentInvoicesResponse?.data, [shipmentInvoicesResponse?.data]);

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

  // Reset selected customer when party type changes
  useEffect(() => {
    setSelectedCustomerId("");
  }, [selectedPartyType]);

  // Update job number and sync data when shipment is saved and loaded
  useEffect(() => {
    if (savedShipmentData) {
      setSavedJobNumber(savedShipmentData.jobNumber);
      setFormData(prev => ({ ...prev, jobNumber: savedShipmentData.jobNumber }));
      // Sync parties from saved data
      if (savedShipmentData.parties) {
        setParties(savedShipmentData.parties.map(p => ({
          id: p.id,
          masterType: p.masterType,
          partyType: p.partyType,
          customerId: p.customerId,
          customerName: p.customerName,
          mobile: p.mobile,
          phone: p.phone,
          email: p.email,
        })));
      }
      // Sync containers from saved data
      if (savedShipmentData.containers) {
        setContainers(savedShipmentData.containers.map(c => ({
          id: c.id,
          containerNumber: c.containerNumber,
          containerTypeId: c.containerTypeId,
          containerTypeName: c.containerTypeName,
          sealNo: c.sealNo,
          noOfPcs: c.noOfPcs,
          packageTypeId: c.packageTypeId,
          packageTypeName: c.packageTypeName,
          grossWeight: c.grossWeight,
          volume: c.volume,
          description: c.description,
        })));
      }
      // Sync costings from saved data
      if (savedShipmentData.costings) {
        setCosting(savedShipmentData.costings.map(c => ({
          id: c.id,
          description: c.description,
          chargeDescription: c.description, // Same as description for display
          remarks: c.remarks || "",
          saleQty: c.saleQty,
          saleUnit: c.saleUnit,
          saleCurrency: c.saleCurrency,
          saleExRate: c.saleExRate,
          saleFCY: c.saleFCY,
          saleLCY: c.saleLCY,
          costQty: c.costQty,
          costUnit: c.costUnit,
          costCurrency: c.costCurrency,
          costExRate: c.costExRate,
          costFCY: c.costFCY,
          costLCY: c.costLCY,
          unitName: c.unitName,
          gp: c.gp,
          billToCustomerId: c.billToCustomerId,
          billToName: c.billToName,
          vendorCustomerId: c.vendorCustomerId,
          vendorName: c.vendorName,
          saleInvoiced: c.saleInvoiced || false,
          purchaseInvoiced: c.purchaseInvoiced || false,
        })));
      }
    }
  }, [savedShipmentData]);

  // Modal states
  const [containerModalOpen, setContainerModalOpen] = useState(false);
  const [costingModalOpen, setCostingModalOpen] = useState(false);
  const [documentModalOpen, setDocumentModalOpen] = useState(false);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [editingContainer, setEditingContainer] = useState<(Partial<ShipmentContainer> & { sNo?: number | string }) | null>(null);
  const [editingCosting, setEditingCosting] = useState<Partial<ShipmentCosting> | null>(null);

  // Delete confirmation modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteModalConfig, setDeleteModalConfig] = useState<{
    type: 'party' | 'container' | 'costing' | 'document';
    id: number;
    name?: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Warning modal state
  const [warningModalOpen, setWarningModalOpen] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddParty = async () => {
    if (!selectedCustomer) {
      toast.error("Please select a customer");
      return;
    }
    if (!savedShipmentId) {
      toast.error("Please save the shipment first");
      return;
    }
    // Check if customer is already added with the SAME party type
    const existingParty = parties.find(
      p => p.customerId === selectedCustomer.id && p.partyType === selectedPartyType
    );
    if (existingParty) {
      toast.error(`${selectedCustomer.name} is already added as ${partyTypeLabels[selectedPartyType]}`);
      return;
    }

    const partyData: AddShipmentPartyRequest = {
      shipmentId: savedShipmentId,
      masterType: selectedCustomer.masterType,
      partyType: selectedPartyType,
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      mobile: '',
      phone: selectedCustomer.phone || '',
      email: selectedCustomer.email || '',
    };

    try {
      await addPartyMutation.mutateAsync({ shipmentId: savedShipmentId, data: partyData });
      setSelectedCustomerId("");
      refetchShipment();
    } catch (error) {
      // Error is handled by mutation
    }
  };

  const handleDeleteParty = (partyId: number, partyName?: string) => {
    if (!savedShipmentId) return;
    setDeleteModalConfig({ type: 'party', id: partyId, name: partyName });
    setDeleteModalOpen(true);
  };

  const handleSaveContainer = async (container: Partial<ShipmentContainer> & { sNo?: number | string }) => {
    if (!savedShipmentId) {
      toast.error("Please save the shipment first");
      return;
    }

    try {
      if (editingContainer) {
        // Update existing container
        const containerData: UpdateShipmentContainerRequest = {
          id: editingContainer.id,
          shipmentId: savedShipmentId,
          containerNumber: container.containerNumber,
          containerTypeId: container.containerTypeId || null,
          sealNo: container.sealNo,
          noOfPcs: parseInt(container.noOfPcs) || 0,
          packageTypeId: container.packageTypeId || null,
          grossWeight: parseFloat(container.grossWeight) || 0,
          volume: parseFloat(container.volume) || 0,
          description: container.description,
        };

        await updateContainerMutation.mutateAsync({ shipmentId: savedShipmentId, containerId: editingContainer.id, data: containerData });
      } else {
        // Add new container
        const containerData: AddShipmentContainerRequest = {
          shipmentId: savedShipmentId,
          containerNumber: container.containerNumber,
          containerTypeId: container.containerTypeId || null,
          sealNo: container.sealNo,
          noOfPcs: parseInt(container.noOfPcs) || 0,
          packageTypeId: container.packageTypeId || null,
          grossWeight: parseFloat(container.grossWeight) || 0,
          volume: parseFloat(container.volume) || 0,
          description: container.description,
        };

        await addContainerMutation.mutateAsync({ shipmentId: savedShipmentId, data: containerData });
      }
      refetchShipment();
      setEditingContainer(null);
    } catch (error) {
      // Error is handled by mutation
    }
  };

  const handleEditContainer = (container: Partial<ShipmentContainer> & { sNo?: number | string }) => {
    setEditingContainer(container);
    setContainerModalOpen(true);
  };

  const handleDeleteContainer = (containerId: number, containerNumber?: string) => {
    if (!savedShipmentId) return;
    setDeleteModalConfig({ type: 'container', id: containerId, name: containerNumber });
    setDeleteModalOpen(true);
  };

  const handleSaveCosting = async (cost: Partial<ShipmentCosting>) => {
    if (!savedShipmentId) {
      toast.error("Please save the shipment first");
      return;
    }

    try {
      if (editingCosting) {
        // Update existing costing
        const costingData: UpdateShipmentCostingRequest = {
          id: editingCosting.id,
          shipmentId: savedShipmentId,
          description: cost.description,
          remarks: cost.remarks || undefined,
          saleQty: parseFloat(cost.saleQty) || 0,
          saleUnit: parseFloat(cost.saleUnit) || 0,
          saleCurrencyId: cost.saleCurrencyId,
          saleExRate: parseFloat(cost.saleExRate) || 1,
          saleFCY: parseFloat(cost.saleFCY) || 0,
          saleLCY: parseFloat(cost.saleLCY) || 0,
          saleTaxPercentage: parseFloat(cost.saleTaxPercentage) || 0,
          saleTaxAmount: parseFloat(cost.saleTaxAmount) || 0,
          costQty: parseFloat(cost.costQty) || 0,
          costUnit: parseFloat(cost.costUnit) || 0,
          costCurrencyId: cost.costCurrencyId,
          costExRate: parseFloat(cost.costExRate) || 1,
          costFCY: parseFloat(cost.costFCY) || 0,
          costLCY: parseFloat(cost.costLCY) || 0,
          costTaxPercentage: parseFloat(cost.costTaxPercentage) || 0,
          costTaxAmount: parseFloat(cost.costTaxAmount) || 0,
          unitId: cost.unitId,
          gp: parseFloat(cost.gp) || 0,
          billToCustomerId: cost.billToCustomerId || undefined,
          vendorCustomerId: cost.vendorCustomerId || undefined,
          costReferenceNo: cost.costReferenceNo || undefined,
          costDate: cost.costDate || undefined,
        };

        await updateCostingMutation.mutateAsync({ shipmentId: savedShipmentId, costingId: editingCosting.id, data: costingData });
      } else {
        // Add new costing
        const costingData: AddShipmentCostingRequest = {
          shipmentId: savedShipmentId,
          description: cost.description,
          remarks: cost.remarks || undefined,
          saleQty: parseFloat(cost.saleQty) || 0,
          saleUnit: parseFloat(cost.saleUnit) || 0,
          saleCurrencyId: cost.saleCurrencyId,
          saleExRate: parseFloat(cost.saleExRate) || 1,
          saleFCY: parseFloat(cost.saleFCY) || 0,
          saleLCY: parseFloat(cost.saleLCY) || 0,
          saleTaxPercentage: parseFloat(cost.saleTaxPercentage) || 0,
          saleTaxAmount: parseFloat(cost.saleTaxAmount) || 0,
          costQty: parseFloat(cost.costQty) || 0,
          costUnit: parseFloat(cost.costUnit) || 0,
          costCurrencyId: cost.costCurrencyId,
          costExRate: parseFloat(cost.costExRate) || 1,
          costFCY: parseFloat(cost.costFCY) || 0,
          costLCY: parseFloat(cost.costLCY) || 0,
          costTaxPercentage: parseFloat(cost.costTaxPercentage) || 0,
          costTaxAmount: parseFloat(cost.costTaxAmount) || 0,
          unitId: cost.unitId,
          gp: parseFloat(cost.gp) || 0,
          billToCustomerId: cost.billToCustomerId || undefined,
          vendorCustomerId: cost.vendorCustomerId || undefined,
          costReferenceNo: cost.costReferenceNo || undefined,
          costDate: cost.costDate || undefined,
        };

        await addCostingMutation.mutateAsync({ shipmentId: savedShipmentId, data: costingData });
      }
      refetchShipment();
      setEditingCosting(null);
    } catch (error) {
      // Error is handled by mutation
    }
  };

  const handleEditCosting = (cost: Partial<ShipmentCosting>) => {
    setEditingCosting(cost);
    setCostingModalOpen(true);
  };

  const handleDeleteCosting = (costId: number, description?: string) => {
    if (!savedShipmentId) return;
    setDeleteModalConfig({ type: 'costing', id: costId, name: description });
    setDeleteModalOpen(true);
  };

  const handleSaveDocument = (doc: Partial<ShipmentDocument>) => {
    setDocuments(prev => [...prev, doc]);
    toast.success("Document added");
  };

  const handleDeleteDocument = (docId: number, docType?: string) => {
    setDeleteModalConfig({ type: 'document', id: docId, name: docType });
    setDeleteModalOpen(true);
  };

  // Handle delete confirmation
  const handleConfirmDelete = async () => {
    if (!deleteModalConfig) return;
    setIsDeleting(true);

    try {
      switch (deleteModalConfig.type) {
        case 'party':
          if (savedShipmentId) {
            try {
              await deletePartyMutation.mutateAsync({ partyId: deleteModalConfig.id, shipmentId: savedShipmentId });
              refetchShipment();
            } catch (error: unknown) {
              // Show warning modal for party deletion errors (e.g., costings assigned)
              const message = error instanceof Error ? error.message : 'Failed to delete party';
              setWarningMessage(message);
              setWarningModalOpen(true);
              setDeleteModalOpen(false);
              setDeleteModalConfig(null);
              return;
            }
          }
          break;
        case 'container':
          if (savedShipmentId) {
            await deleteContainerMutation.mutateAsync({ containerId: deleteModalConfig.id, shipmentId: savedShipmentId });
            refetchShipment();
          }
          break;
        case 'costing':
          if (savedShipmentId) {
            await deleteCostingMutation.mutateAsync({ costingId: deleteModalConfig.id, shipmentId: savedShipmentId });
            refetchShipment();
          }
          break;
        case 'document':
          setDocuments(prev => prev.filter(d => d.id !== deleteModalConfig.id));
          toast.success("Document deleted");
          break;
      }
      setDeleteModalOpen(false);
      setDeleteModalConfig(null);
    } catch (error) {
      // Error handled by mutation
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveAndContinue = async () => {
    setIsSaving(true);
    try {
      const shipmentData = {
        jobDate: formData.jobDate,
        direction: mapDirection(formData.direction),
        mode: mapMode(formData.mode),
        transportModeId: formData.transportModeId,
        incoterms: mapIncoterms(formData.incoterms),
        hblNo: formData.houseBLNo || undefined,
        hblDate: formData.houseBLDate || undefined,
        hblStatus: formData.houseBLStatus ? mapBLStatus(formData.houseBLStatus) : undefined,
        hblServiceType: formData.hblServiceType ? mapBLServiceType(formData.hblServiceType) : undefined,
        hblNoBLIssued: formData.hblNoBLIssued || undefined,
        hblFreight: formData.hblFreight ? mapFreightType(formData.hblFreight) : undefined,
        mblNo: formData.mblNumber || undefined,
        mblDate: formData.mblDate || undefined,
        mblStatus: formData.mblStatus ? mapBLStatus(formData.mblStatus) : undefined,
        mblServiceType: formData.mblServiceType ? mapBLServiceType(formData.mblServiceType) : undefined,
        mblNoBLIssued: formData.mblNoBLIssued || undefined,
        mblFreight: formData.mblFreight ? mapFreightType(formData.mblFreight) : undefined,
        placeOfBLIssue: formData.placeOfBLIssue || undefined,
        carrier: formData.carrier || undefined,
        freeTime: formData.freeTime || undefined,
        networkPartnerId: formData.networkPartnerId,
        portOfLoadingId: formData.portOfLoadingId,
        portOfDischargeId: formData.portOfDischargeId,
        portOfReceiptId: formData.portOfReceiptId,
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
      };

      if (savedShipmentId) {
        // Update existing shipment
        await updateShipmentMutation.mutateAsync({
          id: savedShipmentId,
          data: {
            id: savedShipmentId,
            jobStatus: 'Opened',
            ...shipmentData,
          },
        });
      } else {
        // Create new shipment
        const newShipmentId = await createShipmentMutation.mutateAsync(shipmentData);
        setSavedShipmentId(newShipmentId);
      }

      // Move to the next tab after successful save
      setActiveTab("parties");
    } catch (error) {
      // Error is handled by mutation
    } finally {
      setIsSaving(false);
    }
  };

  const totalContainerQty = containers.reduce((sum, c) => sum + (c.noOfPcs || 0), 0);
  const containerSummary = containers.length > 0
    ? (() => {
        // Group containers by type name
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

  const totalSale = costing.reduce((sum, c) => sum + parseFloat(c.saleLCY || 0), 0);
  const totalCost = costing.reduce((sum, c) => sum + parseFloat(c.costLCY || 0), 0);

  return (
    <MainLayout>
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-foreground">Add New Shipment</h1>
          <div className="flex gap-2">
            <Button variant="outline" className="bg-[#2c3e50] hover:bg-[#34495e] text-white border-[#2c3e50]" onClick={() => navigate("/shipments")}>
              Back
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => {
          // Only allow switching to other tabs if shipment is saved
          if (value !== "shipment-info" && !savedShipmentId) {
            toast.error("Please save the shipment first before proceeding to other tabs");
            return;
          }
          setActiveTab(value);
        }} className="w-full">
          <TabsList className="w-full justify-start mb-4 bg-card border border-border rounded-lg p-1 h-auto flex-wrap">
            <TabsTrigger value="shipment-info" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6 py-2.5">
              Shipment Info
            </TabsTrigger>
            <TabsTrigger
              value="parties"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!savedShipmentId}
            >
              Parties
            </TabsTrigger>
            <TabsTrigger
              value="containers"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!savedShipmentId}
            >
              Containers
            </TabsTrigger>
            <TabsTrigger
              value="costing"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!savedShipmentId}
            >
              Costing
            </TabsTrigger>
            <TabsTrigger
              value="cargo-details"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!savedShipmentId}
            >
              Cargo Details
            </TabsTrigger>
            <TabsTrigger
              value="documents"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!savedShipmentId}
            >
              Documents
            </TabsTrigger>
            <TabsTrigger
              value="shipment-status"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!savedShipmentId}
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
                    <Input
                      value={savedShipmentId ? savedJobNumber : (nextJobNumberData || "Loading...")}
                      className="bg-muted"
                      readOnly
                    />
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
                    <Select
                      value={formData.mode}
                      onValueChange={(v) => {
                        handleInputChange("mode", v);
                        // Also update the transportModeId
                        const selectedMode = transportModes.find(m => m.name === v);
                        setFormData(prev => ({ ...prev, transportModeId: selectedMode?.id }));
                      }}
                    >
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
                          <SelectItem value="LCL/LCL">LCL/LCL</SelectItem>
                          <SelectItem value="FCL/FCL">FCL/FCL</SelectItem>
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

                {/* MBL */}
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
                          <SelectItem value="FCL/FCL">FCL/FCL</SelectItem>
                          <SelectItem value="LCL/LCL">LCL/LCL</SelectItem>
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

                {/* Additional BL Info */}
                <div className="grid grid-cols-4 gap-4 pt-2">
                  <div>
                    <Label className="text-sm">Place of BL Issue</Label>
                    <Input value={formData.placeOfBLIssue} onChange={(e) => handleInputChange("placeOfBLIssue", e.target.value)} placeholder="Place of BL Issue" />
                  </div>
                  <div>
                    <Label className="text-sm">Carrier</Label>
                    <Input value={formData.carrier} onChange={(e) => handleInputChange("carrier", e.target.value)} />
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
                      <Input value={formData.vessel} onChange={(e) => handleInputChange("vessel", e.target.value)} placeholder="OCL France" />
                    </div>
                    <div>
                      <Label className="text-sm">Voyage</Label>
                      <Input value={formData.voyage} onChange={(e) => handleInputChange("voyage", e.target.value)} placeholder="78465F1" />
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

                  {/* 2nd Leg Vessel Row - Conditional */}
                  {formData.secondLegVessel && (
                    <div className="grid grid-cols-4 gap-4 pt-2">
                      <div>
                        <Label className="text-sm">2nd Leg Vessel</Label>
                        <Input
                          value={formData.secondLegVesselName}
                          onChange={(e) => handleInputChange("secondLegVesselName", e.target.value)}
                          placeholder="OCL France"
                        />
                      </div>
                      <div>
                        <Label className="text-sm">2nd Leg Voyage</Label>
                        <Input
                          value={formData.secondLegVoyage}
                          onChange={(e) => handleInputChange("secondLegVoyage", e.target.value)}
                          placeholder="78465F1"
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
                  onClick={handleSaveAndContinue}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save and Continue"
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Parties Tab */}
          <TabsContent value="parties" className="mt-0">
            <div className="bg-card border border-border rounded-lg p-6 space-y-6">
              <h3 className="text-emerald-600 font-semibold text-lg">Parties</h3>

              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <Label className="text-sm text-red-500">* Customer Type</Label>
                  <Select value={selectedPartyType} onValueChange={(v) => setSelectedPartyType(v as PartyType)}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-popover border border-border">
                      {partyTypes.map(type => (
                        <SelectItem key={type} value={type}>{partyTypeLabels[type]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Label className="text-sm text-red-500">* Customer Name</Label>
                  <Select
                    value={selectedCustomerId}
                    onValueChange={setSelectedCustomerId}
                    disabled={isLoadingCustomers}
                  >
                    <SelectTrigger className="w-full">
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
                </div>
                <Button
                  className="bg-emerald-500 hover:bg-emerald-600 text-white whitespace-nowrap"
                  onClick={handleAddParty}
                  disabled={!selectedCustomer}
                >
                  Add Party
                </Button>
              </div>
              {customers.length === 0 && !isLoadingCustomers && (
                <p className="text-xs text-amber-600 -mt-4">
                  No customers with category "{partyTypeLabels[selectedPartyType]}" found.
                </p>
              )}

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
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No parties added yet</TableCell>
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
                            <Button variant="ghost" size="icon" className="h-8 w-8 bg-red-500 hover:bg-red-600 text-white rounded" onClick={() => handleDeleteParty(party.id, party.customerName)}>
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
                  <span className="text-sm text-muted-foreground">Containers - {containerSummary}</span>
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
                      <TableCell colSpan={9} className="text-center text-muted-foreground">No containers added</TableCell>
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
                        <TableCell>{(container.grossWeight || 0).toFixed(3)}</TableCell>
                        <TableCell className="text-emerald-600">{(container.volume || 0).toFixed(3)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 bg-emerald-500 hover:bg-emerald-600 text-white rounded" onClick={() => handleEditContainer(container)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 bg-red-500 hover:bg-red-600 text-white rounded" onClick={() => handleDeleteContainer(container.id, container.containerNumber)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
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
                    className="bg-[#2c3e50] hover:bg-[#34495e] text-white border-[#2c3e50]"
                    onClick={() => {
                      setEditingCosting(null);
                      setCostingModalOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create
                  </Button>
                  <Button 
                    className="bg-emerald-500 hover:bg-emerald-600 text-white"
                    onClick={() => setInvoiceModalOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Generate Invoice
                  </Button>
                  <Button 
                    className="bg-emerald-500 hover:bg-emerald-600 text-white"
                    onClick={() => setPurchaseModalOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Book Purchase Invoice
                  </Button>
                </div>
              </div>

              {/* Legend for color coding */}
              {costing.length > 0 && (
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
                    <TableHead className="text-table-header-foreground">Sale Qty</TableHead>
                    <TableHead className="text-table-header-foreground">Sale Unit</TableHead>
                    <TableHead className="text-table-header-foreground">Currency</TableHead>
                    <TableHead className="text-table-header-foreground">Ex.Rate</TableHead>
                    <TableHead className="text-table-header-foreground">FCY Amount</TableHead>
                    <TableHead className="text-table-header-foreground">LCY Amount</TableHead>
                    <TableHead className="text-table-header-foreground">Cost Qty</TableHead>
                    <TableHead className="text-table-header-foreground">Cost/Unit</TableHead>
                    <TableHead className="text-table-header-foreground">Currency</TableHead>
                    <TableHead className="text-table-header-foreground">Ex.Rate</TableHead>
                    <TableHead className="text-table-header-foreground">FCY</TableHead>
                    <TableHead className="text-table-header-foreground">LCY</TableHead>
                    <TableHead className="text-table-header-foreground">Unit</TableHead>
                    <TableHead className="text-table-header-foreground">GP</TableHead>
                    <TableHead className="text-table-header-foreground">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {costing.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={17} className="text-center text-muted-foreground">No costing entries</TableCell>
                    </TableRow>
                  ) : (
                    costing.map((cost, index) => {
                      // Column-level highlighting based on invoice status
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
                          <TableCell className={saleHighlight}>{cost.saleFCY}</TableCell>
                          <TableCell className={saleHighlight}>{cost.saleLCY}</TableCell>
                          <TableCell className={costHighlight}>{cost.costQty}</TableCell>
                          <TableCell className={costHighlight}>{cost.costUnit}</TableCell>
                          <TableCell className={costHighlight}>{cost.costCurrency}</TableCell>
                          <TableCell className={costHighlight}>{cost.costExRate}</TableCell>
                          <TableCell className={costHighlight}>{cost.costFCY}</TableCell>
                          <TableCell className={costHighlight}>{cost.costLCY}</TableCell>
                          <TableCell>{cost.unitName}</TableCell>
                          <TableCell>{cost.gp}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8 bg-emerald-500 hover:bg-emerald-600 text-white rounded" onClick={() => handleEditCosting(cost)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 bg-red-500 hover:bg-red-600 text-white rounded" onClick={() => handleDeleteCosting(cost.id, cost.description)}>
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

              {/* Summary */}
              <div className="flex justify-center">
                <div className="grid grid-cols-3 gap-8 bg-secondary/30 p-4 rounded-lg">
                  <div className="text-center">
                    <Label className="text-sm font-semibold">Total Sale</Label>
                    <div className="text-emerald-600 font-semibold">[ AED {totalSale.toFixed(2)} ]</div>
                  </div>
                  <div className="text-center">
                    <Label className="text-sm font-semibold">Total Cost</Label>
                    <div className="text-foreground font-semibold">[ AED {totalCost.toFixed(2)} ]</div>
                  </div>
                  <div className="text-center">
                    <Label className="text-sm font-semibold">Profit</Label>
                    <div className={`font-semibold ${(totalSale - totalCost) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      [ AED {(totalSale - totalCost).toFixed(2)} ]
                    </div>
                  </div>
                </div>
              </div>

              {/* Invoices Section */}
              {savedShipmentId && (
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
                                <TableCell className="text-xs">{inv.partyName || "-"}</TableCell>
                                <TableCell className="text-xs">{inv.currencyCode} {inv.amount.toFixed(2)}</TableCell>
                                <TableCell className="text-xs">{inv.invoiceNo}</TableCell>
                                <TableCell className="text-xs">{inv.paymentStatus}</TableCell>
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
                            <TableHead className="text-table-header-foreground text-xs">Vendor</TableHead>
                            <TableHead className="text-table-header-foreground text-xs">P.Cost</TableHead>
                            <TableHead className="text-table-header-foreground text-xs">Voucher Number</TableHead>
                            <TableHead className="text-table-header-foreground text-xs">Status</TableHead>
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
                                <TableCell className="text-xs">{inv.partyName || "-"}</TableCell>
                                <TableCell className="text-xs">{inv.currencyCode} {inv.amount.toFixed(2)}</TableCell>
                                <TableCell className="text-xs">{inv.purchaseNo}</TableCell>
                                <TableCell className="text-xs">{inv.paymentStatus}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="flex justify-center">
                    <div className="grid grid-cols-3 gap-8 bg-secondary/30 p-4 rounded-lg">
                      <div className="text-center">
                        <Label className="text-sm font-semibold">Total Sale</Label>
                        <div className="text-emerald-600 font-semibold">[ AED {totalSale.toFixed(2)} ]</div>
                      </div>
                      <div className="text-center">
                        <Label className="text-sm font-semibold">Total Cost</Label>
                        <div className="text-foreground font-semibold">[ AED {totalCost.toFixed(2)} ]</div>
                      </div>
                      <div className="text-center">
                        <Label className="text-sm font-semibold">Profit</Label>
                        <div className={`font-semibold ${(totalSale - totalCost) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          [ AED {(totalSale - totalCost).toFixed(2)} ]
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Cargo Details Tab */}
          <TabsContent value="cargo-details" className="mt-0">
            <div className="bg-card border border-border rounded-lg p-6 space-y-6">
              <h3 className="text-emerald-600 font-semibold text-lg">Cargo Details</h3>
              
              <div className="grid grid-cols-5 gap-4">
                <div>
                  <Label className="text-sm">Quantity</Label>
                  <Input placeholder="Quantity" />
                </div>
                <div>
                  <Label className="text-sm">Load Type</Label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent className="bg-popover border border-border">
                      <SelectItem value="FCL">FCL</SelectItem>
                      <SelectItem value="LCL">LCL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm">Total CBM</Label>
                  <Input placeholder="Total CBM" />
                </div>
                <div>
                  <Label className="text-sm">Total Weight</Label>
                  <Input placeholder="Total Weight" />
                </div>
                <div>
                  <Label className="text-sm">Description</Label>
                  <Input placeholder="Description" />
                </div>
              </div>

              <Button className="bg-emerald-500 hover:bg-emerald-600 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Add Cargo
              </Button>
            </div>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="mt-0">
            <div className="bg-card border border-border rounded-lg p-6 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-emerald-600 font-semibold text-lg">Documents</h3>
                <Button 
                  className="bg-emerald-500 hover:bg-emerald-600 text-white"
                  onClick={() => setDocumentModalOpen(true)}
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
                    <TableHead className="text-table-header-foreground">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">No documents</TableCell>
                    </TableRow>
                  ) : (
                    documents.map((doc, index) => (
                      <TableRow key={doc.id} className={index % 2 === 0 ? "bg-card" : "bg-secondary/30"}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{doc.documentType}</TableCell>
                        <TableCell>{doc.documentNo}</TableCell>
                        <TableCell>{doc.docDate}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 bg-emerald-500 hover:bg-emerald-600 text-white rounded">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 bg-red-500 hover:bg-red-600 text-white rounded" onClick={() => handleDeleteDocument(doc.id, doc.documentType)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Shipment Status Tab */}
          <TabsContent value="shipment-status" className="mt-0">
            <div className="bg-card border border-border rounded-lg p-6 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-emerald-600 font-semibold text-lg">Shipment Status</h3>
                <Button className="bg-emerald-500 hover:bg-emerald-600 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Create
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Date</Label>
                  <DateInput 
                    value={shipmentStatus.date}
                    onChange={(v) => setShipmentStatus(prev => ({ ...prev, date: v }))}
                  />
                </div>
                <div>
                  <Label className="text-sm">Text (Remarks)</Label>
                  <Textarea 
                    value={shipmentStatus.remarks}
                    onChange={(e) => setShipmentStatus(prev => ({ ...prev, remarks: e.target.value }))}
                    placeholder="Remarks"
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      <ContainerModal
        open={containerModalOpen}
        onOpenChange={setContainerModalOpen}
        container={editingContainer}
        onSave={handleSaveContainer}
        nextSNo={containers.length + 1}
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

      <DocumentModal
        open={documentModalOpen}
        onOpenChange={setDocumentModalOpen}
        onSave={handleSaveDocument}
      />

      <InvoiceModal
        open={invoiceModalOpen}
        onOpenChange={setInvoiceModalOpen}
        shipmentId={savedShipmentId}
        chargesDetails={costing}
        parties={parties}
        onSave={(invoice) => {
          // Refetch shipment data to update saleInvoiced status on costings
          refetchShipment();
        }}
      />

      <PurchaseModal
        open={purchaseModalOpen}
        onOpenChange={setPurchaseModalOpen}
        shipmentId={savedShipmentId}
        jobNumber={savedJobNumber}
        chargesDetails={costing}
        parties={parties}
        onSave={(purchase) => {
          // Refetch shipment data to update purchaseInvoiced status on costings
          refetchShipment();
          // Toast is already shown by the mutation hook
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
          deleteModalConfig?.type === 'costing' ? 'Delete Costing' :
          deleteModalConfig?.type === 'document' ? 'Delete Document' : 'Delete Item'
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

export default AddShipment;
