import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Plus, Eye, Trash2, Edit, Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MainLayout } from "@/components/layout/MainLayout";
import { Input } from "@/components/ui/input";
import { PermissionGate } from "@/components/auth/PermissionGate";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SearchableSelect } from "@/components/ui/searchable-select";
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
import { RecordPaymentModal } from "@/components/payments/RecordPaymentModal";
import { PaymentDetailsModal } from "@/components/payments/PaymentDetailsModal";
import { UpdatePaymentModal } from "@/components/payments/UpdatePaymentModal";
import { usePaymentVouchers, useDeletePaymentVoucher } from "@/hooks/usePaymentVouchers";
import { type PaymentVoucher } from "@/services/api/payment";
import { formatDate } from "@/lib/utils";
import { API_BASE_URL, fetchBlob } from "@/services/api/base";

export default function PaymentVouchers() {
  const navigate = useNavigate();
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [detailsModalPaymentId, setDetailsModalPaymentId] = useState<number | null>(null);
  const [editPaymentId, setEditPaymentId] = useState<number | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
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

  const handlePrintPdf = (id: number) => {
    window.open(`/accounts/payment-vouchers/${id}/print`, "_blank");
  };

  const handleEdit = (paymentId: number) => {
    setEditPaymentId(paymentId);
    setIsUpdateModalOpen(true);
  };

  const handleDownload = async (id: number, paymentNo: string) => {
    try {
      const response = await fetchBlob(`${API_BASE_URL}/invoices/payments/${id}/pdf`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${paymentNo}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Error downloading PDF:", error);
    }
  };

  const handleViewDetails = (paymentId: number) => {
    setDetailsModalPaymentId(paymentId);
  };

  return (
    <MainLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">All Payment Voucher</h1>
          <PermissionGate permission="paymentvoucher_add">
            <Button
              className="btn-success"
              onClick={() => setRecordModalOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Record Payment
            </Button>
          </PermissionGate>
        </div>

      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Show</span>
          <SearchableSelect
            options={[
              { value: "10", label: "10" },
              { value: "25", label: "25" },
              { value: "50", label: "50" },
              { value: "100", label: "100" },
            ]}
            value={pageSize.toString()}
            onValueChange={(v) => {
              setPageSize(parseInt(v));
              setPageNumber(1);
            }}
            placeholder="10"
            searchPlaceholder="Search..."
            triggerClassName="w-[90px]"
          />
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
            <TableRow className="bg-table-header">
              <TableHead className="text-table-header-foreground font-semibold">Date</TableHead>
              <TableHead className="text-table-header-foreground font-semibold">Payment Voucher No.</TableHead>
              <TableHead className="text-table-header-foreground font-semibold">Job #</TableHead>
              <TableHead className="text-table-header-foreground font-semibold">Payment Type</TableHead>
              <TableHead className="text-table-header-foreground font-semibold">Purchases</TableHead>
              <TableHead className="text-table-header-foreground font-semibold">Vendor Name</TableHead>
              <TableHead className="text-table-header-foreground font-semibold">Narration (HBL#)</TableHead>
              <TableHead className="text-table-header-foreground font-semibold">Amount</TableHead>
              <TableHead className="text-table-header-foreground font-semibold">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
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
                  <TableCell className="max-w-[150px] truncate" title={payment.jobNumbers || ""}>
                    {payment.jobNumbers || "-"}
                  </TableCell>
                  <TableCell>
                    <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                      {payment.paymentMode === 'PostDatedCheque' ? 'POST DATED CHEQUE' : payment.paymentMode.toUpperCase().replace("BANKWIRE", "BANK WIRE").replace("BANKTRANSFER", "BANK TRANSFER")}
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
                    {payment.currencyCode} {payment.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        className="bg-yellow-500 hover:bg-yellow-600 text-white h-8 w-8 p-0"
                        onClick={() => navigate(`/accounts/payment-vouchers/${payment.id}`)}
                        title="View"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <PermissionGate permission="paymentvoucher_edit">
                        <Button
                          size="sm"
                          className="bg-amber-500 hover:bg-amber-600 text-white h-8 w-8 p-0"
                          onClick={() => handleEdit(payment.id)}
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </PermissionGate>
                      <PermissionGate permission="paymentvoucher_delete">
                        <Button
                          size="sm"
                          className="bg-red-500 hover:bg-red-600 text-white h-8 w-8 p-0"
                          onClick={() => {
                            setSelectedPayment(payment);
                            setDeleteDialogOpen(true);
                          }}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </PermissionGate>
                      <Button
                        size="sm"
                        className="bg-yellow-500 hover:bg-yellow-600 text-white h-8 w-8 p-0"
                        onClick={() => handleDownload(payment.id, payment.paymentNo)}
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        className="btn-success h-8 w-8 p-0"
                        onClick={() => handlePrintPdf(payment.id)}
                        title="Print"
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  No payment vouchers found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {data && (
        <div className="mt-4 flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            Showing {data.totalCount > 0 ? (pageNumber - 1) * pageSize + 1 : 0} to {Math.min(pageNumber * pageSize, data.totalCount)} of {data.totalCount} entries
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
            {data.totalPages > 0 && Array.from({ length: Math.min(7, data.totalPages) }, (_, i) => {
              let pageNum: number;
              if (data.totalPages <= 7) {
                pageNum = i + 1;
              } else if (pageNumber <= 4) {
                pageNum = i + 1;
              } else if (pageNumber >= data.totalPages - 3) {
                pageNum = data.totalPages - 6 + i;
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
            {data.totalPages > 7 && pageNumber < data.totalPages - 3 && (
              <>
                <span className="px-2">...</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPageNumber(data.totalPages)}
                  className="w-8"
                >
                  {data.totalPages}
                </Button>
              </>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPageNumber((p) => Math.min(data.totalPages, p + 1))}
              disabled={pageNumber === data.totalPages || data.totalPages === 0}
            >
              Next
            </Button>
          </div>
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

      {/* Update Payment Modal */}
      <UpdatePaymentModal
        open={isUpdateModalOpen}
        onOpenChange={setIsUpdateModalOpen}
        paymentId={editPaymentId}
        onSuccess={() => {
          setIsUpdateModalOpen(false);
          setEditPaymentId(null);
          refetch();
        }}
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
