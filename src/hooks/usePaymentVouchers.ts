import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getPaymentVouchers,
  getPaymentVoucherById,
  getNextPaymentNumber,
  getUnpaidPurchaseInvoices,
  getPaymentVoucherPaymentTypes,
  createPaymentVoucher,
  deletePaymentVoucher,
  CreatePaymentVoucherRequest,
} from '@/services/api/payment';

export function usePaymentVouchers(params: {
  pageNumber?: number;
  pageSize?: number;
  vendorId?: number;
  searchTerm?: string;
}) {
  return useQuery({
    queryKey: ['paymentVouchers', params],
    queryFn: async () => {
      const response = await getPaymentVouchers(params);
      if (response.error) throw new Error(response.error);
      return response.data;
    },
  });
}

export function usePaymentVoucher(id: number | null) {
  return useQuery({
    queryKey: ['paymentVoucher', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await getPaymentVoucherById(id);
      if (response.error) throw new Error(response.error);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useNextPaymentNumber() {
  return useQuery({
    queryKey: ['nextPaymentNumber'],
    queryFn: async () => {
      const response = await getNextPaymentNumber();
      if (response.error) throw new Error(response.error);
      return response.data;
    },
  });
}

export function useUnpaidPurchaseInvoices(vendorId: number | null) {
  return useQuery({
    queryKey: ['unpaidPurchaseInvoices', vendorId],
    queryFn: async () => {
      if (!vendorId) return [];
      const response = await getUnpaidPurchaseInvoices(vendorId);
      if (response.error) throw new Error(response.error);
      return response.data;
    },
    enabled: !!vendorId,
  });
}

export function usePaymentVoucherPaymentTypes() {
  return useQuery({
    queryKey: ['paymentVoucherPaymentTypes'],
    queryFn: async () => {
      const response = await getPaymentVoucherPaymentTypes();
      if (response.error) throw new Error(response.error);
      return response.data;
    },
  });
}

export function useCreatePaymentVoucher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: CreatePaymentVoucherRequest) => {
      const response = await createPaymentVoucher(request);
      if (response.error) throw new Error(response.error);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentVouchers'] });
      queryClient.invalidateQueries({ queryKey: ['nextPaymentNumber'] });
      queryClient.invalidateQueries({ queryKey: ['unpaidPurchaseInvoices'] });
      toast.success('Payment voucher created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create payment voucher');
    },
  });
}

export function useDeletePaymentVoucher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await deletePaymentVoucher(id);
      if (response.error) throw new Error(response.error);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentVouchers'] });
      queryClient.invalidateQueries({ queryKey: ['unpaidPurchaseInvoices'] });
      toast.success('Payment voucher deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete payment voucher');
    },
  });
}
