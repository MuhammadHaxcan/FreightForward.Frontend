import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rolesApi, permissionsApi } from '@/services/api/auth';
import { toast } from 'sonner';
import type { CreateRoleRequest, UpdateRoleRequest } from '@/types/auth';

export function useRoles(params: {
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
}) {
  return useQuery({
    queryKey: ['roles', params],
    queryFn: async () => {
      const result = await rolesApi.getAll(params);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
  });
}

export function useAllRoles() {
  return useQuery({
    queryKey: ['roles-list'],
    queryFn: async () => {
      const result = await rolesApi.getAllList();
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useRole(id: number | null) {
  return useQuery({
    queryKey: ['roles', id],
    queryFn: async () => {
      const result = await rolesApi.getById(id!);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    enabled: id !== null && id > 0,
  });
}

export function usePermissionsGrouped() {
  return useQuery({
    queryKey: ['permissions', 'grouped'],
    queryFn: async () => {
      const result = await permissionsApi.getGrouped();
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateRoleRequest) => {
      const result = await rolesApi.create(data);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    onSuccess: () => {
      toast.success('Role created successfully');
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['roles-list'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create role');
    },
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateRoleRequest }) => {
      const result = await rolesApi.update(id, data);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      toast.success('Role updated successfully');
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['roles-list'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update role');
    },
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const result = await rolesApi.delete(id);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      toast.success('Role deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['roles-list'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete role');
    },
  });
}
