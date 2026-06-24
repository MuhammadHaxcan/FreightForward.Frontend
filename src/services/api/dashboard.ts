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

export interface SalespersonStat {
  salesperson: string;
  shipmentCount: number;
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
  salespersonStats: SalespersonStat[];
}

export interface ExceptionDashboardParams {
  asOfDate?: string;
  overdueDays?: number;
  customerId?: number;
  salesperson?: string;
  mode?: string;
  direction?: string;
}

export interface ExceptionDashboard {
  asOfDate: string;
  overdueDays: number;
  currency: string;
  kpis: ExceptionDashboardKpis;
  customerCollections: CustomerCollectionException[];
  shipmentExceptions: ShipmentException[];
  overdueInvoices: OverdueCustomerInvoiceException[];
  unbilledJobs: UnbilledJobException[];
  vendorPaymentExceptions: VendorPaymentException[];
  salespeople: string[];
}

export interface ExceptionDashboardKpis {
  overdueAR: number;
  overdueInvoiceCount: number;
  criticalCustomerCount: number;
  overdueShipmentCount: number;
  unbilledJobCount: number;
  vendorPayablesDue: number;
}

export interface CustomerCollectionException {
  customerId: number;
  customerName: string;
  overdueBalanceLCY: number;
  overdueInvoiceCount: number;
  oldestInvoiceAge: number;
  bucket30LCY: number;
  bucket60LCY: number;
  bucket90LCY: number;
  latestInvoiceNo?: string;
  latestInvoiceDate?: string;
  latestInvoiceBalanceLCY: number;
}

export interface ShipmentException {
  shipmentId: number;
  jobNumber: string;
  customerNames: string[];
  mode: string;
  direction: string;
  eta?: string;
  daysLate: number;
  lastEvent?: string;
  lastEventDateTime?: string;
  billedStatus: string;
}

export interface OverdueCustomerInvoiceException {
  invoiceId: number;
  invoiceNo: string;
  customerId: number;
  customerName: string;
  shipmentId?: number;
  jobNo?: string;
  invoiceDate: string;
  ageDays: number;
  currencyCode?: string;
  totalLCY: number;
  paidLCY: number;
  creditLCY: number;
  balanceLCY: number;
  paymentStatus: string;
}

export interface UnbilledJobException {
  shipmentId: number;
  jobNumber: string;
  customerNames: string[];
  mode: string;
  direction: string;
  expectedSaleLCY: number;
  billedSaleLCY: number;
  unbilledSaleLCY: number;
  expectedCostLCY: number;
  billedCostLCY: number;
  unbilledCostLCY: number;
}

export interface VendorPaymentException {
  purchaseInvoiceId: number;
  purchaseNo: string;
  vendorId: number;
  vendorName: string;
  shipmentId?: number;
  jobNo?: string;
  purchaseDate: string;
  ageDays: number;
  currencyCode?: string;
  totalLCY: number;
  paidLCY: number;
  balanceLCY: number;
  paymentStatus: string;
}

export const dashboardApi = {
  getStats: (params?: { fromDate?: string; toDate?: string }) => {
    const query = new URLSearchParams();
    if (params?.fromDate) query.append('fromDate', params.fromDate);
    if (params?.toDate) query.append('toDate', params.toDate);
    const queryString = query.toString();
    return fetchApi<DashboardStats>(`/dashboard/stats${queryString ? `?${queryString}` : ''}`);
  },
  getExceptions: (params?: ExceptionDashboardParams) => {
    const query = new URLSearchParams();
    if (params?.asOfDate) query.append('asOfDate', params.asOfDate);
    if (params?.overdueDays !== undefined) query.append('overdueDays', params.overdueDays.toString());
    if (params?.customerId !== undefined) query.append('customerId', params.customerId.toString());
    if (params?.salesperson) query.append('salesperson', params.salesperson);
    if (params?.mode) query.append('mode', params.mode);
    if (params?.direction) query.append('direction', params.direction);
    const queryString = query.toString();
    return fetchApi<ExceptionDashboard>(`/dashboard/exceptions${queryString ? `?${queryString}` : ''}`);
  },
};
