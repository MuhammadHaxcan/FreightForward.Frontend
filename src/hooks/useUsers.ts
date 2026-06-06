import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi, rolesApi } from '@/services/api/auth';
import { hrEmployeeApi } from '@/services/api/hr';
import { toast } from 'sonner';
import type { CreateUserRequest, UpdateUserRequest } from '@/types/auth';

export function useUsers(params: {
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  isActive?: boolean;
}) {
  return useQuery({
    queryKey: ['users', params],
    queryFn: async () => {
      const result = await usersApi.getAll(params);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
  });
}

export function useUserById(id: number | null) {
  return useQuery({
    queryKey: ['users', id],
    queryFn: async () => {
      const result = await usersApi.getById(id!);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    enabled: id !== null && id > 0,
  });
}

export function useAllRolesList() {
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

export function useUnlinkedEmployees(enabled = true) {
  return useQuery({
    queryKey: ['unlinked-employees'],
    queryFn: async () => {
      const result = await hrEmployeeApi.getUnlinkedDropdown();
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    enabled,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateUserRequest) => {
      const result = await usersApi.create(data);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      toast.success('User created successfully');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['unlinked-employees'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create user');
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateUserRequest }) => {
      const result = await usersApi.update(id, data);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      toast.success('User updated successfully');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['unlinked-employees'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update user');
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const result = await usersApi.delete(id);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      toast.success('User deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['unlinked-employees'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete user');
    },
  });
}
