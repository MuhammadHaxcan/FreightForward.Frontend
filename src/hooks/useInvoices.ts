import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  invoiceApi,
  CreateInvoiceRequest,
  CreatePurchaseInvoiceRequest,
  UpdateInvoiceRequest,
  UpdatePurchaseInvoiceRequest,
  AccountInvoice,
  AccountInvoiceDetail,
  AccountPurchaseInvoice,
  AccountPurchaseInvoiceDetail,
  AccountReceivableSummaryResult,
  AccountPayableSummaryResult,
  VatReportResult,
  PaginatedList,
} from '@/services/api';
import { toast } from 'sonner';

// Invoice Query Hooks
export interface InvoiceQueryParams {
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  customerId?: number;
  fromDate?: string;
  toDate?: string;
}

export function useInvoices(params: InvoiceQueryParams) {
  return useQuery<PaginatedList<AccountInvoice>>({
    queryKey: ['invoices', params],
    queryFn: async () => {
      const response = await invoiceApi.getAll(params);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data!;
    },
  });
}

export function useInvoice(id: number | undefined) {
  return useQuery<AccountInvoiceDetail>({
    queryKey: ['invoices', id],
    queryFn: async () => {
      if (!id) throw new Error('Invoice ID is required');
      const response = await invoiceApi.getById(id);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data!;
    },
    enabled: !!id,
  });
}

export function useInvoiceByIdentifier(identifier: string | undefined) {
  return useQuery<AccountInvoiceDetail>({
    queryKey: ['invoices', identifier],
    queryFn: async () => {
      if (!identifier) throw new Error('Invoice identifier is required');
      const response = await invoiceApi.getByIdentifier(identifier);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data!;
    },
    enabled: !!identifier,
  });
}

// Account Receivable summary — keyed under ['invoices', ...] so invoice/receipt/credit-note
// mutations auto-refresh it.
export interface AccountReceivableSummaryParams {
  pageNumber?: number;
  pageSize?: number;
  customerId?: number;
  fromDate?: string;
  toDate?: string;
  searchTerm?: string;
}

export function useAccountReceivableSummary(params: AccountReceivableSummaryParams) {
  return useQuery<AccountReceivableSummaryResult>({
    queryKey: ['invoices', 'accountReceivableSummary', params],
    queryFn: async () => {
      const response = await invoiceApi.getAccountReceivableSummary(params);
      if (response.error) throw new Error(response.error);
      return response.data!;
    },
  });
}

// Account Payable summary — keyed under ['purchaseInvoices', ...] so purchase-invoice /
// payment-voucher mutations auto-refresh it.
export interface AccountPayableSummaryParams {
  pageNumber?: number;
  pageSize?: number;
  vendorId?: number;
  fromDate?: string;
  toDate?: string;
  searchTerm?: string;
}

export function useAccountPayableSummary(params: AccountPayableSummaryParams) {
  return useQuery<AccountPayableSummaryResult>({
    queryKey: ['purchaseInvoices', 'accountPayableSummary', params],
    queryFn: async () => {
      const response = await invoiceApi.getAccountPayableSummary(params);
      if (response.error) throw new Error(response.error);
      return response.data!;
    },
  });
}

// VAT Output report — keyed under ['invoices', ...] so invoice mutations auto-refresh it.
export interface VatReportQueryParams {
  pageNumber?: number;
  pageSize?: number;
  customerId?: number;
  fromDate?: string;
  toDate?: string;
  searchTerm?: string;
  enabled?: boolean;
}

export function useVatReport(params: VatReportQueryParams) {
  const { enabled = true, ...queryParams } = params;
  return useQuery<VatReportResult>({
    queryKey: ['invoices', 'vatReport', queryParams],
    queryFn: async () => {
      const response = await invoiceApi.getVatReport(queryParams);
      if (response.error) throw new Error(response.error);
      return response.data!;
    },
    enabled,
  });
}

// VAT Input report — keyed under ['purchaseInvoices', ...] so purchase-invoice mutations auto-refresh it.
export interface VatInputReportQueryParams {
  pageNumber?: number;
  pageSize?: number;
  vendorId?: number;
  fromDate?: string;
  toDate?: string;
  searchTerm?: string;
  enabled?: boolean;
}

export function useVatInputReport(params: VatInputReportQueryParams) {
  const { enabled = true, ...queryParams } = params;
  return useQuery<VatReportResult>({
    queryKey: ['purchaseInvoices', 'vatInputReport', queryParams],
    queryFn: async () => {
      const response = await invoiceApi.getVatInputReport(queryParams);
      if (response.error) throw new Error(response.error);
      return response.data!;
    },
    enabled,
  });
}

export function usePurchaseInvoiceByIdentifier(identifier: string | undefined) {
  return useQuery<AccountPurchaseInvoiceDetail>({
    queryKey: ['purchaseInvoice', identifier],
    queryFn: async () => {
      if (!identifier) throw new Error('Purchase invoice identifier is required');
      const response = await invoiceApi.getPurchaseInvoiceByIdentifier(identifier);
      if (response.error) throw new Error(response.error);
      return response.data!;
    },
    enabled: !!identifier,
  });
}

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
      queryClient.invalidateQueries({ queryKey: ['shipment-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['creditNotes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
      queryClient.invalidateQueries({ queryKey: ['purchaseInvoices'] });
      queryClient.invalidateQueries({ queryKey: ['shipment-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
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

export function useUpdateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateInvoiceRequest }) => {
      const response = await invoiceApi.updateInvoice(id, data);
      if (response.error) {
        throw new Error(response.error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['shipment-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['creditNotes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Invoice updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update invoice');
    },
  });
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await invoiceApi.deleteInvoice(id);
      if (response.error) {
        throw new Error(response.error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['shipment-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['creditNotes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Invoice deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete invoice');
    },
  });
}

export function useUpdatePurchaseInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdatePurchaseInvoiceRequest }) => {
      const response = await invoiceApi.updatePurchaseInvoice(id, data);
      if (response.error) {
        throw new Error(response.error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
      queryClient.invalidateQueries({ queryKey: ['purchaseInvoices'] });
      queryClient.invalidateQueries({ queryKey: ['purchaseInvoice'] });
      queryClient.invalidateQueries({ queryKey: ['shipment-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Purchase invoice updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update purchase invoice');
    },
  });
}

export function useDeletePurchaseInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await invoiceApi.deletePurchaseInvoice(id);
      if (response.error) {
        throw new Error(response.error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
      queryClient.invalidateQueries({ queryKey: ['purchaseInvoices'] });
      queryClient.invalidateQueries({ queryKey: ['purchaseInvoice'] });
      queryClient.invalidateQueries({ queryKey: ['shipment-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Purchase invoice deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete purchase invoice');
    },
  });
}
