import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { API_BASE_URL } from "@/services/api/base";
import { useAuthPdf } from "@/hooks/useAuthPdf";

export default function VatReportPrintView() {
  const [searchParams] = useSearchParams();

  const typeParam = searchParams.get("type");
  const type: "input" | "output" | "combined" =
    typeParam === "input" ? "input" : typeParam === "combined" ? "combined" : "output";
  const fromDate = searchParams.get("fromDate") || "";
  const toDate = searchParams.get("toDate") || "";
  const entityId = searchParams.get("entityId") || "";

  const pdfUrl = useMemo(() => {
    const endpoint =
      type === "input" ? "vat-input-report"
      : type === "combined" ? "vat-combined-report"
      : "vat-report";
    let url = `${API_BASE_URL}/invoices/${endpoint}/pdf?inline=true`;
    if (fromDate) url += `&fromDate=${encodeURIComponent(fromDate)}`;
    if (toDate) url += `&toDate=${encodeURIComponent(toDate)}`;
    if (entityId && type !== "combined") {
      const entityParam = type === "input" ? "vendorId" : "customerId";
      url += `&${entityParam}=${encodeURIComponent(entityId)}`;
    }
    return url;
  }, [type, fromDate, toDate, entityId]);

  const { blobUrl, isLoading, error } = useAuthPdf(pdfUrl);
  const label =
    type === "input" ? "VAT Input Report"
    : type === "combined" ? "VAT Combined Report"
    : "VAT Output Report";

  return (
    <div className="h-screen w-screen relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading {label}...</p>
          </div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
            >
              Retry
            </button>
          </div>
        </div>
      )}
      {blobUrl && (
        <iframe
          src={blobUrl}
          className="w-full h-full border-0"
          title={label}
        />
      )}
    </div>
  );
}
