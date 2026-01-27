import { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { API_BASE_URL } from "@/services/api/base";

export default function StatementPrintView() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const fromDate = searchParams.get("fromDate") || "";
  const toDate = searchParams.get("toDate") || "";

  const pdfUrl = `${API_BASE_URL}/customers/${id}/statement/pdf?fromDate=${fromDate}&toDate=${toDate}&inline=true`;

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  return (
    <div className="h-screen w-screen relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading Statement of Account...</p>
          </div>
        </div>
      )}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <div className="text-center">
            <p className="text-red-600 mb-4">Failed to load PDF</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
            >
              Retry
            </button>
          </div>
        </div>
      )}
      <iframe
        src={pdfUrl}
        className="w-full h-full border-0"
        title="Statement of Account"
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
}
