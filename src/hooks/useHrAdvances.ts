import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hrAdvanceApi, type CreateAdvanceRequest } from '@/services/api/hr';
import { toast } from 'sonner';

export function useHrAdvances(params?: {
  pageNumber?: number;
  pageSize?: number;
  employeeId?: number;
}) {
  return useQuery({
    queryKey: ['hr-advances', params],
    queryFn: async () => {
      const result = await hrAdvanceApi.getAll(params);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
  });
}

export function useHrAdvancesByEmployee(employeeId: number | null) {
  return useQuery({
    queryKey: ['hr-advances-employee', employeeId],
    queryFn: async () => {
      const result = await hrAdvanceApi.getByEmployee(employeeId!);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    enabled: employeeId !== null && employeeId > 0,
  });
}

export function useCreateHrAdvance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateAdvanceRequest) => {
      const result = await hrAdvanceApi.create(data);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      toast.success('Advance created successfully');
      queryClient.invalidateQueries({ queryKey: ['hr-advances'] });
      queryClient.invalidateQueries({ queryKey: ['hr-advances-employee'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create advance');
    },
  });
}

export function useDeleteHrAdvance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const result = await hrAdvanceApi.delete(id);
      if (result.error) throw new Error(result.error);
    },
    onSuccess: () => {
      toast.success('Advance deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['hr-advances'] });
      queryClient.invalidateQueries({ queryKey: ['hr-advances-employee'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete advance');
    },
  });
}
