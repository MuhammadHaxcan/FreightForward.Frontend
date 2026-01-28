import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
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
import { Edit, Search, Calendar, CheckCircle, Loader2, Plus, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useShipments } from "@/hooks/useShipments";
import { Shipment, ShipmentStatus } from "@/services/api";
import { formatEventDateOnly } from "@/lib/status-event-utils";
import { PermissionGate } from "@/components/auth/PermissionGate";

const Shipments = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState("10");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchBy, setSearchBy] = useState("jobNo");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Build search params based on search type
  const searchParams = useMemo(() => {
    const params: {
      pageNumber: number;
      pageSize: number;
      searchTerm?: string;
      status?: ShipmentStatus;
      fromDate?: string;
      toDate?: string;
    } = {
      pageNumber: currentPage,
      pageSize: parseInt(entriesPerPage),
    };

    if (searchTerm) {
      params.searchTerm = searchTerm;
    }

    if (statusFilter && statusFilter !== "all") {
      params.status = statusFilter as ShipmentStatus;
    }

    if (fromDate) {
      params.fromDate = fromDate;
    }

    if (toDate) {
      params.toDate = toDate;
    }

    return params;
  }, [currentPage, entriesPerPage, searchTerm, statusFilter, fromDate, toDate]);

  const { data, isLoading, isError, error } = useShipments(searchParams);

  const shipments = data?.items || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = data?.totalPages || 1;

  const handleEdit = (shipment: Shipment) => {
    navigate(`/shipments/${shipment.id}/edit`);
  };

  const handleAddNew = () => {
    navigate('/shipments/add');
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

  const getDirectionBadge = (direction: string) => {
    switch (direction) {
      case "Import":
        return <Badge variant="outline" className="border-blue-500 text-blue-500">Import</Badge>;
      case "Export":
        return <Badge variant="outline" className="border-orange-500 text-orange-500">Export</Badge>;
      case "CrossTrade":
        return <Badge variant="outline" className="border-purple-500 text-purple-500">Cross-Trade</Badge>;
      default:
        return <Badge variant="outline">{direction}</Badge>;
    }
  };

  // formatDate imported from utils

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const startPage = Math.max(1, currentPage - 2);
      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }

    return pages;
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-foreground">All Shipments</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle size={16} className="text-emerald-500" />
              <span>- (Atleast One Invoice Generated)</span>
            </div>
            <PermissionGate permission="ship_add">
              <Button
                className="bg-emerald-500 hover:bg-emerald-600 text-white gap-2"
                onClick={handleAddNew}
              >
                <Plus size={16} />
                Add Shipment
              </Button>
            </PermissionGate>
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-3">
          <Select value={searchBy} onValueChange={setSearchBy}>
            <SelectTrigger className="w-[150px] bg-card border-border">
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
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-[300px] bg-card"
          />

          <Select value={statusFilter} onValueChange={(value) => {
            setStatusFilter(value);
            setCurrentPage(1);
          }}>
            <SelectTrigger className="w-[150px] bg-card">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border">
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="Opened">Opened</SelectItem>
              <SelectItem value="Closed">Closed</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 border border-border rounded-md px-3 py-2 bg-card">
              <Calendar size={16} className="text-muted-foreground" />
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="border-0 p-0 h-auto bg-transparent focus-visible:ring-0 text-sm w-[130px]"
                placeholder="From Date"
              />
            </div>
            <span className="text-muted-foreground">to</span>
            <div className="flex items-center gap-2 border border-border rounded-md px-3 py-2 bg-card">
              <Calendar size={16} className="text-muted-foreground" />
              <Input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="border-0 p-0 h-auto bg-transparent focus-visible:ring-0 text-sm w-[130px]"
                placeholder="To Date"
              />
            </div>
          </div>

          <Button
            className="bg-emerald-500 hover:bg-emerald-600 text-white gap-2"
            onClick={() => setCurrentPage(1)}
          >
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
                  <TableHead className="text-table-header-foreground font-semibold">Mode</TableHead>
                  <TableHead className="text-table-header-foreground font-semibold">POL</TableHead>
                  <TableHead className="text-table-header-foreground font-semibold">POD</TableHead>
                  <TableHead className="text-table-header-foreground font-semibold">Departure/Arrival</TableHead>
                  <TableHead className="text-table-header-foreground font-semibold">Carrier</TableHead>
                  <TableHead className="text-table-header-foreground font-semibold">Vessel</TableHead>
                  <TableHead className="text-table-header-foreground font-semibold">Latest Event</TableHead>
                  <TableHead className="text-table-header-foreground font-semibold">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={13} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Loading shipments...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : isError ? (
                  <TableRow>
                    <TableCell colSpan={13} className="text-center py-8 text-red-500">
                      Error loading shipments: {error?.message || 'Unknown error'}
                    </TableCell>
                  </TableRow>
                ) : shipments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={13} className="text-center py-8 text-muted-foreground">
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
                        <PermissionGate permission="ship_edit">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 bg-emerald-500 hover:bg-emerald-600 text-white rounded"
                            onClick={() => handleEdit(shipment)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </PermissionGate>
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {shipment.jobNumber}
                          {shipment.invoiceGenerated && (
                            <CheckCircle size={14} className="text-emerald-500" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-emerald-600 text-sm">HBL - {shipment.houseBLNo || "-"}</div>
                          <div className="text-emerald-600 text-sm">MBL - {shipment.mblNumber || "-"}</div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <span className="text-emerald-600">{shipment.customerName || "-"}</span>
                      </TableCell>
                      <TableCell>{getDirectionBadge(shipment.direction)}</TableCell>
                      <TableCell>
                        <span className="text-sm">{shipment.transportModeName || shipment.modeDisplay || "-"}</span>
                      </TableCell>
                      <TableCell className="text-emerald-600">{shipment.portOfLoadingName || "-"}</TableCell>
                      <TableCell>{shipment.portOfDischargeName || "-"}</TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          <div>ETD - {formatDate(shipment.etd, "dd/MM/yyyy")}</div>
                          <div>ETA - {formatDate(shipment.eta, "dd/MM/yyyy")}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-emerald-600">{shipment.carrier || "-"}</TableCell>
                      <TableCell>{shipment.vessel || "-"}</TableCell>
                      <TableCell>
                        {shipment.latestEvent ? (
                          <div className="space-y-0.5 text-sm max-w-[200px]">
                            <div className="font-medium text-foreground truncate" title={shipment.latestEvent.eventDescription}>
                              {shipment.latestEvent.eventDescription}
                            </div>
                            {shipment.latestEvent.location && (
                              <div className="flex items-center gap-1 text-muted-foreground text-xs">
                                <MapPin className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{shipment.latestEvent.location}</span>
                              </div>
                            )}
                            {shipment.latestEvent.eventDateTime && (
                              <div className="text-xs text-muted-foreground">
                                {formatEventDateOnly(shipment.latestEvent.eventDateTime)}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(shipment.jobStatus)}</TableCell>
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
            {totalCount > 0 ? (
              <>
                Showing {((currentPage - 1) * parseInt(entriesPerPage)) + 1} to {Math.min(currentPage * parseInt(entriesPerPage), totalCount)} of {totalCount} entries
              </>
            ) : (
              "No entries to show"
            )}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1 || isLoading}
              onClick={() => setCurrentPage(p => p - 1)}
            >
              Previous
            </Button>
            {getPageNumbers().map((page) => (
              <Button
                key={page}
                variant={page === currentPage ? "default" : "outline"}
                size="sm"
                className={page === currentPage ? "bg-emerald-500 hover:bg-emerald-600" : ""}
                onClick={() => setCurrentPage(page)}
                disabled={isLoading}
              >
                {page}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages || isLoading}
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
