import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  settingsApi,
  CreateCurrencyTypeRequest,
  UpdateCurrencyTypeRequest,
  CreatePortRequest,
  UpdatePortRequest,
  CreateChargeItemRequest,
  UpdateChargeItemRequest,
  CreateExpenseTypeRequest,
  UpdateExpenseTypeRequest,
  PaymentType,
} from '@/services/api';
import { toast } from 'sonner';

// Currency Types Hooks
export function useCurrencyTypes(params?: {
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
}) {
  return useQuery({
    queryKey: ['currencyTypes', params],
    queryFn: async () => {
      const response = await settingsApi.getCurrencyTypes(params);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data!;
    },
  });
}

export function useCreateCurrencyType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCurrencyTypeRequest) => {
      const response = await settingsApi.createCurrencyType(data);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currencyTypes'] });
      toast.success('Currency type created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create currency type');
    },
  });
}

export function useUpdateCurrencyType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateCurrencyTypeRequest }) => {
      const response = await settingsApi.updateCurrencyType(id, data);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currencyTypes'] });
      toast.success('Currency type updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update currency type');
    },
  });
}

export function useDeleteCurrencyType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await settingsApi.deleteCurrencyType(id);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currencyTypes'] });
      toast.success('Currency type deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete currency type');
    },
  });
}

// Ports Hooks
export function usePorts(params?: {
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
}) {
  return useQuery({
    queryKey: ['ports', params],
    queryFn: async () => {
      const response = await settingsApi.getPorts(params);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data!;
    },
  });
}

export function useCreatePort() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePortRequest) => {
      const response = await settingsApi.createPort(data);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ports'] });
      toast.success('Port created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create port');
    },
  });
}

export function useUpdatePort() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdatePortRequest }) => {
      const response = await settingsApi.updatePort(id, data);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ports'] });
      toast.success('Port updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update port');
    },
  });
}

export function useDeletePort() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await settingsApi.deletePort(id);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ports'] });
      toast.success('Port deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete port');
    },
  });
}

// Charge Items Hooks
export function useChargeItems(params?: {
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
}) {
  return useQuery({
    queryKey: ['chargeItems', params],
    queryFn: async () => {
      const response = await settingsApi.getChargeItems(params);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data!;
    },
  });
}

export function useCreateChargeItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateChargeItemRequest) => {
      const response = await settingsApi.createChargeItem(data);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chargeItems'] });
      toast.success('Charge item created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create charge item');
    },
  });
}

export function useUpdateChargeItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateChargeItemRequest }) => {
      const response = await settingsApi.updateChargeItem(id, data);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chargeItems'] });
      toast.success('Charge item updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update charge item');
    },
  });
}

export function useDeleteChargeItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await settingsApi.deleteChargeItem(id);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chargeItems'] });
      toast.success('Charge item deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete charge item');
    },
  });
}

// Expense Types Hooks
export function useExpenseTypes(params?: {
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  paymentDirection?: PaymentType;
}) {
  return useQuery({
    queryKey: ['expenseTypes', params],
    queryFn: async () => {
      const response = await settingsApi.getExpenseTypes(params);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data!;
    },
  });
}

export function useAllExpenseTypes() {
  return useQuery({
    queryKey: ['expenseTypes', 'all'],
    queryFn: async () => {
      const response = await settingsApi.getAllExpenseTypes();
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data!;
    },
  });
}

export function useExpenseTypesByDirection(paymentDirection: 'Inwards' | 'Outwards' | null) {
  return useQuery({
    queryKey: ['expenseTypes', 'byDirection', paymentDirection],
    queryFn: async () => {
      if (!paymentDirection) return [];
      const response = await settingsApi.getExpenseTypesByDirection(paymentDirection);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data!;
    },
    enabled: !!paymentDirection,
  });
}

export function useCreateExpenseType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateExpenseTypeRequest) => {
      const response = await settingsApi.createExpenseType(data);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenseTypes'] });
      toast.success('Expense type created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create expense type');
    },
  });
}

export function useUpdateExpenseType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateExpenseTypeRequest }) => {
      const response = await settingsApi.updateExpenseType(id, data);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenseTypes'] });
      toast.success('Expense type updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update expense type');
    },
  });
}

export function useDeleteExpenseType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await settingsApi.deleteExpenseType(id);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenseTypes'] });
      toast.success('Expense type deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete expense type');
    },
  });
}

// Countries Hooks
export function useAllCountries() {
  return useQuery({
    queryKey: ['countries', 'all'],
    queryFn: async () => {
      const response = await settingsApi.getAllCountries();
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data!;
    },
  });
}

// All Ports Hooks
export function useAllPorts() {
  return useQuery({
    queryKey: ['ports', 'all'],
    queryFn: async () => {
      const response = await settingsApi.getAllPorts();
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data!;
    },
  });
}

// IncoTerms Hooks
export function useAllIncoTerms() {
  return useQuery({
    queryKey: ['incoTerms', 'all'],
    queryFn: async () => {
      const response = await settingsApi.getAllIncoTerms();
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data!;
    },
  });
}

// Container Types Hooks
export function useAllContainerTypes() {
  return useQuery({
    queryKey: ['containerTypes', 'all'],
    queryFn: async () => {
      const response = await settingsApi.getAllContainerTypes();
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data!;
    },
  });
}

// Package Types Hooks
export function useAllPackageTypes() {
  return useQuery({
    queryKey: ['packageTypes', 'all'],
    queryFn: async () => {
      const response = await settingsApi.getAllPackageTypes();
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data!;
    },
  });
}

// Customer Category Types Hooks
export function useAllCustomerCategoryTypes() {
  return useQuery({
    queryKey: ['customerCategoryTypes', 'all'],
    queryFn: async () => {
      const response = await settingsApi.getAllCustomerCategoryTypes();
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data!;
    },
  });
}

// All Currency Types Hooks
export function useAllCurrencyTypes() {
  return useQuery({
    queryKey: ['currencyTypes', 'all'],
    queryFn: async () => {
      const response = await settingsApi.getAllCurrencyTypes();
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data!;
    },
  });
}

// All Charge Items Hooks
export function useAllChargeItems() {
  return useQuery({
    queryKey: ['chargeItems', 'all'],
    queryFn: async () => {
      const response = await settingsApi.getChargeItems({ pageSize: 1000 });
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data!.items;
    },
  });
}
