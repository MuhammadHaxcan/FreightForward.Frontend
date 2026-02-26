import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { formatDate } from "@/lib/utils";
import { ArrowLeft, Printer, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MainLayout } from "@/components/layout/MainLayout";
import { receiptApi, ReceiptDetail } from "@/services/api";
import { API_BASE_URL, fetchBlob } from "@/services/api/base";
import { useBaseCurrency } from "@/hooks/useBaseCurrency";

export default function ReceiptView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const baseCurrencyCode = useBaseCurrency();
  const [receipt, setReceipt] = useState<ReceiptDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReceipt = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const response = await receiptApi.getById(parseInt(id));
        if (response.data) {
          setReceipt(response.data);
        }
      } catch (error) {
        console.error("Error fetching receipt:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchReceipt();
  }, [id]);

  const handlePrint = () => {
    if (!id) return;
    window.open(`/accounts/receipt-vouchers/${id}/print`, '_blank');
  };

  const handleDownload = async () => {
    if (!id) return;
    try {
      const response = await fetchBlob(`${API_BASE_URL}/invoices/receipts/${id}/pdf`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${receipt?.receiptNo || 'receipt'}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Error downloading PDF:", error);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <div className="text-lg">Loading...</div>
        </div>
      </MainLayout>
    );
  }

  if (!receipt) {
    return (
      <MainLayout>
        <div className="p-6 flex flex-col items-center justify-center min-h-[400px]">
          <div className="text-lg mb-4">Receipt not found</div>
          <Button onClick={() => navigate("/accounts/receipt-vouchers")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Receipts
          </Button>
        </div>
      </MainLayout>
    );
  }

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
      case 'PostDatedCheque': return 'POST DATED CHEQUE';
      default: return mode.toUpperCase();
    }
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center print:hidden">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/accounts/receipt-vouchers")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold">Receipt Voucher - {receipt.receiptNo}</h1>
          </div>
          <div className="flex gap-2">
            <Button className="btn-success" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button className="bg-amber-500 hover:bg-amber-600 text-white" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>

        {/* Receipt Content */}
        <div className="bg-background border rounded-lg p-6">
          {/* Header Section */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-2xl font-semibold mb-4 text-green-700">RECEIPT</h2>
              <div className="space-y-1">
                <p><span className="font-medium">Customer Code:</span> {receipt.customerCode || "-"}</p>
                <p><span className="font-medium">Customer:</span> {receipt.customerName || "-"}</p>
                <p><span className="font-medium">Address:</span> {receipt.customerAddress || "-"}</p>
                <p><span className="font-medium">Phone:</span> {receipt.customerPhone || "-"}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="space-y-1 text-sm">
                <p className="font-bold text-lg">{receipt.receiptNo}</p>
                <p>Date: {formatDate(receipt.receiptDate)}</p>
              </div>
            </div>
          </div>

          {/* Payment Details Table */}
          <div className="border rounded-lg overflow-hidden mb-6">
            <Table>
              <TableHeader>
                <TableRow className="bg-green-700">
                  <TableHead className="text-white font-semibold">Payment Mode</TableHead>
                  <TableHead className="text-white font-semibold">Cheque No</TableHead>
                  <TableHead className="text-white font-semibold">Date</TableHead>
                  <TableHead className="text-white font-semibold">Bank Name</TableHead>
                  <TableHead className="text-white font-semibold">Currency</TableHead>
                  <TableHead className="text-white font-semibold text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>{formatPaymentMode(receipt.paymentMode)}</TableCell>
                  <TableCell>{receipt.chequeNo || "-"}</TableCell>
                  <TableCell>
                    {formatDate(receipt.chequeDate) || "---"}
                  </TableCell>
                  <TableCell>{receipt.bankName || "-"}</TableCell>
                  <TableCell>{receipt.currencyCode || baseCurrencyCode}</TableCell>
                  <TableCell className="text-right">{receipt.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* Invoice Details Section */}
          {receipt.invoices && receipt.invoices.length > 0 && (
            <>
              <h3 className="text-lg font-semibold mb-4">Invoice Details :</h3>
              <div className="border rounded-lg overflow-hidden mb-6">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-green-700">
                      <TableHead className="text-white font-semibold">Invoice Date</TableHead>
                      <TableHead className="text-white font-semibold">Invoice No</TableHead>
                      <TableHead className="text-white font-semibold">Job No</TableHead>
                      <TableHead className="text-white font-semibold">BL No</TableHead>
                      <TableHead className="text-white font-semibold">Currency</TableHead>
                      <TableHead className="text-white font-semibold text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {receipt.invoices.map((inv, index) => (
                      <TableRow key={inv.id || index}>
                        <TableCell>
                          {formatDate(inv.invoiceDate)}
                        </TableCell>
                        <TableCell>{inv.invoiceNo || "-"}</TableCell>
                        <TableCell>{inv.jobNo || "-"}</TableCell>
                        <TableCell>{inv.hblNo || "-"}</TableCell>
                        <TableCell>{inv.currencyCode || baseCurrencyCode}</TableCell>
                        <TableCell className="text-right">
                          {inv.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}

          {/* Remarks Section */}
          {receipt.narration && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Remarks :</h3>
              <p className="text-muted-foreground">{receipt.narration}</p>
            </div>
          )}

          {/* Signature Lines */}
          <div className="grid grid-cols-3 gap-8 mt-12">
            <div className="text-center">
              <div className="border-t border-gray-400 pt-2">
                <span className="text-sm font-medium">Prepared By:</span>
              </div>
            </div>
            <div className="text-center">
              <div className="border-t border-gray-400 pt-2">
                <span className="text-sm font-medium">Printed By:</span>
              </div>
            </div>
            <div className="text-center">
              <div className="border-t border-gray-400 pt-2">
                <span className="text-sm font-medium">Approved By:</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground print:hidden">
          This is a computer generated receipt.
        </div>
      </div>
    </MainLayout>
  );
}
