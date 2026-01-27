import { useParams } from "react-router-dom";
import { API_BASE_URL } from "@/services/api/base";

export default function PurchaseInvoicePrintView() {
  const { id } = useParams<{ id: string }>();

  // Build the PDF URL with inline parameter for embedded viewing
  const pdfUrl = `${API_BASE_URL}/invoices/purchases/${id}/pdf?inline=true`;

  return (
    <div className="h-screen w-screen">
      <iframe
        src={pdfUrl}
        className="w-full h-full border-0"
        title="Purchase Invoice"
      />
    </div>
  );
}
