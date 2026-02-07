import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  shipmentApi,
  CreateShipmentRequest,
  UpdateShipmentRequest,
  AddShipmentPartyRequest,
  AddShipmentContainerRequest,
  UpdateShipmentContainerRequest,
  AddShipmentCostingRequest,
  UpdateShipmentCostingRequest,
  ShipmentStatus,
} from '@/services/api';
import { toast } from 'sonner';

export function useShipments(params?: {
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  status?: ShipmentStatus;
  fromDate?: string;
  toDate?: string;
}) {
  return useQuery({
    queryKey: ['shipments', params],
    queryFn: async () => {
      const response = await shipmentApi.getAll(params);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data!;
    },
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useShipment(id: number) {
  return useQuery({
    queryKey: ['shipments', id],
    queryFn: async () => {
      const response = await shipmentApi.getById(id);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data!;
    },
    enabled: id > 0,
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useCreateShipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateShipmentRequest) => {
      const response = await shipmentApi.create(data);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
      toast.success('Shipment created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create shipment');
    },
  });
}

export function useUpdateShipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateShipmentRequest }) => {
      const response = await shipmentApi.update(id, data);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
      queryClient.invalidateQueries({ queryKey: ['shipments', variables.id] });
      toast.success('Shipment updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update shipment');
    },
  });
}

export function useDeleteShipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await shipmentApi.delete(id);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
      toast.success('Shipment deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete shipment');
    },
  });
}

// Party hooks
export function useAddShipmentParty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ shipmentId, data }: { shipmentId: number; data: AddShipmentPartyRequest }) => {
      const response = await shipmentApi.addParty(shipmentId, data);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data!;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['shipments', variables.shipmentId] });
      toast.success('Party added successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add party');
    },
  });
}

export function useDeleteShipmentParty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ partyId, shipmentId }: { partyId: number; shipmentId: number }) => {
      const response = await shipmentApi.deleteParty(partyId);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['shipments', variables.shipmentId] });
      toast.success('Party removed successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to remove party');
    },
  });
}

// Container hooks
export function useAddShipmentContainer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ shipmentId, data }: { shipmentId: number; data: AddShipmentContainerRequest }) => {
      const response = await shipmentApi.addContainer(shipmentId, data);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data!;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['shipments', variables.shipmentId] });
      toast.success('Container added successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add container');
    },
  });
}

export function useUpdateShipmentContainer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ shipmentId, containerId, data }: { shipmentId: number; containerId: number; data: UpdateShipmentContainerRequest }) => {
      const response = await shipmentApi.updateContainer(shipmentId, containerId, data);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['shipments', variables.shipmentId] });
      toast.success('Container updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update container');
    },
  });
}

export function useDeleteShipmentContainer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ containerId, shipmentId }: { containerId: number; shipmentId: number }) => {
      const response = await shipmentApi.deleteContainer(containerId);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['shipments', variables.shipmentId] });
      toast.success('Container removed successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to remove container');
    },
  });
}

// Costing hooks
export function useAddShipmentCosting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ shipmentId, data }: { shipmentId: number; data: AddShipmentCostingRequest }) => {
      const response = await shipmentApi.addCosting(shipmentId, data);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data!;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['shipments', variables.shipmentId] });
      queryClient.invalidateQueries({ queryKey: ['shipment-invoices', variables.shipmentId] });
      toast.success('Costing added successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add costing');
    },
  });
}

export function useUpdateShipmentCosting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ shipmentId, costingId, data }: { shipmentId: number; costingId: number; data: UpdateShipmentCostingRequest }) => {
      const response = await shipmentApi.updateCosting(shipmentId, costingId, data);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['shipments', variables.shipmentId] });
      queryClient.invalidateQueries({ queryKey: ['shipment-invoices', variables.shipmentId] });
      toast.success('Costing updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update costing');
    },
  });
}

export function useDeleteShipmentCosting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ costingId, shipmentId }: { costingId: number; shipmentId: number }) => {
      const response = await shipmentApi.deleteCosting(costingId);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['shipments', variables.shipmentId] });
      queryClient.invalidateQueries({ queryKey: ['shipment-invoices', variables.shipmentId] });
      toast.success('Costing removed successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to remove costing');
    },
  });
}
