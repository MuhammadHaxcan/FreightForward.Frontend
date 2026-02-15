import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { formatDate } from "@/lib/utils";
import { ArrowLeft, Mail, Pencil, FileText, Download } from "lucide-react";
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
import { creditNoteApi, AccountCreditNoteDetail } from "@/services/api";
import { API_BASE_URL, fetchBlob } from "@/services/api/base";
import { useAuth } from "@/contexts/AuthContext";

export default function CreditNoteView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [creditNote, setCreditNote] = useState<AccountCreditNoteDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCreditNote = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const response = await creditNoteApi.getById(parseInt(id));
        if (response.data) {
          setCreditNote(response.data);
        }
      } catch (error) {
        console.error("Error fetching credit note:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCreditNote();
  }, [id]);

  const handlePrint = () => {
    if (!id) return;
    window.open(`/accounts/credit-notes/${id}/print`, '_blank');
  };

  const handleDownload = async () => {
    if (!id) return;
    try {
      const response = await fetchBlob(`${API_BASE_URL}/invoices/credit-notes/${id}/pdf`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${creditNote?.creditNoteNo || 'credit-note'}.pdf`;
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
    if (!creditNote?.email) return;
    window.location.href = `mailto:${creditNote.email}?subject=Credit Note ${creditNote.creditNoteNo}`;
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

  if (!creditNote) {
    return (
      <MainLayout>
        <div className="p-6 flex flex-col items-center justify-center min-h-[400px]">
          <div className="text-lg mb-4">Credit Note not found</div>
          <Button onClick={() => navigate("/accounts/credit-notes")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Credit Notes
          </Button>
        </div>
      </MainLayout>
    );
  }

  const details = creditNote.details || [];
  const total = details.reduce((sum, d) => sum + (d.amount || 0), 0);

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Action Buttons */}
        <div className="flex justify-end gap-2 print:hidden">
          <Button
            variant="default"
            className="bg-gray-800 hover:bg-gray-900 text-white"
            onClick={() => navigate("/accounts/credit-notes")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          {creditNote.email && (
            <Button className="bg-teal-500 hover:bg-teal-600 text-white" onClick={handleSendEmail}>
              <Mail className="h-4 w-4 mr-2" />
              Send Email
            </Button>
          )}
          {hasPermission("creditnote_edit") && (
            <Button className="btn-success" onClick={() => navigate(`/accounts/credit-notes/${id}/edit`)}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
          <Button className="bg-lime-500 hover:bg-lime-600 text-white" onClick={handlePrint}>
            <FileText className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button className="bg-amber-500 hover:bg-amber-600 text-white" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>

        {/* Credit Note Content */}
        <div className="bg-background border rounded-lg p-6">
          {/* Header Section */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-2xl font-semibold mb-4">Credit To:</h2>
              <div className="space-y-1">
                <p className="font-bold text-lg">{creditNote.customerName}</p>
                {creditNote.email && (
                  <p className="text-muted-foreground">Email : {creditNote.email}</p>
                )}
              </div>
            </div>
            <div className="text-right">
              <h1 className="text-4xl font-light text-muted-foreground mb-4">Credit Note</h1>
              <div className="space-y-1 text-sm">
                {creditNote.jobNumber && (
                  <p>Job No : <span className="font-bold">{creditNote.jobNumber}</span></p>
                )}
                <p className="font-bold">{creditNote.creditNoteNo}</p>
                <p>Date : {formatDate(creditNote.creditNoteDate)}</p>
                {creditNote.referenceNo && (
                  <p>Reference : {creditNote.referenceNo}</p>
                )}
                {creditNote.status && (
                  <p>Status : {creditNote.status}</p>
                )}
              </div>
            </div>
          </div>

          {/* Charges Table */}
          <div className="border rounded-lg overflow-hidden mb-4">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-800">
                  <TableHead className="text-white font-semibold">Charge Details</TableHead>
                  <TableHead className="text-white font-semibold text-center">Bases</TableHead>
                  <TableHead className="text-white font-semibold text-center">Currency</TableHead>
                  <TableHead className="text-white font-semibold text-right">Rate</TableHead>
                  <TableHead className="text-white font-semibold text-right">ROE</TableHead>
                  <TableHead className="text-white font-semibold text-right">Quantity</TableHead>
                  <TableHead className="text-white font-semibold text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {details.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-blue-600">{item.chargeDetails || "-"}</TableCell>
                    <TableCell className="text-center">{item.bases || '-'}</TableCell>
                    <TableCell className="text-center">{item.currencyCode || ''}</TableCell>
                    <TableCell className="text-right">{(item.rate ?? 0).toFixed(2)}</TableCell>
                    <TableCell className="text-right">{(item.roe ?? 1).toFixed(4)}</TableCell>
                    <TableCell className="text-right">{(item.quantity ?? 0).toFixed(2)}</TableCell>
                    <TableCell className="text-right">{(item.amount ?? 0).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
                {details.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                      No charges found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Applied to Invoices */}
          {creditNote.invoices && creditNote.invoices.length > 0 && (
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Applied to Invoices</h3>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-800">
                      <TableHead className="text-white font-semibold">Invoice Date</TableHead>
                      <TableHead className="text-white font-semibold">Invoice No</TableHead>
                      <TableHead className="text-white font-semibold">Job No</TableHead>
                      <TableHead className="text-white font-semibold">BL No</TableHead>
                      <TableHead className="text-white font-semibold text-center">Currency</TableHead>
                      <TableHead className="text-white font-semibold text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {creditNote.invoices.map((inv) => (
                      <TableRow key={inv.id}>
                        <TableCell>{inv.invoiceDate ? formatDate(inv.invoiceDate) : '-'}</TableCell>
                        <TableCell className="text-blue-600 cursor-pointer" onClick={() => navigate(`/accounts/invoices/${inv.invoiceId}`)}>{inv.invoiceNo || '-'}</TableCell>
                        <TableCell>{inv.jobNo || '-'}</TableCell>
                        <TableCell>{inv.hblNo || '-'}</TableCell>
                        <TableCell className="text-center">{inv.currencyCode || '-'}</TableCell>
                        <TableCell className="text-right">{inv.amount.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Additional Contents */}
          {creditNote.additionalContents && (
            <div className="mb-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-sm font-semibold mb-1">Additional Notes:</p>
              <p className="text-sm text-muted-foreground">{creditNote.additionalContents}</p>
            </div>
          )}

          {/* Total */}
          <div className="flex justify-end">
            <div className="w-80">
              <div className="bg-orange-50 dark:bg-orange-900/20 p-2">
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>{total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
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
