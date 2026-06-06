import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MainLayout } from "@/components/layout/MainLayout";
import { InvoiceModal } from "@/components/shipments/InvoiceModal";
import { useInvoiceByIdentifier } from "@/hooks/useInvoices";
import { useShipment } from "@/hooks/useShipments";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function InvoiceEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const { data: invoice, isLoading: invoiceLoading } = useInvoiceByIdentifier(id);
  const { data: shipment, isLoading: shipmentLoading } = useShipment(invoice?.shipmentId ?? 0);
  // Still loading if invoice is pending, or invoice has a shipmentId but that shipment is still loading
  const loading = invoiceLoading || (!!invoice?.shipmentId && shipmentLoading);
  const isClosedLinkedShipment = shipment?.jobStatus === "Closed";
  const canEditClosedShipment = hasPermission("ship_edit_closed");

  useEffect(() => {
    if (loading || !invoice) return;
    if (shipment && isClosedLinkedShipment && !canEditClosedShipment) {
      toast.error("Closed shipment is view-only for your role");
      navigate(`/accounts/invoices/${encodeURIComponent(invoice.invoiceNo)}`, { replace: true });
      return;
    }
    const hasLinkedDocuments = (invoice.linkedReceiptCount ?? 0) > 0 || (invoice.linkedCreditNoteCount ?? 0) > 0;
    if (hasLinkedDocuments) {
      toast.error("Invoice cannot be edited because it has linked receipts or credit notes");
      navigate(`/accounts/invoices/${encodeURIComponent(invoice.invoiceNo)}`, { replace: true });
    }
  }, [loading, invoice, shipment, isClosedLinkedShipment, canEditClosedShipment, navigate]);

  const handleModalClose = (open: boolean) => {
    if (!open) {
      const invoiceNo = invoice?.invoiceNo;
      navigate(invoiceNo ? `/accounts/invoices/${encodeURIComponent(invoiceNo)}` : `/accounts/invoices/${id}`);
    }
  };

  const handleSave = () => {
    const invoiceNo = invoice?.invoiceNo;
    navigate(invoiceNo ? `/accounts/invoices/${encodeURIComponent(invoiceNo)}` : `/accounts/invoices/${id}`);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
          <span className="text-lg">Loading invoice...</span>
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

  if (!shipment) {
    return (
      <MainLayout>
        <div className="p-6 flex flex-col items-center justify-center min-h-[400px]">
          <div className="text-lg mb-4">No shipment linked to this invoice</div>
          <Button onClick={() => navigate(invoice?.invoiceNo ? `/accounts/invoices/${encodeURIComponent(invoice.invoiceNo)}` : `/accounts/invoices/${id}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Invoice
          </Button>
        </div>
      </MainLayout>
    );
  }

  if (isClosedLinkedShipment && !canEditClosedShipment) {
    return (
      <MainLayout>
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
          <span className="text-lg">Redirecting...</span>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6">
        <InvoiceModal
          open
          onOpenChange={handleModalClose}
          shipmentId={shipment.id}
          chargesDetails={shipment.costings}
          parties={shipment.parties}
          onSave={handleSave}
          editInvoiceId={invoice.id}
          asPage
        />
      </div>
    </MainLayout>
  );
}
