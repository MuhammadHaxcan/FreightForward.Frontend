import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { creditNoteApi, CreateAccountCreditNoteRequest, UpdateAccountCreditNoteRequest } from '@/services/api';
import { toast } from 'sonner';

export function useCreditNotes(params?: {
  pageNumber?: number;
  pageSize?: number;
  customerId?: number;
  searchTerm?: string;
}) {
  return useQuery({
    queryKey: ['creditNotes', params],
    queryFn: async () => {
      const response = await creditNoteApi.getAll(params);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data!;
    },
    staleTime: 30000,
  });
}

export function useCreditNote(id: number | undefined) {
  return useQuery({
    queryKey: ['creditNotes', id],
    queryFn: async () => {
      const response = await creditNoteApi.getById(id!);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data!;
    },
    enabled: !!id && id > 0,
  });
}

export function useCreateCreditNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateAccountCreditNoteRequest) => {
      const response = await creditNoteApi.create(data);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creditNotes'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Credit note created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create credit note');
    },
  });
}

export function useUpdateCreditNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateAccountCreditNoteRequest }) => {
      const response = await creditNoteApi.update(id, data);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creditNotes'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Credit note updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update credit note');
    },
  });
}

export function useDeleteCreditNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await creditNoteApi.delete(id);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creditNotes'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Credit note deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete credit note');
    },
  });
}
