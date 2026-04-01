import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shipmentApi, UpsertShipmentCustomsRequest } from '@/services/api';
import { toast } from 'sonner';

export function useShipmentCustoms(shipmentId: number) {
  return useQuery({
    queryKey: ['shipment-customs', shipmentId],
    queryFn: async () => {
      const response = await shipmentApi.getCustoms(shipmentId);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data ?? null;
    },
    enabled: shipmentId > 0,
    staleTime: 30 * 1000,
  });
}

export function useUpsertShipmentCustoms(shipmentId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpsertShipmentCustomsRequest) => {
      const response = await shipmentApi.upsertCustoms(shipmentId, data);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipment-customs', shipmentId] });
      toast.success('Customs details saved successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save customs details');
    },
  });
}
