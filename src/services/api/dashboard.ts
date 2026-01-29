import { fetchApi } from './base';

export interface MonthlyShipment {
  month: string;
  year: number;
  shipments: number;
}

export interface ShipmentDistribution {
  name: string;
  value: number;
  color: string;
}

export interface DashboardStats {
  inProcess: number;
  completed: number;
  pending: number;
  total: number;
  monthlyShipments: MonthlyShipment[];
  modeDistribution: ShipmentDistribution[];
  directionDistribution: ShipmentDistribution[];
}

export const dashboardApi = {
  getStats: (params?: { fromDate?: string; toDate?: string }) => {
    const query = new URLSearchParams();
    if (params?.fromDate) query.append('fromDate', params.fromDate);
    if (params?.toDate) query.append('toDate', params.toDate);
    const queryString = query.toString();
    return fetchApi<DashboardStats>(`/dashboard/stats${queryString ? `?${queryString}` : ''}`);
  },
};
