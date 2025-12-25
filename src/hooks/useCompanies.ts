import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companyApi, CreateCompanyRequest, UpdateCompanyRequest } from '@/services/api';
import { toast } from 'sonner';

export function useCompanies(params?: { pageNumber?: number; pageSize?: number; searchTerm?: string }) {
  return useQuery({
    queryKey: ['companies', params],
    queryFn: async () => {
      const response = await companyApi.getAll(params);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data!;
    },
  });
}

export function useCompany(id: number) {
  return useQuery({
    queryKey: ['companies', id],
    queryFn: async () => {
      const response = await companyApi.getById(id);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data!;
    },
    enabled: id > 0,
  });
}

export function useCreateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCompanyRequest) => {
      const response = await companyApi.create(data);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Company created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create company');
    },
  });
}

export function useUpdateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateCompanyRequest }) => {
      const response = await companyApi.update(id, data);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Company updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update company');
    },
  });
}

export function useDeleteCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await companyApi.delete(id);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Company deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete company');
    },
  });
}
