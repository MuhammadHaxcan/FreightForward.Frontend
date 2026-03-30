import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { formatDate, formatDateToISO } from "@/lib/utils";
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
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Edit, Search, CheckCircle, Loader2, Plus, MapPin, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useShipments } from "@/hooks/useShipments";
import { Shipment, ShipmentStatus } from "@/services/api";
import { formatEventDateOnly } from "@/lib/status-event-utils";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { DateRangePicker, DateRangeValue } from "@/components/ui/date-range-picker";

const Shipments = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState("10");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchBy, setSearchBy] = useState("jobNo");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRangeValue | undefined>(undefined);
  const [appliedDateRange, setAppliedDateRange] = useState<DateRangeValue | undefined>(undefined);
  const [reportsShipmentId, setReportsShipmentId] = useState<number | null>(null);

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
      pageSize: parseInt(entriesPerPage, 10) || 10,
    };

    if (appliedSearch) {
      params.searchTerm = appliedSearch;
    }

    if (statusFilter && statusFilter !== "all") {
      params.status = statusFilter as ShipmentStatus;
    }

    if (appliedDateRange?.from) {
      params.fromDate = formatDateToISO(appliedDateRange.from);
    }

    if (appliedDateRange?.to) {
      params.toDate = formatDateToISO(appliedDateRange.to);
    }

    return params;
  }, [currentPage, entriesPerPage, appliedSearch, statusFilter, appliedDateRange]);

  const { data, isLoading, isError, error } = useShipments(searchParams);

  const shipments = data?.items || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = data?.totalPages || 1;

  const handleSearch = () => {
    setAppliedSearch(searchTerm);
    setAppliedDateRange(dateRange);
    setCurrentPage(1);
  };

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
    return Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
      let pageNum: number;
      if (totalPages <= 7) {
        pageNum = i + 1;
      } else if (currentPage <= 4) {
        pageNum = i + 1;
      } else if (currentPage >= totalPages - 3) {
        pageNum = totalPages - 6 + i;
      } else {
        pageNum = currentPage - 3 + i;
      }
      return pageNum;
    });
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
                className="btn-success gap-2"
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
          <SearchableSelect
            options={[
              { value: "jobNo", label: "Job No" },
              { value: "hbl", label: "HBL No" },
              { value: "mbl", label: "MBL No" },
              { value: "customer", label: "Customer" },
            ]}
            value={searchBy}
            onValueChange={setSearchBy}
            placeholder="Job No"
            searchPlaceholder="Search..."
            triggerClassName="w-[150px] bg-card border-border"
          />

          <Input
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="w-[300px] bg-card"
          />

          <SearchableSelect
            options={[
              { value: "all", label: "All" },
              { value: "Opened", label: "Opened" },
              { value: "Closed", label: "Closed" },
              { value: "Cancelled", label: "Cancelled" },
            ]}
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value);
              setCurrentPage(1);
            }}
            placeholder="All"
            searchPlaceholder="Search status..."
            triggerClassName="w-[150px] bg-card"
          />

          <DateRangePicker
            value={dateRange}
            onApply={setDateRange}
            placeholder="Select date range"
            className="min-w-[240px]"
          />

          <Button
            className="btn-success gap-2"
            onClick={handleSearch}
          >
            <Search size={16} />
            Search
          </Button>
        </div>

        {/* Table Controls */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Show</span>
          <SearchableSelect
            options={[
              { value: "10", label: "10" },
              { value: "25", label: "25" },
              { value: "50", label: "50" },
              { value: "100", label: "100" },
            ]}
            value={entriesPerPage}
            onValueChange={(value) => {
              setEntriesPerPage(value);
              setCurrentPage(1);
            }}
            triggerClassName="w-[90px] h-8"
          />
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
                  <TableHead className="text-table-header-foreground font-semibold">Direction/Mode</TableHead>
                  <TableHead className="text-table-header-foreground font-semibold">Shipment Type</TableHead>
                  <TableHead className="text-table-header-foreground font-semibold">POL</TableHead>
                  <TableHead className="text-table-header-foreground font-semibold">POD</TableHead>
                  <TableHead className="text-table-header-foreground font-semibold">Carrier/Vessel</TableHead>
                  <TableHead className="text-table-header-foreground font-semibold">Latest Event</TableHead>
                  <TableHead className="text-table-header-foreground font-semibold">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={14} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Loading shipments...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : isError ? (
                  <TableRow>
                    <TableCell colSpan={14} className="text-center py-8 text-red-500">
                      Error loading shipments: {error?.message || 'Unknown error'}
                    </TableCell>
                  </TableRow>
                ) : shipments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={14} className="text-center py-8 text-muted-foreground">
                      No shipments found
                    </TableCell>
                  </TableRow>
                ) : (
                  shipments.map((shipment, index) => (
                    <TableRow
                      key={shipment.id}
                      className={`hover:bg-table-row-hover ${index % 2 === 0 ? "bg-card" : "bg-secondary/30"}`}
                    >
                      <TableCell>
                        <div className="flex gap-1">
                          <PermissionGate permission="ship_edit">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 btn-success rounded"
                              onClick={() => handleEdit(shipment)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </PermissionGate>
                          <PermissionGate permission="ship_view">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded"
                              onClick={() => setReportsShipmentId(shipment.id)}
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                          </PermissionGate>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {shipment.jobNumber}
                          {shipment.invoiceGenerated && (
                            <CheckCircle size={14} className="text-emerald-500" />
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">{formatDate(shipment.jobDate, "dd/MM/yyyy")}</div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-emerald-600 text-sm">HBL - {shipment.houseBLNo || "-"}</div>
                          <div className="text-emerald-600 text-sm">MBL - {shipment.mblNumber || "-"}</div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        {shipment.customerNames && shipment.customerNames.length > 0
                          ? shipment.customerNames.map((name, i) => (
                              <div key={i} className="text-emerald-600 text-sm">{name}</div>
                            ))
                          : <span className="text-emerald-600">-</span>
                        }
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {getDirectionBadge(shipment.direction)}
                          <span className="text-sm block">{shipment.modeDisplay || "-"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{shipment.shipmentTypeDisplay || "-"}</span>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <span className="text-emerald-600">{shipment.portOfLoadingName || "-"}</span>
                          <div className="text-xs text-muted-foreground">ETD: {formatDate(shipment.etd, "dd/MM/yyyy")}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <span>{shipment.portOfDischargeName || "-"}</span>
                          <div className="text-xs text-muted-foreground">ETA: {formatDate(shipment.eta, "dd/MM/yyyy")}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          <div className="text-emerald-600">{shipment.carrier || "-"}</div>
                          <div>{shipment.vessel || "-"}</div>
                        </div>
                      </TableCell>
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
          <p className="text-sm text-muted-foreground">
            {totalCount > 0 ? (
              <>
                Showing {((currentPage - 1) * (parseInt(entriesPerPage, 10) || 10)) + 1} to {Math.min(currentPage * (parseInt(entriesPerPage, 10) || 10), totalCount)} of {totalCount} entries
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
                className={page === currentPage ? "btn-success" : ""}
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

      {/* Reports Dialog */}
      <Dialog open={reportsShipmentId !== null} onOpenChange={(open) => { if (!open) setReportsShipmentId(null); }}>
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
                ].map((report) => (
                  <tr key={report.slug} className="border-b hover:bg-muted/50">
                    <td className="py-2 px-2 text-sm">{report.no}</td>
                    <td className="py-2 px-2">
                      <button
                        className="text-emerald-600 hover:text-emerald-700 hover:underline font-medium text-sm"
                        onClick={() => window.open(`/shipments/${reportsShipmentId}/reports/${report.slug}`, '_blank')}
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
            <Button variant="outline" onClick={() => setReportsShipmentId(null)} className="mx-auto">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Shipments;
