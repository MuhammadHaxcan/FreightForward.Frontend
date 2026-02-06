import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { generalDocumentApi, CreateGeneralDocumentRequest } from '@/services/api';
import { toast } from 'sonner';

export function useGeneralDocuments(params?: { pageNumber?: number; pageSize?: number; searchTerm?: string }) {
  return useQuery({
    queryKey: ['generalDocuments', params],
    queryFn: async () => {
      const response = await generalDocumentApi.getAll(params);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data!;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateGeneralDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateGeneralDocumentRequest) => {
      const response = await generalDocumentApi.create(data);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generalDocuments'] });
      toast.success('Document created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create document');
    },
  });
}

export function useDeleteGeneralDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await generalDocumentApi.delete(id);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generalDocuments'] });
      toast.success('Document deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete document');
    },
  });
}
