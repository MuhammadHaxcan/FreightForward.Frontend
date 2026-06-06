import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  hrAttendanceApi,
  hrAttendancePolicyApi,
  type CreateAttendanceRequest,
  type UpdateAttendanceRequest,
  type BulkAttendanceRequest,
  type UpdateAttendancePolicyRequest,
} from '@/services/api/hr';
import { toast } from 'sonner';

export function useHrAttendance(params?: {
  pageNumber?: number;
  pageSize?: number;
  date?: string;
  employeeId?: number;
}) {
  return useQuery({
    queryKey: ['hr-attendance', params],
    queryFn: async () => {
      const result = await hrAttendanceApi.getAll(params);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
  });
}

export function useHrDailyAttendance(date: string | null) {
  return useQuery({
    queryKey: ['hr-attendance-daily', date],
    queryFn: async () => {
      const result = await hrAttendanceApi.getDaily(date!);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    enabled: !!date,
  });
}

export function useHrAttendanceSummary(year: number | null, month: number | null) {
  return useQuery({
    queryKey: ['hr-attendance-summary', year, month],
    queryFn: async () => {
      const result = await hrAttendanceApi.getSummary(year!, month!);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    enabled: year !== null && month !== null,
  });
}

export function useHrEmployeeMonthlyAttendance(
  employeeId: number | null,
  year: number | null,
  month: number | null,
) {
  return useQuery({
    queryKey: ['hr-attendance-employee-monthly', employeeId, year, month],
    queryFn: async () => {
      const result = await hrAttendanceApi.getEmployeeMonthly(employeeId!, year!, month!);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    enabled: employeeId !== null && year !== null && month !== null,
  });
}

export function useCreateHrAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateAttendanceRequest) => {
      const result = await hrAttendanceApi.create(data);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      toast.success('Attendance record created');
      queryClient.invalidateQueries({ queryKey: ['hr-attendance'] });
      queryClient.invalidateQueries({ queryKey: ['hr-attendance-daily'] });
      queryClient.invalidateQueries({ queryKey: ['hr-attendance-summary'] });
      queryClient.invalidateQueries({ queryKey: ['hr-attendance-employee-monthly'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create attendance record');
    },
  });
}

export function useUpdateHrAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateAttendanceRequest }) => {
      const result = await hrAttendanceApi.update(id, data);
      if (result.error) throw new Error(result.error);
    },
    onSuccess: () => {
      toast.success('Attendance record updated');
      queryClient.invalidateQueries({ queryKey: ['hr-attendance'] });
      queryClient.invalidateQueries({ queryKey: ['hr-attendance-daily'] });
      queryClient.invalidateQueries({ queryKey: ['hr-attendance-summary'] });
      queryClient.invalidateQueries({ queryKey: ['hr-attendance-employee-monthly'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update attendance record');
    },
  });
}

export function useSaveBulkHrAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: BulkAttendanceRequest) => {
      const result = await hrAttendanceApi.saveBulk(data);
      if (result.error) throw new Error(result.error);
    },
    onSuccess: () => {
      toast.success('Attendance saved successfully');
      queryClient.invalidateQueries({ queryKey: ['hr-attendance'] });
      queryClient.invalidateQueries({ queryKey: ['hr-attendance-daily'] });
      queryClient.invalidateQueries({ queryKey: ['hr-attendance-summary'] });
      queryClient.invalidateQueries({ queryKey: ['hr-attendance-employee-monthly'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save attendance');
    },
  });
}

export function useHrAttendancePolicy() {
  return useQuery({
    queryKey: ['hr-attendance-policy'],
    queryFn: async () => {
      const result = await hrAttendancePolicyApi.get();
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
  });
}

export function useUpdateHrAttendancePolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: UpdateAttendancePolicyRequest) => {
      const result = await hrAttendancePolicyApi.update(data);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    onSuccess: () => {
      toast.success('Attendance policy updated');
      queryClient.invalidateQueries({ queryKey: ['hr-attendance-policy'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update attendance policy');
    },
  });
}
