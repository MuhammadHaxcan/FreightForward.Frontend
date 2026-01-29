import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/services/api';

export function useDashboardStats(params?: { fromDate?: string; toDate?: string }) {
  return useQuery({
    queryKey: ['dashboard', 'stats', params],
    queryFn: async () => {
      const response = await dashboardApi.getStats(params);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data!;
    },
  });
}
