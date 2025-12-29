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
import { useShipment, useUpdateShipment, useAddShipmentParty, useDeleteShipmentParty } from "@/hooks/useShipments";
import { useCustomers } from "@/hooks/useCustomers";
import { PartyType, CustomerCategory, MasterType, Customer } from "@/services/api";

// Map PartyType to CustomerCategory for filtering customers
const partyTypeToCategory: Record<PartyType, CustomerCategory | null> = {
  Shipper: 'Shipper',
  Consignee: 'Consignee',
  BookingParty: 'BookingParty',
  Agents: 'Agents',
  Forwarder: 'Forwarder',
  Customer: 'Customer',
  DeliveryAgent: 'DeliveryAgent',
  OriginAgent: 'OriginAgent',
  NotifyParty: 'NotifyParty',
  ShippingLine: null, // No matching customer category
  AirLine: null, // No matching customer category
};

// Display labels for party types
const partyTypeLabels: Record<PartyType, string> = {
  Shipper: 'Shipper',
  Consignee: 'Consignee',
  BookingParty: 'Booking Party',
  Agents: 'Agents',
  Forwarder: 'Forwarder',
  Customer: 'Customer',
  DeliveryAgent: 'Delivery Agent',
  OriginAgent: 'Origin Agent',
  NotifyParty: 'Notify Party',
  ShippingLine: 'Shipping Line',
  AirLine: 'Air Line',
};

// Mock data for the shipment
const mockShipmentData = {
  jobNumber: "25JAE1658",
  jobDate: "2025-12-24",
  jobStatus: "Opened",
  direction: "Import",
  mode: "Sea Freight FCL",
  incoterms: "CFR-COST AND FREIGHT",
  houseBLNo: "HSCMBJEA00077",
  houseBLDate: "2025-12-24",
  houseBLStatus: "HBL",
  hblServiceType: "LCL/LCL",
  hblNoBLIssued: "3",
  hblFreight: "Prepaid",
  mblNumber: "CGLCMBJEA322725",
  mblDate: "2025-12-24",
  mblStatus: "MBL",
  mblServiceType: "FCL/FCL",
  mblNoBLIssued: "3",
  mblFreight: "Prepaid",
  placeOfBLIssue: "COLOMBO,SRILANKA",
  carrier: "GULF AGENCY CO PVT LTD",
  freeTime: "14 DAYS",
  networkPartner: "SELF",
  assignedTo: "None",
  placeOfReceipt: "Colombo",
  portOfReceipt: "Colombo",
  portOfLoading: "Colombo",
  portOfDischarge: "Jebel Ali",
  portOfFinalDestination: "Jebel Ali",
  placeOfDelivery: "Jebel Ali",
  vessel: "EVER URBAN",
  voyage: "221W",
  etd: "2025-12-24",
  eta: "2025-12-24",
  secondLegVessel: false,
  secondLegVesselName: "",
  secondLegVoyage: "",
  secondLegETD: "2025-12-24",
  secondLegETA: "2025-12-24",
  marksNumbers: "",
  notes: "",
  internalNotes: "",
};

// Mock parties data
const mockParties = [
  { id: 1, masterType: "Debtors", type: "Agents", name: "INFINITE SHIPPING PVT LTD", mobile: "0", phone: "", email: "kushla@infinite.lk" },
  { id: 2, masterType: "Creditors", type: "Shipping Line", name: "GULF AGENCY CO (DUBAI) PVT LTD", mobile: "0", phone: "", email: "LINERDOCDUBAI@GAC.COM" },
  { id: 3, masterType: "Debtors", type: "Customer", name: "KADDAH BLDG CLEANING EQUIP. TR CO LLC", mobile: "0", phone: "0507466916", email: "XXXXX@GMAIL.COM" },
  { id: 4, masterType: "Debtors", type: "Consignee", name: "KADDAH BLDG CLEANING EQUIP. TR CO LLC", mobile: "0", phone: "0507466916", email: "XXXXX@GMAIL.COM" },
  { id: 5, masterType: "Neutral", type: "Shipper(Neutral)", name: "RAVI INDUSTRIES LTD", mobile: "0", phone: "", email: "RAVIINDUSTRIES@LTD.COM" },
];

// Mock containers data
const mockContainers = [
  { id: 1, container: "GESU6251749", type: "40HC", sealNo: "FX44078456", noOfPcs: 1120, packageType: "BAGS", grossWeight: 28224.000, volume: 45.000 },
  { id: 2, container: "MLDU4363310", type: "40HC", sealNo: "FX44021137", noOfPcs: 1120, packageType: "BAGS", grossWeight: 28224.000, volume: 45.000 },
  { id: 3, container: "MSDU5652784", type: "40HC", sealNo: "FX44021047", noOfPcs: 1120, packageType: "BAGS", grossWeight: 28224.000, volume: 45.000 },
  { id: 4, container: "MSDU6686161", type: "40HC", sealNo: "FX44021021", noOfPcs: 1120, packageType: "BAGS", grossWeight: 28224.000, volume: 45.000 },
  { id: 5, container: "MSDU8495457", type: "40HC", sealNo: "FX43958866", noOfPcs: 1120, packageType: "BAGS", grossWeight: 28224.000, volume: 45.000 },
  { id: 6, container: "MSMU8504811", type: "40HC", sealNo: "FX43958894", noOfPcs: 1120, packageType: "BAGS", grossWeight: 28224.000, volume: 45.000 },
];

// Mock costing data
const mockCosting = [
  { id: 1, description: "Handling Charges", saleQty: "1.000", saleUnit: "25.00", saleCurrency: "USD", saleExRate: "3.685", saleFCY: "25.00", saleLCY: "92.13", costQty: "0.000", costUnit: "0.00", costCurrency: "AED", costExRate: "1.000", costFCY: "0.00", costLCY: "0.00", unit: "BL", gp: "92.13" },
  { id: 2, description: "Bill of Lading Charges", saleQty: "1.000", saleUnit: "350.00", saleCurrency: "USD", saleExRate: "3.685", saleFCY: "350.00", saleLCY: "1289.75", costQty: "0.000", costUnit: "0.00", costCurrency: "AED", costExRate: "1.000", costFCY: "0.00", costLCY: "0.00", unit: "BL", gp: "1,289.75" },
];

// Mock bill to data
const mockBillTo = [
  { billTo: "BLISS LOGISTICS & SHIPPING PVT LTD", pSale: "USD 25.00", voucherNumber: "INVAL251836", status: "Opened" },
  { billTo: "MMF GLOBAL TRADING LLC", pSale: "AED 1,289.75", voucherNumber: "INVAL251799", status: "Opened" },
];

// All available party types
const partyTypes: PartyType[] = [
  'Shipper',
  'Consignee',
  'BookingParty',
  'Agents',
  'Forwarder',
  'ShippingLine',
  'AirLine',
  'DeliveryAgent',
  'OriginAgent',
  'NotifyParty',
  'Customer',
];

const ShipmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const shipmentId = parseInt(id || '0');

  // Fetch shipment data from API
  const { data: shipmentData, isLoading: isLoadingShipment, error: shipmentError } = useShipment(shipmentId);

  // Mutations
  const updateShipmentMutation = useUpdateShipment();
  const addPartyMutation = useAddShipmentParty();
  const deletePartyMutation = useDeleteShipmentParty();

  const [activeTab, setActiveTab] = useState("shipment-info");
  const [formData, setFormData] = useState(mockShipmentData);
  const [selectedPartyType, setSelectedPartyType] = useState<PartyType>('Shipper');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [containers, setContainers] = useState(mockContainers);
  const [cargoDetails, setCargoDetails] = useState({ quantity: "", loadType: "", totalCBM: "", totalWeight: "", description: "" });
  const [documents, setDocuments] = useState<any[]>([]);
  const [shipmentStatus, setShipmentStatus] = useState({ date: "2025-12-26", remarks: "" });

  // Get the customer category for the selected party type
  const selectedCategory = partyTypeToCategory[selectedPartyType];

  // Fetch customers filtered by the selected category
  const { data: customersData, isLoading: isLoadingCustomers } = useCustomers({
    pageSize: 100,
    category: selectedCategory || undefined,
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
        direction: shipmentData.direction,
        mode: shipmentData.mode === 'SeaFreightFCL' ? 'Sea Freight FCL' :
              shipmentData.mode === 'SeaFreightLCL' ? 'Sea Freight LCL' : 'Air Freight',
        incoterms: shipmentData.incoterms || '',
        houseBLNo: shipmentData.houseBLNo || '',
        houseBLDate: shipmentData.houseBLDate?.split('T')[0] || '',
        houseBLStatus: shipmentData.houseBLStatus || 'HBL',
        hblServiceType: shipmentData.hblServiceType || 'LCL/LCL',
        hblNoBLIssued: shipmentData.hblNoBLIssued || '',
        hblFreight: shipmentData.hblFreight || 'Prepaid',
        mblNumber: shipmentData.mblNumber || '',
        mblDate: shipmentData.mblDate?.split('T')[0] || '',
        mblStatus: shipmentData.mblStatus || 'MBL',
        mblServiceType: shipmentData.mblServiceType || 'FCL/FCL',
        mblNoBLIssued: shipmentData.mblNoBLIssued || '',
        mblFreight: shipmentData.mblFreight || 'Prepaid',
        placeOfBLIssue: shipmentData.placeOfBLIssue || '',
        carrier: shipmentData.carrier || '',
        freeTime: shipmentData.freeTime || '',
        networkPartner: shipmentData.networkPartner || 'SELF',
        assignedTo: shipmentData.assignedTo || 'None',
        placeOfReceipt: shipmentData.placeOfReceipt || '',
        portOfReceipt: shipmentData.portOfReceipt || '',
        portOfLoading: shipmentData.portOfLoading || '',
        portOfDischarge: shipmentData.portOfDischarge || '',
        portOfFinalDestination: shipmentData.portOfFinalDestination || '',
        placeOfDelivery: shipmentData.placeOfDelivery || '',
        vessel: shipmentData.vessel || '',
        voyage: shipmentData.voyage || '',
        etd: shipmentData.etd?.split('T')[0] || '',
        eta: shipmentData.eta?.split('T')[0] || '',
        secondLegVessel: shipmentData.secondLegVessel || false,
        secondLegVesselName: shipmentData.secondLegVesselName || '',
        secondLegVoyage: shipmentData.secondLegVoyage || '',
        secondLegETD: shipmentData.secondLegETD?.split('T')[0] || '',
        secondLegETA: shipmentData.secondLegETA?.split('T')[0] || '',
        marksNumbers: shipmentData.marksNumbers || '',
        notes: shipmentData.notes || '',
        internalNotes: shipmentData.internalNotes || '',
      });
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
    if (!selectedCustomer || !shipmentId) return;

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

  const handleDeleteParty = (partyId: number) => {
    if (!shipmentId) return;
    deletePartyMutation.mutate({ partyId, shipmentId });
  };

  // Get parties from shipment data
  const parties = shipmentData?.parties || [];

  return (
    <MainLayout>
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-foreground">
            Edit Shipment - Job No : <span className="font-bold">{formData.jobNumber}</span>
          </h1>
          <div className="flex gap-2">
            <Button variant="outline" className="bg-[#2c3e50] hover:bg-[#34495e] text-white border-[#2c3e50]" onClick={() => navigate("/shipments")}>
              Back
            </Button>
          </div>
        </div>

        {/* Tabs */}
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
            <div className="bg-card border border-border rounded-lg p-6 space-y-6">
              <h3 className="text-emerald-600 font-semibold text-lg">Shipment Info</h3>
              
              {/* Row 1 */}
              <div className="grid grid-cols-6 gap-4">
                <div>
                  <Label className="text-sm">Job Number</Label>
                  <Input value={formData.jobNumber} readOnly className="bg-muted" />
                </div>
                <div>
                  <Label className="text-sm">Job Date</Label>
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
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm">Mode</Label>
                  <Select value={formData.mode} onValueChange={(v) => handleInputChange("mode", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-popover border border-border">
                      <SelectItem value="Sea Freight FCL">Sea Freight FCL</SelectItem>
                      <SelectItem value="Sea Freight LCL">Sea Freight LCL</SelectItem>
                      <SelectItem value="Air Freight">Air Freight</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm">INCO Terms</Label>
                  <Select value={formData.incoterms} onValueChange={(v) => handleInputChange("incoterms", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-popover border border-border">
                      <SelectItem value="CFR-COST AND FREIGHT">CFR-COST AND FREIGHT</SelectItem>
                      <SelectItem value="CIF">CIF</SelectItem>
                      <SelectItem value="FOB">FOB</SelectItem>
                      <SelectItem value="EXW">EXW</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row 2 - House B/L */}
              <div className="grid grid-cols-6 gap-4">
                <div>
                  <Label className="text-sm text-emerald-600">House B/L No</Label>
                  <Input value={formData.houseBLNo} onChange={(e) => handleInputChange("houseBLNo", e.target.value)} className="border-emerald-300" />
                </div>
                <div>
                  <Label className="text-sm">Date</Label>
                  <DateInput value={formData.houseBLDate} onChange={(v) => handleInputChange("houseBLDate", v)} />
                </div>
                <div>
                  <Label className="text-sm">BL Status</Label>
                  <Select value={formData.houseBLStatus} onValueChange={(v) => handleInputChange("houseBLStatus", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-popover border border-border">
                      <SelectItem value="HBL">HBL</SelectItem>
                      <SelectItem value="Express">Express</SelectItem>
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
                  <Input value={formData.hblNoBLIssued} onChange={(e) => handleInputChange("hblNoBLIssued", e.target.value)} />
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

              {/* Row 3 - MBL */}
              <div className="grid grid-cols-6 gap-4">
                <div>
                  <Label className="text-sm">MBL Number</Label>
                  <Input value={formData.mblNumber} onChange={(e) => handleInputChange("mblNumber", e.target.value)} />
                </div>
                <div>
                  <Label className="text-sm">Date</Label>
                  <DateInput value={formData.mblDate} onChange={(v) => handleInputChange("mblDate", v)} />
                </div>
                <div>
                  <Label className="text-sm">BL Status</Label>
                  <Select value={formData.mblStatus} onValueChange={(v) => handleInputChange("mblStatus", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-popover border border-border">
                      <SelectItem value="MBL">MBL</SelectItem>
                      <SelectItem value="Express">Express</SelectItem>
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
                  <Input value={formData.mblNoBLIssued} onChange={(e) => handleInputChange("mblNoBLIssued", e.target.value)} />
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

              {/* Row 4 */}
              <div className="grid grid-cols-5 gap-4">
                <div>
                  <Label className="text-sm">Place of BL Issue</Label>
                  <Input value={formData.placeOfBLIssue} onChange={(e) => handleInputChange("placeOfBLIssue", e.target.value)} />
                </div>
                <div>
                  <Label className="text-sm">Carrier</Label>
                  <Input value={formData.carrier} onChange={(e) => handleInputChange("carrier", e.target.value)} />
                </div>
                <div>
                  <Label className="text-sm">Free Time</Label>
                  <Input value={formData.freeTime} onChange={(e) => handleInputChange("freeTime", e.target.value)} />
                </div>
                <div>
                  <Label className="text-sm">Network Partner</Label>
                  <Select value={formData.networkPartner} onValueChange={(v) => handleInputChange("networkPartner", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-popover border border-border">
                      <SelectItem value="SELF">SELF</SelectItem>
                      <SelectItem value="Partner 1">Partner 1</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm">Assigned To</Label>
                  <Select value={formData.assignedTo} onValueChange={(v) => handleInputChange("assignedTo", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-popover border border-border">
                      <SelectItem value="None">None</SelectItem>
                      <SelectItem value="User 1">User 1</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row 5 - Ports */}
              <div className="grid grid-cols-6 gap-4">
                <div>
                  <Label className="text-sm">Place of Receipt</Label>
                  <Select value={formData.placeOfReceipt} onValueChange={(v) => handleInputChange("placeOfReceipt", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-popover border border-border">
                      <SelectItem value="Colombo">Colombo</SelectItem>
                      <SelectItem value="Singapore">Singapore</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm">Port of Receipt</Label>
                  <Select value={formData.portOfReceipt} onValueChange={(v) => handleInputChange("portOfReceipt", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-popover border border-border">
                      <SelectItem value="Colombo">Colombo</SelectItem>
                      <SelectItem value="Singapore">Singapore</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm">Port of Loading</Label>
                  <Select value={formData.portOfLoading} onValueChange={(v) => handleInputChange("portOfLoading", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-popover border border-border">
                      <SelectItem value="Colombo">Colombo</SelectItem>
                      <SelectItem value="Singapore">Singapore</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm">Port of Discharge</Label>
                  <Select value={formData.portOfDischarge} onValueChange={(v) => handleInputChange("portOfDischarge", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-popover border border-border">
                      <SelectItem value="Jebel Ali">Jebel Ali</SelectItem>
                      <SelectItem value="Dubai">Dubai</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm">Port of Final Destination</Label>
                  <Select value={formData.portOfFinalDestination} onValueChange={(v) => handleInputChange("portOfFinalDestination", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-popover border border-border">
                      <SelectItem value="Jebel Ali">Jebel Ali</SelectItem>
                      <SelectItem value="Dubai">Dubai</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm">Place of Delivery</Label>
                  <Select value={formData.placeOfDelivery} onValueChange={(v) => handleInputChange("placeOfDelivery", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-popover border border-border">
                      <SelectItem value="Jebel Ali">Jebel Ali</SelectItem>
                      <SelectItem value="Dubai">Dubai</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row 6 - Vessel & Dates */}
              <div className="grid grid-cols-5 gap-4">
                <div>
                  <Label className="text-sm">Vessel</Label>
                  <Input value={formData.vessel} onChange={(e) => handleInputChange("vessel", e.target.value)} />
                </div>
                <div>
                  <Label className="text-sm">Voyage</Label>
                  <Input value={formData.voyage} onChange={(e) => handleInputChange("voyage", e.target.value)} />
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
                <div className="grid grid-cols-4 gap-4">
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

              {/* Row 7 - Notes */}
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

              <Button className="bg-emerald-500 hover:bg-emerald-600 text-white">
                Update & Continue
              </Button>
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
                    disabled={isLoadingCustomers || !selectedCategory}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        isLoadingCustomers ? "Loading..." :
                        !selectedCategory ? "No customers for this type" :
                        customers.length === 0 ? "No customers found" :
                        "Select a customer"
                      } />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border border-border max-h-[300px]">
                      {customers.map(customer => (
                        <SelectItem key={customer.id} value={customer.id.toString()}>
                          {customer.name} ({customer.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!selectedCategory && (
                    <p className="text-xs text-amber-600 mt-1">
                      No customer category matches "{partyTypeLabels[selectedPartyType]}". You can add customers manually.
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
                      parties.map((party, index) => (
                        <TableRow key={party.id} className={index % 2 === 0 ? "bg-card" : "bg-secondary/30"}>
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
                              onClick={() => handleDeleteParty(party.id)}
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
                  <span className="text-sm text-muted-foreground">Containers - 6 x 40HC, Total Quantity : 6720</span>
                  <Button className="bg-emerald-500 hover:bg-emerald-600 text-white">
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
                  {containers.map((container, index) => (
                    <TableRow key={container.id} className={index % 2 === 0 ? "bg-card" : "bg-secondary/30"}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="text-emerald-600">{container.container}</TableCell>
                      <TableCell>{container.type}</TableCell>
                      <TableCell className="text-emerald-600">{container.sealNo}</TableCell>
                      <TableCell>{container.noOfPcs}</TableCell>
                      <TableCell>{container.packageType}</TableCell>
                      <TableCell>{container.grossWeight.toFixed(3)}</TableCell>
                      <TableCell className="text-emerald-600">{container.volume.toFixed(3)}</TableCell>
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
                  ))}
                </TableBody>
              </Table>

              <div className="text-sm text-emerald-600">Showing 1 to 6 of 6 entries</div>
            </div>
          </TabsContent>

          {/* Costing Tab */}
          <TabsContent value="costing" className="mt-0">
            <div className="bg-card border border-border rounded-lg p-6 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-emerald-600 font-semibold text-lg">Costing</h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="bg-[#2c3e50] hover:bg-[#34495e] text-white border-[#2c3e50] h-9 px-4">
                    <Plus className="h-4 w-4 mr-1.5" />
                    Create
                  </Button>
                  <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white h-9 px-4">
                    <Plus className="h-4 w-4 mr-1.5" />
                    Generate Invoice
                  </Button>
                  <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white h-9 px-4">
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
                    {mockCosting.map((cost, index) => (
                      <TableRow key={cost.id} className={index % 2 === 0 ? "bg-card" : "bg-secondary/30"}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="text-emerald-600">{cost.description}</TableCell>
                        <TableCell>{cost.saleQty}</TableCell>
                        <TableCell>{cost.saleUnit}</TableCell>
                        <TableCell>{cost.saleCurrency}</TableCell>
                        <TableCell>{cost.saleExRate}</TableCell>
                        <TableCell>{cost.saleFCY}</TableCell>
                        <TableCell className="text-emerald-600">{cost.saleLCY}</TableCell>
                        <TableCell>{cost.costQty}</TableCell>
                        <TableCell>{cost.costUnit}</TableCell>
                        <TableCell>{cost.costCurrency}</TableCell>
                        <TableCell>{cost.costExRate}</TableCell>
                        <TableCell>{cost.costFCY}</TableCell>
                        <TableCell>{cost.costLCY}</TableCell>
                        <TableCell>{cost.unit}</TableCell>
                        <TableCell className="text-emerald-600 font-semibold">{cost.gp}</TableCell>
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
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Bill To and Vendor Tables */}
              <div className="grid grid-cols-2 gap-6">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-table-header">
                      <TableHead className="text-table-header-foreground">Bill To</TableHead>
                      <TableHead className="text-table-header-foreground">P.Sale</TableHead>
                      <TableHead className="text-table-header-foreground">Voucher Number</TableHead>
                      <TableHead className="text-table-header-foreground">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockBillTo.map((bill, index) => (
                      <TableRow key={index} className={index % 2 === 0 ? "bg-card" : "bg-secondary/30"}>
                        <TableCell className="text-emerald-600">{bill.billTo}</TableCell>
                        <TableCell>{bill.pSale}</TableCell>
                        <TableCell className="text-emerald-600">{bill.voucherNumber}</TableCell>
                        <TableCell>{bill.status}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <Table>
                  <TableHeader>
                    <TableRow className="bg-table-header">
                      <TableHead className="text-table-header-foreground">Vendor</TableHead>
                      <TableHead className="text-table-header-foreground">P.Cost</TableHead>
                      <TableHead className="text-table-header-foreground">Voucher Number</TableHead>
                      <TableHead className="text-table-header-foreground">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-4">No data available in table</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              {/* Summary */}
              <div className="flex justify-center">
                <Table className="w-auto">
                  <TableHeader>
                    <TableRow className="bg-table-header">
                      <TableHead className="text-table-header-foreground">Total Sale</TableHead>
                      <TableHead className="text-table-header-foreground">Total Cost</TableHead>
                      <TableHead className="text-table-header-foreground">Profit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="bg-card">
                      <TableCell>( AED 1,381.88)</TableCell>
                      <TableCell></TableCell>
                      <TableCell className="font-semibold">AED 1381.875</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          {/* Cargo Details Tab */}
          <TabsContent value="cargo-details" className="mt-0">
            <div className="bg-card border border-border rounded-lg p-6 space-y-6">
              <h3 className="text-emerald-600 font-semibold text-lg">Cargo Details</h3>
              
              <div className="grid grid-cols-6 gap-4 items-end">
                <div>
                  <Label className="text-sm font-semibold">Quantity</Label>
                  <Input value={cargoDetails.quantity} onChange={(e) => setCargoDetails(prev => ({ ...prev, quantity: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-sm font-semibold">Load Type</Label>
                  <Select value={cargoDetails.loadType} onValueChange={(v) => setCargoDetails(prev => ({ ...prev, loadType: v }))}>
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
                  <Input value={cargoDetails.totalCBM} onChange={(e) => setCargoDetails(prev => ({ ...prev, totalCBM: e.target.value }))} placeholder="Total CBM" />
                </div>
                <div>
                  <Label className="text-sm font-semibold">Total Weight</Label>
                  <Input value={cargoDetails.totalWeight} onChange={(e) => setCargoDetails(prev => ({ ...prev, totalWeight: e.target.value }))} placeholder="Total Weight" />
                </div>
                <div>
                  <Label className="text-sm font-semibold">Description</Label>
                  <Textarea value={cargoDetails.description} onChange={(e) => setCargoDetails(prev => ({ ...prev, description: e.target.value }))} placeholder="Description" className="min-h-[40px]" />
                </div>
                <div>
                  <Button className="bg-emerald-500 hover:bg-emerald-600 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Cargo
                  </Button>
                </div>
              </div>

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
                    Add Cargo
                  </Button>
                </div>
              </div>

              <Button className="bg-emerald-500 hover:bg-emerald-600 text-white">
                Save and Continue
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default ShipmentDetail;
