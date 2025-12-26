import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
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
import { Edit, Search, Calendar, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Mock shipment data
const mockShipments = [
  {
    id: 1,
    jobNumber: "25JAE1658",
    hblNumber: "HSCMBJEA00077",
    mblNumber: "CGLCMBJEA322725",
    customer: "KADDAH BLDG CLEANING EQUIP. TR CO LLC",
    direction: "Import",
    pol: "Colombo",
    pod: "Jebel Ali",
    etd: "24-12-2025",
    eta: "24-12-2025",
    carrier: "GULF AGENCY CO PVT LTD",
    vesselFlight: "EVER URBAN",
    addedBy: "Mazeeda H-SU",
    status: "Opened",
    invoiceGenerated: true,
  },
  {
    id: 2,
    jobNumber: "25JAE1657",
    hblNumber: "716-11767442",
    mblNumber: "716-11767442",
    customer: "GLOBAL REFINISH FZE DUBAI BRANCH",
    direction: "Import",
    pol: "ISTANBUL",
    pod: "DUBAI",
    etd: "20-12-2025",
    eta: "22-12-2025",
    carrier: "MNG AIRLINE",
    vesselFlight: "MB",
    addedBy: "BABAR IRSHAD",
    status: "Opened",
    invoiceGenerated: false,
  },
  {
    id: 3,
    jobNumber: "25JAE1656",
    hblNumber: "H-SU",
    mblNumber: "DXB",
    customer: "",
    direction: "Export",
    pol: "Jebel Ali",
    pod: "Rotterdam",
    etd: "24-12-2025",
    eta: "31-12-2025",
    carrier: "MACNELS",
    vesselFlight: "CMA CGM GLMINI",
    addedBy: "Talha Javed",
    status: "Opened",
    invoiceGenerated: false,
  },
  {
    id: 4,
    jobNumber: "25JAE1655",
    hblNumber: "FCL-SJEA0561001",
    mblNumber: "HLCUSIN251142612",
    customer: "NAWANI WORLDWIDE TRADING LLC",
    direction: "Import",
    pol: "Singapore",
    pod: "Jebel Ali",
    etd: "22-12-2025",
    eta: "22-12-2025",
    carrier: "HAPAG LLOYD",
    vesselFlight: "MAERSK WALLIS",
    addedBy: "Mazeeda H-SU",
    status: "Opened",
    invoiceGenerated: false,
  },
  {
    id: 5,
    jobNumber: "25JAE1654",
    hblNumber: "HBL -",
    mblNumber: "5551311710",
    customer: "NISSEI ASB FZE",
    direction: "Export",
    pol: "DUBAI",
    pod: "Apapa",
    etd: "20-12-2025",
    eta: "20-12-2025",
    carrier: "ICS",
    vesselFlight: "",
    addedBy: "Mazeeda H-SU",
    status: "Opened",
    invoiceGenerated: false,
  },
  {
    id: 6,
    jobNumber: "25JAE1653",
    hblNumber: "HBL -",
    mblNumber: "8868788594909",
    customer: "NISSEI ASB FZE",
    direction: "Export",
    pol: "DUBAI",
    pod: "Abidjan",
    etd: "20-12-2025",
    eta: "18-12-2025",
    carrier: "ICS",
    vesselFlight: "",
    addedBy: "Mazeeda H-SU",
    status: "Opened",
    invoiceGenerated: false,
  },
  {
    id: 7,
    jobNumber: "25JAE1652",
    hblNumber: "FCL-SJEA059101",
    mblNumber: "EMIVVNESAL001367",
    customer: "UNITED GENERAL TRADING FZCO",
    direction: "Import",
    pol: "Manila",
    pod: "Jebel Ali",
    etd: "20-12-2025",
    eta: "20-12-2025",
    carrier: "ESL",
    vesselFlight: "ZHONG GU GUI YANG",
    addedBy: "Mazeeda H-SU",
    status: "Opened",
    invoiceGenerated: false,
  },
  {
    id: 8,
    jobNumber: "25JAE1651",
    hblNumber: "25L03182",
    mblNumber: "HLCUGOA251018A2Q2",
    customer: "",
    direction: "Import",
    pol: "La Spezia",
    pod: "Jebel Ali",
    etd: "12-11-2025",
    eta: "19-12-2025",
    carrier: "HAPAG LLOYD",
    vesselFlight: "M/V PHOENIX J",
    addedBy: "Talha Javed",
    status: "Opened",
    invoiceGenerated: false,
  },
  {
    id: 9,
    jobNumber: "25JAE1650",
    hblNumber: "FCL-SJEA0560901",
    mblNumber: "HLCUSIN251147448",
    customer: "NAWANI WORLDWIDE TRADING LLC",
    direction: "Import",
    pol: "Singapore",
    pod: "Jebel Ali",
    etd: "27-12-2025",
    eta: "09-01-2026",
    carrier: "MAERSK WALLIS",
    vesselFlight: "",
    addedBy: "Mazeeda H-SU",
    status: "Opened",
    invoiceGenerated: false,
  },
  {
    id: 10,
    jobNumber: "25JAE1649",
    hblNumber: "FCL-SJEA0564401",
    mblNumber: "HLCUSIN251147437",
    customer: "",
    direction: "Import",
    pol: "Singapore",
    pod: "Jebel Ali",
    etd: "27-12-2025",
    eta: "16-01-2026",
    carrier: "HAPAG LLOYD",
    vesselFlight: "MAERSK WALLIS",
    addedBy: "Mazeeda H-SU",
    status: "Opened",
    invoiceGenerated: false,
  },
];

const Shipments = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState("10");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchBy, setSearchBy] = useState("jobNo");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState("December 1, 2025 - December 31, 2025");

  const shipments = mockShipments;
  const totalCount = mockShipments.length;
  const totalPages = Math.ceil(totalCount / parseInt(entriesPerPage));

  const handleEdit = (shipment: typeof mockShipments[0]) => {
    navigate(`/shipments/${shipment.id}/edit`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Opened":
        return <Badge className="bg-emerald-500 text-white hover:bg-emerald-600">Opened</Badge>;
      case "Closed":
        return <Badge className="bg-gray-500 text-white hover:bg-gray-600">Closed</Badge>;
      case "Cancelled":
        return <Badge className="bg-red-500 text-white hover:bg-red-600">Cancelled</Badge>;
      default:
        return <Badge className="bg-gray-500 text-white">{status}</Badge>;
    }
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-foreground">All Shipments</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle size={16} className="text-emerald-500" />
            <span>- (Atleast One Invoice Generated)</span>
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-3">
          <Select value={searchBy} onValueChange={setSearchBy}>
            <SelectTrigger className="w-[150px] bg-card border-emerald-500">
              <SelectValue placeholder="Job No" />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border">
              <SelectItem value="jobNo">Job No</SelectItem>
              <SelectItem value="hbl">HBL No</SelectItem>
              <SelectItem value="mbl">MBL No</SelectItem>
              <SelectItem value="customer">Customer</SelectItem>
            </SelectContent>
          </Select>

          <Input
            placeholder=""
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-[300px] bg-card"
          />

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px] bg-card">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border">
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="opened">Opened</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2 border border-border rounded-md px-3 py-2 bg-card flex-1 max-w-[350px]">
            <Calendar size={16} className="text-muted-foreground" />
            <Input
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="border-0 p-0 h-auto bg-transparent focus-visible:ring-0 text-sm"
              placeholder="Select date range"
            />
          </div>

          <Button className="bg-emerald-500 hover:bg-emerald-600 text-white gap-2">
            <Search size={16} />
            Search
          </Button>
        </div>

        {/* Table Controls */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Show</span>
          <Select value={entriesPerPage} onValueChange={(value) => {
            setEntriesPerPage(value);
            setCurrentPage(1);
          }}>
            <SelectTrigger className="w-[70px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border">
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">entries</span>
        </div>

        {/* Shipments Table */}
        <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-table-header">
                  <TableHead className="text-table-header-foreground font-semibold">Actions</TableHead>
                  <TableHead className="text-table-header-foreground font-semibold">Job Number</TableHead>
                  <TableHead className="text-table-header-foreground font-semibold">Document No</TableHead>
                  <TableHead className="text-table-header-foreground font-semibold">Customer</TableHead>
                  <TableHead className="text-table-header-foreground font-semibold">Direction</TableHead>
                  <TableHead className="text-table-header-foreground font-semibold">POL</TableHead>
                  <TableHead className="text-table-header-foreground font-semibold">POD</TableHead>
                  <TableHead className="text-table-header-foreground font-semibold">Departure/Arrival</TableHead>
                  <TableHead className="text-table-header-foreground font-semibold">Carrier</TableHead>
                  <TableHead className="text-table-header-foreground font-semibold">Vessel/Flight</TableHead>
                  <TableHead className="text-table-header-foreground font-semibold">Added</TableHead>
                  <TableHead className="text-table-header-foreground font-semibold">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shipments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center py-8 text-muted-foreground">
                      No shipments found
                    </TableCell>
                  </TableRow>
                ) : (
                  shipments.map((shipment, index) => (
                    <TableRow 
                      key={shipment.id} 
                      className={`hover:bg-muted/50 ${index % 2 === 0 ? "bg-card" : "bg-secondary/30"}`}
                    >
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 bg-emerald-500 hover:bg-emerald-600 text-white rounded"
                          onClick={() => handleEdit(shipment)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                      <TableCell className="font-medium">{shipment.jobNumber}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-emerald-600 text-sm">HBL - {shipment.hblNumber}</div>
                          <div className="text-emerald-600 text-sm">MBL - {shipment.mblNumber}</div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <span className="text-emerald-600">{shipment.customer || "-"}</span>
                      </TableCell>
                      <TableCell>{shipment.direction}</TableCell>
                      <TableCell className="text-emerald-600">{shipment.pol}</TableCell>
                      <TableCell>{shipment.pod}</TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          <div>ETD - {shipment.etd}</div>
                          <div>ETA - {shipment.eta}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-emerald-600">{shipment.carrier}</TableCell>
                      <TableCell>{shipment.vesselFlight || "-"}</TableCell>
                      <TableCell>{shipment.addedBy}</TableCell>
                      <TableCell>{getStatusBadge(shipment.status)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-emerald-600">
            Showing 1 to {Math.min(parseInt(entriesPerPage), totalCount)} of {totalCount} entries (filtered from 320 total entries)
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
            >
              Previous
            </Button>
            {[1, 2, 3, 4, 5].map((page) => (
              <Button
                key={page}
                variant={page === currentPage ? "default" : "outline"}
                size="sm"
                className={page === currentPage ? "bg-emerald-500 hover:bg-emerald-600" : ""}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Shipments;
