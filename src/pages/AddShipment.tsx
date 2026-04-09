import { useState, useEffect, useMemo, useCallback, useRef, useLayoutEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { getTodayDateOnly } from "@/lib/utils";
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
import { CustomsTab } from "@/components/shipments/CustomsTab";
import { Edit, Trash2, Plus, Loader2, AlertTriangle, Eye } from "lucide-react";
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
import { StatusLogModal } from "@/components/shipments/StatusLogModal";
import { StatusTimeline } from "@/components/shipments/StatusTimeline";
import { ShipmentJourneyCalendar } from "@/components/shipments/ShipmentJourneyCalendar";
import { DeleteConfirmationModal } from "@/components/ui/delete-confirmation-modal";
import { toast } from "sonner";
import { useCustomers } from "@/hooks/useCustomers";
import {
  MasterType,
  settingsApi,
  shipmentApi,
  ShipmentDirection,
  ShipmentMode,
  ShipmentType,
  BLServiceType,
  FreightType,
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
  ShipmentCargo,
  ShipmentStatusLog,
  AddShipmentCargoRequest,
  AddShipmentDocumentRequest,
  AddShipmentStatusLogRequest,
  PackageType,
  ShipmentStatus,
  PaymentStatus,
  fileApi,
} from "@/services/api";
import { hrEmployeeApi } from "@/services/api/hr";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { useDeleteInvoice, useDeletePurchaseInvoice } from "@/hooks/useInvoices";
import { useQuotationForShipment, useConvertQuotationToShipment } from "@/hooks/useSales";
import { CargoContainerTab, CargoFormEntry } from "@/components/shipments/CargoContainerTab";
import { calculateCbm } from "@/lib/cargoCalculations";

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

// Local party type for storing before API submission
interface LocalParty {
  id: number;
  masterType: MasterType;
  customerCategoryId?: number;
  customerCategoryName?: string;
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
    'Courier': 'Courier',
  };
  return map[mode] || 'AirFreight';
};


const mapFreightType = (type: string): FreightType => {
  const map: Record<string, FreightType> = {
    'Prepaid': 'Prepaid',
    'Collect': 'Collect',
  };
  return map[type] || 'Collect';
};

const mapShipmentType = (type: string): ShipmentType => {
  const map: Record<string, ShipmentType> = {
    'Console Shipment': 'ConsoleShipment',
    'Non-Console Shipment': 'NonConsoleShipment',
  };
  return map[type] || 'NonConsoleShipment';
};

// Helper to format port label based on selected mode
const getPortLabel = (port: { seaPortName?: string; seaPortCode?: string; airPortName?: string; airPortCode?: string; city?: string; country?: string }, mode: string): string => {
  if (mode === 'Air Freight') {
    return `${port.airPortName || ''}${port.airPortCode ? ` (${port.airPortCode})` : ''} - ${port.city}, ${port.country}`;
  }
  return `${port.seaPortName || ''}${port.seaPortCode ? ` (${port.seaPortCode})` : ''} - ${port.city}, ${port.country}`;
};

const createInitialFormData = () => ({
  jobNumber: "", // Will be generated by backend
  jobDate: getTodayDateOnly(),
  jobStatus: "Opened",
  direction: "Cross-Trade",
  mode: "Air Freight",
  shipmentType: "Non-Console Shipment",
  incoTermId: "" as string,
  houseBLNo: "",
  houseBLDate: getTodayDateOnly(),
  houseBLStatus: "HAWB",
  hblServiceType: "LCLLCL",
  hblNoBLIssued: "0",
  hblFreight: "Collect",
  mblNumber: "",
  mblDate: getTodayDateOnly(),
  mblStatus: "MAWB",
  mblServiceType: "LCLLCL",
  mblNoBLIssued: "0",
  mblFreight: "Collect",
  placeOfBLIssue: "",
  carrier: "",
  freeTime: "0",
  networkPartnerId: undefined as number | undefined,
  salesperson: "",
  placeOfReceiptId: undefined as number | undefined,
  placeOfReceipt: "",
  portOfReceiptId: undefined as number | undefined,
  portOfReceipt: "",
  portOfLoadingId: undefined as number | undefined,
  portOfLoading: "",
  portOfDischargeId: undefined as number | undefined,
  portOfDischarge: "",
  portOfFinalDestinationId: undefined as number | undefined,
  portOfFinalDestination: "",
  placeOfDeliveryId: undefined as number | undefined,
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

const createInitialCargoEntry = (): CargoFormEntry => ({
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
});

const AddShipment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("shipment-info");

  // Track if shipment has been saved (null = new shipment, number = saved shipment ID)
  const [savedShipmentId, setSavedShipmentId] = useState<number | null>(null);
  const [savedJobNumber, setSavedJobNumber] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  // Get quotationId from location state (when converting from approved booking)
  const quotationIdFromState = (location.state as { quotationId?: number })?.quotationId;
  const [conversionQuotationId, setConversionQuotationId] = useState<number | null>(
    quotationIdFromState || null
  );
  const skipNextRouteResetRef = useRef(false);

  // Fetch quotation data for conversion
  const { data: quotationForShipment } = useQuotationForShipment(conversionQuotationId || 0);
  const convertQuotationToShipment = useConvertQuotationToShipment();

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

  const [formData, setFormData] = useState(createInitialFormData);

  const [parties, setParties] = useState<LocalParty[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [containers, setContainers] = useState<Array<Partial<ShipmentContainer> & { sNo?: number | string }>>([]);
  const [costing, setCosting] = useState<Array<Partial<ShipmentCosting>>>([]);
  const [documents, setDocuments] = useState<ShipmentDocument[]>([]);
  const [cargoDetails, setCargoDetails] = useState<ShipmentCargo[]>([]);
  const [newCargoEntry, setNewCargoEntry] = useState<CargoFormEntry>(createInitialCargoEntry);
  const [cargoCalculationMode, setCargoCalculationMode] = useState("units");
  const [isSavingCargo, setIsSavingCargo] = useState(false);
  const [statusLogs, setStatusLogs] = useState<ShipmentStatusLog[]>([]);
  const [statusLogModalOpen, setStatusLogModalOpen] = useState(false);

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

  // Fetch Container Types
  const { data: containerTypesResponse } = useQuery({
    queryKey: ['containerTypes', 'all'],
    queryFn: () => settingsApi.getAllContainerTypes(),
    staleTime: 60 * 60 * 1000, // Cache for 1 hour
  });
  const containerTypes = useMemo(() => containerTypesResponse?.data ?? [], [containerTypesResponse?.data]);

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

  // Fetch shipment invoices when we have a saved shipment ID
  const { data: shipmentInvoicesResponse } = useQuery({
    queryKey: ['shipment-invoices', savedShipmentId],
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
  const { data: portsResponse, isLoading: isLoadingPorts } = useQuery({
    queryKey: ['ports', 'all'],
    queryFn: () => settingsApi.getAllPorts(),
    staleTime: 60 * 60 * 1000, // Cache for 1 hour
  });
  const ports = useMemo(() => portsResponse?.data ?? [], [portsResponse?.data]);

  // Fetch customers filtered by the selected category ID (only when a type is selected)
  const { data: customersData, isLoading: isLoadingCustomers } = useCustomers({
    pageSize: 1000,
    categoryId: selectedCategoryId ? parseInt(selectedCategoryId) : undefined,
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

  // Reset selected customer when party type changes
  useEffect(() => {
    setSelectedCustomerId("");
  }, [selectedCategoryId]);

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
          customerCategoryId: p.customerCategoryId,
          customerCategoryName: p.customerCategoryName,
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
          chargeDescription: c.description,
          remarks: c.remarks || "",
          ppcc: c.ppcc,
          saleQty: c.saleQty,
          saleUnit: c.saleUnit,
          saleCurrencyCode: c.saleCurrencyCode,
          saleCurrencyId: c.saleCurrencyId,
          saleExRate: c.saleExRate,
          saleFCY: c.saleFCY,
          saleLCY: c.saleLCY,
          saleTaxPercentage: c.saleTaxPercentage,
          saleTaxAmount: c.saleTaxAmount,
          costQty: c.costQty,
          costUnit: c.costUnit,
          costCurrencyCode: c.costCurrencyCode,
          costCurrencyId: c.costCurrencyId,
          costExRate: c.costExRate,
          costFCY: c.costFCY,
          costLCY: c.costLCY,
          costTaxPercentage: c.costTaxPercentage,
          costTaxAmount: c.costTaxAmount,
          unitId: c.unitId,
          unitName: c.unitName,
          gp: c.gp,
          billToCustomerId: c.billToCustomerId,
          billToName: c.billToName,
          vendorCustomerId: c.vendorCustomerId,
          vendorName: c.vendorName,
          costReferenceNo: c.costReferenceNo,
          costDate: c.costDate,
          saleInvoiced: c.saleInvoiced || false,
          purchaseInvoiced: c.purchaseInvoiced || false,
        })));
      }
      // Sync cargo from saved data
      if (savedShipmentData.cargos) {
        setCargoDetails(savedShipmentData.cargos);
      }
      // Sync documents from saved data
      if (savedShipmentData.documents) {
        setDocuments(savedShipmentData.documents);
      }
      // Sync status logs from saved data
      if (savedShipmentData.statusLogs) {
        setStatusLogs(savedShipmentData.statusLogs);
      }
    }
  }, [savedShipmentData]);

  // Pre-fill form data when converting from quotation
  useEffect(() => {
    if (conversionQuotationId && quotationForShipment && incoTerms.length > 0) {
      // Map quotation mode to shipment mode
      let shipmentMode = "Air Freight";
      const quotationMode = quotationForShipment.mode;
      if (quotationMode === "SeaFreightFCL") {
        shipmentMode = "Sea Freight FCL";
      } else if (quotationMode === "SeaFreightLCL") {
        shipmentMode = "Sea Freight LCL";
      } else if (quotationMode === "AirFreight") {
        shipmentMode = "Air Freight";
      }

      // Map incoterm from quotation
      const incoTermId = quotationForShipment.incoTermCode
        ? incoTerms.find(t => t.code === quotationForShipment.incoTermCode)?.id?.toString() || ""
        : "";

      setFormData(prev => ({
        ...prev,
        direction: "Import", // Default to Import as per plan
        mode: shipmentMode,
        incoTermId,
        // Port of Loading → Load, Receipt, Place of Receipt
        portOfLoadingId: quotationForShipment.loadingPortId,
        portOfLoading: quotationForShipment.loadingPortId?.toString() || "",
        portOfReceiptId: quotationForShipment.loadingPortId,
        portOfReceipt: quotationForShipment.loadingPortId?.toString() || "",
        placeOfReceipt: quotationForShipment.loadingPortId?.toString() || "",
        // Port of Discharge → Discharge, Final Destination, Place of Delivery
        portOfDischargeId: quotationForShipment.destinationPortId,
        portOfDischarge: quotationForShipment.destinationPortId?.toString() || "",
        portOfFinalDestinationId: quotationForShipment.destinationPortId,
        portOfFinalDestination: quotationForShipment.destinationPortId?.toString() || "",
        placeOfDelivery: quotationForShipment.destinationPortId?.toString() || "",
        notes: quotationForShipment.notes || "",
        internalNotes: quotationForShipment.notesForBooking || "",
      }));

      // Clear router state to prevent re-triggering quotation prefill on same route entry.
      if ((location.state as { quotationId?: number } | null)?.quotationId) {
        skipNextRouteResetRef.current = true;
        navigate(location.pathname, { replace: true, state: null });
      }
    }
  }, [conversionQuotationId, quotationForShipment, incoTerms, location.pathname, location.state, navigate]);

  // Auto-add parties, costings, and cargo after shipment is saved (when converting from quotation)
  useEffect(() => {
    const addConversionData = async () => {
      if (!savedShipmentId || !conversionQuotationId || !quotationForShipment) return;

      try {
        // Add customer as Shipper party
        if (quotationForShipment.customerId) {
          const partyData: AddShipmentPartyRequest = {
            shipmentId: savedShipmentId,
            masterType: 'Debtors',
            customerCategoryId: categoryTypes.find(c => c.code === 'Shipper')?.id,
            customerId: quotationForShipment.customerId,
            customerName: quotationForShipment.customerName || '',
            mobile: '',
            phone: '',
            email: '',
          };
          try {
            await addPartyMutation.mutateAsync({ shipmentId: savedShipmentId, data: partyData });
          } catch (error) {
            // Ignore if party already exists
          }
        }

        // Add contact person as Customer party (if exists)
        if (quotationForShipment.contactPersonId && quotationForShipment.contactPersonName) {
          const contactPartyData: AddShipmentPartyRequest = {
            shipmentId: savedShipmentId,
            masterType: 'Debtors',
            customerCategoryId: categoryTypes.find(c => c.code === 'Customer')?.id,
            customerId: quotationForShipment.contactPersonId,
            customerName: quotationForShipment.contactPersonName || '',
            mobile: '',
            phone: '',
            email: '',
          };
          try {
            await addPartyMutation.mutateAsync({ shipmentId: savedShipmentId, data: contactPartyData });
          } catch (error) {
            // Ignore if party already exists
          }
        }

        // Add vendor as Supplier party (if exists)
        if (quotationForShipment.vendorId && quotationForShipment.vendorName) {
          const vendorPartyData: AddShipmentPartyRequest = {
            shipmentId: savedShipmentId,
            masterType: 'Creditors',
            customerCategoryId: categoryTypes.find(c => c.code === 'Supplier')?.id,
            customerId: quotationForShipment.vendorId,
            customerName: quotationForShipment.vendorName || '',
            mobile: '',
            phone: '',
            email: '',
          };
          try {
            await addPartyMutation.mutateAsync({ shipmentId: savedShipmentId, data: vendorPartyData });
          } catch (error) {
            // Ignore if party already exists
          }
        }

        // Add costings from quotation charges
        if (quotationForShipment.charges && quotationForShipment.charges.length > 0) {
          for (const charge of quotationForShipment.charges) {
            const saleLCY = (charge.amount || 0) * (charge.roe || 1);
            const costLCY = (charge.costAmount || 0) * (charge.costRoe || 1);
            const costingData: AddShipmentCostingRequest = {
              shipmentId: savedShipmentId,
              description: charge.chargeType || '',
              remarks: '',
              saleQty: charge.quantity || 0,
              saleUnit: charge.rate || 0,
              saleCurrencyId: charge.currencyId,
              saleExRate: charge.roe || 1,
              saleFCY: charge.amount || 0,
              saleLCY,
              saleTaxPercentage: 0,
              saleTaxAmount: 0,
              costQty: charge.costQuantity || 0,
              costUnit: charge.costRate || 0,
              costCurrencyId: charge.costCurrencyId,
              costExRate: charge.costRoe || 1,
              costFCY: charge.costAmount || 0,
              costLCY,
              costTaxPercentage: 0,
              costTaxAmount: 0,
              unitId: charge.costingUnitId,
              gp: saleLCY - costLCY,
              billToCustomerId: quotationForShipment.customerId,
              vendorCustomerId: quotationForShipment.vendorId,
            };
            try {
              await addCostingMutation.mutateAsync({ shipmentId: savedShipmentId, data: costingData });
            } catch (error) {
              // Continue with next costing
            }
          }
        }

        // Add cargo details from quotation — branch on FCL vs non-FCL
        if (quotationForShipment.cargoDetails && quotationForShipment.cargoDetails.length > 0) {
          const isQuotationFCL = quotationForShipment.mode === 'SeaFreightFCL';
          for (const cargo of quotationForShipment.cargoDetails) {
            if (isQuotationFCL) {
              // FCL: map cargo to container entry
              const containerType = containerTypes?.find(ct => ct.name === cargo.loadType);
              const containerData: AddShipmentContainerRequest = {
                shipmentId: savedShipmentId,
                containerNumber: '',
                containerTypeId: containerType?.id || null,
                sealNo: '',
                noOfPcs: cargo.quantity || 0,
                packageTypeId: cargo.packageTypeId || null,
                grossWeight: cargo.totalWeight || cargo.weight || 0,
                volume: cargo.totalCbm || cargo.cbm || 0,
                description: cargo.cargoDescription || cargo.loadType || '',
              };
              try {
                await addContainerMutation.mutateAsync({ shipmentId: savedShipmentId, data: containerData });
              } catch (error) {
                // Continue with next entry
              }
            } else {
              // LCL / Air / BreakBulk / RoRo: map cargo to ShipmentCargo entry
              const cargoData: AddShipmentCargoRequest = {
                calculationMode: cargo.calculationMode || 'units',
                quantity: cargo.quantity || 0,
                packageTypeId: cargo.packageTypeId || null,
                loadType: cargo.loadType || undefined,
                length: cargo.length ?? null,
                width: cargo.width ?? null,
                height: cargo.height ?? null,
                volumeUnit: cargo.volumeUnit || 'cm',
                cbm: cargo.cbm ?? null,
                weight: cargo.weight ?? null,
                weightUnit: cargo.weightUnit || 'kg',
                totalCBM: cargo.totalCbm ?? null,
                totalWeight: cargo.totalWeight ?? null,
                description: cargo.cargoDescription || undefined,
              };
              try {
                await shipmentApi.addCargo(savedShipmentId, cargoData);
              } catch (error) {
                // Continue with next entry
              }
            }
          }
        }

        // Update lead status to Converted
        try {
          await convertQuotationToShipment.mutateAsync(conversionQuotationId);
        } catch {
          // Non-critical: don't block conversion if lead status update fails
        }

        // Refetch shipment to get updated data
        refetchShipment();

        // Clear conversion quotation ID after successful conversion
        setConversionQuotationId(null);
        toast.success('Quotation data has been pre-filled to the shipment');
      } catch (error) {
        console.error('Error adding conversion data:', error);
      }
    };

    addConversionData();
  }, [savedShipmentId, conversionQuotationId, quotationForShipment]);

  // Modal states
  const [containerModalOpen, setContainerModalOpen] = useState(false);
  const [costingModalOpen, setCostingModalOpen] = useState(false);
  const [documentModalOpen, setDocumentModalOpen] = useState(false);
  const [documentModalMode, setDocumentModalMode] = useState<"add" | "edit">("add");
  const [editingDocument, setEditingDocument] = useState<ShipmentDocument | null>(null);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [editingContainer, setEditingContainer] = useState<(Partial<ShipmentContainer> & { sNo?: number | string }) | null>(null);
  const [editingContainerIndex, setEditingContainerIndex] = useState<number | null>(null);
  const [editingCosting, setEditingCosting] = useState<Partial<ShipmentCosting> | null>(null);
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

  const resetAddShipmentState = useCallback((nextQuotationId: number | null) => {
    setActiveTab("shipment-info");
    setSavedShipmentId(null);
    setSavedJobNumber("");
    setIsSaving(false);
    setConversionQuotationId(nextQuotationId);
    setFormData(createInitialFormData());
    setParties([]);
    setSelectedCategoryId("");
    setSelectedCustomerId("");
    setContainers([]);
    setCosting([]);
    setDocuments([]);
    setCargoDetails([]);
    setNewCargoEntry(createInitialCargoEntry());
    setCargoCalculationMode("units");
    setIsSavingCargo(false);
    setStatusLogs([]);
    setStatusLogModalOpen(false);
    setContainerModalOpen(false);
    setCostingModalOpen(false);
    setDocumentModalOpen(false);
    setDocumentModalMode("add");
    setEditingDocument(null);
    setInvoiceModalOpen(false);
    setPurchaseModalOpen(false);
    setEditingContainer(null);
    setEditingContainerIndex(null);
    setEditingCosting(null);
    setEditInvoiceId(null);
    setEditPurchaseInvoiceId(null);
    setDeleteModalOpen(false);
    setDeleteModalConfig(null);
    setIsDeleting(false);
    setWarningModalOpen(false);
    setWarningMessage("");
  }, []);

  // Ensure each Add Shipment route entry starts from a clean draft.
  useLayoutEffect(() => {
    if (skipNextRouteResetRef.current) {
      skipNextRouteResetRef.current = false;
      return;
    }

    const nextQuotationId = (location.state as { quotationId?: number } | null)?.quotationId ?? null;
    resetAddShipmentState(nextQuotationId);
  }, [location.key, location.state, resetAddShipmentState]);

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
    // Check if customer is already added with the SAME category
    const categoryId = selectedCategoryId ? parseInt(selectedCategoryId) : undefined;
    const existingParty = parties.find(
      p => p.customerId === selectedCustomer.id && p.customerCategoryId === categoryId
    );
    if (existingParty) {
      const partyLabel = categoryTypes.find(c => c.id.toString() === selectedCategoryId)?.name || "this category";
      toast.error(`${selectedCustomer.name} is already added as ${partyLabel}`);
      return;
    }

    const partyData: AddShipmentPartyRequest = {
      shipmentId: savedShipmentId,
      masterType: selectedCustomer.masterType,
      customerCategoryId: categoryId,
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
      setContainerModalOpen(false);
      setEditingContainer(null);
      setEditingContainerIndex(null);
      refetchShipment();
    } catch (error) {
      // Error is handled by mutation
    }
  };

  const handleEditContainer = (container: Partial<ShipmentContainer> & { sNo?: number | string }, index: number) => {
    setEditingContainer(container);
    setEditingContainerIndex(index);
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
      const saleLCY = parseFloat(cost.saleLCY) || 0;
      const costLCY = parseFloat(cost.costLCY) || 0;

      if (editingCosting) {
        // Update existing costing
        const costingData: UpdateShipmentCostingRequest = {
          id: editingCosting.id,
          shipmentId: savedShipmentId,
          description: cost.description,
          remarks: cost.remarks,
          saleQty: parseFloat(cost.saleQty) || 0,
          saleUnit: parseFloat(cost.saleUnit) || 0,
          saleCurrencyId: cost.saleCurrencyId,
          saleExRate: parseFloat(cost.saleExRate) || 1,
          saleFCY: parseFloat(cost.saleFCY) || 0,
          saleLCY,
          saleTaxPercentage: parseFloat(cost.saleTaxPercentage) || 0,
          saleTaxAmount: parseFloat(cost.saleTaxAmount) || 0,
          costQty: parseFloat(cost.costQty) || 0,
          costUnit: parseFloat(cost.costUnit) || 0,
          costCurrencyId: cost.costCurrencyId,
          costExRate: parseFloat(cost.costExRate) || 1,
          costFCY: parseFloat(cost.costFCY) || 0,
          costLCY,
          costTaxPercentage: parseFloat(cost.costTaxPercentage) || 0,
          costTaxAmount: parseFloat(cost.costTaxAmount) || 0,
          unitId: cost.unitId,
          gp: saleLCY - costLCY,
          billToCustomerId: cost.billToCustomerId,
          vendorCustomerId: cost.vendorCustomerId,
          costReferenceNo: cost.costReferenceNo || undefined,
          costDate: cost.costDate || undefined,
          ppcc: cost.ppcc || undefined,
        };

        await updateCostingMutation.mutateAsync({ shipmentId: savedShipmentId, costingId: editingCosting.id, data: costingData });
      } else {
        // Add new costing
        const costingData: AddShipmentCostingRequest = {
          shipmentId: savedShipmentId,
          description: cost.description,
          remarks: cost.remarks,
          saleQty: parseFloat(cost.saleQty) || 0,
          saleUnit: parseFloat(cost.saleUnit) || 0,
          saleCurrencyId: cost.saleCurrencyId,
          saleExRate: parseFloat(cost.saleExRate) || 1,
          saleFCY: parseFloat(cost.saleFCY) || 0,
          saleLCY,
          saleTaxPercentage: parseFloat(cost.saleTaxPercentage) || 0,
          saleTaxAmount: parseFloat(cost.saleTaxAmount) || 0,
          costQty: parseFloat(cost.costQty) || 0,
          costUnit: parseFloat(cost.costUnit) || 0,
          costCurrencyId: cost.costCurrencyId,
          costExRate: parseFloat(cost.costExRate) || 1,
          costFCY: parseFloat(cost.costFCY) || 0,
          costLCY,
          costTaxPercentage: parseFloat(cost.costTaxPercentage) || 0,
          costTaxAmount: parseFloat(cost.costTaxAmount) || 0,
          unitId: cost.unitId,
          gp: saleLCY - costLCY,
          billToCustomerId: cost.billToCustomerId,
          vendorCustomerId: cost.vendorCustomerId,
          costReferenceNo: cost.costReferenceNo || undefined,
          costDate: cost.costDate || undefined,
          ppcc: cost.ppcc || undefined,
        };

        await addCostingMutation.mutateAsync({ shipmentId: savedShipmentId, data: costingData });
      }
      setCostingModalOpen(false);
      setEditingCosting(null);
      refetchShipment();
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

  // Cargo handlers
  const handleAddCargo = async () => {
    if (!savedShipmentId) {
      toast.error("Please save the shipment first");
      return;
    }
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

      const response = await shipmentApi.addCargo(savedShipmentId, request);
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

  const handleDeleteCargo = (cargoId: number, description?: string) => {
    if (!savedShipmentId) return;
    setDeleteModalConfig({ type: 'cargo', id: cargoId, name: description || `Cargo #${cargoId}` });
    setDeleteModalOpen(true);
  };

  // Document handlers
  const handleSaveDocument = async (documentData: AddShipmentDocumentRequest) => {
    if (!savedShipmentId) {
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
        const newDocumentId = await shipmentApi.addDocument(savedShipmentId, documentData);
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

  const handleDeleteDocument = (doc: ShipmentDocument) => {
    setDeleteModalConfig({
      type: 'document',
      id: doc.id,
      name: doc.documentNo,
      filePath: doc.filePath,
    });
    setDeleteModalOpen(true);
  };

  // Status log handlers
  const handleAddStatusLogFromModal = async (statusLogData: AddShipmentStatusLogRequest) => {
    if (!savedShipmentId) {
      toast.error("Please save the shipment first");
      return;
    }

    try {
      const response = await shipmentApi.addStatusLog(savedShipmentId, statusLogData);
      if (response.data) {
        refetchShipment();
        toast.success("Status log added successfully");
      }
    } catch (error) {
      console.error("Failed to add status log:", error);
      toast.error("Failed to add status log");
      throw error;
    }
  };

  const handleDeleteStatusLog = (statusLog: ShipmentStatusLog) => {
    setDeleteModalConfig({
      type: 'statusLog',
      id: statusLog.id,
      name: statusLog.eventDescription || statusLog.remarks || 'Status Event',
    });
    setDeleteModalOpen(true);
  };

  const handleDeleteStatusLogById = (statusLogId: number) => {
    const statusLog = statusLogs.find(log => log.id === statusLogId);
    if (statusLog) {
      handleDeleteStatusLog(statusLog);
    }
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
            try {
              await deleteCostingMutation.mutateAsync({ costingId: deleteModalConfig.id, shipmentId: savedShipmentId });
              refetchShipment();
            } catch (error: unknown) {
              const message = error instanceof Error ? error.message : 'Failed to delete costing';
              setWarningMessage(message);
              setWarningModalOpen(true);
              setDeleteModalOpen(false);
              setDeleteModalConfig(null);
              return;
            }
          }
          break;
        case 'cargo':
          await shipmentApi.deleteCargo(deleteModalConfig.id);
          setCargoDetails(prev => prev.filter(c => c.id !== deleteModalConfig.id));
          toast.success("Cargo deleted successfully");
          break;
        case 'document':
          await shipmentApi.deleteDocument(deleteModalConfig.id);
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
          queryClient.invalidateQueries({ queryKey: ['shipment-invoices', savedShipmentId] });
          refetchShipment();
          break;
        case 'purchaseInvoice':
          await deletePurchaseInvoiceMutation.mutateAsync(deleteModalConfig.id);
          queryClient.invalidateQueries({ queryKey: ['shipment-invoices', savedShipmentId] });
          refetchShipment();
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

  const handleSaveShipment = async (navigateToTab?: string) => {
    setIsSaving(true);
    try {
      const shipmentData = {
        jobDate: formData.jobDate,
        jobStatus: (formData.jobStatus || 'Opened') as ShipmentStatus,
        direction: mapDirection(formData.direction),
        mode: mapMode(formData.mode),
        shipmentType: mapShipmentType(formData.shipmentType),
        salesperson: formData.salesperson || undefined,
        incoTermId: formData.incoTermId ? parseInt(formData.incoTermId) : undefined,
        hblNo: formData.houseBLNo || undefined,
        hblDate: formData.houseBLDate || undefined,
        hblStatus: formData.houseBLStatus || undefined,
        hblServiceType: (formData.hblServiceType || undefined) as BLServiceType | undefined,
        hblNoBLIssued: formData.hblNoBLIssued || undefined,
        hblFreight: formData.hblFreight ? mapFreightType(formData.hblFreight) : undefined,
        mblNo: formData.mblNumber || undefined,
        mblDate: formData.mblDate || undefined,
        mblStatus: formData.mblStatus || undefined,
        mblServiceType: (formData.mblServiceType || undefined) as BLServiceType | undefined,
        mblNoBLIssued: formData.mblNoBLIssued || undefined,
        mblFreight: formData.mblFreight ? mapFreightType(formData.mblFreight) : undefined,
        placeOfBLIssue: formData.placeOfBLIssue || undefined,
        carrier: formData.carrier || undefined,
        freeTime: formData.freeTime || undefined,
        networkPartnerId: formData.networkPartnerId,
        placeOfReceiptId: formData.placeOfReceiptId,
        placeOfDeliveryId: formData.placeOfDeliveryId,
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
            ...shipmentData,
          },
        });
      } else {
        // Create new shipment
        const newShipmentId = await createShipmentMutation.mutateAsync(shipmentData);
        setSavedShipmentId(newShipmentId);
      }

      if (navigateToTab) {
        setActiveTab(navigateToTab);
      }
    } catch (error) {
      // Error is handled by mutation
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAndContinue = () => handleSaveShipment("parties");

  const isFCL = formData.mode === 'Sea Freight FCL';
  const isLCL = formData.mode === 'Sea Freight LCL';

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

  return (
    <MainLayout>
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-foreground">Add New Shipment</h1>
          <div className="flex gap-2">
            <Button variant="outline" className="bg-modal-header hover:bg-modal-header/80 text-modal-header-foreground border-modal-header" onClick={() => navigate("/shipments")}>
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
              value="cargo-containers"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!savedShipmentId}
            >
              {(isFCL || isLCL) ? "Cargo & Containers" : "Cargo Details"}
            </TabsTrigger>
            <TabsTrigger
              value="costing"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!savedShipmentId}
            >
              Costing
            </TabsTrigger>
            <TabsTrigger
              value="documents"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!savedShipmentId}
            >
              Documents
            </TabsTrigger>
            <TabsTrigger
              value="customs"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!savedShipmentId}
            >
              Customs
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
                <div className="grid grid-cols-7 gap-4">
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

                {/* Additional BL Info */}
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

                  {/* 2nd Leg Vessel Row - Conditional */}
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
                  onClick={handleSaveAndContinue}
                  className="btn-success"
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
                <div className="flex-1">
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
                <Button
                  className="btn-success whitespace-nowrap"
                  onClick={handleAddParty}
                  disabled={!selectedCustomer || addPartyMutation.isPending}
                >
                  {addPartyMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Add Party
                </Button>
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
              isShipmentSaved={!!savedShipmentId}
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
                  {costing.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={15} className="text-center text-muted-foreground">No costing entries</TableCell>
                    </TableRow>
                  ) : (
                    costing.map((cost, index) => {
                      // Column-level highlighting based on invoice status
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
                              <Button variant="ghost" size="icon" className={`h-8 w-8 rounded ${cost.saleInvoiced && cost.purchaseInvoiced ? "bg-slate-500 hover:bg-slate-600 text-white" : "btn-success"}`} onClick={() => handleEditCosting(cost)}>
                                {cost.saleInvoiced && cost.purchaseInvoiced ? <Eye className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded" onClick={() => handleDeleteCosting(cost.id, cost.description)}>
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
                            <TableHead className="text-table-header-foreground text-xs">Remarks</TableHead>
                            <TableHead className="text-table-header-foreground text-xs">Status</TableHead>
                            <TableHead className="text-table-header-foreground text-xs w-20">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {!shipmentInvoices?.customerInvoices?.length ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center text-muted-foreground text-sm">No customer invoices</TableCell>
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
                                  <TableCell className="text-xs">{inv.remarks || "-"}</TableCell>
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
              )}

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
                  disabled={!savedShipmentId}
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
            </div>
          </TabsContent>

          {/* Customs Tab */}
          <TabsContent value="customs" className="mt-0">
            {savedShipmentId && <CustomsTab shipmentId={savedShipmentId} />}
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
                    onValueChange={(value) => setFormData(prev => ({ ...prev, jobStatus: value }))}
                    triggerClassName="w-[180px] bg-background border-border"
                  />
                </div>
                <Button
                  className="btn-success"
                  onClick={() => handleSaveShipment()}
                  disabled={isSaving || !savedShipmentId}
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
                  disabled={!savedShipmentId}
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

      <InvoiceModal
        open={invoiceModalOpen}
        onOpenChange={(open) => {
          setInvoiceModalOpen(open);
          if (!open) setEditInvoiceId(null);
        }}
        shipmentId={savedShipmentId}
        chargesDetails={costing}
        parties={parties}
        editInvoiceId={editInvoiceId}
        onSave={async () => {
          await queryClient.invalidateQueries({ queryKey: ['shipment-invoices', savedShipmentId] });
          await refetchShipment();
        }}
      />

      <PurchaseModal
        open={purchaseModalOpen}
        onOpenChange={(open) => {
          setPurchaseModalOpen(open);
          if (!open) setEditPurchaseInvoiceId(null);
        }}
        shipmentId={savedShipmentId}
        jobNumber={savedJobNumber}
        chargesDetails={costing}
        parties={parties}
        editPurchaseInvoiceId={editPurchaseInvoiceId}
        onSave={async () => {
          await queryClient.invalidateQueries({ queryKey: ['shipment-invoices', savedShipmentId] });
          await refetchShipment();
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

export default AddShipment;
