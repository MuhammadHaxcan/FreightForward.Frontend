import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  invoiceApi,
  CreateInvoiceRequest,
  CreatePurchaseInvoiceRequest,
} from '@/services/api';
import { toast } from 'sonner';

export function useCreateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateInvoiceRequest) => {
      const response = await invoiceApi.createInvoice(data);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data!;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['shipments', variables.shipmentId] });
      toast.success('Invoice created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create invoice');
    },
  });
}

export function useCreatePurchaseInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePurchaseInvoiceRequest) => {
      const response = await invoiceApi.createPurchaseInvoice(data);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data!;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['shipments', variables.shipmentId] });
      toast.success('Purchase invoice created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create purchase invoice');
    },
  });
}
