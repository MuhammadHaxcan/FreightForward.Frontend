import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  receiptApi,
  type CreateReceiptRequest,
  type UpdateReceiptRequest,
} from '@/services/api';

function invalidateReceiptRelated(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['receipts'] });
  queryClient.invalidateQueries({ queryKey: ['nextReceiptNumber'] });
  queryClient.invalidateQueries({ queryKey: ['unpaidInvoices'] });
  queryClient.invalidateQueries({ queryKey: ['customers'] });
  queryClient.invalidateQueries({ queryKey: ['invoices'] });
  queryClient.invalidateQueries({ queryKey: ['shipments'] });
  queryClient.invalidateQueries({ queryKey: ['shipment-invoices'] });
  queryClient.invalidateQueries({ queryKey: ['creditNotes'] });
  queryClient.invalidateQueries({ queryKey: ['post-dated-cheques'] });
  queryClient.invalidateQueries({ queryKey: ['dashboard'] });
}

export function useReceipts(params: {
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  customerId?: number;
}) {
  return useQuery({
    queryKey: ['receipts', params],
    queryFn: async () => {
      const response = await receiptApi.getAll(params);
      if (response.error) throw new Error(response.error);
      return response.data;
    },
  });
}

export function useReceipt(id: number | null) {
  return useQuery({
    queryKey: ['receipt', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await receiptApi.getById(id);
      if (response.error) throw new Error(response.error);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useReceiptByIdentifier(identifier: string | null) {
  return useQuery({
    queryKey: ['receipt', identifier],
    queryFn: async () => {
      if (!identifier) return null;
      const response = await receiptApi.getByIdentifier(identifier);
      if (response.error) throw new Error(response.error);
      return response.data;
    },
    enabled: !!identifier,
  });
}

export function useNextReceiptNumber() {
  return useQuery({
    queryKey: ['nextReceiptNumber'],
    queryFn: async () => {
      const response = await receiptApi.getNextNumber();
      if (response.error) throw new Error(response.error);
      return response.data;
    },
  });
}

export function useUnpaidInvoicesForCustomer(customerId: number | null) {
  return useQuery({
    queryKey: ['unpaidInvoices', customerId],
    queryFn: async () => {
      if (!customerId) return [];
      const response = await receiptApi.getUnpaidInvoices(customerId);
      if (response.error) throw new Error(response.error);
      return response.data ?? [];
    },
    enabled: !!customerId,
  });
}

export function useReceiptPaymentTypes() {
  return useQuery({
    queryKey: ['receiptPaymentTypes'],
    queryFn: async () => {
      const response = await receiptApi.getPaymentTypes();
      if (response.error) throw new Error(response.error);
      return response.data;
    },
  });
}

export function useCreateReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: CreateReceiptRequest) => {
      const response = await receiptApi.create(request);
      if (response.error) throw new Error(response.error);
      return response.data;
    },
    onSuccess: () => {
      invalidateReceiptRelated(queryClient);
      toast.success('Receipt recorded successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to record receipt');
    },
  });
}

export function useUpdateReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, request }: { id: number; request: UpdateReceiptRequest }) => {
      const response = await receiptApi.update(id, request);
      if (response.error) throw new Error(response.error);
      return response.data;
    },
    onSuccess: () => {
      invalidateReceiptRelated(queryClient);
      queryClient.invalidateQueries({ queryKey: ['receipt'] });
      toast.success('Receipt updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update receipt');
    },
  });
}

export function useDeleteReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await receiptApi.delete(id);
      if (response.error) throw new Error(response.error);
      return response.data;
    },
    onSuccess: () => {
      invalidateReceiptRelated(queryClient);
      queryClient.invalidateQueries({ queryKey: ['receipt'] });
      toast.success('Receipt deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete receipt');
    },
  });
}
