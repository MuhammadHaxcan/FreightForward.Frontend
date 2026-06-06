import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  hrPayrollApi,
  type UpdatePayrollRequest,
  type UpdatePayrollWithComponentsRequest,
  type MarkPaidRequest,
} from '@/services/api/hr';
import { toast } from 'sonner';

export function useHrPayrolls(params?: {
  pageNumber?: number;
  pageSize?: number;
  year?: number;
  monthFrom?: number;
  monthTo?: number;
  employeeId?: number;
}) {
  return useQuery({
    queryKey: ['hr-payrolls', params],
    queryFn: async () => {
      const result = await hrPayrollApi.getAll(params);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
  });
}

export function useHrPayslip(id: number | null) {
  return useQuery({
    queryKey: ['hr-payslip', id],
    queryFn: async () => {
      const result = await hrPayrollApi.getPayslip(id!);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    enabled: id !== null && id > 0,
  });
}

export function useHrPreGenerateInfo(
  employeeId: number | null,
  year: number | null,
  month: number | null,
) {
  return useQuery({
    queryKey: ['hr-pre-generate-info', employeeId, year, month],
    queryFn: async () => {
      const result = await hrPayrollApi.getPreGenerateInfo(employeeId!, year!, month!);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    enabled: employeeId !== null && year !== null && month !== null,
  });
}

export function useGenerateHrPayroll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      employeeId,
      data,
    }: {
      employeeId: number;
      data: { year: number; month: number; annualLeavesToConsume?: number };
    }) => {
      const result = await hrPayrollApi.generate(employeeId, data);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      toast.success('Payroll generated successfully');
      queryClient.invalidateQueries({ queryKey: ['hr-payrolls'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to generate payroll');
    },
  });
}

export function useUpdateHrPayroll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdatePayrollRequest }) => {
      const result = await hrPayrollApi.update(id, data);
      if (result.error) throw new Error(result.error);
    },
    onSuccess: () => {
      toast.success('Payroll updated successfully');
      queryClient.invalidateQueries({ queryKey: ['hr-payrolls'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update payroll');
    },
  });
}

export function useUpdateHrPayrollWithComponents() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdatePayrollWithComponentsRequest }) => {
      const result = await hrPayrollApi.updateWithComponents(id, data);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    onSuccess: () => {
      toast.success('Payroll updated successfully');
      queryClient.invalidateQueries({ queryKey: ['hr-payrolls'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update payroll');
    },
  });
}

export function useDeleteHrPayroll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const result = await hrPayrollApi.delete(id);
      if (result.error) throw new Error(result.error);
    },
    onSuccess: () => {
      toast.success('Payroll deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['hr-payrolls'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete payroll');
    },
  });
}

export function useMarkHrPayrollPaid() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: MarkPaidRequest }) => {
      const result = await hrPayrollApi.markPaid(id, data);
      if (result.error) throw new Error(result.error);
    },
    onSuccess: () => {
      toast.success('Payroll marked as paid');
      queryClient.invalidateQueries({ queryKey: ['hr-payrolls'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to mark payroll as paid');
    },
  });
}

export function useCancelHrPayroll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const result = await hrPayrollApi.cancel(id);
      if (result.error) throw new Error(result.error);
    },
    onSuccess: () => {
      toast.success('Payroll cancelled');
      queryClient.invalidateQueries({ queryKey: ['hr-payrolls'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to cancel payroll');
    },
  });
}
