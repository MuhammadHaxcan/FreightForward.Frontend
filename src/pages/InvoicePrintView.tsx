import { useParams, useSearchParams } from "react-router-dom";
import { API_BASE_URL } from "@/services/api/base";

export default function InvoicePrintView() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();

  const type = searchParams.get("type") || "tax";

  // Build the PDF URL with inline parameter for embedded viewing
  const pdfUrl = `${API_BASE_URL}/invoices/${id}/pdf?type=${type}&inline=true`;

  return (
    <div className="h-screen w-screen">
      <iframe
        src={pdfUrl}
        className="w-full h-full border-0"
        title="Invoice"
      />
    </div>
  );
}
