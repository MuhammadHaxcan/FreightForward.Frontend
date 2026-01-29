import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { formatDate } from "@/lib/utils";
import { ArrowLeft, Mail, Pencil, FileText, Download, File } from "lucide-react";
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
import { invoiceApi, AccountInvoiceDetail } from "@/services/api";
import { API_BASE_URL, fetchBlob } from "@/services/api/base";

export default function InvoiceView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<AccountInvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const response = await invoiceApi.getById(parseInt(id));
        if (response.data) {
          setInvoice(response.data);
        }
      } catch (error) {
        console.error("Error fetching invoice:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [id]);

  const handleTaxInvoice = () => {
    if (!id) return;
    window.open(`/accounts/invoices/${id}/print?type=tax`, '_blank');
  };

  const handleNonTaxInvoice = () => {
    if (!id) return;
    window.open(`/accounts/invoices/${id}/print?type=nontax`, '_blank');
  };

  const handleDownload = async () => {
    if (!id) return;
    try {
      const response = await fetchBlob(`${API_BASE_URL}/invoices/${id}/pdf?type=tax`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${invoice?.invoiceNo || 'invoice'}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Error downloading PDF:", error);
    }
  };

  const handleSendEmail = () => {
    if (!invoice?.customerEmail) return;
    window.location.href = `mailto:${invoice.customerEmail}?subject=Invoice ${invoice.invoiceNo}`;
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
          <div className="text-lg mb-4">Invoice not found</div>
          <Button onClick={() => navigate("/accounts/invoices")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Invoices
          </Button>
        </div>
      </MainLayout>
    );
  }

  const formatCurrency = (amount: number, currency: string) => {
    return `${currency} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Deduplicate items by id to handle any existing duplicate records in database
  const uniqueItems = (invoice.items || []).filter((item, index, self) =>
    index === self.findIndex(i => i.id === item.id)
  );

  // Calculate totals using unique items
  const subTotal = invoice.subTotal || uniqueItems.reduce((sum, item) => sum + (item.amount || 0), 0);
  const totalTax = invoice.totalTax || uniqueItems.reduce((sum, item) => sum + (item.taxAmount || 0), 0);
  const total = invoice.total || subTotal + totalTax;

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Action Buttons */}
        <div className="flex justify-end gap-2 print:hidden">
          <Button
            variant="default"
            className="bg-gray-800 hover:bg-gray-900 text-white"
            onClick={() => navigate("/accounts/invoices")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button className="bg-teal-500 hover:bg-teal-600 text-white" onClick={handleSendEmail}>
            <Mail className="h-4 w-4 mr-2" />
            Send Email
          </Button>
          <Button className="btn-success" onClick={() => navigate(`/accounts/invoices/${id}/edit`)}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button className="bg-lime-500 hover:bg-lime-600 text-white" onClick={handleTaxInvoice}>
            <FileText className="h-4 w-4 mr-2" />
            Tax Invoice
          </Button>
          <Button className="bg-amber-500 hover:bg-amber-600 text-white" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button className="bg-orange-500 hover:bg-orange-600 text-white" onClick={handleNonTaxInvoice}>
            <File className="h-4 w-4 mr-2" />
            Non-Tax Invoice
          </Button>
        </div>

        {/* Invoice Content */}
        <div className="bg-background border rounded-lg p-6">
          {/* Header Section */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-2xl font-semibold mb-4">Bill To:</h2>
              <div className="space-y-1">
                <p className="font-bold text-lg">{invoice.customerName}</p>
                <p className="text-muted-foreground">Address : {invoice.customerAddress || ""}</p>
                <p className="text-muted-foreground">Phone : {invoice.customerPhone || ""}</p>
                <p className="text-muted-foreground">Email : {invoice.customerEmail || ""}</p>
              </div>
            </div>
            <div className="text-right">
              <h1 className="text-4xl font-light text-muted-foreground mb-4">Sales Invoice</h1>
              <div className="space-y-1 text-sm">
                {invoice.jobNumber && (
                  <p>Job No : <span className="font-bold">{invoice.jobNumber}</span></p>
                )}
                <p className="font-bold">{invoice.invoiceNo}</p>
                <p>Date : {formatDate(invoice.invoiceDate)}</p>
                {invoice.dueDate && (
                  <p>Due Date : {formatDate(invoice.dueDate)}</p>
                )}
              </div>
            </div>
          </div>

          {/* Charges Table */}
          <div className="border rounded-lg overflow-hidden mb-4">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-800">
                  <TableHead className="text-white font-semibold">Charges Details</TableHead>
                  <TableHead className="text-white font-semibold text-center">Basis</TableHead>
                  <TableHead className="text-white font-semibold text-center">Currency</TableHead>
                  <TableHead className="text-white font-semibold text-right">Rate</TableHead>
                  <TableHead className="text-white font-semibold text-right">Quantity</TableHead>
                  <TableHead className="text-white font-semibold text-right">ROE</TableHead>
                  <TableHead className="text-white font-semibold text-right">Tax%</TableHead>
                  <TableHead className="text-white font-semibold text-right">Tax Amt</TableHead>
                  <TableHead className="text-white font-semibold text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {uniqueItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-blue-600">{item.chargeDetails}</TableCell>
                    <TableCell className="text-center">{item.basis || '-'}</TableCell>
                    <TableCell className="text-center">{item.currencyCode || ''}</TableCell>
                    <TableCell className="text-right">{(item.rate ?? 0).toFixed(2)}</TableCell>
                    <TableCell className="text-right">{(item.quantity ?? 0).toFixed(2)}</TableCell>
                    <TableCell className="text-right">{(item.roe ?? 1).toFixed(4)}</TableCell>
                    <TableCell className="text-right">{(item.taxPercentage ?? 0).toFixed(2)}</TableCell>
                    <TableCell className="text-right">{(item.taxAmount ?? 0).toFixed(2)}</TableCell>
                    <TableCell className="text-right">{(item.amount ?? 0).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
                {uniqueItems.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-4 text-muted-foreground">
                      No charges found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Remarks Section */}
          {invoice.remarks && (
            <div className="mb-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-sm font-semibold mb-1">Remarks:</p>
              <p className="text-sm text-muted-foreground">{invoice.remarks}</p>
            </div>
          )}

          {/* Totals Section */}
          <div className="flex justify-end">
            <div className="w-80">
              <div className="bg-amber-50 dark:bg-amber-900/20 p-2 mb-2">
                <div className="flex justify-between">
                  <span>Sub Total</span>
                  <span className="font-semibold">{formatCurrency(subTotal, invoice.currencyCode || '')}</span>
                </div>
              </div>
              <div className="px-2 py-1">
                <div className="flex justify-between">
                  <span>Total Tax</span>
                  <span>{formatCurrency(totalTax, invoice.currencyCode || '')}</span>
                </div>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 p-2 mt-2">
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(total, invoice.currencyCode || '')}</span>
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
