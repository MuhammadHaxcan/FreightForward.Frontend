import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { formatDate } from "@/lib/utils";
import { Eye, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PermissionGate } from "@/components/auth/PermissionGate";
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
import { invoiceApi, customerApi, AccountPurchaseInvoice, Customer } from "@/services/api";
import { useBaseCurrency } from "@/hooks/useBaseCurrency";

export default function PurchaseInvoices() {
  const navigate = useNavigate();
  const baseCurrencyCode = useBaseCurrency();
  const [invoices, setInvoices] = useState<AccountPurchaseInvoice[]>([]);
  const [vendors, setVendors] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Fetch vendors (Creditors) for filter
  useEffect(() => {
    const fetchVendors = async () => {
      const response = await customerApi.getAll({ pageSize: 1000, masterType: 'Creditors' });
      if (response.data) {
        setVendors(response.data.items);
      }
    };
    fetchVendors();
  }, []);

  // Fetch purchase invoices
  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const response = await invoiceApi.getAllPurchaseInvoices({
        pageNumber,
        pageSize,
        searchTerm: searchTerm || undefined,
      });
      if (response.data) {
        setInvoices(response.data.items);
        setTotalCount(response.data.totalCount);
        setTotalPages(response.data.totalPages);
      }
    } catch (error) {
      console.error("Error fetching purchase invoices:", error);
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
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold">Purchase Invoices</h1>
          <PermissionGate permission="purchase_add">
            <Button className="btn-success">
              <Plus className="h-4 w-4 mr-2" />
              New Purchase Invoice
            </Button>
          </PermissionGate>
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

        {/* Purchase Invoices Table */}
        <div className="border rounded-lg overflow-hidden">
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
                  <TableCell colSpan={8} className="text-center py-8">
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
                invoices.map((invoice) => (
                  <TableRow key={invoice.id} className="hover:bg-table-row-hover">
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
