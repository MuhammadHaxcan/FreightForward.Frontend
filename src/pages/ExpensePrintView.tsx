import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { API_BASE_URL } from "@/services/api/base";
import { useAuthPdf } from "@/hooks/useAuthPdf";

export default function ExpensePrintView() {
  const [searchParams] = useSearchParams();

  const startDate = searchParams.get("startDate") || "";
  const endDate = searchParams.get("endDate") || "";
  const bank = searchParams.get("bank") || "";
  const category = searchParams.get("category") || "";

  const pdfUrl = useMemo(() => {
    let url = `${API_BASE_URL}/invoices/expenses/pdf?startDate=${startDate}&endDate=${endDate}&inline=true`;
    if (bank) url += `&bank=${encodeURIComponent(bank)}`;
    if (category) url += `&category=${encodeURIComponent(category)}`;
    return url;
  }, [startDate, endDate, bank, category]);

  const { blobUrl, isLoading, error } = useAuthPdf(pdfUrl);

  return (
    <div className="h-screen w-screen relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading Cash Flow Report...</p>
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
          title="Cash Flow Report"
        />
      )}
    </div>
  );
}
