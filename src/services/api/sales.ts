import { fetchApi, PaginatedList, Currency } from './base';

// Sales Types
export type ShippingMode = 'FCLSeaFreight' | 'LCLSeaFreight' | 'AirFreight';
export type Incoterms = 'EXW' | 'FCA' | 'FAS' | 'FOB' | 'CFR' | 'CIF' | 'CPT' | 'CIP' | 'DAP' | 'DPU' | 'DDP';
export type LeadStatus = 'New' | 'Pending' | 'Converted';
export type RateRequestStatus = 'Pending' | 'Sent' | 'Received';
export type QuotationStatus = 'Pending' | 'Approved' | 'Rejected';

export interface Lead {
  id: number;
  leadNo: string;
  leadDate: string;
  customerName: string;
  customerId?: number;
  mode: ShippingMode;
  modeDisplay: string;
  incoterms: Incoterms;
  polCountry?: string;
  podCountry?: string;
  quantity: number;
  weight?: number;
  weightUnit?: string;
  leadStatus: LeadStatus;
  status?: string;
  createdAt: string;
}

export interface CreateLeadRequest {
  customerName: string;
  customerId?: number;
  mode: ShippingMode;
  incoterms: Incoterms;
  polCountry?: string;
  podCountry?: string;
  quantity: number;
  weight?: number;
  weightUnit?: string;
}

export interface UpdateLeadRequest extends CreateLeadRequest {
  id: number;
  leadStatus: LeadStatus;
}

export interface RateRequest {
  id: number;
  rateRequestNo: string;
  requestDate: string;
  leadId?: number;
  mode: ShippingMode;
  modeDisplay: string;
  incoterms: Incoterms;
  vendorName: string;
  vendorId?: number;
  polCountry?: string;
  podCountry?: string;
  requestStatus: RateRequestStatus;
  status?: string;
  createdAt: string;
}

export interface CreateRateRequestRequest {
  leadId?: number;
  mode: ShippingMode;
  incoterms: Incoterms;
  vendorName: string;
  vendorId?: number;
  polCountry?: string;
  podCountry?: string;
}

export interface Quotation {
  id: number;
  quotationNo: string;
  quotationDate: string;
  customerName: string;
  customerId?: number;
  incoterms: Incoterms;
  mode: ShippingMode;
  modeDisplay: string;
  pol?: string;
  pod?: string;
  quoteExpiryDate?: string;
  quotationStatus: QuotationStatus;
  status?: string;
  createdAt: string;
}

export interface QuotationDetail extends Quotation {
  rateRequestId?: number;
  cargoCalculationMode?: string;
  charges: QuotationCharge[];
}

export interface QuotationCharge {
  id: number;
  chargeType?: string;
  bases?: string;
  currency: Currency;
  rate: number;
  roe: number;
  quantity: number;
  amount: number;
}

export interface CreateQuotationRequest {
  rateRequestId?: number;
  customerId?: number;
  customerName: string;
  incoterms: Incoterms;
  mode: ShippingMode;
  pol?: string;
  pod?: string;
  quoteExpiryDate?: string;
  cargoCalculationMode?: string;
  charges?: {
    chargeType?: string;
    bases?: string;
    currency: Currency;
    rate: number;
    roe: number;
    quantity: number;
    amount: number;
  }[];
}

// Sales APIs
export const leadApi = {
  getAll: (params?: {
    pageNumber?: number;
    pageSize?: number;
    searchTerm?: string;
    status?: LeadStatus;
  }) => {
    const query = new URLSearchParams();
    if (params?.pageNumber) query.append('pageNumber', params.pageNumber.toString());
    if (params?.pageSize) query.append('pageSize', params.pageSize.toString());
    if (params?.searchTerm) query.append('searchTerm', params.searchTerm);
    if (params?.status) query.append('status', params.status);
    return fetchApi<PaginatedList<Lead>>(`/sales/leads?${query}`);
  },
  create: (data: CreateLeadRequest) =>
    fetchApi<number>('/sales/leads', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: UpdateLeadRequest) =>
    fetchApi<void>(`/sales/leads/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
};

export const rateRequestApi = {
  getAll: (params?: {
    pageNumber?: number;
    pageSize?: number;
    searchTerm?: string;
    status?: RateRequestStatus;
  }) => {
    const query = new URLSearchParams();
    if (params?.pageNumber) query.append('pageNumber', params.pageNumber.toString());
    if (params?.pageSize) query.append('pageSize', params.pageSize.toString());
    if (params?.searchTerm) query.append('searchTerm', params.searchTerm);
    if (params?.status) query.append('status', params.status);
    return fetchApi<PaginatedList<RateRequest>>(`/sales/raterequests?${query}`);
  },
  create: (data: CreateRateRequestRequest) =>
    fetchApi<number>('/sales/raterequests', { method: 'POST', body: JSON.stringify(data) }),
};

export const quotationApi = {
  getAll: (params?: {
    pageNumber?: number;
    pageSize?: number;
    searchTerm?: string;
    status?: QuotationStatus;
  }) => {
    const query = new URLSearchParams();
    if (params?.pageNumber) query.append('pageNumber', params.pageNumber.toString());
    if (params?.pageSize) query.append('pageSize', params.pageSize.toString());
    if (params?.searchTerm) query.append('searchTerm', params.searchTerm);
    if (params?.status) query.append('status', params.status);
    return fetchApi<PaginatedList<Quotation>>(`/sales/quotations?${query}`);
  },
  getById: (id: number) => fetchApi<QuotationDetail>(`/sales/quotations/${id}`),
  create: (data: CreateQuotationRequest) =>
    fetchApi<number>('/sales/quotations', { method: 'POST', body: JSON.stringify(data) }),
};
