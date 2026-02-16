import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerApi, CreateCustomerRequest, UpdateCustomerRequest, MasterType } from '@/services/api';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';

export function useCustomers(params?: {
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  masterType?: MasterType;
  categoryId?: number;
}) {
  return useQuery({
    queryKey: ['customers', params],
    queryFn: async () => {
      const response = await customerApi.getAll(params);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data!;
    },
    staleTime: 30 * 1000, // 30 seconds
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
      toast.success('Customer created successfully');
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

export function useCustomerInvoices(customerId: number, params?: { pageNumber?: number; pageSize?: number }) {
  return useQuery({
    queryKey: ['customers', customerId, 'invoices', params],
    queryFn: async () => {
      const response = await customerApi.getInvoices(customerId, params);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data!;
    },
    enabled: customerId > 0,
  });
}

export function useCustomerReceipts(customerId: number, params?: { pageNumber?: number; pageSize?: number }) {
  return useQuery({
    queryKey: ['customers', customerId, 'receipts', params],
    queryFn: async () => {
      const response = await customerApi.getReceipts(customerId, params);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data!;
    },
    enabled: customerId > 0,
  });
}

export function useCustomerCreditNotes(customerId: number, params?: { pageNumber?: number; pageSize?: number }) {
  return useQuery({
    queryKey: ['customers', customerId, 'creditNotes', params],
    queryFn: async () => {
      const response = await customerApi.getCreditNotes(customerId, params);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data!;
    },
    enabled: customerId > 0,
  });
}

export function useCustomerAccountReceivables(customerId: number, params?: { pageNumber?: number; pageSize?: number }) {
  return useQuery({
    queryKey: ['customers', customerId, 'accountReceivables', params],
    queryFn: async () => {
      const response = await customerApi.getAccountReceivables(customerId, params);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data!;
    },
    enabled: customerId > 0,
  });
}

// Get all creditors (customers with Creditors master type) for Company Name dropdown
export function useAllCreditors() {
  return useQuery({
    queryKey: ['customers', 'creditors'],
    queryFn: async () => {
      const response = await customerApi.getAll({ pageSize: 500, masterType: 'Creditors' });
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
      const response = await customerApi.getAll({ pageSize: 500, masterType: 'Debtors' });
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
