import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { PurchaseModal } from "@/components/shipments/PurchaseModal";
import { usePurchaseInvoiceByIdentifier } from "@/hooks/useInvoices";
import { useShipment } from "@/hooks/useShipments";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function PurchaseInvoiceEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const { data: invoice, isLoading: invoiceLoading } = usePurchaseInvoiceByIdentifier(id);
  const shipmentId = invoice?.shipmentId;
  const { data: shipment, isLoading: shipmentLoading } = useShipment(shipmentId ?? 0);

  const isLoading = invoiceLoading || (!!shipmentId && shipmentLoading);
  const isClosedLinkedShipment = shipment?.jobStatus === "Closed";
  const canEditClosedShipment = hasPermission("ship_edit_closed");

  useEffect(() => {
    if (isLoading || !invoice) return;
    if (shipment && isClosedLinkedShipment && !canEditClosedShipment) {
      toast.error("Closed shipment is view-only for your role");
      navigate(`/accounts/purchase-invoices/${encodeURIComponent(invoice.purchaseNo)}`, { replace: true });
      return;
    }
    if ((invoice.linkedPaymentVoucherCount ?? 0) > 0) {
      toast.error("Purchase invoice cannot be edited because it has linked payment vouchers");
      navigate(`/accounts/purchase-invoices/${encodeURIComponent(invoice.purchaseNo)}`, { replace: true });
    }
  }, [isLoading, invoice, shipment, isClosedLinkedShipment, canEditClosedShipment, navigate]);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <div className="text-lg">Loading purchase invoice editor...</div>
        </div>
      </MainLayout>
    );
  }

  if (!invoice) {
    return (
      <MainLayout>
        <div className="p-6 flex flex-col items-center justify-center min-h-[400px] gap-4">
          <div className="text-lg">Purchase invoice not found</div>
          <Button onClick={() => navigate("/accounts/purchase-invoices")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Purchase Invoices
          </Button>
        </div>
      </MainLayout>
    );
  }

  if (!shipmentId || !shipment) {
    return (
      <MainLayout>
        <div className="p-6 flex flex-col items-center justify-center min-h-[400px] gap-4">
          <div className="text-lg">Shipment data not available for this purchase invoice</div>
          <Button onClick={() => navigate(`/accounts/purchase-invoices/${encodeURIComponent(invoice.purchaseNo)}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Purchase Invoice
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
        <PurchaseModal
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              navigate(`/accounts/purchase-invoices/${encodeURIComponent(invoice.purchaseNo)}`);
            }
          }}
          shipmentId={shipment.id}
          jobNumber={shipment.jobNumber}
          chargesDetails={shipment.costings}
          parties={shipment.parties}
          editPurchaseInvoiceId={invoice.id}
          asPage
          onSave={async () => {
            navigate(`/accounts/purchase-invoices/${encodeURIComponent(invoice.purchaseNo)}`);
          }}
        />
      </div>
    </MainLayout>
  );
}
