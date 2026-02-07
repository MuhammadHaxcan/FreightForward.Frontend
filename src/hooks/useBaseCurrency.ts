import { useQuery } from '@tanstack/react-query';
import { companyApi } from '../services/api/company';

export function useBaseCurrency() {
  const { data: baseCurrencyCode } = useQuery({
    queryKey: ['baseCurrency'],
    queryFn: async () => {
      const result = await companyApi.getAll({ pageNumber: 1, pageSize: 1 });
      if (result.error || !result.data?.items?.length) return 'AED';
      return result.data.items[0].baseCurrencyCode || 'AED';
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  return baseCurrencyCode || 'AED';
}
