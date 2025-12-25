import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bankApi, CreateBankRequest, UpdateBankRequest } from '@/services/api';
import { toast } from 'sonner';

export function useBanks(params?: { pageNumber?: number; pageSize?: number; searchTerm?: string }) {
  return useQuery({
    queryKey: ['banks', params],
    queryFn: async () => {
      const response = await bankApi.getAll(params);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data!;
    },
  });
}

export function useBank(id: number) {
  return useQuery({
    queryKey: ['banks', id],
    queryFn: async () => {
      const response = await bankApi.getById(id);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data!;
    },
    enabled: id > 0,
  });
}

export function useCreateBank() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateBankRequest) => {
      const response = await bankApi.create(data);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banks'] });
      toast.success('Bank created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create bank');
    },
  });
}

export function useUpdateBank() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateBankRequest }) => {
      const response = await bankApi.update(id, data);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banks'] });
      toast.success('Bank updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update bank');
    },
  });
}

export function useDeleteBank() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await bankApi.delete(id);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banks'] });
      toast.success('Bank deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete bank');
    },
  });
}
