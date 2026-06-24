import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/services/api';
import type { ExceptionDashboardParams } from '@/services/api/dashboard';

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

export function useDashboardExceptions(params?: ExceptionDashboardParams) {
  return useQuery({
    queryKey: ['dashboard', 'exceptions', params],
    queryFn: async () => {
      const response = await dashboardApi.getExceptions(params);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data!;
    },
  });
}
