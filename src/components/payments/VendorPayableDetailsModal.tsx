import { useState, useEffect } from "react";
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
import { formatDate } from "@/lib/utils";
import { customerApi, AccountPayable } from "@/services/api";

interface VendorPayableDetailsModalProps {
  vendorId: number | null;
  vendorName: string;
  currencyCode: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VendorPayableDetailsModal({
  vendorId,
  vendorName,
  currencyCode,
  open,
  onOpenChange,
}: VendorPayableDetailsModalProps) {
  const [items, setItems] = useState<AccountPayable[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !vendorId) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await customerApi.getAllAccountPayables(vendorId);
        if (response.data) {
          setItems(response.data);
        }
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [open, vendorId]);

  if (!open) return null;

  const formatAmount = (amount: number) =>
    amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const totalCredit = items.reduce((sum, item) => sum + item.credit, 0);
  const totalPaid = items.reduce((sum, item) => sum + (item.credit - item.balance), 0);
  const totalBalance = items.reduce((sum, item) => sum + item.balance, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0">
        <DialogHeader className="bg-modal-header text-white p-4 rounded-t-lg">
          <DialogTitle className="text-white text-lg font-semibold">
            Payment Details [{vendorName}]
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center">Loading...</div>
        ) : items.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            No purchase invoices found
          </div>
        ) : (
          <div className="p-6">
            <div className="border rounded-lg overflow-hidden">
              <div className="max-h-[70vh] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-100">
                      <TableHead className="font-semibold">Sr. No</TableHead>
                      <TableHead className="font-semibold">Purchase Inv #</TableHead>
                      <TableHead className="font-semibold">PI. date</TableHead>
                      <TableHead className="font-semibold text-right">PI. Amount</TableHead>
                      <TableHead className="font-semibold text-right">Total Paid</TableHead>
                      <TableHead className="font-semibold text-right">Balance Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, index) => (
                      <TableRow key={item.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>
                          <span
                            className="text-green-600 font-medium cursor-pointer hover:underline"
                            onClick={() =>
                              window.open(
                                `/accounts/purchase-invoices/${item.purchaseInvoiceNo}`,
                                "_blank"
                              )
                            }
                          >
                            {item.purchaseInvoiceNo}
                          </span>
                        </TableCell>
                        <TableCell>
                          {item.invoiceDate ? formatDate(item.invoiceDate, "dd MMM yyyy") : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {currencyCode} {formatAmount(item.credit)}
                        </TableCell>
                        <TableCell className="text-right">
                          {currencyCode} {formatAmount(item.credit - item.balance)}
                        </TableCell>
                        <TableCell className="text-right">
                          {currencyCode} {formatAmount(item.balance)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {/* Totals Row */}
                    <TableRow className="bg-orange-50 font-semibold">
                      <TableCell></TableCell>
                      <TableCell></TableCell>
                      <TableCell className="font-semibold">Total</TableCell>
                      <TableCell className="text-right font-semibold">
                        {currencyCode} {formatAmount(totalCredit)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {currencyCode} {formatAmount(totalPaid)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {currencyCode} {formatAmount(totalBalance)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end p-4 pt-0">
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
