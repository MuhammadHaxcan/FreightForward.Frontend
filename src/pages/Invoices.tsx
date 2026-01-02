import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Search, Calendar, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { MainLayout } from "@/components/layout/MainLayout";
import { invoiceApi, customerApi, AccountInvoice, Customer, PaginatedList } from "@/services/api";
import { DateRange } from "react-day-picker";

export default function Invoices() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<AccountInvoice[]>([]);
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
      const response = await customerApi.getAll({ pageSize: 1000 });
      if (response.data) {
        setCustomers(response.data.items);
      }
    };
    fetchCustomers();
  }, []);

  // Fetch invoices
  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const response = await invoiceApi.getAll({
        pageNumber,
        pageSize,
        searchTerm: searchTerm || undefined,
        customerId: selectedCustomer !== "all" ? parseInt(selectedCustomer) : undefined,
        fromDate: dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
        toDate: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
      });
      if (response.data) {
        setInvoices(response.data.items);
        setTotalCount(response.data.totalCount);
        setTotalPages(response.data.totalPages);
      }
    } catch (error) {
      console.error("Error fetching invoices:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [pageNumber, pageSize]);

  const handleSearch = () => {
    setPageNumber(1);
    fetchInvoices();
  };

  const handleViewInvoice = (invoiceId: number) => {
    navigate(`/accounts/invoices/${invoiceId}`);
  };

  const formatCurrency = (amount: number, currency: string) => {
    return `${currency} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getAgingDisplay = (days: number) => {
    if (days <= 0) return "-";
    return `${days} Day${days > 1 ? "s" : ""}`;
  };

  const getStatusBadge = (status: string) => {
    return (
      <span className="text-sm">{status}</span>
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    return (
      <span className="text-sm">{status}</span>
    );
  };

  const startEntry = (pageNumber - 1) * pageSize + 1;
  const endEntry = Math.min(pageNumber * pageSize, totalCount);

  return (
    <MainLayout>
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Invoices</h1>

      {/* Filters */}
      <div className="bg-muted/30 border rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-green-600">Customers</label>
            <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
              <SelectTrigger>
                <SelectValue placeholder="Select All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Select All</SelectItem>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id.toString()}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                        {format(dateRange.from, "MMM d, yyyy")} -{" "}
                        {format(dateRange.to, "MMM d, yyyy")}
                      </>
                    ) : (
                      format(dateRange.from, "MMM d, yyyy")
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
          <Select value={pageSize.toString()} onValueChange={(v) => setPageSize(parseInt(v))}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
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

      {/* Invoices Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-primary">
              <TableHead className="text-primary-foreground font-semibold">Invoice Details</TableHead>
              <TableHead className="text-primary-foreground font-semibold">Job Number</TableHead>
              <TableHead className="text-primary-foreground font-semibold">Customer</TableHead>
              <TableHead className="text-primary-foreground font-semibold">Amount</TableHead>
              <TableHead className="text-primary-foreground font-semibold">Due Date</TableHead>
              <TableHead className="text-primary-foreground font-semibold">Aging</TableHead>
              <TableHead className="text-primary-foreground font-semibold">Added</TableHead>
              <TableHead className="text-primary-foreground font-semibold">Payment Status</TableHead>
              <TableHead className="text-primary-foreground font-semibold">Status</TableHead>
              <TableHead className="text-primary-foreground font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8">
                  No invoices found
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((invoice) => (
                <TableRow key={invoice.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div>
                      <div className="text-sm">Date - {format(new Date(invoice.invoiceDate), "dd-MMM-yy")}</div>
                      <div className="text-sm">No - {invoice.invoiceNo}</div>
                    </div>
                  </TableCell>
                  <TableCell>{invoice.jobNumber || "-"}</TableCell>
                  <TableCell className="text-blue-600">{invoice.customerName}</TableCell>
                  <TableCell>{formatCurrency(invoice.amount, invoice.currency)}</TableCell>
                  <TableCell>{invoice.dueDate ? format(new Date(invoice.dueDate), "dd-MM-yyyy") : "-"}</TableCell>
                  <TableCell className="font-semibold">{getAgingDisplay(invoice.agingDays)}</TableCell>
                  <TableCell className="text-blue-600">{invoice.addedBy || "-"}</TableCell>
                  <TableCell>{getPaymentStatusBadge(invoice.paymentStatus)}</TableCell>
                  <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      className="bg-green-500 hover:bg-green-600 text-white"
                      onClick={() => handleViewInvoice(invoice.id)}
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
          {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPageNumber((p) => Math.min(totalPages, p + 1))}
            disabled={pageNumber === totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
    </MainLayout>
  );
}
