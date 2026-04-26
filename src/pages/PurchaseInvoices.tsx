import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatDate, formatDateToISO } from "@/lib/utils";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MainLayout } from "@/components/layout/MainLayout";
import { usePurchaseInvoices } from "@/hooks/useInvoices";
import { useAllCreditors } from "@/hooks/useCustomers";
import { useBaseCurrency } from "@/hooks/useBaseCurrency";
import { DateRangePicker, DateRangeValue } from "@/components/ui/date-range-picker";

export default function PurchaseInvoices() {
  const navigate = useNavigate();
  const baseCurrencyCode = useBaseCurrency();
  const [searchTerm, setSearchTerm] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [selectedVendor, setSelectedVendor] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRangeValue | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  });
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data: vendors = [] } = useAllCreditors();
  const { data: invoicesPage, isLoading: loading } = usePurchaseInvoices({
    pageNumber,
    pageSize,
    searchTerm: appliedSearch || undefined,
    vendorId: selectedVendor !== "all" ? parseInt(selectedVendor) : undefined,
    fromDate: dateRange?.from ? formatDateToISO(dateRange.from) : undefined,
    toDate: dateRange?.to ? formatDateToISO(dateRange.to) : undefined,
  });
  const invoices = invoicesPage?.items ?? [];
  const totalCount = invoicesPage?.totalCount ?? 0;
  const totalPages = invoicesPage?.totalPages ?? 0;

  const handleSearch = () => {
    setAppliedSearch(searchTerm);
    setPageNumber(1);
  };

  const handleViewInvoice = (purchaseNo: string) => {
    navigate(`/accounts/purchase-invoices/${encodeURIComponent(purchaseNo)}`);
  };

  const formatCurrency = (amount: number, currency: string) => {
    return `${currency} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const startEntry = totalCount > 0 ? (pageNumber - 1) * pageSize + 1 : 0;
  const endEntry = Math.min(pageNumber * pageSize, totalCount);

  return (
    <MainLayout>
      <div className="p-6 space-y-4">
        {/* Header */}
        <h1 className="text-2xl font-semibold">Purchase Invoices</h1>

        {/* Filters */}
        <div className="bg-muted/30 border rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-green-600">Vendors (Creditors)</label>
              <SearchableSelect
                options={[
                  { value: "all", label: "Select All" },
                  ...vendors.map((vendor) => ({
                    value: vendor.id.toString(),
                    label: vendor.name,
                  })),
                ]}
                value={selectedVendor}
                onValueChange={setSelectedVendor}
                placeholder="Select All"
                searchPlaceholder="Search vendors..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-green-600">Date</label>
              <DateRangePicker
                value={dateRange}
                onApply={setDateRange}
                className="w-full"
              />
            </div>

            <div className="flex items-end">
              <Button onClick={handleSearch} className="bg-primary text-primary-foreground">
                Search
              </Button>
            </div>
          </div>
        </div>

        {/* Table Controls */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm">Show</span>
            <SearchableSelect
              options={[
                { value: "10", label: "10" },
                { value: "25", label: "25" },
                { value: "50", label: "50" },
                { value: "100", label: "100" },
              ]}
              value={pageSize.toString()}
              onValueChange={(v) => { setPageSize(parseInt(v)); setPageNumber(1); }}
              placeholder="10"
              searchPlaceholder="Search..."
              triggerClassName="w-[90px]"
            />
            <span className="text-sm">entries</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm">Search:</span>
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="w-48"
              placeholder="Search..."
            />
          </div>
        </div>

        {/* Purchase Invoices Table */}
        <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-table-header">
                <TableHead className="text-table-header-foreground font-semibold">Purchase Inv #</TableHead>
                <TableHead className="text-table-header-foreground font-semibold">Job #</TableHead>
                <TableHead className="text-table-header-foreground font-semibold">Vendor Invoice Date</TableHead>
                <TableHead className="text-table-header-foreground font-semibold">Vendor Invoice No</TableHead>
                <TableHead className="text-table-header-foreground font-semibold">Vendor Name</TableHead>
                <TableHead className="text-table-header-foreground font-semibold">Amount</TableHead>
                <TableHead className="text-table-header-foreground font-semibold">Added</TableHead>
                <TableHead className="text-table-header-foreground font-semibold">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    No purchase invoices found
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((invoice, index) => (
                  <TableRow key={invoice.id} className={`border-b border-border hover:bg-table-row-hover transition-colors ${index % 2 === 0 ? "bg-card" : "bg-secondary/30"}`}>
                    <TableCell>
                      <span
                        className="text-primary hover:underline cursor-pointer"
                        onClick={() => handleViewInvoice(invoice.purchaseNo)}
                      >
                        {invoice.purchaseNo}
                      </span>
                    </TableCell>
                    <TableCell>{invoice.jobNo || "-"}</TableCell>
                    <TableCell>
                      {invoice.vendorInvoiceDate
                        ? formatDate(invoice.vendorInvoiceDate)
                        : "-"}
                    </TableCell>
                    <TableCell>{invoice.vendorInvoiceNo || "-"}</TableCell>
                    <TableCell>
                      <span className="text-primary hover:underline cursor-pointer">
                        {invoice.vendorName || "-"}
                      </span>
                    </TableCell>
                    <TableCell>{formatCurrency(invoice.amount, invoice.currencyCode || baseCurrencyCode)}</TableCell>
                    <TableCell>{invoice.createdBy || "-"}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        className="btn-success"
                        onClick={() => handleViewInvoice(invoice.purchaseNo)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            Showing {startEntry} to {endEntry} of {totalCount} entries
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
              disabled={pageNumber === 1}
            >
              Previous
            </Button>
            {totalPages > 0 && Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 7) {
                pageNum = i + 1;
              } else if (pageNumber <= 4) {
                pageNum = i + 1;
              } else if (pageNumber >= totalPages - 3) {
                pageNum = totalPages - 6 + i;
              } else {
                pageNum = pageNumber - 3 + i;
              }
              return (
                <Button
                  key={pageNum}
                  variant={pageNumber === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPageNumber(pageNum)}
                  className="w-8"
                >
                  {pageNum}
                </Button>
              );
            })}
            {totalPages > 7 && pageNumber < totalPages - 3 && (
              <>
                <span className="px-2">...</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPageNumber(totalPages)}
                  className="w-8"
                >
                  {totalPages}
                </Button>
              </>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPageNumber((p) => Math.min(totalPages, p + 1))}
              disabled={pageNumber === totalPages || totalPages === 0}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
