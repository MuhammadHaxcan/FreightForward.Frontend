import { useState } from "react";
import { formatDateToISO } from "@/lib/utils";
import { Search, Printer } from "lucide-react";
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
import { DateRangePicker, DateRangeValue } from "@/components/ui/date-range-picker";
import { MainLayout } from "@/components/layout/MainLayout";
import { CustomerReceivableDetailsModal } from "@/components/payments/CustomerReceivableDetailsModal";
import { useAccountReceivableSummary } from "@/hooks/useInvoices";
import { useAllDebtors } from "@/hooks/useCustomers";

export default function AccountReceivable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRangeValue | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  });
  const [modalCustomer, setModalCustomer] = useState<{ id: number; name: string; currencyCode: string } | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [appliedSearch, setAppliedSearch] = useState("");
  const [appliedCustomer, setAppliedCustomer] = useState<string>("all");
  const [appliedDateRange, setAppliedDateRange] = useState<DateRangeValue | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  });

  const { data: customers = [] } = useAllDebtors();
  const { data: summary, isLoading: loading } = useAccountReceivableSummary({
    pageNumber,
    pageSize,
    customerId: appliedCustomer !== "all" ? parseInt(appliedCustomer, 10) : undefined,
    fromDate: appliedDateRange?.from ? formatDateToISO(appliedDateRange.from) : undefined,
    toDate: appliedDateRange?.to ? formatDateToISO(appliedDateRange.to) : undefined,
    searchTerm: appliedSearch || undefined,
  });
  const items = summary?.items.items ?? [];
  const totalCount = summary?.items.totalCount ?? 0;
  const totalPages = summary?.items.totalPages ?? 0;
  const totals = summary?.totals ?? [];

  const handleSearch = () => {
    setAppliedSearch(searchTerm);
    setAppliedCustomer(selectedCustomer);
    setAppliedDateRange(dateRange);
    setPageNumber(1);
  };

  const handlePrint = () => {
    const params = new URLSearchParams();
    if (appliedDateRange?.from) params.append('fromDate', formatDateToISO(appliedDateRange.from));
    if (appliedDateRange?.to) params.append('toDate', formatDateToISO(appliedDateRange.to));
    if (appliedCustomer !== "all") params.append('customerId', appliedCustomer);
    if (appliedSearch) params.append('searchTerm', appliedSearch);
    window.open(`/accounts/account-receivable/print?${params.toString()}`, '_blank');
  };

  const formatAmount = (amount: number) => {
    return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const startEntry = totalCount > 0 ? (pageNumber - 1) * pageSize + 1 : 0;
  const endEntry = Math.min(pageNumber * pageSize, totalCount);

  return (
    <MainLayout>
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-semibold">All Account Receivable</h1>

        {/* Filters */}
        <div className="bg-muted/30 border rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <DateRangePicker
                value={dateRange}
                onApply={setDateRange}
                className="w-full"
              />
            </div>

            <div className="flex items-end gap-2">
              <Button onClick={handleSearch} className="bg-primary text-primary-foreground">
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
              <Button onClick={handlePrint} variant="outline" className="bg-yellow-400 hover:bg-yellow-500 text-black border-yellow-400">
                <Printer className="mr-2 h-4 w-4" />
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
              value={pageSize.toString()}
              onValueChange={(v) => { setPageSize(parseInt(v, 10)); setPageNumber(1); }}
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

        {/* Account Receivable Table */}
        <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-table-header">
                <TableHead className="text-table-header-foreground font-semibold">Customer</TableHead>
                <TableHead className="text-table-header-foreground font-semibold text-right">Invoiced</TableHead>
                <TableHead className="text-table-header-foreground font-semibold text-right">Received</TableHead>
                <TableHead className="text-table-header-foreground font-semibold text-right">Credit Notes</TableHead>
                <TableHead className="text-table-header-foreground font-semibold text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No records found
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item, index) => (
                  <TableRow key={`${item.customerId}-${item.currencyCode}`} className={`border-b border-border hover:bg-table-row-hover transition-colors ${index % 2 === 0 ? "bg-card" : "bg-secondary/30"}`}>
                    <TableCell
                      className="text-green-600 font-medium cursor-pointer hover:underline"
                      onClick={() => setModalCustomer({ id: item.customerId, name: item.customerName, currencyCode: item.currencyCode })}
                    >{item.customerName}</TableCell>
                    <TableCell className="text-right">{item.currencyCode} {formatAmount(item.totalInvoiced)}</TableCell>
                    <TableCell className="text-right">{item.currencyCode} {formatAmount(item.totalReceived)}</TableCell>
                    <TableCell className="text-right text-orange-600">{item.currencyCode} {formatAmount(item.totalCreditNotes)}</TableCell>
                    <TableCell className="text-right font-bold text-red-600">{item.currencyCode} {formatAmount(item.balance)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            {!loading && items.length > 0 && (
              <TableFooter>
                <TableRow className="font-bold">
                  <TableCell className="text-right font-bold">TOTAL OF RECEIVABLE</TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                  <TableCell className="text-right">
                    {totals.map((t) => (
                      <div key={t.currencyCode} className="font-bold">
                        {t.currencyCode} {formatAmount(t.balance)}
                      </div>
                    ))}
                  </TableCell>
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

      <CustomerReceivableDetailsModal
        customerId={modalCustomer?.id ?? null}
        customerName={modalCustomer?.name ?? ""}
        currencyCode={modalCustomer?.currencyCode ?? ""}
        open={!!modalCustomer}
        onOpenChange={(open) => { if (!open) setModalCustomer(null); }}
      />
    </MainLayout>
  );
}
