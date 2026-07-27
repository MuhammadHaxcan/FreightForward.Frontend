import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { cn, formatDate, formatDateToISO } from "@/lib/utils";
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
import {
  Edit,
  Eye,
  Search,
  CheckCircle,
  Loader2,
  Plus,
  MapPin,
  FileText,
  PackageCheck,
  Ship,
  FileBadge,
  FileSignature,
  ClipboardList,
  BookOpen,
  ListChecks,
  ChevronRight,
  Package,
  Info,
  ArrowRight,
  RotateCcw,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { useShipments } from "@/hooks/useShipments";
import { Shipment, ShipmentStatus } from "@/services/api";
import { formatEventDateOnly } from "@/lib/status-event-utils";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { useAuth } from "@/contexts/AuthContext";
import { DateRangePicker, DateRangeValue } from "@/components/ui/date-range-picker";

const CONTAINER_NUMBER_REPORTS = new Set(["c-list", "customs-declaration"]);

const Shipments = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState("10");
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRangeValue | undefined>(undefined);
  const [appliedDateRange, setAppliedDateRange] = useState<DateRangeValue | undefined>(undefined);
  const [reportsShipmentId, setReportsShipmentId] = useState<number | null>(null);
  const [containerPromptReport, setContainerPromptReport] = useState<{ slug: string; name: string } | null>(null);
  const [containerNumberValue, setContainerNumberValue] = useState("");

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

  const handleResetFilters = () => {
    setSearchTerm("");
    setAppliedSearch("");
    setStatusFilter("all");
    setDateRange(undefined);
    setAppliedDateRange(undefined);
    setCurrentPage(1);
  };

  const handleEdit = (shipment: Shipment) => {
    navigate(`/shipments/${shipment.jobNumber}/edit`);
  };

  const canEditShipment = (shipment: Shipment) =>
    hasPermission("ship_edit") && (shipment.jobStatus !== "Closed" || hasPermission("ship_edit_closed"));

  const handleAddNew = () => {
    navigate('/shipments/add');
  };

  const getStatusBadge = (status: string) => <StatusBadge status={status} />;

  const getDirectionBadge = (direction: string) => {
    switch (direction) {
      case "Import":
        return <Badge variant="outline" className="border-blue-500 text-[0.825rem] text-blue-500">Import</Badge>;
      case "Export":
        return <Badge variant="outline" className="border-orange-500 text-[0.825rem] text-orange-500">Export</Badge>;
      case "CrossTrade":
        return <Badge variant="outline" className="border-purple-500 text-[0.825rem] text-purple-500">Cross-Trade</Badge>;
      default:
        return <Badge variant="outline" className="text-[0.825rem]">{direction}</Badge>;
    }
  };

  const getShipmentTypeMeta = (shipmentTypeDisplay?: string) => {
    const normalizedType = shipmentTypeDisplay?.toLowerCase() || "";
    const isNonConsole = normalizedType.includes("non") && normalizedType.includes("console");
    const isConsole = !isNonConsole && normalizedType.includes("console");

    if (isConsole) {
      return {
        label: "Console Shipment",
        rowClassName: "bg-emerald-50/70 hover:bg-emerald-100/70",
        stickyCellClassName: "bg-emerald-50 group-hover:bg-emerald-100",
        badgeClassName: "border-emerald-200 bg-emerald-100 text-emerald-800",
      };
    }

    if (isNonConsole) {
      return {
        label: "Non-Console Shipment",
        rowClassName: "bg-background/90 hover:bg-secondary/55",
        stickyCellClassName: "bg-background group-hover:bg-secondary",
        badgeClassName: "border-slate-300 bg-slate-100 text-slate-700",
      };
    }

    return {
      label: shipmentTypeDisplay || "-",
      rowClassName: "bg-card hover:bg-table-row-hover",
      stickyCellClassName: "bg-card group-hover:bg-table-row-hover",
      badgeClassName: "border-border bg-card text-muted-foreground",
    };
  };

  const hasActiveFilters =
    Boolean(searchTerm || appliedSearch) ||
    statusFilter !== "all" ||
    Boolean(
      dateRange?.from ||
      dateRange?.to ||
      appliedDateRange?.from ||
      appliedDateRange?.to,
    );

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
      <div className="min-h-screen bg-background p-4 lg:p-6">
        <div className="mx-auto flex max-w-[1800px] flex-col gap-4">
          <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
            <div className="flex flex-col gap-4 border-b border-border px-4 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-5">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-semibold tracking-tight text-foreground">All Shipments</h1>
                  <Badge variant="secondary" className="border border-border bg-secondary/60 text-secondary-foreground">
                    {totalCount.toLocaleString()} total
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Search, review routes, and manage shipment milestones from one operational grid.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CheckCircle size={14} className="text-emerald-600" />
                  <span>Invoice generated</span>
                </div>

                <PermissionGate permission="ship_add">
                  <Button className="btn-success h-9 gap-2" onClick={handleAddNew}>
                    <Plus size={16} />
                    Add Shipment
                  </Button>
                </PermissionGate>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 px-4 py-3 lg:px-5">
              <div className="relative min-w-[280px] flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search jobs, documents, customers, ports, carriers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="h-9 bg-background pl-9"
                />
              </div>

              <SearchableSelect
                options={[
                  { value: "all", label: "All statuses" },
                  { value: "Opened", label: "Opened" },
                  { value: "Closed", label: "Closed" },
                  { value: "Cancelled", label: "Cancelled" },
                ]}
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value);
                  setCurrentPage(1);
                }}
                placeholder="All statuses"
                searchPlaceholder="Search status..."
                triggerClassName="h-9 w-[155px] bg-background"
              />

              <DateRangePicker
                value={dateRange}
                onApply={setDateRange}
                placeholder="Date range"
                className="h-9 min-w-[220px]"
              />

              <Button className="btn-success h-9 gap-2" onClick={handleSearch}>
                <Search size={15} />
                Apply
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="h-9 gap-2 text-muted-foreground"
                onClick={handleResetFilters}
                disabled={!hasActiveFilters}
              >
                <RotateCcw size={14} />
                Reset
              </Button>

              <div className="ml-auto flex items-center gap-2 border-l border-border pl-3">
                <span className="text-xs text-muted-foreground">Show</span>
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
                  triggerClassName="h-9 w-[82px] bg-background"
                />
                <span className="text-xs text-muted-foreground">rows</span>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
            <div className="min-h-[360px] overflow-x-auto">
              <Table className="min-w-[1320px] text-[0.9625rem]">
                <TableHeader className="sticky top-0 z-20">
                  <TableRow className="border-sidebar-border bg-table-header hover:bg-table-header">
                    <TableHead className="sticky left-0 z-30 w-[92px] bg-table-header text-[12.1px] font-semibold uppercase tracking-wide text-table-header-foreground">
                      Actions
                    </TableHead>
                    <TableHead className="w-[170px] text-[12.1px] font-semibold uppercase tracking-wide text-table-header-foreground">
                      Job
                    </TableHead>
                    <TableHead className="w-[175px] text-[12.1px] font-semibold uppercase tracking-wide text-table-header-foreground">
                      Documents
                    </TableHead>
                    <TableHead className="min-w-[198px] text-[12.1px] font-semibold uppercase tracking-wide text-table-header-foreground">
                      Customer(s)
                    </TableHead>
                    <TableHead className="w-[204px] text-[12.1px] font-semibold uppercase tracking-wide text-table-header-foreground">
                      Direction / Mode / Type
                    </TableHead>
                    <TableHead className="min-w-[360px] text-[12.1px] font-semibold uppercase tracking-wide text-table-header-foreground">
                      Route & Milestone
                    </TableHead>
                    <TableHead className="w-[180px] text-[12.1px] font-semibold uppercase tracking-wide text-table-header-foreground">
                      Carrier & Vessel
                    </TableHead>
                    <TableHead className="w-[110px] text-[12.1px] font-semibold uppercase tracking-wide text-table-header-foreground">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody className="[&_tr]:hover:bg-transparent">
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="py-12 text-center">
                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Loading shipments...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : isError ? (
                    <TableRow>
                      <TableCell colSpan={8} className="py-12 text-center text-red-600">
                        Error loading shipments: {error?.message || "Unknown error"}
                      </TableCell>
                    </TableRow>
                  ) : shipments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="py-12 text-center">
                        <div className="space-y-1">
                          <p className="font-medium text-foreground">No shipments found</p>
                          <p className="text-[0.825rem] text-muted-foreground">
                            Try changing the search term, status, or date range.
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    shipments.map((shipment) => {
                      const shipmentTypeMeta = getShipmentTypeMeta(shipment.shipmentTypeDisplay);

                      return (
                        <TableRow
                          key={shipment.id}
                          className={cn(
                            "group border-border/80 transition-colors",
                            shipmentTypeMeta.rowClassName,
                          )}
                        >
                          <TableCell
                            className={cn(
                              "sticky left-0 z-10 px-3 py-3 transition-colors",
                              shipmentTypeMeta.stickyCellClassName,
                            )}
                          >
                            <div className="flex gap-1.5">
                              {canEditShipment(shipment) ? (
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 border-border bg-card text-foreground hover:border-emerald-400 hover:bg-emerald-100 hover:text-emerald-800"
                                  onClick={() => handleEdit(shipment)}
                                  title="Edit shipment"
                                  aria-label={`Edit shipment ${shipment.jobNumber}`}
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </Button>
                              ) : (
                                <PermissionGate permission="ship_view">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 border-border bg-card text-foreground hover:bg-secondary"
                                    onClick={() => handleEdit(shipment)}
                                    title="View shipment"
                                    aria-label={`View shipment ${shipment.jobNumber}`}
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                  </Button>
                                </PermissionGate>
                              )}
                              <PermissionGate permission="ship_view">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 border-border bg-card text-foreground hover:border-table-header hover:bg-table-header hover:text-table-header-foreground"
                                  onClick={() => setReportsShipmentId(shipment.id)}
                                  title="Shipment reports"
                                  aria-label={`Open reports for shipment ${shipment.jobNumber}`}
                                >
                                  <FileText className="h-3.5 w-3.5" />
                                </Button>
                              </PermissionGate>
                            </div>
                          </TableCell>

                          <TableCell className="px-4 py-3 align-middle">
                            <div className="flex items-center gap-1.5 font-semibold text-foreground">
                              <span>{shipment.jobNumber}</span>
                              {shipment.invoiceGenerated && (
                                <CheckCircle
                                  size={14}
                                  className="shrink-0 text-emerald-600"
                                  aria-label="Invoice generated"
                                />
                              )}
                            </div>
                            <div className="mt-1 text-[12.1px] text-muted-foreground">
                              {formatDate(shipment.jobDate, "dd/MM/yyyy")}
                            </div>
                          </TableCell>

                          <TableCell className="px-4 py-3 align-middle">
                            <div className="space-y-1.5">
                              <div className="flex items-baseline gap-2">
                                <span className="min-w-7 text-[12.1px] font-semibold uppercase tracking-wide text-muted-foreground">HBL</span>
                                <span className="text-[0.9075rem] font-semibold text-foreground">{shipment.houseBLNo || "-"}</span>
                              </div>
                              <div className="flex items-baseline gap-2">
                                <span className="min-w-7 text-[12.1px] font-semibold uppercase tracking-wide text-muted-foreground">MBL</span>
                                <span className="text-[0.9075rem] font-semibold text-foreground">{shipment.mblNumber || "-"}</span>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell className="max-w-[234px] px-4 py-3 align-middle">
                            {shipment.customerNames && shipment.customerNames.length > 0 ? (
                              <div className="space-y-1">
                                {shipment.customerNames.map((name, i) => (
                                  <div key={i} className="text-[0.9625rem] font-semibold leading-snug text-foreground">
                                    {name}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="font-semibold text-foreground">-</span>
                            )}
                          </TableCell>

                          <TableCell className="px-4 py-3 align-middle">
                            <div className="flex flex-col items-start gap-1.5">
                              <div className="flex flex-wrap items-center gap-1.5">
                                {getDirectionBadge(shipment.direction)}
                                <span className="text-[0.825rem] font-medium text-foreground">{shipment.modeDisplay || "-"}</span>
                              </div>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "whitespace-nowrap px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
                                  shipmentTypeMeta.badgeClassName,
                                )}
                              >
                                {shipmentTypeMeta.label}
                              </Badge>
                            </div>
                          </TableCell>

                          <TableCell className="px-4 py-3 align-middle">
                            <div className="min-w-[330px]">
                              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                                <div className="min-w-0">
                                  <div className="truncate text-[0.825rem] font-semibold text-foreground" title={shipment.portOfLoadingName || "-"}>
                                    {shipment.portOfLoadingName || "-"}
                                  </div>
                                  <div className="mt-0.5 text-[11px] font-medium text-muted-foreground">
                                    ETD {formatDate(shipment.etd, "dd/MM/yyyy")}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <span className="h-px w-3 bg-border" />
                                  <ArrowRight className="h-3.5 w-3.5" />
                                  <span className="h-px w-3 bg-border" />
                                </div>
                                <div className="min-w-0 text-right">
                                  <div className="truncate text-[0.825rem] font-semibold text-foreground" title={shipment.portOfDischargeName || "-"}>
                                    {shipment.portOfDischargeName || "-"}
                                  </div>
                                  <div className="mt-0.5 text-[11px] font-medium text-muted-foreground">
                                    ETA {formatDate(shipment.eta, "dd/MM/yyyy")}
                                  </div>
                                </div>
                              </div>

                              <div className="mt-2 border-t border-border/70 pt-2">
                                {shipment.latestEvent ? (
                                  <div className="grid grid-cols-[auto_1fr_auto] items-start gap-2 text-[12.1px]">
                                    <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-emerald-100" />
                                    <div className="min-w-0">
                                      <div
                                        className="truncate font-semibold text-foreground"
                                        title={shipment.latestEvent.eventDescription}
                                      >
                                        {shipment.latestEvent.eventDescription}
                                      </div>
                                      {shipment.latestEvent.location && (
                                        <div className="mt-0.5 flex items-center gap-1 text-muted-foreground">
                                          <MapPin className="h-3 w-3 shrink-0" />
                                          <span className="truncate">{shipment.latestEvent.location}</span>
                                        </div>
                                      )}
                                    </div>
                                    {shipment.latestEvent.eventDateTime && (
                                      <span className="whitespace-nowrap text-[11px] font-medium text-muted-foreground">
                                        {formatEventDateOnly(shipment.latestEvent.eventDateTime)}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-[12.1px] italic text-muted-foreground">No milestone reported</span>
                                )}
                              </div>
                            </div>
                          </TableCell>

                          <TableCell className="px-4 py-3 align-middle">
                            <div className="space-y-1">
                              <div className="text-[0.825rem] font-semibold text-foreground">{shipment.carrier || "-"}</div>
                              <div className="text-[12.1px] font-medium text-muted-foreground">{shipment.vessel || "-"}</div>
                            </div>
                          </TableCell>

                          <TableCell className="px-4 py-3 align-middle">
                            {getStatusBadge(shipment.jobStatus)}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-col gap-3 border-t border-border bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[0.825rem] text-muted-foreground">
                {totalCount > 0 ? (
                  <>
                    Showing{" "}
                    <span className="font-semibold text-foreground">
                      {((currentPage - 1) * (parseInt(entriesPerPage, 10) || 10)) + 1}
                    </span>{" "}
                    to{" "}
                    <span className="font-semibold text-foreground">
                      {Math.min(currentPage * (parseInt(entriesPerPage, 10) || 10), totalCount)}
                    </span>{" "}
                    of <span className="font-semibold text-foreground">{totalCount}</span> shipments
                  </>
                ) : (
                  "No shipments to show"
                )}
              </p>

              <div className="flex flex-wrap items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-[0.825rem]"
                  disabled={currentPage === 1 || isLoading}
                  onClick={() => setCurrentPage((page) => page - 1)}
                >
                  Previous
                </Button>
                {getPageNumbers().map((page) => (
                  <Button
                    key={page}
                    variant={page === currentPage ? "default" : "outline"}
                    size="sm"
                    className={cn("h-8 min-w-8 px-2 text-[0.825rem]", page === currentPage && "btn-success")}
                    onClick={() => setCurrentPage(page)}
                    disabled={isLoading}
                  >
                    {page}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-[0.825rem]"
                  disabled={currentPage >= totalPages || isLoading}
                  onClick={() => setCurrentPage((page) => page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Reports Dialog */}
      <Dialog open={reportsShipmentId !== null} onOpenChange={(open) => { if (!open) setReportsShipmentId(null); }}>
        <DialogContent className="max-w-modal-md p-0 bg-card overflow-hidden">
          <DialogHeader className="bg-modal-header text-white p-4 rounded-t-lg">
            <DialogTitle className="text-white text-lg">Shipment Reports</DialogTitle>
          </DialogHeader>
          <div className="p-3 max-h-[60vh] overflow-y-auto">
            <div className="space-y-1">
              {[
                { name: "CARGO MANIFEST", slug: "cargo-manifest", icon: FileText, color: "text-blue-600 bg-blue-100" },
                { name: "PROOF OF DELIVERY", slug: "proof-of-delivery", icon: PackageCheck, color: "text-emerald-600 bg-emerald-100" },
                { name: "CARGO ARRIVAL", slug: "cargo-arrival-notice", icon: Ship, color: "text-cyan-600 bg-cyan-100" },
                { name: "FREIGHT CERTIFICATE", slug: "freight-certificate", icon: FileBadge, color: "text-amber-600 bg-amber-100" },
                { name: "MBL SHIPPING", slug: "mbl-shipping-instruction", icon: FileSignature, color: "text-indigo-600 bg-indigo-100" },
                { name: "CUSTOMS MANIFEST", slug: "customs-declaration", icon: ClipboardList, color: "text-orange-600 bg-orange-100" },
                { name: "C BOOK", slug: "cbook", icon: BookOpen, color: "text-purple-600 bg-purple-100" },
                { name: "C LIST", slug: "c-list", icon: ListChecks, color: "text-rose-600 bg-rose-100" },
              ].map((report) => (
                <button
                  key={report.slug}
                  className="group flex w-full items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 text-left transition-colors hover:border-border hover:bg-accent"
                  onClick={() => {
                    if (CONTAINER_NUMBER_REPORTS.has(report.slug)) {
                      setContainerNumberValue("");
                      setContainerPromptReport({ slug: report.slug, name: report.name });
                    } else {
                      window.open(`/shipments/${reportsShipmentId}/reports/${report.slug}`, '_blank');
                    }
                  }}
                >
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${report.color}`}>
                    <report.icon className="h-4 w-4" />
                  </span>
                  <span className="flex-1 text-sm font-semibold text-slate-700 group-hover:text-slate-900">
                    {report.name}
                  </span>
                  <ChevronRight className="h-4 w-4 text-slate-300 transition-colors group-hover:text-slate-500" />
                </button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Container Number Prompt (for C List / Customs Manifest) */}
      <Dialog open={containerPromptReport !== null} onOpenChange={(open) => { if (!open) setContainerPromptReport(null); }}>
        <DialogContent className="max-w-modal-md p-0 bg-card overflow-hidden">
          <DialogHeader className="bg-modal-header text-white p-4 rounded-t-lg">
            <DialogTitle className="flex items-center gap-2 text-white text-lg">
              <Package className="h-5 w-5 text-white/80" />
              Print {containerPromptReport?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 p-6">
            <label className="text-sm font-semibold text-slate-700" htmlFor="container-number-input">
              Container Number
            </label>
            <Input
              id="container-number-input"
              autoFocus
              placeholder="e.g. STXU4531168"
              value={containerNumberValue}
              onChange={(e) => setContainerNumberValue(e.target.value.toUpperCase())}
              className="h-11 font-mono tracking-wide focus-visible:ring-emerald-500"
              onKeyDown={(e) => {
                if (e.key === "Enter" && containerNumberValue.trim()) {
                  window.open(
                    `/shipments/reports/by-container/${containerPromptReport?.slug}/${encodeURIComponent(containerNumberValue.trim())}?shipmentId=${reportsShipmentId}`,
                    '_blank'
                  );
                  setContainerPromptReport(null);
                }
              }}
            />
            <p className="flex items-start gap-1.5 rounded-md bg-slate-50 p-2.5 text-xs text-muted-foreground">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
              All shipments sharing this container will be included on the printed document.
            </p>
          </div>
          <DialogFooter className="gap-2 border-t border-border bg-card px-6 py-4">
            <Button type="button" variant="outline" onClick={() => setContainerPromptReport(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!containerNumberValue.trim()}
              className="btn-success px-8"
              onClick={() => {
                window.open(
                  `/shipments/reports/by-container/${containerPromptReport?.slug}/${encodeURIComponent(containerNumberValue.trim())}?shipmentId=${reportsShipmentId}`,
                  '_blank'
                );
                setContainerPromptReport(null);
              }}
            >
              Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Shipments;
