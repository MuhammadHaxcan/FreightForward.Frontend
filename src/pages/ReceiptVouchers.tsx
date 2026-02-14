import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { formatDate } from "@/lib/utils";
import { Eye, Plus, Trash2, Download, Printer, Edit } from "lucide-react";
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
import { receiptApi, ReceiptVoucher as Receipt } from "@/services/api";
import { API_BASE_URL, fetchBlob } from "@/services/api/base";
import { RecordReceiptModal } from "@/components/receipts/RecordReceiptModal";
import { UpdateReceiptModal } from "@/components/receipts/UpdateReceiptModal";
import { ReceiptDetailsModal } from "@/components/receipts/ReceiptDetailsModal";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { toast } from "sonner";
import { useBaseCurrency } from "@/hooks/useBaseCurrency";

export default function ReceiptVouchers() {
  const navigate = useNavigate();
  const baseCurrencyCode = useBaseCurrency();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedReceiptId, setSelectedReceiptId] = useState<number | null>(null);
  const [editReceiptId, setEditReceiptId] = useState<number | null>(null);

  // Fetch receipts
  const fetchReceipts = async () => {
    setLoading(true);
    try {
      const response = await receiptApi.getAll({
        pageNumber,
        pageSize,
        searchTerm: searchTerm || undefined,
      });
      if (response.data) {
        setReceipts(response.data.items);
        setTotalCount(response.data.totalCount);
        setTotalPages(response.data.totalPages);
      }
    } catch (error) {
      console.error("Error fetching receipts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceipts();
  }, [pageNumber, pageSize]);

  const handleSearch = () => {
    setPageNumber(1);
    fetchReceipts();
  };

  const handleViewReceipt = (receiptId: number) => {
    navigate(`/accounts/receipt-vouchers/${receiptId}`);
  };

  const handleViewInvoiceDetails = (receiptId: number) => {
    setSelectedReceiptId(receiptId);
    setIsDetailsModalOpen(true);
  };

  const handleEdit = (receiptId: number) => {
    setEditReceiptId(receiptId);
    setIsUpdateModalOpen(true);
  };

  const handlePrint = (id: number) => {
    window.open(`/accounts/receipt-vouchers/${id}/print`, '_blank');
  };

  const handleDownload = async (id: number, receiptNo: string) => {
    try {
      const response = await fetchBlob(`${API_BASE_URL}/invoices/receipts/${id}/pdf`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${receiptNo}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Error downloading PDF:", error);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this receipt?")) {
      try {
        await receiptApi.delete(id);
        toast.success("Receipt deleted successfully");
        fetchReceipts();
      } catch (error) {
        console.error("Error deleting receipt:", error);
        toast.error("Failed to delete receipt");
      }
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return `${currency} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatPaymentMode = (mode: string) => {
    switch (mode) {
      case 'BankWire': return 'BANK WIRE';
      case 'BankTransfer': return 'BANK TRANSFER';
      case 'Cash': return 'CASH';
      case 'Cheque': return 'CHEQUE';
      case 'Card': return 'CARD';
      default: return mode.toUpperCase();
    }
  };

  const startEntry = totalCount > 0 ? (pageNumber - 1) * pageSize + 1 : 0;
  const endEntry = Math.min(pageNumber * pageSize, totalCount);

  return (
    <MainLayout>
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold">All Receipt Vouchers</h1>
          <PermissionGate permission="receipt_add">
            <Button
              className="btn-success"
              onClick={() => setIsModalOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Record Receipt
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

        {/* Receipts Table */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-table-header">
                <TableHead className="text-table-header-foreground font-semibold">Date</TableHead>
                <TableHead className="text-table-header-foreground font-semibold">Receipt Voucher No</TableHead>
                <TableHead className="text-table-header-foreground font-semibold">Job #</TableHead>
                <TableHead className="text-table-header-foreground font-semibold">Payment Type</TableHead>
                <TableHead className="text-table-header-foreground font-semibold">Invoice(s) Details</TableHead>
                <TableHead className="text-table-header-foreground font-semibold">Customer</TableHead>
                <TableHead className="text-table-header-foreground font-semibold">Narration</TableHead>
                <TableHead className="text-table-header-foreground font-semibold">Amount</TableHead>
                <TableHead className="text-table-header-foreground font-semibold">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : receipts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    No receipt vouchers found
                  </TableCell>
                </TableRow>
              ) : (
                receipts.map((receipt) => (
                  <TableRow key={receipt.id} className="hover:bg-table-row-hover">
                    <TableCell>
                      {formatDate(receipt.receiptDate)}
                    </TableCell>
                    <TableCell>
                      <span
                        className="text-green-600 hover:underline cursor-pointer"
                        onClick={() => handleViewReceipt(receipt.id)}
                      >
                        {receipt.receiptNo}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate" title={receipt.jobNumbers || ""}>
                      {receipt.jobNumbers || "-"}
                    </TableCell>
                    <TableCell>{formatPaymentMode(receipt.paymentMode)}</TableCell>
                    <TableCell>
                      <span
                        className="text-blue-600 hover:underline cursor-pointer"
                        onClick={() => handleViewInvoiceDetails(receipt.id)}
                      >
                        {receipt.invoiceCount} Invoice(s)
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-blue-600 hover:underline cursor-pointer">
                        {receipt.customerName || "-"}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-xs truncate" title={receipt.narration || ""}>
                      {receipt.narration || "-"}
                    </TableCell>
                    <TableCell>{formatCurrency(receipt.amount, receipt.currencyCode || baseCurrencyCode)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          className="bg-yellow-500 hover:bg-yellow-600 text-white h-8 w-8 p-0"
                          title="View"
                          onClick={() => handleViewReceipt(receipt.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <PermissionGate permission="receipt_edit">
                          <Button
                            size="sm"
                            className="bg-amber-500 hover:bg-amber-600 text-white h-8 w-8 p-0"
                            title="Edit"
                            onClick={() => handleEdit(receipt.id)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </PermissionGate>
                        <PermissionGate permission="receipt_delete">
                          <Button
                            size="sm"
                            className="bg-red-500 hover:bg-red-600 text-white h-8 w-8 p-0"
                            title="Delete"
                            onClick={() => handleDelete(receipt.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </PermissionGate>
                        <Button
                          size="sm"
                          className="bg-yellow-500 hover:bg-yellow-600 text-white h-8 w-8 p-0"
                          title="Download"
                          onClick={() => handleDownload(receipt.id, receipt.receiptNo)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          className="btn-success h-8 w-8 p-0"
                          title="Print"
                          onClick={() => handlePrint(receipt.id)}
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                      </div>
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

      {/* Record Receipt Modal */}
      <RecordReceiptModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={() => {
          setIsModalOpen(false);
          fetchReceipts();
        }}
      />

      {/* Receipt Invoice Details Modal */}
      <ReceiptDetailsModal
        open={isDetailsModalOpen}
        onOpenChange={setIsDetailsModalOpen}
        receiptId={selectedReceiptId}
      />

      {/* Update Receipt Modal */}
      <UpdateReceiptModal
        open={isUpdateModalOpen}
        onOpenChange={setIsUpdateModalOpen}
        receiptId={editReceiptId}
        onSuccess={() => {
          setIsUpdateModalOpen(false);
          setEditReceiptId(null);
          fetchReceipts();
        }}
      />
    </MainLayout>
  );
}
