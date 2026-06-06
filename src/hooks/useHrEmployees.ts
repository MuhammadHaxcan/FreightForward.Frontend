import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  hrEmployeeApi,
  type CreateEmployeeRequest,
  type UpdateEmployeeRequest,
} from '@/services/api/hr';
import { toast } from 'sonner';

export function useHrEmployees(params?: {
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: ['hr-employees', params],
    queryFn: async () => {
      const result = await hrEmployeeApi.getAll(params);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
  });
}

export function useHrEmployee(id: number | null) {
  return useQuery({
    queryKey: ['hr-employee', id],
    queryFn: async () => {
      const result = await hrEmployeeApi.getById(id!);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    enabled: id !== null && id > 0,
  });
}

export function useHrEmployeeDropdown(enabled = true) {
  return useQuery({
    queryKey: ['hr-employees-dropdown'],
    queryFn: async () => {
      const result = await hrEmployeeApi.getDropdown();
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

export function useHrNextEmployeeCode() {
  return useQuery({
    queryKey: ['hr-next-employee-code'],
    queryFn: async () => {
      const result = await hrEmployeeApi.getNextCode();
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    staleTime: 0,
  });
}

export function useCreateHrEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateEmployeeRequest) => {
      const result = await hrEmployeeApi.create(data);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      toast.success('Employee created successfully');
      queryClient.invalidateQueries({ queryKey: ['hr-employees'] });
      queryClient.invalidateQueries({ queryKey: ['hr-employees-dropdown'] });
      queryClient.invalidateQueries({ queryKey: ['unlinked-employees'] });
      queryClient.invalidateQueries({ queryKey: ['hr-next-employee-code'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create employee');
    },
  });
}

export function useUpdateHrEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateEmployeeRequest }) => {
      const result = await hrEmployeeApi.update(id, data);
      if (result.error) throw new Error(result.error);
    },
    onSuccess: (_, { id }) => {
      toast.success('Employee updated successfully');
      queryClient.invalidateQueries({ queryKey: ['hr-employees'] });
      queryClient.invalidateQueries({ queryKey: ['hr-employee', id] });
      queryClient.invalidateQueries({ queryKey: ['hr-employees-dropdown'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update employee');
    },
  });
}

export function useDeleteHrEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const result = await hrEmployeeApi.delete(id);
      if (result.error) throw new Error(result.error);
    },
    onSuccess: () => {
      toast.success('Employee deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['hr-employees'] });
      queryClient.invalidateQueries({ queryKey: ['hr-employees-dropdown'] });
      queryClient.invalidateQueries({ queryKey: ['unlinked-employees'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete employee');
    },
  });
}
