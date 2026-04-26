import { useState } from "react";
import { formatDate, formatDateToISO } from "@/lib/utils";
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
import { DateRangePicker, DateRangeValue } from "@/components/ui/date-range-picker";
import { MainLayout } from "@/components/layout/MainLayout";
import { VatReportTotals } from "@/services/api";
import { useVatReport, useVatInputReport } from "@/hooks/useInvoices";
import { useAllDebtors, useAllCreditors } from "@/hooks/useCustomers";
import { useBaseCurrency } from "@/hooks/useBaseCurrency";

const defaultTotals: VatReportTotals = {
  totalAmount: 0,
  totalNonTaxableSale: 0,
  totalTaxableSale: 0,
  totalTaxAmount: 0,
  totalInvoiceAmount: 0,
};

const defaultDateRange = (): DateRangeValue => ({
  from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  to: new Date(),
});

export default function VatReport() {
  const baseCurrencyCode = useBaseCurrency();
  const [activeTab, setActiveTab] = useState<"vat-output" | "vat-input">("vat-output");

  // --- VAT Output state ---
  const [outSearchTerm, setOutSearchTerm] = useState("");
  const [outSelectedCustomer, setOutSelectedCustomer] = useState<string>("all");
  const [outDateRange, setOutDateRange] = useState<DateRangeValue | undefined>(defaultDateRange());
  const [outPageNumber, setOutPageNumber] = useState(1);
  const [outPageSize, setOutPageSize] = useState(10);
  const [outAppliedSearch, setOutAppliedSearch] = useState("");
  const [outAppliedCustomer, setOutAppliedCustomer] = useState<string>("all");
  const [outAppliedDateRange, setOutAppliedDateRange] = useState<DateRangeValue | undefined>(defaultDateRange());

  // --- VAT Input state ---
  const [inSearchTerm, setInSearchTerm] = useState("");
  const [inSelectedVendor, setInSelectedVendor] = useState<string>("all");
  const [inDateRange, setInDateRange] = useState<DateRangeValue | undefined>(defaultDateRange());
  const [inPageNumber, setInPageNumber] = useState(1);
  const [inPageSize, setInPageSize] = useState(10);
  const [inAppliedSearch, setInAppliedSearch] = useState("");
  const [inAppliedVendor, setInAppliedVendor] = useState<string>("all");
  const [inAppliedDateRange, setInAppliedDateRange] = useState<DateRangeValue | undefined>(defaultDateRange());

  // Filter dropdowns
  const { data: outCustomers = [] } = useAllDebtors();
  const { data: inVendors = [] } = useAllCreditors();

  // VAT Output data — only fetches while the tab is active; cached on tab switch
  const { data: outData, isLoading: outLoading } = useVatReport({
    pageNumber: outPageNumber,
    pageSize: outPageSize,
    customerId: outAppliedCustomer !== "all" ? parseInt(outAppliedCustomer) : undefined,
    fromDate: outAppliedDateRange?.from ? formatDateToISO(outAppliedDateRange.from) : undefined,
    toDate: outAppliedDateRange?.to ? formatDateToISO(outAppliedDateRange.to) : undefined,
    searchTerm: outAppliedSearch || undefined,
    enabled: activeTab === "vat-output",
  });
  const outItems = outData?.items.items ?? [];
  const outTotalCount = outData?.items.totalCount ?? 0;
  const outTotalPages = outData?.items.totalPages ?? 0;
  const outTotals = outData?.totals ?? defaultTotals;

  // VAT Input data — lazy-loaded (only fetches after first tab visit)
  const { data: inData, isLoading: inLoading } = useVatInputReport({
    pageNumber: inPageNumber,
    pageSize: inPageSize,
    vendorId: inAppliedVendor !== "all" ? parseInt(inAppliedVendor) : undefined,
    fromDate: inAppliedDateRange?.from ? formatDateToISO(inAppliedDateRange.from) : undefined,
    toDate: inAppliedDateRange?.to ? formatDateToISO(inAppliedDateRange.to) : undefined,
    searchTerm: inAppliedSearch || undefined,
    enabled: activeTab === "vat-input",
  });
  const inItems = inData?.items.items ?? [];
  const inTotalCount = inData?.items.totalCount ?? 0;
  const inTotalPages = inData?.items.totalPages ?? 0;
  const inTotals = inData?.totals ?? defaultTotals;

  const handleOutSearch = () => {
    setOutAppliedSearch(outSearchTerm);
    setOutAppliedCustomer(outSelectedCustomer);
    setOutAppliedDateRange(outDateRange);
    setOutPageNumber(1);
  };

  const handleOutPrint = () => {
    const params = new URLSearchParams({ type: "output" });
    if (outAppliedDateRange?.from) params.set("fromDate", formatDateToISO(outAppliedDateRange.from));
    if (outAppliedDateRange?.to) params.set("toDate", formatDateToISO(outAppliedDateRange.to));
    if (outAppliedCustomer !== "all") params.set("entityId", outAppliedCustomer);
    window.open(`/accounts/vat-report/print?${params.toString()}`, "_blank");
  };

  const handleInSearch = () => {
    setInAppliedSearch(inSearchTerm);
    setInAppliedVendor(inSelectedVendor);
    setInAppliedDateRange(inDateRange);
    setInPageNumber(1);
  };

  const handleInPrint = () => {
    const params = new URLSearchParams({ type: "input" });
    if (inAppliedDateRange?.from) params.set("fromDate", formatDateToISO(inAppliedDateRange.from));
    if (inAppliedDateRange?.to) params.set("toDate", formatDateToISO(inAppliedDateRange.to));
    if (inAppliedVendor !== "all") params.set("entityId", inAppliedVendor);
    window.open(`/accounts/vat-report/print?${params.toString()}`, "_blank");
  };

  const handleCombinedPrint = () => {
    const applied = activeTab === "vat-output" ? outAppliedDateRange : inAppliedDateRange;
    const params = new URLSearchParams({ type: "combined" });
    if (applied?.from) params.set("fromDate", formatDateToISO(applied.from));
    if (applied?.to) params.set("toDate", formatDateToISO(applied.to));
    window.open(`/accounts/vat-report/print?${params.toString()}`, "_blank");
  };

  const formatAmount = (amount: number) => {
    return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };


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
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">VAT Report</h1>
          <Button onClick={handleCombinedPrint} variant="outline">
            Print Combined
          </Button>
        </div>

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
                  <DateRangePicker
                    value={outDateRange}
                    onApply={setOutDateRange}
                    className="w-full"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <Button onClick={handleOutSearch} className="bg-primary text-primary-foreground">
                    Search
                  </Button>
                  <Button onClick={handleOutPrint} variant="outline">
                    Print
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
                  <DateRangePicker
                    value={inDateRange}
                    onApply={setInDateRange}
                    className="w-full"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <Button onClick={handleInSearch} className="bg-primary text-primary-foreground">
                    Search
                  </Button>
                  <Button onClick={handleInPrint} variant="outline">
                    Print
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
