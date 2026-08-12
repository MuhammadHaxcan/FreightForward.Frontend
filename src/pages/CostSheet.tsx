import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { DateRangePicker, DateRangeValue } from "@/components/ui/date-range-picker";
import { formatDate, formatDateToISO } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, Printer, Loader2, Search } from "lucide-react";
import { costSheetApi, CostSheetSummaryDto } from "@/services/api";
import { useBaseCurrency } from "@/hooks/useBaseCurrency";


// Format mode for display
const formatMode = (mode?: string) => {
  switch (mode) {
    case "SeaFreightFCL": return "Sea Freight FCL";
    case "SeaFreightLCL": return "Sea Freight LCL";
    case "AirFreight": return "Air Freight";
    case "BreakBulk": return "Break Bulk";
    case "RoRo": return "RoRo";
    case "Courier": return "Courier";
    default: return mode || "";
  }
};

const getStatusBadge = (status?: string) => {
  switch (status) {
    case "Opened":
      return <Badge className="bg-emerald-500 text-white hover:bg-emerald-600">Opened</Badge>;
    case "Closed":
      return <Badge className="bg-gray-500 text-white hover:bg-gray-600">Closed</Badge>;
    case "Cancelled":
      return <Badge className="bg-red-500 text-white hover:bg-red-600">Cancelled</Badge>;
    default:
      return <Badge className="bg-gray-500 text-white">{status || "-"}</Badge>;
  }
};

const getDirectionBadge = (direction?: string) => {
  switch (direction) {
    case "Import":
      return <Badge variant="outline" className="border-blue-500 text-blue-500">Import</Badge>;
    case "Export":
      return <Badge variant="outline" className="border-orange-500 text-orange-500">Export</Badge>;
    case "CrossTrade":
      return <Badge variant="outline" className="border-purple-500 text-purple-500">Cross-Trade</Badge>;
    default:
      return <Badge variant="outline">{direction || "-"}</Badge>;
  }
};

export const CostSheet = () => {
  const navigate = useNavigate();
  const baseCurrencyCode = useBaseCurrency();
  const initialDateRange = useMemo<DateRangeValue>(() => ({
    from: new Date(new Date().getFullYear(), 0, 1),
    to: new Date(),
  }), []);
  const [searchTerm, setSearchTerm] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [entriesPerPage, setEntriesPerPage] = useState("10");
  const [currentPage, setCurrentPage] = useState(1);
  const [dateRange, setDateRange] = useState<DateRangeValue>(initialDateRange);
  const [appliedDateRange, setAppliedDateRange] = useState<DateRangeValue>({
    ...initialDateRange,
  });

  // Fetch cost sheet data
  const { data: costSheetResponse, isLoading } = useQuery({
    queryKey: ["cost-sheet", appliedDateRange.from, appliedDateRange.to],
    queryFn: () => costSheetApi.getList(
      appliedDateRange.from ? formatDateToISO(appliedDateRange.from) : "",
      appliedDateRange.to ? formatDateToISO(appliedDateRange.to) : ""
    ),
    enabled: !!appliedDateRange.from && !!appliedDateRange.to,
  });

  const costSheetData = costSheetResponse?.data || [];

  const filteredCostSheetData = useMemo(() => {
    const search = appliedSearch.trim().toLowerCase();

    return costSheetData.filter((item) => {
      if (statusFilter !== "all" && item.jobStatus !== statusFilter) {
        return false;
      }

      if (!search) {
        return true;
      }

      return [
        item.jobDate,
        item.jobNumber,
        item.jobStatus,
        item.direction,
        formatMode(item.mode),
        item.salesPerson,
        item.totalSaleLCY.toFixed(2),
        item.totalCostLCY.toFixed(2),
        item.gp.toFixed(2),
      ].some((value) => value?.toLowerCase().includes(search));
    });
  }, [appliedSearch, costSheetData, statusFilter]);

  const pageSize = parseInt(entriesPerPage, 10) || 10;
  const totalCount = filteredCostSheetData.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const paginatedCostSheetData = filteredCostSheetData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleSearch = () => {
    setAppliedSearch(searchTerm);
    setAppliedDateRange(dateRange);
    setCurrentPage(1);
  };

  // Handle print PDF - opens in new tab
  const handlePrint = () => {
    const from = appliedDateRange.from ? formatDateToISO(appliedDateRange.from) : "";
    const to = appliedDateRange.to ? formatDateToISO(appliedDateRange.to) : "";
    window.open(`/accounts/cost-sheet/print?fromDate=${from}&toDate=${to}`, '_blank');
  };

  // Handle view detail
  const handleView = (shipmentId: number) => {
    navigate(`/accounts/cost-sheet/${shipmentId}`);
  };

  // Calculate totals
  const totalSale = filteredCostSheetData.reduce((sum, item) => sum + item.totalSaleLCY, 0);
  const totalCost = filteredCostSheetData.reduce((sum, item) => sum + item.totalCostLCY, 0);
  const totalGP = filteredCostSheetData.reduce((sum, item) => sum + item.gp, 0);

  const getPageNumbers = () => Array.from({ length: Math.min(7, totalPages) }, (_, index) => {
    if (totalPages <= 7) return index + 1;
    if (currentPage <= 4) return index + 1;
    if (currentPage >= totalPages - 3) return totalPages - 6 + index;
    return currentPage - 3 + index;
  });

  return (
    <MainLayout>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold">Cost Sheet</h1>
          <Button
            onClick={handlePrint}
            disabled={isLoading || filteredCostSheetData.length === 0}
            className="btn-success"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <Input
            placeholder="Search all cost sheet columns..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && handleSearch()}
            className="w-[340px] bg-card"
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
            onApply={(range) => range && setDateRange(range)}
            placeholder="Select date range"
            excludePresets={["all"]}
            className="min-w-[240px]"
          />

          <Button className="btn-success gap-2" onClick={handleSearch}>
            <Search size={16} />
            Search
          </Button>
        </div>

        {/* Table controls */}
        <div className="flex justify-between items-center text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>Show</span>
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
            <span>entries</span>
          </div>
          <span>{`Amount in ${baseCurrencyCode}`}</span>
        </div>

        {/* Table */}
        <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-table-header">
                <TableHead className="text-table-header-foreground font-semibold">Date</TableHead>
                <TableHead className="text-table-header-foreground font-semibold">Job No</TableHead>
                <TableHead className="text-table-header-foreground font-semibold">Job Status</TableHead>
                <TableHead className="text-table-header-foreground font-semibold">Direction</TableHead>
                <TableHead className="text-table-header-foreground font-semibold">Mode</TableHead>
                <TableHead className="text-table-header-foreground font-semibold">Sales Person</TableHead>
                <TableHead className="text-table-header-foreground font-semibold text-right">Sale Cost</TableHead>
                <TableHead className="text-table-header-foreground font-semibold text-right">Purchase Cost</TableHead>
                <TableHead className="text-table-header-foreground font-semibold text-right">GP</TableHead>
                <TableHead className="text-table-header-foreground font-semibold w-16">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : paginatedCostSheetData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    No data found for the selected date range
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {paginatedCostSheetData.map((item, index) => (
                    <TableRow
                      key={item.shipmentId}
                      className={`hover:bg-table-row-hover ${index % 2 === 0 ? "bg-card" : "bg-secondary/30"}`}
                    >
                      <TableCell className="text-xs text-muted-foreground">{formatDate(item.jobDate)}</TableCell>
                      <TableCell className="text-xs font-semibold text-foreground">{item.jobNumber}</TableCell>
                      <TableCell className="text-xs">{getStatusBadge(item.jobStatus)}</TableCell>
                      <TableCell className="text-xs">{getDirectionBadge(item.direction)}</TableCell>
                      <TableCell className="text-xs text-foreground">{formatMode(item.mode)}</TableCell>
                      <TableCell className="text-xs font-medium text-foreground">{item.salesPerson || "-"}</TableCell>
                      <TableCell className="text-xs text-right font-medium tabular-nums">
                        {item.totalSaleLCY > 0 ? `${baseCurrencyCode} ${item.totalSaleLCY.toFixed(2)}` : ""}
                      </TableCell>
                      <TableCell className="text-xs text-right font-medium tabular-nums">
                        {item.totalCostLCY > 0 ? `${baseCurrencyCode} ${item.totalCostLCY.toFixed(2)}` : ""}
                      </TableCell>
                      <TableCell className={`text-xs text-right font-semibold tabular-nums ${item.gp >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                        {baseCurrencyCode} {item.gp.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleView(item.shipmentId)}
                          className="h-8 w-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Totals Row */}
                  <TableRow className="bg-muted/50 font-semibold">
                    <TableCell colSpan={6} className="text-right text-xs">Totals:</TableCell>
                    <TableCell className="text-xs text-right">{baseCurrencyCode} {totalSale.toFixed(2)}</TableCell>
                    <TableCell className="text-xs text-right">{baseCurrencyCode} {totalCost.toFixed(2)}</TableCell>
                    <TableCell className={`text-xs text-right ${totalGP >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {baseCurrencyCode} {totalGP.toFixed(2)}
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            {totalCount > 0
              ? `Showing ${(currentPage - 1) * pageSize + 1} to ${Math.min(currentPage * pageSize, totalCount)} of ${totalCount} entries`
              : "No entries to show"}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
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
              onClick={() => setCurrentPage((page) => page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default CostSheet;
