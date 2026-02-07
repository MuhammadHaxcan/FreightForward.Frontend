import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { formatDate, formatDateToISO, formatDateForDisplay } from "@/lib/utils";
import { Search, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { MainLayout } from "@/components/layout/MainLayout";
import { invoiceApi, customerApi, Customer, VatReportItem, VatReportTotals } from "@/services/api";
import { DateRange } from "react-day-picker";
import { useBaseCurrency } from "@/hooks/useBaseCurrency";

export default function VatReport() {
  const baseCurrencyCode = useBaseCurrency();
  const [items, setItems] = useState<VatReportItem[]>([]);
  const [totals, setTotals] = useState<VatReportTotals>({
    totalAmount: 0,
    totalNonTaxableSale: 0,
    totalTaxableSale: 0,
    totalTaxAmount: 0,
    totalInvoiceAmount: 0,
  });
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  });
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Fetch customers for filter
  useEffect(() => {
    const fetchCustomers = async () => {
      const response = await customerApi.getAll({ pageSize: 1000, masterType: 'Debtors' });
      if (response.data) {
        setCustomers(response.data.items);
      }
    };
    fetchCustomers();
  }, []);

  // Fetch VAT report data
  const fetchVatReport = async () => {
    setLoading(true);
    try {
      const response = await invoiceApi.getVatReport({
        pageNumber,
        pageSize,
        customerId: selectedCustomer !== "all" ? parseInt(selectedCustomer) : undefined,
        fromDate: dateRange?.from ? formatDateToISO(dateRange.from) : undefined,
        toDate: dateRange?.to ? formatDateToISO(dateRange.to) : undefined,
        searchTerm: searchTerm || undefined,
      });
      if (response.data) {
        setItems(response.data.items.items);
        setTotalCount(response.data.items.totalCount);
        setTotalPages(response.data.items.totalPages);
        setTotals(response.data.totals);
      }
    } catch (error) {
      toast.error("Failed to load VAT report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVatReport();
  }, [pageNumber, pageSize]);

  const handleSearch = () => {
    setPageNumber(1);
    fetchVatReport();
  };

  const formatAmount = (amount: number) => {
    return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const startEntry = totalCount > 0 ? (pageNumber - 1) * pageSize + 1 : 0;
  const endEntry = Math.min(pageNumber * pageSize, totalCount);

  return (
    <MainLayout>
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-semibold">VAT Report</h1>

        {/* Filters */}
        <div className="bg-muted/30 border rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-green-600">Customers</label>
              <SearchableSelect
                options={[
                  { value: "all", label: "Select All" },
                  ...customers.map((customer) => ({
                    value: customer.id.toString(),
                    label: customer.name,
                  })),
                ]}
                value={selectedCustomer}
                onValueChange={setSelectedCustomer}
                placeholder="Select All"
                searchPlaceholder="Search customers..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-green-600">Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {formatDateForDisplay(dateRange.from, "MMM d, yyyy")} -{" "}
                          {formatDateForDisplay(dateRange.to, "MMM d, yyyy")}
                        </>
                      ) : (
                        formatDateForDisplay(dateRange.from, "MMM d, yyyy")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
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
              triggerClassName="w-20"
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

        {/* VAT Report Table */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-table-header">
                <TableHead className="text-table-header-foreground font-semibold">Job No.</TableHead>
                <TableHead className="text-table-header-foreground font-semibold">Bill of Lading No.</TableHead>
                <TableHead className="text-table-header-foreground font-semibold">Invoice No.</TableHead>
                <TableHead className="text-table-header-foreground font-semibold">Invoice Date</TableHead>
                <TableHead className="text-table-header-foreground font-semibold">Customer</TableHead>
                <TableHead className="text-table-header-foreground font-semibold">Curr Unit</TableHead>
                <TableHead className="text-table-header-foreground font-semibold text-right">Amount</TableHead>
                <TableHead className="text-table-header-foreground font-semibold text-right">{`Non-Taxable Sale(${baseCurrencyCode})`}</TableHead>
                <TableHead className="text-table-header-foreground font-semibold text-right">{`Taxable Sale(${baseCurrencyCode})`}</TableHead>
                <TableHead className="text-table-header-foreground font-semibold text-right">{`Tax (5%)(${baseCurrencyCode})`}</TableHead>
                <TableHead className="text-table-header-foreground font-semibold text-right">{`Total Invoice(${baseCurrencyCode})`}</TableHead>
                <TableHead className="text-table-header-foreground font-semibold">Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={12} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} className="text-center py-8">
                    No records found
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/50">
                    <TableCell>{item.jobNo || "-"}</TableCell>
                    <TableCell>{item.hblNo || "-"}</TableCell>
                    <TableCell>{item.invoiceNo}</TableCell>
                    <TableCell>{formatDate(item.invoiceDate)}</TableCell>
                    <TableCell>{item.customerName || "-"}</TableCell>
                    <TableCell>{item.currencyCode || "-"}</TableCell>
                    <TableCell className="text-right">{formatAmount(item.amount)}</TableCell>
                    <TableCell className="text-right">{formatAmount(item.nonTaxableSale)}</TableCell>
                    <TableCell className="text-right">{formatAmount(item.taxableSale)}</TableCell>
                    <TableCell className="text-right">{formatAmount(item.taxAmount)}</TableCell>
                    <TableCell className="text-right">{formatAmount(item.totalInvoice)}</TableCell>
                    <TableCell>{item.remarks || "-"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            {!loading && items.length > 0 && (
              <TableFooter>
                <TableRow className="font-bold">
                  <TableCell colSpan={6} className="text-right">Totals:</TableCell>
                  <TableCell className="text-right">{formatAmount(totals.totalAmount)}</TableCell>
                  <TableCell className="text-right">{formatAmount(totals.totalNonTaxableSale)}</TableCell>
                  <TableCell className="text-right">{formatAmount(totals.totalTaxableSale)}</TableCell>
                  <TableCell className="text-right">{formatAmount(totals.totalTaxAmount)}</TableCell>
                  <TableCell className="text-right">{formatAmount(totals.totalInvoiceAmount)}</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableFooter>
            )}
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
