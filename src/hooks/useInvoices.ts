import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  invoiceApi,
  CreateInvoiceRequest,
  CreatePurchaseInvoiceRequest,
  AccountPurchaseInvoice,
  AccountPurchaseInvoiceDetail,
  PaginatedList,
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
      queryClient.invalidateQueries({ queryKey: ['purchaseInvoices'] });
      toast.success('Purchase invoice created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create purchase invoice');
    },
  });
}

// Purchase Invoice Query Hooks
export interface PurchaseInvoiceQueryParams {
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  vendorId?: number;
  fromDate?: string;
  toDate?: string;
}

export function usePurchaseInvoices(params: PurchaseInvoiceQueryParams) {
  return useQuery<PaginatedList<AccountPurchaseInvoice>>({
    queryKey: ['purchaseInvoices', params],
    queryFn: async () => {
      const response = await invoiceApi.getAllPurchaseInvoices(params);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data!;
    },
  });
}

export function usePurchaseInvoice(id: number | undefined) {
  return useQuery<AccountPurchaseInvoiceDetail>({
    queryKey: ['purchaseInvoice', id],
    queryFn: async () => {
      if (!id) throw new Error('Invoice ID is required');
      const response = await invoiceApi.getPurchaseInvoiceById(id);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data!;
    },
    enabled: !!id,
  });
}
