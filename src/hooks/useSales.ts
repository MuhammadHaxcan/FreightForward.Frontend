import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  leadApi,
  rateRequestApi,
  quotationApi,
  CreateLeadRequest,
  UpdateLeadRequest,
  CreateRateRequestRequest,
  UpdateRateRequestRequest,
  CreateQuotationRequest,
  UpdateQuotationRequest,
  LeadStatus,
  RateRequestStatus,
  QuotationStatus,
} from '@/services/api';
import { toast } from 'sonner';

// Leads
export function useLeads(params?: {
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  status?: LeadStatus;
}) {
  return useQuery({
    queryKey: ['leads', params],
    queryFn: async () => {
      const response = await leadApi.getAll(params);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data!;
    },
  });
}

export function useLead(id: number) {
  return useQuery({
    queryKey: ['leads', id],
    queryFn: async () => {
      const response = await leadApi.getById(id);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data!;
    },
    enabled: id > 0,
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateLeadRequest) => {
      const response = await leadApi.create(data);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create lead');
    },
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateLeadRequest }) => {
      const response = await leadApi.update(id, data);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update lead');
    },
  });
}

// Rate Requests
export function useRateRequests(params?: {
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  status?: RateRequestStatus;
}) {
  return useQuery({
    queryKey: ['rateRequests', params],
    queryFn: async () => {
      const response = await rateRequestApi.getAll(params);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data!;
    },
  });
}

export function useCreateRateRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateRateRequestRequest) => {
      const response = await rateRequestApi.create(data);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rateRequests'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Rate request created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create rate request');
    },
  });
}

export function useUpdateRateRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateRateRequestRequest }) => {
      const response = await rateRequestApi.update(id, data);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rateRequests'] });
      toast.success('Rate request updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update rate request');
    },
  });
}

// Quotations
export function useQuotations(params?: {
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  status?: QuotationStatus;
}) {
  return useQuery({
    queryKey: ['quotations', params],
    queryFn: async () => {
      const response = await quotationApi.getAll(params);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data!;
    },
  });
}

export function useQuotation(id: number) {
  return useQuery({
    queryKey: ['quotations', id],
    queryFn: async () => {
      const response = await quotationApi.getById(id);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data!;
    },
    enabled: id > 0,
  });
}

export function useCreateQuotation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateQuotationRequest) => {
      const response = await quotationApi.create(data);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      queryClient.invalidateQueries({ queryKey: ['rateRequests'] });
      toast.success('Quotation created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create quotation');
    },
  });
}

export function useUpdateQuotation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateQuotationRequest }) => {
      const response = await quotationApi.update(id, data);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      toast.success('Quotation updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update quotation');
    },
  });
}

// Rate Request for Conversion
export function useRateRequestForConversion(id: number) {
  return useQuery({
    queryKey: ['rateRequests', id, 'forConversion'],
    queryFn: async () => {
      const response = await rateRequestApi.getForConversion(id);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data!;
    },
    enabled: id > 0,
  });
}

// Approve Quotation
export function useApproveQuotation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await quotationApi.approve(id);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data!;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      toast.success(`Quotation approved! Booking No: ${data.bookingNo}`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to approve quotation');
    },
  });
}

// Quotation for Shipment conversion
export function useQuotationForShipment(id: number) {
  return useQuery({
    queryKey: ['quotations', id, 'forShipment'],
    queryFn: async () => {
      const response = await quotationApi.getForShipment(id);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data!;
    },
    enabled: id > 0,
  });
}
