import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type ReceiptInvoice } from "@/services/api";
import { useReceipt } from "@/hooks/useReceipts";
import { useBaseCurrency } from "@/hooks/useBaseCurrency";
import { formatDate } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface ReceiptDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receiptId: number | null;
}

export function ReceiptDetailsModal({ open, onOpenChange, receiptId }: ReceiptDetailsModalProps) {
  const baseCurrencyCode = useBaseCurrency();
  const { data: receipt, isLoading: loading } = useReceipt(open ? receiptId : null);

  const formatCurrency = (amount: number, currency: string) => {
    return `${currency} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-modal-4xl p-0 max-h-[90vh] overflow-hidden flex flex-col gap-0">
        <DialogHeader className="bg-modal-header text-white p-4 rounded-t-lg">
          <DialogTitle className="text-white text-lg font-semibold">Receipt Details</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : receipt ? (
          <div className="space-y-4 p-6">
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Invoice #</TableHead>
                    <TableHead className="font-semibold">Amount</TableHead>
                    <TableHead className="font-semibold bg-green-100 dark:bg-green-900/30">Received Amount</TableHead>
                    <TableHead className="font-semibold">Total Received</TableHead>
                    <TableHead className="font-semibold">Balance</TableHead>
                    <TableHead className="font-semibold">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receipt.invoices && receipt.invoices.length > 0 ? (
                    receipt.invoices.map((invoice: ReceiptInvoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell>
                          <span className="text-green-600 hover:underline cursor-pointer">
                            {invoice.invoiceNo || "-"}
                          </span>
                        </TableCell>
                        <TableCell>
                          {formatCurrency(invoice.invoiceAmount, invoice.currencyCode || baseCurrencyCode)}
                        </TableCell>
                        <TableCell className="bg-green-100 dark:bg-green-900/30">
                          {formatCurrency(invoice.amount, invoice.currencyCode || baseCurrencyCode)}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(invoice.totalReceived, invoice.currencyCode || baseCurrencyCode)}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(invoice.balance, invoice.currencyCode || baseCurrencyCode)}
                        </TableCell>
                        <TableCell>
                          {formatDate(receipt.receiptDate)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                        No invoice allocations found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            No receipt details available
          </div>
        )}
        </div>

        <DialogFooter className="shrink-0 gap-2 border-t border-border bg-card px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
