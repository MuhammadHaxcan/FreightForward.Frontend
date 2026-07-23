import { useQuery } from '@tanstack/react-query';
import { lookupApi } from '@/services/api/lookups';

export const salespersonLookupQueryKey = ['lookups', 'salespersons'] as const;

export function useSalespersonLookup(enabled = true) {
  return useQuery({
    queryKey: salespersonLookupQueryKey,
    queryFn: async () => {
      const result = await lookupApi.getSalespersons();
      if (result.error) throw new Error(result.error);
      return result.data ?? [];
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}
