import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { expenseApi, CreateExpenseRequest, UpdateExpenseRequest } from '@/services/api';
import { toast } from 'sonner';

export function useExpenses(params?: {
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
}) {
  return useQuery({
    queryKey: ['expenses', params],
    queryFn: async () => {
      const response = await expenseApi.getExpenses(params);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data!;
    },
  });
}

export function useExpenseById(id: number | null) {
  return useQuery({
    queryKey: ['expenses', id],
    queryFn: async () => {
      if (id === null) return null;
      const response = await expenseApi.getExpenseById(id);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data!;
    },
    enabled: id !== null,
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateExpenseRequest) => {
      const response = await expenseApi.createExpense(data);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Expense created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create expense');
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateExpenseRequest }) => {
      const response = await expenseApi.updateExpense(id, data);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Expense updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update expense');
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await expenseApi.deleteExpense(id);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Expense deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete expense');
    },
  });
}
