import { useQuery } from '@tanstack/react-query';
import { getPostDatedCheques } from '@/services/api/postDatedCheque';

export function usePostDatedCheques(params?: {
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  type?: string;
  source?: string;
}) {
  return useQuery({
    queryKey: ['post-dated-cheques', params],
    queryFn: async () => {
      const response = await getPostDatedCheques(params);
      if (response.error) throw new Error(response.error);
      return response.data;
    },
  });
}
