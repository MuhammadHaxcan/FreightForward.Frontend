import { useState, useEffect } from 'react';
import { fetchBlob } from '@/services/api/base';

export function useAuthPdf(pdfUrl: string | null) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pdfUrl) {
      setIsLoading(false);
      return;
    }

    let currentBlobUrl: string | null = null;

    const fetchPdf = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetchBlob(pdfUrl);
        if (!response.ok) {
          throw new Error(`Failed to load PDF: ${response.status}`);
        }
        const blob = await response.blob();
        currentBlobUrl = URL.createObjectURL(blob);
        setBlobUrl(currentBlobUrl);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load PDF');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPdf();

    return () => {
      if (currentBlobUrl) {
        URL.revokeObjectURL(currentBlobUrl);
      }
    };
  }, [pdfUrl]);

  return { blobUrl, isLoading, error };
}
