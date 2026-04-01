import { useParams } from "react-router-dom";
import { API_BASE_URL } from "@/services/api/base";
import { useAuthPdf } from "@/hooks/useAuthPdf";

const REPORT_TITLES: Record<string, string> = {
  "cargo-manifest": "Cargo Manifest",
  "proof-of-delivery": "Proof of Delivery",
  "cargo-arrival-notice": "Cargo Arrival Notice",
  "freight-certificate": "Freight Certificate",
  "mbl-shipping-instruction": "MBL Shipping Instruction",
  "bill-of-lading": "Bill of Lading",
  "customs-declaration": "Customs Declaration",
};

export default function ShipmentReportPrintView() {
  const { shipmentId, reportType } = useParams<{ shipmentId: string; reportType: string }>();

  const pdfUrl = shipmentId && reportType
    ? `${API_BASE_URL}/shipments/${shipmentId}/reports/${reportType}?inline=true`
    : null;

  const { blobUrl, isLoading, error } = useAuthPdf(pdfUrl);

  const title = REPORT_TITLES[reportType ?? ""] ?? "Report";

  return (
    <div className="h-screen w-screen relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading {title}...</p>
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
          title={title}
        />
      )}
    </div>
  );
}
