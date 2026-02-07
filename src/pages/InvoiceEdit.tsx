import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MainLayout } from "@/components/layout/MainLayout";
import { invoiceApi, shipmentApi, AccountInvoiceDetail, ShipmentDetail } from "@/services/api";
import { InvoiceModal } from "@/components/shipments/InvoiceModal";

export default function InvoiceEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<AccountInvoiceDetail | null>(null);
  const [shipment, setShipment] = useState<ShipmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const invoiceResponse = await invoiceApi.getByIdentifier(id);
        if (invoiceResponse.data) {
          setInvoice(invoiceResponse.data);

          // Fetch shipment data for parties and costings
          if (invoiceResponse.data.shipmentId) {
            const shipmentResponse = await shipmentApi.getById(invoiceResponse.data.shipmentId);
            if (shipmentResponse.data) {
              setShipment(shipmentResponse.data);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // Auto-open modal once data is loaded
  useEffect(() => {
    if (!loading && invoice && shipment) {
      setModalOpen(true);
    }
  }, [loading, invoice, shipment]);

  const handleModalClose = (open: boolean) => {
    setModalOpen(open);
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

  return (
    <MainLayout>
      <div className="p-6">
        <InvoiceModal
          open={modalOpen}
          onOpenChange={handleModalClose}
          shipmentId={shipment.id}
          chargesDetails={shipment.costings}
          parties={shipment.parties}
          onSave={handleSave}
          editInvoiceId={invoice.id}
        />
      </div>
    </MainLayout>
  );
}
