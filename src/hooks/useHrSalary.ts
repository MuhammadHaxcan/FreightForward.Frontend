import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  hrSalaryApi,
  type CreateSalaryComponentRequest,
  type UpdateSalaryComponentRequest,
  type SetSalaryStructureRequest,
} from '@/services/api/hr';
import { toast } from 'sonner';

export function useHrSalaryComponents(params?: {
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
}) {
  return useQuery({
    queryKey: ['hr-salary-components', params],
    queryFn: async () => {
      const result = await hrSalaryApi.getComponents(params);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
  });
}

export function useHrActiveSalaryComponents() {
  return useQuery({
    queryKey: ['hr-salary-components-active'],
    queryFn: async () => {
      const result = await hrSalaryApi.getActiveComponents();
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useHrSalaryStructure(employeeId: number | null) {
  return useQuery({
    queryKey: ['hr-salary-structure', employeeId],
    queryFn: async () => {
      const result = await hrSalaryApi.getStructure(employeeId!);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    enabled: employeeId !== null && employeeId > 0,
  });
}

export function useCreateHrSalaryComponent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateSalaryComponentRequest) => {
      const result = await hrSalaryApi.createComponent(data);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      toast.success('Salary component created successfully');
      queryClient.invalidateQueries({ queryKey: ['hr-salary-components'] });
      queryClient.invalidateQueries({ queryKey: ['hr-salary-components-active'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create salary component');
    },
  });
}

export function useUpdateHrSalaryComponent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateSalaryComponentRequest }) => {
      const result = await hrSalaryApi.updateComponent(id, data);
      if (result.error) throw new Error(result.error);
    },
    onSuccess: () => {
      toast.success('Salary component updated successfully');
      queryClient.invalidateQueries({ queryKey: ['hr-salary-components'] });
      queryClient.invalidateQueries({ queryKey: ['hr-salary-components-active'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update salary component');
    },
  });
}

export function useDeleteHrSalaryComponent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const result = await hrSalaryApi.deleteComponent(id);
      if (result.error) throw new Error(result.error);
    },
    onSuccess: () => {
      toast.success('Salary component deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['hr-salary-components'] });
      queryClient.invalidateQueries({ queryKey: ['hr-salary-components-active'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete salary component');
    },
  });
}

export function useSetHrSalaryStructure() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ employeeId, data }: { employeeId: number; data: SetSalaryStructureRequest }) => {
      const result = await hrSalaryApi.setStructure(employeeId, data);
      if (result.error) throw new Error(result.error);
    },
    onSuccess: (_, { employeeId }) => {
      toast.success('Salary structure saved successfully');
      queryClient.invalidateQueries({ queryKey: ['hr-salary-structure', employeeId] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save salary structure');
    },
  });
}
