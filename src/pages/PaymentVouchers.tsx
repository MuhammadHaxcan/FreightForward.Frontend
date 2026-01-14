import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Plus, Eye, Trash2, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MainLayout } from "@/components/layout/MainLayout";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import RecordPaymentModal from "@/components/payments/RecordPaymentModal";
import PaymentDetailsModal from "@/components/payments/PaymentDetailsModal";
import { usePaymentVouchers, useDeletePaymentVoucher } from "@/hooks/usePaymentVouchers";
import { getPaymentVoucherPdfUrl, type PaymentVoucher } from "@/services/api/payment";
import { formatDate } from "@/lib/utils";

export default function PaymentVouchers() {
  const navigate = useNavigate();
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [detailsModalPaymentId, setDetailsModalPaymentId] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentVoucher | null>(null);

  const { data, isLoading, refetch } = usePaymentVouchers({
    pageNumber,
    pageSize,
    searchTerm: searchTerm || undefined,
  });

  const deletePaymentMutation = useDeletePaymentVoucher();

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setPageNumber(1);
  };

  const handleDelete = async () => {
    if (selectedPayment) {
      await deletePaymentMutation.mutateAsync(selectedPayment.id);
      setDeleteDialogOpen(false);
      setSelectedPayment(null);
    }
  };

  const handleDownloadPdf = (id: number) => {
    window.open(getPaymentVoucherPdfUrl(id), "_blank");
  };

  const handleViewDetails = (paymentId: number) => {
    setDetailsModalPaymentId(paymentId);
  };

  return (
    <MainLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">All Payment Voucher</h1>
        <Button
          className="bg-green-500 hover:bg-green-600 text-white"
          onClick={() => setRecordModalOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Record Payment
        </Button>
      </div>

      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Show</span>
          <Select
            value={pageSize.toString()}
            onValueChange={(v) => {
              setPageSize(parseInt(v));
              setPageNumber(1);
            }}
          >
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
          <span className="text-sm text-muted-foreground">entries</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Search:</span>
          <Input
            className="w-64"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-green-700 hover:bg-green-700">
              <TableHead className="text-white font-semibold">Date</TableHead>
              <TableHead className="text-white font-semibold">Purchase Voucher No.</TableHead>
              <TableHead className="text-white font-semibold">Payment Type</TableHead>
              <TableHead className="text-white font-semibold">Purchases</TableHead>
              <TableHead className="text-white font-semibold">Vendor Name</TableHead>
              <TableHead className="text-white font-semibold">Narration (HBL#)</TableHead>
              <TableHead className="text-white font-semibold text-right">Amount</TableHead>
              <TableHead className="text-white font-semibold text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : data?.items && data.items.length > 0 ? (
              data.items.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>
                    {formatDate(payment.paymentDate, "dd MMM yyyy")}
                  </TableCell>
                  <TableCell className="text-green-600 font-medium">
                    {payment.paymentNo}
                  </TableCell>
                  <TableCell>
                    <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                      {payment.paymentMode.toUpperCase().replace("BANKWIRE", "BANK WIRE")}
                    </span>
                  </TableCell>
                  <TableCell>
                    <button
                      className="text-blue-600 hover:underline"
                      onClick={() => handleViewDetails(payment.id)}
                    >
                      {payment.purchaseInvoiceCount} Purchase(s)
                    </button>
                  </TableCell>
                  <TableCell>{payment.vendorName}</TableCell>
                  <TableCell>{payment.narration || "-"}</TableCell>
                  <TableCell className="text-right font-medium">
                    {payment.currency} {payment.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 bg-blue-500 hover:bg-blue-600 text-white"
                        onClick={() => navigate(`/accounts/payment-vouchers/${payment.id}`)}
                        title="View"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 bg-red-500 hover:bg-red-600 text-white"
                        onClick={() => {
                          setSelectedPayment(payment);
                          setDeleteDialogOpen(true);
                        }}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 bg-orange-500 hover:bg-orange-600 text-white"
                        onClick={() => handleDownloadPdf(payment.id)}
                        title="Download PDF"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No payment vouchers found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="mt-4 flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                  className={pageNumber === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              {Array.from({ length: Math.min(5, data.totalPages) }, (_, i) => {
                const page = pageNumber <= 3 ? i + 1 : pageNumber + i - 2;
                if (page > data.totalPages || page < 1) return null;
                return (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => setPageNumber(page)}
                      isActive={pageNumber === page}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              <PaginationItem>
                <PaginationNext
                  onClick={() => setPageNumber((p) => Math.min(data.totalPages, p + 1))}
                  className={pageNumber === data.totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Record Payment Modal */}
      <RecordPaymentModal
        open={recordModalOpen}
        onOpenChange={setRecordModalOpen}
        onSuccess={() => {
          setRecordModalOpen(false);
          refetch();
        }}
      />

      {/* Payment Details Modal */}
      <PaymentDetailsModal
        paymentId={detailsModalPaymentId}
        open={!!detailsModalPaymentId}
        onOpenChange={(open) => !open && setDetailsModalPaymentId(null)}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Payment Voucher</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this payment voucher ({selectedPayment?.paymentNo})?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </MainLayout>
  );
}
