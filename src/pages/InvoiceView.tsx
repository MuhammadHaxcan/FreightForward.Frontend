import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ArrowLeft, Mail, Edit, FileText, Download, Printer } from "lucide-react";
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

  const handlePrint = () => {
    window.print();
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

  return (
    <MainLayout>
    <div className="p-6 space-y-4">
      {/* Action Buttons */}
      <div className="flex justify-end gap-2 print:hidden">
        <Button variant="outline" onClick={() => navigate("/accounts/invoices")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button className="bg-green-600 hover:bg-green-700 text-white">
          <Mail className="h-4 w-4 mr-2" />
          Send Email
        </Button>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Button>
        <Button className="bg-amber-500 hover:bg-amber-600 text-white">
          <FileText className="h-4 w-4 mr-2" />
          Tax Invoice
        </Button>
        <Button className="bg-green-500 hover:bg-green-600 text-white" onClick={handlePrint}>
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
        <Button className="bg-red-500 hover:bg-red-600 text-white" onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2" />
          Non-Tax Invoice
        </Button>
      </div>

      {/* Invoice Content */}
      <div className="bg-background">
        {/* Header Section */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Bill To:</h2>
            <div className="space-y-1">
              <p className="font-bold text-lg">{invoice.customerName}</p>
              {invoice.customerAddress && (
                <p className="text-muted-foreground">Address: {invoice.customerAddress}</p>
              )}
              {invoice.customerPhone && (
                <p className="text-muted-foreground">Phone: {invoice.customerPhone}</p>
              )}
              {invoice.customerEmail && (
                <p className="text-muted-foreground">Email: {invoice.customerEmail}</p>
              )}
            </div>
          </div>
          <div className="text-right">
            <h1 className="text-3xl font-bold text-muted-foreground mb-2">Sales Invoice</h1>
            <div className="space-y-1">
              <p className="font-bold">{invoice.jobNumber || "-"}</p>
              <p className="font-bold">{invoice.invoiceNo}</p>
              <p>Date: {format(new Date(invoice.invoiceDate), "dd-MM-yyyy")}</p>
              {invoice.dueDate && (
                <p>Due Date: {format(new Date(invoice.dueDate), "dd-MM-yyyy")}</p>
              )}
            </div>
          </div>
        </div>

        {/* Charges Table */}
        <div className="border rounded-lg overflow-hidden mb-4">
          <Table>
            <TableHeader>
              <TableRow className="bg-amber-100 dark:bg-amber-900/30">
                <TableHead className="font-semibold text-foreground">Charges Details</TableHead>
                <TableHead className="font-semibold text-foreground">Basis</TableHead>
                <TableHead className="font-semibold text-foreground">Currency</TableHead>
                <TableHead className="font-semibold text-foreground text-right">Rate</TableHead>
                <TableHead className="font-semibold text-foreground text-right">Quantity</TableHead>
                <TableHead className="font-semibold text-foreground text-right">ROE</TableHead>
                <TableHead className="font-semibold text-foreground text-right">Tax%</TableHead>
                <TableHead className="font-semibold text-foreground text-right">Tax Amt</TableHead>
                <TableHead className="font-semibold text-foreground text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(invoice.items || []).map((item, index) => (
                <TableRow key={item.id || index}>
                  <TableCell className="text-blue-600">{item.chargeDetails}</TableCell>
                  <TableCell>{item.basis || "BL"}</TableCell>
                  <TableCell>{item.currency}</TableCell>
                  <TableCell className="text-right">{(item.rate ?? 0).toFixed(2)}</TableCell>
                  <TableCell className="text-right">{(item.quantity ?? 0).toFixed(3)}</TableCell>
                  <TableCell className="text-right text-blue-600">{(item.roe ?? 1).toFixed(3)}</TableCell>
                  <TableCell className="text-right">{item.taxPercentage ?? 0}</TableCell>
                  <TableCell className="text-right">{(item.taxAmount ?? 0).toFixed(2)}</TableCell>
                  <TableCell className="text-right">{(item.amount ?? 0).toFixed(2)}</TableCell>
                </TableRow>
              ))}
              {/* Remarks Row */}
              <TableRow className="bg-muted/30">
                <TableCell colSpan={9}>
                  <span className="font-medium">Remarks:</span> {invoice.remarks || ""}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-80 space-y-2">
            <div className="flex justify-between">
              <span>Sub Total</span>
              <span className="font-semibold">{formatCurrency(invoice.subTotal ?? 0, invoice.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Tax</span>
              <span className="font-semibold">{formatCurrency(invoice.totalTax ?? 0, invoice.currency)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total</span>
              <span className="text-green-600">{formatCurrency(invoice.total ?? 0, invoice.currency)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    </MainLayout>
  );
}
