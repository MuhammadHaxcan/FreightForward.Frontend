import { useState, useEffect } from "react";
import { toast } from "sonner";
import { formatDate, formatDateToISO, formatDateForDisplay } from "@/lib/utils";
import { Calendar } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { MainLayout } from "@/components/layout/MainLayout";
import { invoiceApi, customerApi, Customer, VatReportItem, VatReportTotals } from "@/services/api";
import { DateRange } from "react-day-picker";
import { useBaseCurrency } from "@/hooks/useBaseCurrency";

const defaultTotals: VatReportTotals = {
  totalAmount: 0,
  totalNonTaxableSale: 0,
  totalTaxableSale: 0,
  totalTaxAmount: 0,
  totalInvoiceAmount: 0,
};

const defaultDateRange = (): DateRange => ({
  from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  to: new Date(),
});

export default function VatReport() {
  const baseCurrencyCode = useBaseCurrency();
  const [activeTab, setActiveTab] = useState<"vat-output" | "vat-input">("vat-output");

  // --- VAT Output state ---
  const [outItems, setOutItems] = useState<VatReportItem[]>([]);
  const [outTotals, setOutTotals] = useState<VatReportTotals>(defaultTotals);
  const [outCustomers, setOutCustomers] = useState<Customer[]>([]);
  const [outLoading, setOutLoading] = useState(true);
  const [outSearchTerm, setOutSearchTerm] = useState("");
  const [outSelectedCustomer, setOutSelectedCustomer] = useState<string>("all");
  const [outDateRange, setOutDateRange] = useState<DateRange | undefined>(defaultDateRange());
  const [outPageNumber, setOutPageNumber] = useState(1);
  const [outPageSize, setOutPageSize] = useState(10);
  const [outTotalCount, setOutTotalCount] = useState(0);
  const [outTotalPages, setOutTotalPages] = useState(0);

  // --- VAT Input state ---
  const [inItems, setInItems] = useState<VatReportItem[]>([]);
  const [inTotals, setInTotals] = useState<VatReportTotals>(defaultTotals);
  const [inVendors, setInVendors] = useState<Customer[]>([]);
  const [inLoading, setInLoading] = useState(true);
  const [inSearchTerm, setInSearchTerm] = useState("");
  const [inSelectedVendor, setInSelectedVendor] = useState<string>("all");
  const [inDateRange, setInDateRange] = useState<DateRange | undefined>(defaultDateRange());
  const [inPageNumber, setInPageNumber] = useState(1);
  const [inPageSize, setInPageSize] = useState(10);
  const [inTotalCount, setInTotalCount] = useState(0);
  const [inTotalPages, setInTotalPages] = useState(0);
  const [inInitialLoaded, setInInitialLoaded] = useState(false);

  // Fetch customers (Debtors) for VAT Output filter
  useEffect(() => {
    const fetchCustomers = async () => {
      const response = await customerApi.getAll({ pageSize: 1000, masterType: 'Debtors' });
      if (response.data) {
        setOutCustomers(response.data.items);
      }
    };
    fetchCustomers();
  }, []);

  // Fetch vendors (Creditors) for VAT Input filter
  useEffect(() => {
    const fetchVendors = async () => {
      const response = await customerApi.getAll({ pageSize: 1000, masterType: 'Creditors' });
      if (response.data) {
        setInVendors(response.data.items);
      }
    };
    fetchVendors();
  }, []);

  // --- VAT Output fetch ---
  const fetchVatOutput = async () => {
    setOutLoading(true);
    try {
      const response = await invoiceApi.getVatReport({
        pageNumber: outPageNumber,
        pageSize: outPageSize,
        customerId: outSelectedCustomer !== "all" ? parseInt(outSelectedCustomer) : undefined,
        fromDate: outDateRange?.from ? formatDateToISO(outDateRange.from) : undefined,
        toDate: outDateRange?.to ? formatDateToISO(outDateRange.to) : undefined,
        searchTerm: outSearchTerm || undefined,
      });
      if (response.data) {
        setOutItems(response.data.items.items);
        setOutTotalCount(response.data.items.totalCount);
        setOutTotalPages(response.data.items.totalPages);
        setOutTotals(response.data.totals);
      }
    } catch {
      toast.error("Failed to load VAT Output report");
    } finally {
      setOutLoading(false);
    }
  };

  useEffect(() => {
    fetchVatOutput();
  }, [outPageNumber, outPageSize]);

  const handleOutSearch = () => {
    setOutPageNumber(1);
    fetchVatOutput();
  };

  // --- VAT Input fetch ---
  const fetchVatInput = async () => {
    setInLoading(true);
    try {
      const response = await invoiceApi.getVatInputReport({
        pageNumber: inPageNumber,
        pageSize: inPageSize,
        vendorId: inSelectedVendor !== "all" ? parseInt(inSelectedVendor) : undefined,
        fromDate: inDateRange?.from ? formatDateToISO(inDateRange.from) : undefined,
        toDate: inDateRange?.to ? formatDateToISO(inDateRange.to) : undefined,
        searchTerm: inSearchTerm || undefined,
      });
      if (response.data) {
        setInItems(response.data.items.items);
        setInTotalCount(response.data.items.totalCount);
        setInTotalPages(response.data.items.totalPages);
        setInTotals(response.data.totals);
      }
    } catch {
      toast.error("Failed to load VAT Input report");
    } finally {
      setInLoading(false);
    }
  };

  useEffect(() => {
    if (inInitialLoaded) {
      fetchVatInput();
    }
  }, [inPageNumber, inPageSize]);

  // Load VAT Input data on first tab switch
  useEffect(() => {
    if (activeTab === "vat-input" && !inInitialLoaded) {
      setInInitialLoaded(true);
      fetchVatInput();
    }
  }, [activeTab]);

  const handleInSearch = () => {
    setInPageNumber(1);
    fetchVatInput();
  };

  const formatAmount = (amount: number) => {
    return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const renderDatePicker = (
    dateRange: DateRange | undefined,
    setDateRange: (range: DateRange | undefined) => void
  ) => (
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
  );

  const renderPagination = (
    pageNumber: number,
    totalPages: number,
    totalCount: number,
    pageSize: number,
    setPageNumber: React.Dispatch<React.SetStateAction<number>>
  ) => {
    const startEntry = totalCount > 0 ? (pageNumber - 1) * pageSize + 1 : 0;
    const endEntry = Math.min(pageNumber * pageSize, totalCount);
    return (
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
    );
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-semibold">VAT Report</h1>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "vat-output" | "vat-input")}>
          <TabsList>
            <TabsTrigger value="vat-output">VAT Output</TabsTrigger>
            <TabsTrigger value="vat-input">VAT Input</TabsTrigger>
          </TabsList>

          {/* =================== VAT OUTPUT TAB =================== */}
          <TabsContent value="vat-output" className="space-y-4">
            {/* Filters */}
            <div className="bg-muted/30 border rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-green-600">Customers</label>
                  <SearchableSelect
                    options={[
                      { value: "all", label: "Select All" },
                      ...outCustomers.map((c) => ({
                        value: c.id.toString(),
                        label: c.name,
                      })),
                    ]}
                    value={outSelectedCustomer}
                    onValueChange={setOutSelectedCustomer}
                    placeholder="Select All"
                    searchPlaceholder="Search customers..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-green-600">Date</label>
                  {renderDatePicker(outDateRange, setOutDateRange)}
                </div>
                <div className="flex items-end">
                  <Button onClick={handleOutSearch} className="bg-primary text-primary-foreground">
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
                  value={outPageSize.toString()}
                  onValueChange={(v) => { setOutPageSize(parseInt(v)); setOutPageNumber(1); }}
                  triggerClassName="w-[90px]"
                />
                <span className="text-sm">entries</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">Search:</span>
                <Input
                  value={outSearchTerm}
                  onChange={(e) => setOutSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleOutSearch()}
                  className="w-48"
                  placeholder="Search..."
                />
              </div>
            </div>

            {/* VAT Output Table */}
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
                    <TableHead className="text-table-header-foreground font-semibold text-right">{`Tax(${baseCurrencyCode})`}</TableHead>
                    <TableHead className="text-table-header-foreground font-semibold text-right">{`Total Invoice(${baseCurrencyCode})`}</TableHead>
                    <TableHead className="text-table-header-foreground font-semibold">Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {outLoading ? (
                    <TableRow>
                      <TableCell colSpan={12} className="text-center py-8">Loading...</TableCell>
                    </TableRow>
                  ) : outItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={12} className="text-center py-8">No records found</TableCell>
                    </TableRow>
                  ) : (
                    outItems.map((item) => (
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
                {!outLoading && outItems.length > 0 && (
                  <TableFooter>
                    <TableRow className="font-bold">
                      <TableCell colSpan={6} className="text-right">Totals:</TableCell>
                      <TableCell className="text-right">{formatAmount(outTotals.totalAmount)}</TableCell>
                      <TableCell className="text-right">{formatAmount(outTotals.totalNonTaxableSale)}</TableCell>
                      <TableCell className="text-right">{formatAmount(outTotals.totalTaxableSale)}</TableCell>
                      <TableCell className="text-right">{formatAmount(outTotals.totalTaxAmount)}</TableCell>
                      <TableCell className="text-right">{formatAmount(outTotals.totalInvoiceAmount)}</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableFooter>
                )}
              </Table>
            </div>

            {renderPagination(outPageNumber, outTotalPages, outTotalCount, outPageSize, setOutPageNumber)}
          </TabsContent>

          {/* =================== VAT INPUT TAB =================== */}
          <TabsContent value="vat-input" className="space-y-4">
            {/* Filters */}
            <div className="bg-muted/30 border rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-green-600">Vendors</label>
                  <SearchableSelect
                    options={[
                      { value: "all", label: "Select All" },
                      ...inVendors.map((v) => ({
                        value: v.id.toString(),
                        label: v.name,
                      })),
                    ]}
                    value={inSelectedVendor}
                    onValueChange={setInSelectedVendor}
                    placeholder="Select All"
                    searchPlaceholder="Search vendors..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-green-600">Date</label>
                  {renderDatePicker(inDateRange, setInDateRange)}
                </div>
                <div className="flex items-end">
                  <Button onClick={handleInSearch} className="bg-primary text-primary-foreground">
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
                  value={inPageSize.toString()}
                  onValueChange={(v) => { setInPageSize(parseInt(v)); setInPageNumber(1); }}
                  triggerClassName="w-[90px]"
                />
                <span className="text-sm">entries</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">Search:</span>
                <Input
                  value={inSearchTerm}
                  onChange={(e) => setInSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleInSearch()}
                  className="w-48"
                  placeholder="Search..."
                />
              </div>
            </div>

            {/* VAT Input Table */}
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-table-header">
                    <TableHead className="text-table-header-foreground font-semibold">Job No.</TableHead>
                    <TableHead className="text-table-header-foreground font-semibold">Invoice No.</TableHead>
                    <TableHead className="text-table-header-foreground font-semibold">Invoice Date</TableHead>
                    <TableHead className="text-table-header-foreground font-semibold">Vendor</TableHead>
                    <TableHead className="text-table-header-foreground font-semibold">Curr Unit</TableHead>
                    <TableHead className="text-table-header-foreground font-semibold text-right">Amount</TableHead>
                    <TableHead className="text-table-header-foreground font-semibold text-right">{`Non-Taxable Purchase(${baseCurrencyCode})`}</TableHead>
                    <TableHead className="text-table-header-foreground font-semibold text-right">{`Taxable Purchase(${baseCurrencyCode})`}</TableHead>
                    <TableHead className="text-table-header-foreground font-semibold text-right">{`Tax(${baseCurrencyCode})`}</TableHead>
                    <TableHead className="text-table-header-foreground font-semibold text-right">{`Total Invoice(${baseCurrencyCode})`}</TableHead>
                    <TableHead className="text-table-header-foreground font-semibold">Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inLoading ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-8">Loading...</TableCell>
                    </TableRow>
                  ) : inItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-8">No records found</TableCell>
                    </TableRow>
                  ) : (
                    inItems.map((item) => (
                      <TableRow key={item.id} className="hover:bg-muted/50">
                        <TableCell>{item.jobNo || "-"}</TableCell>
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
                {!inLoading && inItems.length > 0 && (
                  <TableFooter>
                    <TableRow className="font-bold">
                      <TableCell colSpan={5} className="text-right">Totals:</TableCell>
                      <TableCell className="text-right">{formatAmount(inTotals.totalAmount)}</TableCell>
                      <TableCell className="text-right">{formatAmount(inTotals.totalNonTaxableSale)}</TableCell>
                      <TableCell className="text-right">{formatAmount(inTotals.totalTaxableSale)}</TableCell>
                      <TableCell className="text-right">{formatAmount(inTotals.totalTaxAmount)}</TableCell>
                      <TableCell className="text-right">{formatAmount(inTotals.totalInvoiceAmount)}</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableFooter>
                )}
              </Table>
            </div>

            {renderPagination(inPageNumber, inTotalPages, inTotalCount, inPageSize, setInPageNumber)}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
