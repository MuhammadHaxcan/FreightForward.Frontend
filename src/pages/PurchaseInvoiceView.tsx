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
import { invoiceApi, AccountPurchaseInvoiceDetail } from "@/services/api";
import { API_BASE_URL } from "@/services/api/base";

export default function PurchaseInvoiceView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<AccountPurchaseInvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const response = await invoiceApi.getPurchaseInvoiceById(parseInt(id));
        if (response.data) {
          setInvoice(response.data);
        }
      } catch (error) {
        console.error("Error fetching purchase invoice:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [id]);

  const handlePrint = () => {
    if (!id) return;
    window.open(`${API_BASE_URL}/invoices/purchases/${id}/pdf`, '_blank');
  };

  const handleDownload = async () => {
    if (!id) return;
    try {
      const response = await fetch(`${API_BASE_URL}/invoices/purchases/${id}/pdf`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${invoice?.purchaseNo || 'purchase-invoice'}.pdf`;
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

  if (!invoice) {
    return (
      <MainLayout>
        <div className="p-6 flex flex-col items-center justify-center min-h-[400px]">
          <div className="text-lg mb-4">Purchase Invoice not found</div>
          <Button onClick={() => navigate("/accounts/purchase-invoices")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Purchase Invoices
          </Button>
        </div>
      </MainLayout>
    );
  }

  const formatCurrency = (amount: number, currency: string) => {
    return `${currency} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Calculate totals
  const subTotal = invoice.items?.reduce((sum, item) => sum + (item.localAmount || 0), 0) || 0;
  const totalTax = invoice.items?.reduce((sum, item) => sum + (item.taxAmount || 0), 0) || 0;
  const total = invoice.amount || subTotal + totalTax;

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Action Buttons */}
        <div className="flex justify-end gap-2 print:hidden">
          <Button
            variant="default"
            className="bg-gray-800 hover:bg-gray-900 text-white"
            onClick={() => navigate("/accounts/purchase-invoices")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button className="bg-green-500 hover:bg-green-600 text-white" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button className="bg-amber-500 hover:bg-amber-600 text-white" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>

        {/* Invoice Content */}
        <div className="bg-background border rounded-lg p-6">
          {/* Header Section */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-2xl font-semibold mb-4">Invoice From:</h2>
              <div className="space-y-1">
                <p className="font-bold text-lg">{invoice.vendorName || "-"}</p>
                <p className="text-muted-foreground">Address :</p>
                <p className="text-muted-foreground">Phone :</p>
                <p className="text-muted-foreground">Email :</p>
              </div>
            </div>
            <div className="text-right">
              <h1 className="text-4xl font-light text-muted-foreground mb-4">Purchase Invoice</h1>
              <div className="space-y-1 text-sm">
                <p className="font-bold">{invoice.purchaseNo}</p>
                <p>Date : {formatDate(invoice.purchaseDate)}</p>
                <p>Due Date : {formatDate(invoice.purchaseDate)}</p>
              </div>
            </div>
          </div>

          {/* Charges Table */}
          <div className="border rounded-lg overflow-hidden mb-4">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-800">
                  <TableHead className="text-white font-semibold">Charges Details</TableHead>
                  <TableHead className="text-white font-semibold text-center">Total CBM</TableHead>
                  <TableHead className="text-white font-semibold text-center">Currency</TableHead>
                  <TableHead className="text-white font-semibold text-right">Rate</TableHead>
                  <TableHead className="text-white font-semibold text-right">ROE</TableHead>
                  <TableHead className="text-white font-semibold text-right">Quantity</TableHead>
                  <TableHead className="text-white font-semibold text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(invoice.items || []).map((item, index) => (
                  <TableRow key={item.id || index}>
                    <TableCell className="text-blue-600">{item.chargeDetails}</TableCell>
                    <TableCell className="text-center">{(item.quantity ?? 0).toFixed(0)}</TableCell>
                    <TableCell className="text-center">{item.currency}</TableCell>
                    <TableCell className="text-right">{(item.costPerUnit ?? 0).toFixed(2)}</TableCell>
                    <TableCell className="text-right">{(item.exRate ?? 1).toFixed(2)}</TableCell>
                    <TableCell className="text-right">{(item.quantity ?? 0).toFixed(3)}</TableCell>
                    <TableCell className="text-right">{(item.localAmount ?? 0).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
                {invoice.items?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                      No charges found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Totals Section */}
          <div className="flex justify-end">
            <div className="w-80">
              <div className="bg-amber-50 dark:bg-amber-900/20 p-2 mb-2">
                <div className="flex justify-between">
                  <span>Sub Total</span>
                  <span className="font-semibold">{formatCurrency(subTotal, invoice.currency)}</span>
                </div>
              </div>
              <div className="space-y-2 px-2">
                <div className="flex justify-between">
                  <span>Discount (0%)</span>
                  <span>{formatCurrency(0, invoice.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span>VAT (0%)</span>
                  <span>{formatCurrency(totalTax, invoice.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Adjustment</span>
                  <span>{formatCurrency(0, invoice.currency)}</span>
                </div>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 p-2 mt-2">
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(total, invoice.currency)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground print:hidden">
          Copyright &copy; TransParent {new Date().getFullYear()}
        </div>
      </div>
    </MainLayout>
  );
}
