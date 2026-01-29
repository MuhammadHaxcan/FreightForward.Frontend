import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { usePaymentVoucher } from "@/hooks/usePaymentVouchers";
import { formatDate } from "@/lib/utils";

interface PaymentDetailsModalProps {
  paymentId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PaymentDetailsModal({
  paymentId,
  open,
  onOpenChange,
}: PaymentDetailsModalProps) {
  const { data: payment, isLoading } = usePaymentVoucher(paymentId);

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0">
        <DialogHeader className="bg-modal-header text-white p-4 rounded-t-lg">
          <DialogTitle className="text-white text-lg font-semibold">
            Payment Details
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center">Loading...</div>
        ) : payment ? (
          <div className="p-6">
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-100">
                    <TableHead className="font-semibold">Payment #</TableHead>
                    <TableHead className="font-semibold">Amount</TableHead>
                    <TableHead className="font-semibold text-green-600">Paid</TableHead>
                    <TableHead className="font-semibold">Total Paid</TableHead>
                    <TableHead className="font-semibold">Balance</TableHead>
                    <TableHead className="font-semibold">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payment.purchaseInvoices?.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="text-blue-600 font-medium">
                        {inv.purchaseNo}
                      </TableCell>
                      <TableCell>
                        {inv.currencyCode || "AED"} {inv.invoiceAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-green-600 font-medium">
                        {inv.currencyCode || "AED"} {inv.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        {inv.currencyCode || "AED"} {inv.totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className={inv.balance > 0 ? "text-orange-500" : ""}>
                        {inv.currencyCode || "AED"} {inv.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        {inv.purchaseDate ? formatDate(inv.purchaseDate, "dd MMM yyyy") : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Totals Row */}
                  <TableRow className="bg-orange-50 font-semibold">
                    <TableCell></TableCell>
                    <TableCell className="text-orange-500">
                      {payment.currencyCode || "AED"} {payment.purchaseInvoices?.reduce((sum, inv) => sum + inv.invoiceAmount, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-green-600">
                      {payment.currencyCode || "AED"} {payment.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-orange-500">
                      {payment.currencyCode || "AED"} {payment.purchaseInvoices?.reduce((sum, inv) => sum + inv.totalPaid, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-orange-500">
                      {payment.currencyCode || "AED"} {payment.purchaseInvoices?.reduce((sum, inv) => sum + inv.balance, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            Payment voucher not found
          </div>
        )}

        <div className="flex justify-end">
          <Button
            variant="link"
            className="text-blue-600"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
