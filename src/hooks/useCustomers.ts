import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerApi, CreateCustomerRequest, UpdateCustomerRequest, MasterType, CustomerApprovalStatus } from '@/services/api';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';

export function useCustomers(params?: {
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  masterType?: MasterType;
  categoryId?: number;
  approvalStatus?: CustomerApprovalStatus;
  enabled?: boolean;
}) {
  const { enabled = true, ...queryParams } = params ?? {};
  return useQuery({
    queryKey: ['customers', queryParams],
    queryFn: async () => {
      const response = await customerApi.getAll(queryParams);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data!;
    },
    staleTime: 30 * 1000, // 30 seconds
    enabled,
  });
}

export function useCustomer(id: number) {
  return useQuery({
    queryKey: ['customers', id],
    queryFn: async () => {
      const response = await customerApi.getById(id);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data!;
    },
    enabled: id > 0,
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCustomerRequest) => {
      const response = await customerApi.create(data);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer created and sent for approval');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create customer');
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateCustomerRequest }) => {
      const response = await customerApi.update(id, data);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update customer');
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await customerApi.delete(id);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete customer');
    },
  });
}

// Customer-scoped sub-resource hooks (used by CustomerDetail tabs).
// All keys start with ['customers', ...] so invalidateQueries(['customers']) auto-refreshes them.

export function useCustomerInvoices(
  customerId: number,
  params?: { pageNumber?: number; pageSize?: number; enabled?: boolean }
) {
  const { enabled = true, ...queryParams } = params ?? {};
  return useQuery({
    queryKey: ['customers', customerId, 'invoices', queryParams],
    queryFn: async () => {
      const response = await customerApi.getInvoices(customerId, queryParams);
      if (response.error) throw new Error(response.error);
      return response.data!;
    },
    enabled: customerId > 0 && enabled,
  });
}

export function useCustomerReceipts(
  customerId: number,
  params?: { pageNumber?: number; pageSize?: number; enabled?: boolean }
) {
  const { enabled = true, ...queryParams } = params ?? {};
  return useQuery({
    queryKey: ['customers', customerId, 'receipts', queryParams],
    queryFn: async () => {
      const response = await customerApi.getReceipts(customerId, queryParams);
      if (response.error) throw new Error(response.error);
      return response.data!;
    },
    enabled: customerId > 0 && enabled,
  });
}

export function useCustomerCreditNotes(
  customerId: number,
  params?: { pageNumber?: number; pageSize?: number; enabled?: boolean }
) {
  const { enabled = true, ...queryParams } = params ?? {};
  return useQuery({
    queryKey: ['customers', customerId, 'creditNotes', queryParams],
    queryFn: async () => {
      const response = await customerApi.getCreditNotes(customerId, queryParams);
      if (response.error) throw new Error(response.error);
      return response.data!;
    },
    enabled: customerId > 0 && enabled,
  });
}

export function useCustomerAccountReceivables(
  customerId: number,
  params?: {
    pageNumber?: number;
    pageSize?: number;
    fromDate?: string;
    toDate?: string;
    enabled?: boolean;
  }
) {
  const { enabled = true, ...queryParams } = params ?? {};
  return useQuery({
    queryKey: ['customers', customerId, 'accountReceivables', queryParams],
    queryFn: async () => {
      const response = await customerApi.getAccountReceivables(customerId, queryParams);
      if (response.error) throw new Error(response.error);
      return response.data!;
    },
    enabled: customerId > 0 && enabled,
  });
}

export function useCustomerAccountPayables(
  customerId: number,
  params?: { pageNumber?: number; pageSize?: number; enabled?: boolean }
) {
  const { enabled = true, ...queryParams } = params ?? {};
  return useQuery({
    queryKey: ['customers', customerId, 'accountPayables', queryParams],
    queryFn: async () => {
      const response = await customerApi.getAccountPayables(customerId, queryParams);
      if (response.error) throw new Error(response.error);
      return response.data!;
    },
    enabled: customerId > 0 && enabled,
  });
}

export function useCustomerStatement(
  customerId: number,
  fromDate: string,
  toDate: string,
  options?: { enabled?: boolean }
) {
  const enabled = options?.enabled ?? true;
  return useQuery({
    queryKey: ['customers', customerId, 'statement', fromDate, toDate],
    queryFn: async () => {
      const response = await customerApi.getStatement(customerId, fromDate, toDate);
      if (response.error) throw new Error(response.error);
      return response.data!;
    },
    enabled: customerId > 0 && !!fromDate && !!toDate && enabled,
  });
}

// Get all creditors (customers with Creditors master type) for Company Name dropdown
export function useAllCreditors() {
  return useQuery({
    queryKey: ['customers', 'creditors'],
    queryFn: async () => {
      const response = await customerApi.getAll({ pageSize: 1000, masterType: 'Creditors' });
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data!.items;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - dropdown data changes less frequently
  });
}

// Get all debtors (customers with Debtors master type) for Company Name dropdown
export function useAllDebtors() {
  return useQuery({
    queryKey: ['customers', 'debtors'],
    queryFn: async () => {
      const response = await customerApi.getAll({ pageSize: 1000, masterType: 'Debtors' });
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data!.items;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - dropdown data changes less frequently
  });
}

// Check for similar customer names (debounced)
export function useSimilarCustomerCheck(name: string, excludeId?: number) {
  const [debouncedName, setDebouncedName] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedName(name), 500);
    return () => clearTimeout(timer);
  }, [name]);

  return useQuery({
    queryKey: ['customers', 'similar', debouncedName, excludeId],
    queryFn: async () => {
      const response = await customerApi.checkSimilarNames(debouncedName, excludeId);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data!;
    },
    enabled: debouncedName.trim().length >= 3,
    staleTime: 60 * 1000,
    retry: false,
  });
}

export function useApproveCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await customerApi.approve(id);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer approved successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to approve customer');
    },
  });
}

export function useDenyCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await customerApi.deny(id);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer denied successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to deny customer');
    },
  });
}

// Get all customers (any type) for dropdowns
export function useAllCustomers() {
  return useQuery({
    queryKey: ['customers', 'all'],
    queryFn: async () => {
      const response = await customerApi.getAll({ pageSize: 500 });
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data!.items;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - dropdown data changes less frequently
  });
}
