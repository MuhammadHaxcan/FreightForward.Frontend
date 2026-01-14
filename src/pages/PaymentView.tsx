import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MainLayout } from "@/components/layout/MainLayout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePaymentVoucher } from "@/hooks/usePaymentVouchers";
import { getPaymentVoucherPdfUrl } from "@/services/api/payment";
import { formatDate } from "@/lib/utils";

export default function PaymentView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const paymentId = id ? parseInt(id) : null;

  const { data: payment, isLoading } = usePaymentVoucher(paymentId);

  const handleDownloadPdf = () => {
    if (paymentId) {
      window.open(getPaymentVoucherPdfUrl(paymentId), "_blank");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="p-6">
          <div className="flex justify-center items-center h-64">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!payment) {
    return (
      <MainLayout>
        <div className="p-6">
          <div className="flex justify-center items-center h-64">
            <div className="text-muted-foreground">Payment voucher not found</div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/accounts/payment-vouchers")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Payment Voucher - {payment.paymentNo}</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button
            className="bg-green-500 hover:bg-green-600 text-white"
            onClick={handleDownloadPdf}
          >
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Payment Voucher Card */}
      <div className="bg-white border rounded-lg shadow-sm print:shadow-none">
        {/* Company Header */}
        <div className="p-6 border-b">
          <div className="flex justify-between">
            <div>
              <h2 className="text-xl font-bold text-green-700">TRANSPARENT FREIGHT SERVICES LLC</h2>
              <p className="text-sm text-muted-foreground">Email : info@tfs-global.com</p>
              <p className="text-sm text-muted-foreground">Phone : 04-2396853</p>
              <p className="text-sm text-muted-foreground">
                Address: ROOM No. 313, 3RD FLOOR, SHAIKHA MHARA-AI QUSAIS BLDG., DUBAI, UNITED ARAB EMIRATES.
              </p>
              <p className="text-sm text-muted-foreground">United Arab Emirates</p>
              <p className="text-sm text-muted-foreground">TRN :</p>
            </div>
          </div>
        </div>

        {/* Payment Title Bar */}
        <div className="bg-green-700 text-white text-center py-2 font-bold">
          PAYMENT
        </div>

        {/* Payment Info */}
        <div className="p-6 border-b">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p><span className="font-medium">Purchase No :</span> {payment.paymentNo}</p>
              <p><span className="font-medium">Customer Code :</span> {payment.vendorCode || "-"}</p>
            </div>
            <div className="text-right">
              <p><span className="font-medium">Date:</span> {formatDate(payment.paymentDate, "dd-MM-yyyy")}</p>
            </div>
          </div>
        </div>

        {/* Payment Details Table */}
        <div className="p-6 border-b">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-100">
                <TableHead>Payment Mode</TableHead>
                <TableHead>Cheque No</TableHead>
                <TableHead>Cheque/DD/Cash Date</TableHead>
                <TableHead>Bank Name</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>{payment.paymentMode.toUpperCase().replace("BANKWIRE", "BANK WIRE")}</TableCell>
                <TableCell>{payment.chequeNo || "-"}</TableCell>
                <TableCell>
                  {payment.chequeDate ? formatDate(payment.chequeDate, "dd-MM-yyyy") : "-"}
                </TableCell>
                <TableCell>{payment.bankName || "-"}</TableCell>
                <TableCell>{payment.currency}</TableCell>
                <TableCell className="text-right font-medium">
                  {payment.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {/* Purchase Details */}
        {payment.purchaseInvoices && payment.purchaseInvoices.length > 0 && (
          <div className="p-6 border-b">
            <h3 className="font-semibold mb-4">Purchase Details :</h3>
            <Table>
              <TableHeader>
                <TableRow className="border-b">
                  <TableHead>B/L No</TableHead>
                  <TableHead>Purchase No</TableHead>
                  <TableHead>Vessel/Voyage/Bound</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payment.purchaseInvoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell>{payment.narration || "-"}</TableCell>
                    <TableCell>{inv.purchaseNo}</TableCell>
                    <TableCell>{inv.vesselVoyageBound || "-"}</TableCell>
                    <TableCell>{inv.currency}</TableCell>
                    <TableCell className="text-right">
                      {inv.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Remarks */}
        {payment.narration && (
          <div className="p-6 border-b">
            <h3 className="font-semibold mb-2">Remarks :</h3>
            <p className="text-sm text-red-600">{payment.narration}</p>
          </div>
        )}

        {/* Signature Section */}
        <div className="p-6">
          <div className="grid grid-cols-3 gap-8 mt-8">
            <div className="text-center">
              <div className="border-t border-gray-400 pt-2">
                <p className="font-medium">Prepared By:</p>
              </div>
            </div>
            <div className="text-center">
              <div className="border-t border-gray-400 pt-2">
                <p className="font-medium">Printed By:</p>
              </div>
            </div>
            <div className="text-center">
              <div className="border-t border-gray-400 pt-2">
                <p className="font-medium">Approved By:</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .bg-white.border.rounded-lg, .bg-white.border.rounded-lg * {
            visibility: visible;
          }
          .bg-white.border.rounded-lg {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
      </div>
    </MainLayout>
  );
}
