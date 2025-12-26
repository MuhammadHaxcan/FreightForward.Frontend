import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Edit, Trash2, Plus, FileText } from "lucide-react";
import { ContainerModal } from "@/components/shipments/ContainerModal";
import { CostingModal } from "@/components/shipments/CostingModal";
import { DocumentModal } from "@/components/shipments/DocumentModal";
import { InvoiceModal } from "@/components/shipments/InvoiceModal";
import { PurchaseModal } from "@/components/shipments/PurchaseModal";
import { toast } from "sonner";

const customerTypes = [
  "Shipper",
  "Consignee",
  "Booking Party",
  "Agents",
  "Forwarder",
  "Shipping Line",
  "Air Line",
  "Delivery Agent",
];

const generateJobNumber = () => {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${year}JAE${random}`;
};

const AddShipment = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("shipment-info");
  const [formData, setFormData] = useState({
    jobNumber: generateJobNumber(),
    jobDate: new Date().toISOString().split('T')[0],
    jobStatus: "Opened",
    direction: "Cross-Trade",
    mode: "Air Freight",
    incoterms: "",
    houseBLNo: "",
    houseBLDate: new Date().toISOString().split('T')[0],
    houseBLStatus: "HBL",
    hblServiceType: "LCL/LCL",
    hblNoBLIssued: "",
    hblFreight: "Collect",
    mblNumber: "",
    mblDate: new Date().toISOString().split('T')[0],
    mblStatus: "HBL",
    mblServiceType: "LCL/LCL",
    mblNoBLIssued: "",
    mblFreight: "Collect",
    placeOfBLIssue: "",
    carrier: "",
    freeTime: "",
    networkPartner: "FNC",
    placeOfReceipt: "",
    portOfReceipt: "",
    portOfLoading: "",
    portOfDischarge: "",
    portOfFinalDestination: "",
    placeOfDelivery: "",
    vessel: "",
    voyage: "",
    etd: new Date().toISOString().split('T')[0],
    eta: new Date().toISOString().split('T')[0],
    secondLegVessel: false,
    marksNumbers: "",
    notes: "",
    internalNotes: "",
  });

  const [parties, setParties] = useState<any[]>([]);
  const [selectedCustomerType, setSelectedCustomerType] = useState("Shipper");
  const [selectedCustomerName, setSelectedCustomerName] = useState("");
  const [containers, setContainers] = useState<any[]>([]);
  const [costing, setCosting] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [shipmentStatus, setShipmentStatus] = useState({ date: new Date().toISOString().split('T')[0], remarks: "" });

  // Modal states
  const [containerModalOpen, setContainerModalOpen] = useState(false);
  const [costingModalOpen, setCostingModalOpen] = useState(false);
  const [documentModalOpen, setDocumentModalOpen] = useState(false);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [editingContainer, setEditingContainer] = useState<any>(null);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddParty = () => {
    if (!selectedCustomerName) {
      toast.error("Please select a customer");
      return;
    }
    const newParty = {
      id: Date.now(),
      masterType: "Debtors",
      type: selectedCustomerType,
      name: selectedCustomerName,
      mobile: "0",
      phone: "",
      email: "example@email.com",
    };
    setParties(prev => [...prev, newParty]);
    setSelectedCustomerName("");
    toast.success("Party added successfully");
  };

  const handleDeleteParty = (partyId: number) => {
    setParties(prev => prev.filter(p => p.id !== partyId));
    toast.success("Party deleted");
  };

  const handleSaveContainer = (container: any) => {
    if (editingContainer) {
      setContainers(prev => prev.map(c => c.id === container.id ? container : c));
      toast.success("Container updated");
    } else {
      setContainers(prev => [...prev, container]);
      toast.success("Container added");
    }
    setEditingContainer(null);
  };

  const handleEditContainer = (container: any) => {
    setEditingContainer(container);
    setContainerModalOpen(true);
  };

  const handleDeleteContainer = (containerId: number) => {
    setContainers(prev => prev.filter(c => c.id !== containerId));
    toast.success("Container deleted");
  };

  const handleSaveCosting = (cost: any) => {
    setCosting(prev => [...prev, cost]);
    toast.success("Costing added");
  };

  const handleDeleteCosting = (costId: number) => {
    setCosting(prev => prev.filter(c => c.id !== costId));
    toast.success("Costing deleted");
  };

  const handleSaveDocument = (doc: any) => {
    setDocuments(prev => [...prev, doc]);
    toast.success("Document added");
  };

  const handleDeleteDocument = (docId: number) => {
    setDocuments(prev => prev.filter(d => d.id !== docId));
    toast.success("Document deleted");
  };

  const handleSaveAndContinue = () => {
    toast.success("Shipment saved successfully");
    // Continue to next tab or stay
  };

  const totalContainerQty = containers.reduce((sum, c) => sum + (c.noOfPcs || 0), 0);
  const containerSummary = containers.length > 0 
    ? `${containers.length} x ${containers[0]?.type || 'N/A'}, Total Quantity : ${totalContainerQty}`
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-transparent border-b border-border w-full justify-start rounded-none h-auto p-0 gap-0">
            <TabsTrigger value="shipment-info" className="rounded-t-md rounded-b-none px-4 py-2 data-[state=active]:bg-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-none border-0">
              Shipment Info
            </TabsTrigger>
            <TabsTrigger value="parties" className="rounded-t-md rounded-b-none px-4 py-2 data-[state=active]:bg-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-none border-0">
              Parties
            </TabsTrigger>
            <TabsTrigger value="containers" className="rounded-t-md rounded-b-none px-4 py-2 data-[state=active]:bg-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-none border-0">
              Containers
            </TabsTrigger>
            <TabsTrigger value="costing" className="rounded-t-md rounded-b-none px-4 py-2 data-[state=active]:bg-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-none border-0">
              Costing
            </TabsTrigger>
            <TabsTrigger value="cargo-details" className="rounded-t-md rounded-b-none px-4 py-2 data-[state=active]:bg-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-none border-0">
              Cargo Details
            </TabsTrigger>
            <TabsTrigger value="documents" className="rounded-t-md rounded-b-none px-4 py-2 data-[state=active]:bg-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-none border-0">
              Documents
            </TabsTrigger>
            <TabsTrigger value="shipment-status" className="rounded-t-md rounded-b-none px-4 py-2 data-[state=active]:bg-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-none border-0">
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
                  <Input value={formData.jobNumber} className="bg-[#34495e] text-white" readOnly />
                </div>
                <div>
                  <Label className="text-sm">Date</Label>
                  <Input type="date" value={formData.jobDate} onChange={(e) => handleInputChange("jobDate", e.target.value)} />
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
                      <SelectItem value="Sea Freight FCL">Sea Freight FCL</SelectItem>
                      <SelectItem value="Sea Freight LCL">Sea Freight LCL</SelectItem>
                      <SelectItem value="Air Freight">Air Freight</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm">INCO Terms</Label>
                  <Select value={formData.incoterms} onValueChange={(v) => handleInputChange("incoterms", v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent className="bg-popover border border-border">
                      <SelectItem value="CFR">CFR</SelectItem>
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
                  <Label className="text-sm">House B/L No</Label>
                  <Input value={formData.houseBLNo} onChange={(e) => handleInputChange("houseBLNo", e.target.value)} placeholder="B/L No" />
                </div>
                <div>
                  <Label className="text-sm">Date</Label>
                  <Input type="date" value={formData.houseBLDate} onChange={(e) => handleInputChange("houseBLDate", e.target.value)} />
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

              {/* Row 3 - MBL */}
              <div className="grid grid-cols-6 gap-4">
                <div>
                  <Label className="text-sm">MBL Number</Label>
                  <Input value={formData.mblNumber} onChange={(e) => handleInputChange("mblNumber", e.target.value)} placeholder="MBL Number" />
                </div>
                <div>
                  <Label className="text-sm">Date</Label>
                  <Input type="date" value={formData.mblDate} onChange={(e) => handleInputChange("mblDate", e.target.value)} />
                </div>
                <div>
                  <Label className="text-sm">BL Status</Label>
                  <Select value={formData.mblStatus} onValueChange={(v) => handleInputChange("mblStatus", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-popover border border-border">
                      <SelectItem value="MBL">MBL</SelectItem>
                      <SelectItem value="HBL">HBL</SelectItem>
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

              {/* Row 4 */}
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label className="text-sm">Place of BL Issue</Label>
                  <Input value={formData.placeOfBLIssue} onChange={(e) => handleInputChange("placeOfBLIssue", e.target.value)} placeholder="No BL Issued" />
                </div>
                <div>
                  <Label className="text-sm">Carrier</Label>
                  <Input value={formData.carrier} onChange={(e) => handleInputChange("carrier", e.target.value)} className="bg-[#f0ad4e] border-[#f0ad4e]" />
                </div>
                <div>
                  <Label className="text-sm">Free Time</Label>
                  <Input value={formData.freeTime} onChange={(e) => handleInputChange("freeTime", e.target.value)} placeholder="Free Time" />
                </div>
                <div>
                  <Label className="text-sm">Network Partner</Label>
                  <Select value={formData.networkPartner} onValueChange={(v) => handleInputChange("networkPartner", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-popover border border-border">
                      <SelectItem value="SELF">SELF</SelectItem>
                      <SelectItem value="FNC">FNC</SelectItem>
                      <SelectItem value="Partner 1">Partner 1</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row 5 - Ports */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm">Place of Receipt</Label>
                  <Select value={formData.placeOfReceipt} onValueChange={(v) => handleInputChange("placeOfReceipt", v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent className="bg-popover border border-border">
                      <SelectItem value="Colombo">Colombo</SelectItem>
                      <SelectItem value="Singapore">Singapore</SelectItem>
                      <SelectItem value="Dubai">Dubai</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm">Port of Receipt</Label>
                  <Select value={formData.portOfReceipt} onValueChange={(v) => handleInputChange("portOfReceipt", v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent className="bg-popover border border-border">
                      <SelectItem value="Colombo">Colombo</SelectItem>
                      <SelectItem value="Singapore">Singapore</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm">Port of Loading</Label>
                  <Select value={formData.portOfLoading} onValueChange={(v) => handleInputChange("portOfLoading", v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent className="bg-popover border border-border">
                      <SelectItem value="Colombo">Colombo</SelectItem>
                      <SelectItem value="Singapore">Singapore</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm">Port of Discharge</Label>
                  <Select value={formData.portOfDischarge} onValueChange={(v) => handleInputChange("portOfDischarge", v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent className="bg-popover border border-border">
                      <SelectItem value="Jebel Ali">Jebel Ali</SelectItem>
                      <SelectItem value="Dubai">Dubai</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm">Port of Final Destination</Label>
                  <Select value={formData.portOfFinalDestination} onValueChange={(v) => handleInputChange("portOfFinalDestination", v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent className="bg-popover border border-border">
                      <SelectItem value="Jebel Ali">Jebel Ali</SelectItem>
                      <SelectItem value="Dubai">Dubai</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm">Place of Delivery</Label>
                  <Select value={formData.placeOfDelivery} onValueChange={(v) => handleInputChange("placeOfDelivery", v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
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
                  <Input value={formData.vessel} onChange={(e) => handleInputChange("vessel", e.target.value)} placeholder="OCL France" />
                </div>
                <div>
                  <Label className="text-sm">Voyage</Label>
                  <Input value={formData.voyage} onChange={(e) => handleInputChange("voyage", e.target.value)} placeholder="78465F1" />
                </div>
                <div>
                  <Label className="text-sm">ETD</Label>
                  <Input type="date" value={formData.etd} onChange={(e) => handleInputChange("etd", e.target.value)} />
                </div>
                <div>
                  <Label className="text-sm">ETA</Label>
                  <Input type="date" value={formData.eta} onChange={(e) => handleInputChange("eta", e.target.value)} />
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

              <Button onClick={handleSaveAndContinue} className="bg-emerald-500 hover:bg-emerald-600 text-white">
                Save and Continue
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
                  <Select value={selectedCustomerType} onValueChange={setSelectedCustomerType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-popover border border-border">
                      {customerTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm text-red-500">* Customer Name</Label>
                  <Select value={selectedCustomerName} onValueChange={setSelectedCustomerName}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent className="bg-popover border border-border">
                      <SelectItem value="MONTEVERDI SRL">MONTEVERDI SRL</SelectItem>
                      <SelectItem value="ATRACO INDUSTRIAL ENTERPRISES">ATRACO INDUSTRIAL ENTERPRISES</SelectItem>
                      <SelectItem value="PRECISION INDUSTRIES">PRECISION INDUSTRIES</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Button className="bg-emerald-500 hover:bg-emerald-600 text-white" onClick={handleAddParty}>
                    Add Parties
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
                        <TableCell colSpan={7} className="text-center text-muted-foreground">No parties added</TableCell>
                      </TableRow>
                    ) : (
                      parties.map((party, index) => (
                        <TableRow key={party.id} className={index % 2 === 0 ? "bg-card" : "bg-secondary/30"}>
                          <TableCell>{party.masterType}</TableCell>
                          <TableCell className="text-emerald-600">{party.type}</TableCell>
                          <TableCell className="text-emerald-600">{party.name}</TableCell>
                          <TableCell>{party.mobile}</TableCell>
                          <TableCell>{party.phone || "-"}</TableCell>
                          <TableCell className="text-emerald-600">{party.email}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" className="h-8 w-8 bg-red-500 hover:bg-red-600 text-white rounded" onClick={() => handleDeleteParty(party.id)}>
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
                        <TableCell className="text-emerald-600">{container.container}</TableCell>
                        <TableCell>{container.type}</TableCell>
                        <TableCell className="text-emerald-600">{container.sealNo}</TableCell>
                        <TableCell>{container.noOfPcs}</TableCell>
                        <TableCell>{container.packageType}</TableCell>
                        <TableCell>{(container.grossWeight || 0).toFixed(3)}</TableCell>
                        <TableCell className="text-emerald-600">{(container.volume || 0).toFixed(3)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 bg-emerald-500 hover:bg-emerald-600 text-white rounded" onClick={() => handleEditContainer(container)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 bg-red-500 hover:bg-red-600 text-white rounded" onClick={() => handleDeleteContainer(container.id)}>
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
                    onClick={() => setCostingModalOpen(true)}
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
                    costing.map((cost, index) => (
                      <TableRow key={cost.id} className={index % 2 === 0 ? "bg-card" : "bg-secondary/30"}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="text-emerald-600">{cost.description}</TableCell>
                        <TableCell>{cost.saleQty}</TableCell>
                        <TableCell>{cost.saleUnit}</TableCell>
                        <TableCell>{cost.saleCurrency}</TableCell>
                        <TableCell>{cost.saleExRate}</TableCell>
                        <TableCell>{cost.saleFCY}</TableCell>
                        <TableCell>{cost.saleLCY}</TableCell>
                        <TableCell>{cost.costQty}</TableCell>
                        <TableCell>{cost.costUnit}</TableCell>
                        <TableCell>{cost.costCurrency}</TableCell>
                        <TableCell>{cost.costExRate}</TableCell>
                        <TableCell>{cost.costFCY}</TableCell>
                        <TableCell>{cost.costLCY}</TableCell>
                        <TableCell>{cost.unit}</TableCell>
                        <TableCell>{cost.gp}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 bg-emerald-500 hover:bg-emerald-600 text-white rounded">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 bg-red-500 hover:bg-red-600 text-white rounded" onClick={() => handleDeleteCosting(cost.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Summary */}
              <div className="flex justify-end">
                <div className="grid grid-cols-3 gap-8 bg-secondary/30 p-4 rounded-lg">
                  <div>
                    <Label className="text-sm font-semibold">Total Sale</Label>
                    <div className="text-emerald-600 font-semibold">| AED {totalSale.toFixed(2)}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">Total Cost</Label>
                    <div className="text-foreground font-semibold">AED {totalCost.toFixed(2)}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">Profit</Label>
                    <div className="text-foreground font-semibold">AED {(totalSale - totalCost).toFixed(2)}</div>
                  </div>
                </div>
              </div>
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
                            <Button variant="ghost" size="icon" className="h-8 w-8 bg-red-500 hover:bg-red-600 text-white rounded" onClick={() => handleDeleteDocument(doc.id)}>
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
                  <Input 
                    type="date" 
                    value={shipmentStatus.date}
                    onChange={(e) => setShipmentStatus(prev => ({ ...prev, date: e.target.value }))}
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
        onOpenChange={setCostingModalOpen}
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
        chargesDetails={costing}
        onSave={(invoice) => {
          toast.success("Invoice generated");
        }}
      />

      <PurchaseModal
        open={purchaseModalOpen}
        onOpenChange={setPurchaseModalOpen}
        chargesDetails={costing}
        onSave={(purchase) => {
          toast.success("Purchase booked");
        }}
      />
    </MainLayout>
  );
};

export default AddShipment;
