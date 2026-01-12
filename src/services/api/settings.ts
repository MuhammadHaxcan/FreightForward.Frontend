import { fetchApi, PaginatedList } from './base';

// Settings Types
export type PaymentType = 'Inwards' | 'Outwards';

export interface CurrencyType {
  id: number;
  name: string;
  code: string;
  symbol: string;
  decimalName?: string;
  usdRate: number;
  roe: number;
}

export interface Port {
  id: number;
  name: string;
  country: string;
  code?: string;
}

export interface ChargeItem {
  id: number;
  name: string;
  description?: string;
}

export interface ExpenseType {
  id: number;
  paymentDirection: PaymentType;
  paymentDirectionName: string;
  name: string;
  description?: string;
}

export interface IncoTerm {
  id: number;
  code: string;
  name: string;
  description: string;
  group: string;
}

export interface CustomerCategoryType {
  id: number;
  code: string;
  name: string;
  description?: string;
  sortOrder: number;
}

export interface PackageType {
  id: number;
  code: string;
  name: string;
  description?: string;
  category: string;
  sortOrder: number;
}

export interface NetworkPartner {
  id: number;
  code: string;
  name: string;
  description?: string;
  sortOrder: number;
}

export interface TransportMode {
  id: number;
  code: string;
  name: string;
  description?: string;
  sortOrder: number;
}

export interface BLType {
  id: number;
  code: string;
  name: string;
  description?: string;
  category: string; // "Sea", "Air", or "Common"
  sortOrder: number;
}

export interface CostingUnit {
  id: number;
  code: string;
  name: string;
  description?: string;
  sortOrder: number;
}

export interface CreateCurrencyTypeRequest {
  name: string;
  code: string;
  symbol: string;
  decimalName?: string;
  usdRate: number;
  roe: number;
}

export interface UpdateCurrencyTypeRequest extends CreateCurrencyTypeRequest {
  id: number;
}

export interface CreatePortRequest {
  name: string;
  country: string;
  code?: string;
}

export interface UpdatePortRequest extends CreatePortRequest {
  id: number;
}

export interface CreateChargeItemRequest {
  name: string;
  description?: string;
}

export interface UpdateChargeItemRequest extends CreateChargeItemRequest {
  id: number;
}

export interface CreateExpenseTypeRequest {
  paymentDirection: PaymentType;
  name: string;
  description?: string;
}

export interface UpdateExpenseTypeRequest extends CreateExpenseTypeRequest {
  id: number;
}

// Settings API
export const settingsApi = {
  // Currency Types
  getCurrencyTypes: (params?: { pageNumber?: number; pageSize?: number; searchTerm?: string }) => {
    const query = new URLSearchParams();
    if (params?.pageNumber) query.append('pageNumber', params.pageNumber.toString());
    if (params?.pageSize) query.append('pageSize', params.pageSize.toString());
    if (params?.searchTerm) query.append('searchTerm', params.searchTerm);
    return fetchApi<PaginatedList<CurrencyType>>(`/settings/currency-types?${query}`);
  },
  getAllCurrencyTypes: () =>
    fetchApi<CurrencyType[]>('/settings/currency-types/all'),
  createCurrencyType: (data: CreateCurrencyTypeRequest) =>
    fetchApi<number>('/settings/currency-types', { method: 'POST', body: JSON.stringify(data) }),
  updateCurrencyType: (id: number, data: UpdateCurrencyTypeRequest) =>
    fetchApi<void>(`/settings/currency-types/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCurrencyType: (id: number) =>
    fetchApi<void>(`/settings/currency-types/${id}`, { method: 'DELETE' }),

  // Ports
  getPorts: (params?: { pageNumber?: number; pageSize?: number; searchTerm?: string }) => {
    const query = new URLSearchParams();
    if (params?.pageNumber) query.append('pageNumber', params.pageNumber.toString());
    if (params?.pageSize) query.append('pageSize', params.pageSize.toString());
    if (params?.searchTerm) query.append('searchTerm', params.searchTerm);
    return fetchApi<PaginatedList<Port>>(`/settings/ports?${query}`);
  },
  createPort: (data: CreatePortRequest) =>
    fetchApi<number>('/settings/ports', { method: 'POST', body: JSON.stringify(data) }),
  updatePort: (id: number, data: UpdatePortRequest) =>
    fetchApi<void>(`/settings/ports/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePort: (id: number) =>
    fetchApi<void>(`/settings/ports/${id}`, { method: 'DELETE' }),

  // Charge Items
  getChargeItems: (params?: { pageNumber?: number; pageSize?: number; searchTerm?: string }) => {
    const query = new URLSearchParams();
    if (params?.pageNumber) query.append('pageNumber', params.pageNumber.toString());
    if (params?.pageSize) query.append('pageSize', params.pageSize.toString());
    if (params?.searchTerm) query.append('searchTerm', params.searchTerm);
    return fetchApi<PaginatedList<ChargeItem>>(`/settings/charge-items?${query}`);
  },
  getAllChargeItems: () =>
    fetchApi<ChargeItem[]>('/settings/charge-items/all'),
  createChargeItem: (data: CreateChargeItemRequest) =>
    fetchApi<number>('/settings/charge-items', { method: 'POST', body: JSON.stringify(data) }),
  updateChargeItem: (id: number, data: UpdateChargeItemRequest) =>
    fetchApi<void>(`/settings/charge-items/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteChargeItem: (id: number) =>
    fetchApi<void>(`/settings/charge-items/${id}`, { method: 'DELETE' }),

  // Expense Types
  getExpenseTypes: (params?: { pageNumber?: number; pageSize?: number; searchTerm?: string; paymentDirection?: PaymentType }) => {
    const query = new URLSearchParams();
    if (params?.pageNumber) query.append('pageNumber', params.pageNumber.toString());
    if (params?.pageSize) query.append('pageSize', params.pageSize.toString());
    if (params?.searchTerm) query.append('searchTerm', params.searchTerm);
    if (params?.paymentDirection) query.append('paymentDirection', params.paymentDirection);
    return fetchApi<PaginatedList<ExpenseType>>(`/settings/expense-types?${query}`);
  },
  getAllExpenseTypes: () =>
    fetchApi<ExpenseType[]>('/settings/expense-types/all'),

  // IncoTerms
  getAllIncoTerms: () =>
    fetchApi<IncoTerm[]>('/settings/inco-terms/all'),
  getIncoTermById: (id: number) =>
    fetchApi<IncoTerm>(`/settings/inco-terms/${id}`),

  // Package Types
  getAllPackageTypes: () =>
    fetchApi<PackageType[]>('/settings/package-types/all'),
  getPackageTypeById: (id: number) =>
    fetchApi<PackageType>(`/settings/package-types/${id}`),

  // Network Partners
  getAllNetworkPartners: () =>
    fetchApi<NetworkPartner[]>('/settings/network-partners/all'),
  getNetworkPartnerById: (id: number) =>
    fetchApi<NetworkPartner>(`/settings/network-partners/${id}`),

  // Transport Modes
  getAllTransportModes: () =>
    fetchApi<TransportMode[]>('/settings/transport-modes/all'),

  // BL Types
  getAllBLTypes: () =>
    fetchApi<BLType[]>('/settings/bl-types/all'),

  // Ports - Get All
  getAllPorts: () =>
    fetchApi<Port[]>('/settings/ports/all'),

  // Customer Category Types
  getAllCustomerCategoryTypes: () =>
    fetchApi<CustomerCategoryType[]>('/settings/customer-category-types/all'),

  // Costing Units
  getAllCostingUnits: () =>
    fetchApi<CostingUnit[]>('/settings/costing-units/all'),

  getExpenseTypesByDirection: (paymentDirection: 'Inwards' | 'Outwards') =>
    fetchApi<ExpenseType[]>(`/settings/expense-types/by-direction/${paymentDirection === 'Inwards' ? 0 : 1}`),
  createExpenseType: (data: CreateExpenseTypeRequest) =>
    fetchApi<number>('/settings/expense-types', { method: 'POST', body: JSON.stringify(data) }),
  updateExpenseType: (id: number, data: UpdateExpenseTypeRequest) =>
    fetchApi<void>(`/settings/expense-types/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteExpenseType: (id: number) =>
    fetchApi<void>(`/settings/expense-types/${id}`, { method: 'DELETE' }),
};
