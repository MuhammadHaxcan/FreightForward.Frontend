import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { fetchApi } from "@/services/api/base";

interface InvoicePdfUrlResponse {
  url: string;
  title: string;
}

export default function InvoicePrintView() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();

  const type = searchParams.get("type") || "tax";
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfTitle, setPdfTitle] = useState<string | null>(null);
  const [isFetchingUrl, setIsFetchingUrl] = useState(true);
  const [isIframeLoading, setIsIframeLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fallbackTitle = useMemo(() => {
    if (!id) {
      return "Invoice";
    }

    try {
      return decodeURIComponent(id);
    } catch {
      return id;
    }
  }, [id]);
  const documentTitle = pdfTitle || fallbackTitle;

  useEffect(() => {
    let mounted = true;

    const loadPdfUrl = async () => {
      if (!id) {
        setIsFetchingUrl(false);
        setError("Invoice not found");
        return;
      }

      setIsFetchingUrl(true);
      setIsIframeLoading(false);
      setError(null);
      setPdfUrl(null);
      setPdfTitle(null);

      const result = await fetchApi<InvoicePdfUrlResponse>(
        `/invoices/${encodeURIComponent(id)}/pdf-url?type=${encodeURIComponent(type)}`,
      );

      if (!mounted) {
        return;
      }

      if (result.error || !result.data?.url) {
        setError(result.error || "Failed to load PDF");
      } else {
        setIsIframeLoading(true);
        setPdfUrl(result.data.url);
        setPdfTitle(result.data.title);
      }

      setIsFetchingUrl(false);
    };

    loadPdfUrl();

    return () => {
      mounted = false;
    };
  }, [id, type]);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = documentTitle;

    return () => {
      document.title = previousTitle;
    };
  }, [documentTitle]);

  const showLoading = !error && (isFetchingUrl || isIframeLoading);

  return (
    <div className="h-screen w-screen relative bg-gray-100">
      {showLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading Invoice...</p>
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
      {pdfUrl && (
        <iframe
          src={pdfUrl}
          className={`w-full h-full border-0 ${showLoading ? "opacity-0" : "opacity-100"}`}
          title={documentTitle}
          onLoad={() => setIsIframeLoading(false)}
        />
      )}
    </div>
  );
}
