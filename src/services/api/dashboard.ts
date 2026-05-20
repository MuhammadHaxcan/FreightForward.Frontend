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

export interface MonthlyPnl {
  month: string;
  year: number;
  revenue: number;
  directCost: number;
  grossProfit: number;
}

export interface BestLane {
  from: string;
  to: string;
  grossProfit: number;
  revenue: number;
  grossMarginPercent: number;
}

export interface TopCustomer {
  name: string;
  revenue: number;
}

export interface DashboardStats {
  inProcess: number;
  completed: number;
  pending: number;
  total: number;
  monthlyShipments: MonthlyShipment[];
  modeDistribution: ShipmentDistribution[];
  directionDistribution: ShipmentDistribution[];

  // Finance KPIs
  revenue: number;
  directCost: number;
  grossProfit: number;
  grossMarginPercent: number;
  operatingExpenses: number;
  netProfit: number;
  netMarginPercent: number;
  openAR: number;
  currency: string;

  monthlyPnl: MonthlyPnl[];
  shipmentTypeMix: ShipmentDistribution[];
  bestLane: BestLane | null;
  topCustomer: TopCustomer | null;
  expenseTrendPercent: number;
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
