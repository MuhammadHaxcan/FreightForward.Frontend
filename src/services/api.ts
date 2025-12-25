// API Configuration and Base Client
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://localhost:7001/api';

// Types
export interface PaginatedList<T> {
  items: T[];
  pageNumber: number;
  totalPages: number;
  totalCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  errors?: string[];
}

// Generic fetch wrapper
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return {
        error: errorData?.message || `HTTP error! status: ${response.status}`,
        errors: errorData?.errors || [],
      };
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return { data: undefined as T };
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'An unknown error occurred',
    };
  }
}

// Bank Types
export interface Bank {
  id: number;
  bankName: string;
  acHolder?: string;
  acNumber?: string;
  ibanNumber?: string;
  swiftCode?: string;
  branch?: string;
  telNo?: string;
  faxNo?: string;
  status?: string;
  createdAt: string;
}

export interface CreateBankRequest {
  bankName: string;
  acHolder?: string;
  acNumber?: string;
  ibanNumber?: string;
  swiftCode?: string;
  branch?: string;
  telNo?: string;
  faxNo?: string;
}

export interface UpdateBankRequest extends CreateBankRequest {
  id: number;
  status?: string;
}

// Bank API
export const bankApi = {
  getAll: (params?: { pageNumber?: number; pageSize?: number; searchTerm?: string }) => {
    const query = new URLSearchParams();
    if (params?.pageNumber) query.append('pageNumber', params.pageNumber.toString());
    if (params?.pageSize) query.append('pageSize', params.pageSize.toString());
    if (params?.searchTerm) query.append('searchTerm', params.searchTerm);
    return fetchApi<PaginatedList<Bank>>(`/banks?${query}`);
  },
  getById: (id: number) => fetchApi<Bank>(`/banks/${id}`),
  create: (data: CreateBankRequest) =>
    fetchApi<number>('/banks', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: UpdateBankRequest) =>
    fetchApi<void>(`/banks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => fetchApi<void>(`/banks/${id}`, { method: 'DELETE' }),
};

// Company Types
export interface Company {
  id: number;
  name: string;
  email?: string;
  website?: string;
  addedBy?: string;
  companyType?: string;
  legalTradingName?: string;
  registrationNumber?: string;
  contactNumber?: string;
  vatId?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  stateProvince?: string;
  zipCode?: string;
  country?: string;
  logoPath?: string;
  sealPath?: string;
  status?: string;
  createdAt: string;
}

export interface CreateCompanyRequest {
  name: string;
  email?: string;
  website?: string;
  addedBy?: string;
  companyType?: string;
  legalTradingName?: string;
  registrationNumber?: string;
  contactNumber?: string;
  vatId?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  stateProvince?: string;
  zipCode?: string;
  country?: string;
}

export interface UpdateCompanyRequest extends CreateCompanyRequest {
  id: number;
  status?: string;
}

// Company API
export const companyApi = {
  getAll: (params?: { pageNumber?: number; pageSize?: number; searchTerm?: string }) => {
    const query = new URLSearchParams();
    if (params?.pageNumber) query.append('pageNumber', params.pageNumber.toString());
    if (params?.pageSize) query.append('pageSize', params.pageSize.toString());
    if (params?.searchTerm) query.append('searchTerm', params.searchTerm);
    return fetchApi<PaginatedList<Company>>(`/companies?${query}`);
  },
  getById: (id: number) => fetchApi<Company>(`/companies/${id}`),
  create: (data: CreateCompanyRequest) =>
    fetchApi<number>('/companies', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: UpdateCompanyRequest) =>
    fetchApi<void>(`/companies/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => fetchApi<void>(`/companies/${id}`, { method: 'DELETE' }),
};

// Customer Types
export type MasterType = 'Debtors' | 'Creditors' | 'Neutral';
export type Currency = 'USD' | 'EUR' | 'GBP' | 'AED' | 'PKR' | 'INR' | 'CNY' | 'SGD';
export type PaymentStatus = 'Pending' | 'Paid' | 'PartiallyPaid' | 'Overdue' | 'Closed';

export interface Customer {
  id: number;
  code: string;
  name: string;
  masterType: MasterType;
  masterTypeDisplay: string;
  categoryList: string[];
  phone?: string;
  email?: string;
  country?: string;
  city?: string;
  baseCurrency: Currency;
  taxNo?: string;
  status?: string;
  createdAt: string;
}

export interface CustomerDetail extends Customer {
  fax?: string;
  address?: string;
  taxPercentage?: number;
  carrierCode?: string;
  contacts: CustomerContact[];
  accountDetails: CustomerAccountDetail[];
}

export interface CustomerContact {
  id: number;
  name: string;
  email?: string;
  mobile?: string;
  position?: string;
  phone?: string;
  designation?: string;
  department?: string;
  directTel?: string;
  whatsapp?: string;
  skype?: string;
  enableRateRequest: boolean;
}

export interface CustomerAccountDetail {
  id: number;
  acName?: string;
  bankAcNo?: string;
  currency: Currency;
  type?: string;
  notes?: string;
  swiftCode?: string;
  acType?: string;
  approvedCreditDays?: number;
  alertCreditDays?: number;
  approvedCreditAmount?: number;
  alertCreditAmount?: number;
  cc?: string;
  bcc?: string;
}

export interface Invoice {
  id: number;
  invoiceDate: string;
  invoiceNo: string;
  jobNo?: string;
  hblNo?: string;
  amount: number;
  currency: Currency;
  paymentStatus: PaymentStatus;
  status?: string;
}

export interface Receipt {
  id: number;
  receiptDate: string;
  receiptNo: string;
  type?: string;
  amount: number;
  currency: Currency;
  narration?: string;
}

export interface CreditNote {
  id: number;
  creditNoteNo: string;
  jobNumber?: string;
  creditNoteDate: string;
  referenceNo?: string;
  addedBy?: string;
  status?: string;
  details: CreditNoteDetail[];
}

export interface CreditNoteDetail {
  id: number;
  chargeDetails?: string;
  bases?: string;
  currency: Currency;
  rate: number;
  roe: number;
  quantity: number;
  amount: number;
}

export interface AccountReceivable {
  id: number;
  invoiceDate: string;
  invoiceNo: string;
  customerRef?: string;
  jobHblNo?: string;
  debit: number;
  balance: number;
  paymentStatus: PaymentStatus;
  agingDays: number;
  status?: string;
}

export interface CreateCustomerRequest {
  name: string;
  masterType: MasterType;
  categories?: string[];
  phone?: string;
  fax?: string;
  email?: string;
  country?: string;
  city?: string;
  address?: string;
  baseCurrency?: Currency;
  taxNo?: string;
  taxPercentage?: number;
  carrierCode?: string;
}

export interface UpdateCustomerRequest extends CreateCustomerRequest {
  id: number;
  status?: string;
}

export interface CreateCustomerContactRequest {
  customerId: number;
  name: string;
  email?: string;
  mobile?: string;
  position?: string;
  phone?: string;
  designation?: string;
  department?: string;
  directTel?: string;
  whatsapp?: string;
  skype?: string;
  enableRateRequest?: boolean;
}

export interface CreateCreditNoteRequest {
  customerId: number;
  jobNumber?: string;
  creditNoteDate: string;
  referenceNo?: string;
  email?: string;
  additionalContents?: string;
  details?: {
    chargeDetails?: string;
    bases?: string;
    currency: Currency;
    rate: number;
    roe: number;
    quantity: number;
    amount: number;
  }[];
}

// Customer API
export const customerApi = {
  getAll: (params?: {
    pageNumber?: number;
    pageSize?: number;
    searchTerm?: string;
    masterType?: MasterType;
  }) => {
    const query = new URLSearchParams();
    if (params?.pageNumber) query.append('pageNumber', params.pageNumber.toString());
    if (params?.pageSize) query.append('pageSize', params.pageSize.toString());
    if (params?.searchTerm) query.append('searchTerm', params.searchTerm);
    if (params?.masterType) query.append('masterType', params.masterType);
    return fetchApi<PaginatedList<Customer>>(`/customers?${query}`);
  },
  getById: (id: number) => fetchApi<CustomerDetail>(`/customers/${id}`),
  create: (data: CreateCustomerRequest) =>
    fetchApi<number>('/customers', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: UpdateCustomerRequest) =>
    fetchApi<void>(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => fetchApi<void>(`/customers/${id}`, { method: 'DELETE' }),

  // Contacts
  createContact: (customerId: number, data: CreateCustomerContactRequest) =>
    fetchApi<number>(`/customers/${customerId}/contacts`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Invoices
  getInvoices: (customerId: number, params?: { pageNumber?: number; pageSize?: number }) => {
    const query = new URLSearchParams();
    if (params?.pageNumber) query.append('pageNumber', params.pageNumber.toString());
    if (params?.pageSize) query.append('pageSize', params.pageSize.toString());
    return fetchApi<PaginatedList<Invoice>>(`/customers/${customerId}/invoices?${query}`);
  },

  // Receipts
  getReceipts: (customerId: number, params?: { pageNumber?: number; pageSize?: number }) => {
    const query = new URLSearchParams();
    if (params?.pageNumber) query.append('pageNumber', params.pageNumber.toString());
    if (params?.pageSize) query.append('pageSize', params.pageSize.toString());
    return fetchApi<PaginatedList<Receipt>>(`/customers/${customerId}/receipts?${query}`);
  },

  // Credit Notes
  getCreditNotes: (customerId: number, params?: { pageNumber?: number; pageSize?: number }) => {
    const query = new URLSearchParams();
    if (params?.pageNumber) query.append('pageNumber', params.pageNumber.toString());
    if (params?.pageSize) query.append('pageSize', params.pageSize.toString());
    return fetchApi<PaginatedList<CreditNote>>(`/customers/${customerId}/credit-notes?${query}`);
  },
  createCreditNote: (customerId: number, data: CreateCreditNoteRequest) =>
    fetchApi<number>(`/customers/${customerId}/credit-notes`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Account Receivables
  getAccountReceivables: (
    customerId: number,
    params?: { pageNumber?: number; pageSize?: number }
  ) => {
    const query = new URLSearchParams();
    if (params?.pageNumber) query.append('pageNumber', params.pageNumber.toString());
    if (params?.pageSize) query.append('pageSize', params.pageSize.toString());
    return fetchApi<PaginatedList<AccountReceivable>>(
      `/customers/${customerId}/account-receivables?${query}`
    );
  },
};

// Sales Types
export type ShippingMode = 'FCLSeaFreight' | 'LCLSeaFreight' | 'AirFreight';
export type Incoterms = 'EXW' | 'FOB' | 'CFR' | 'CIF' | 'DDU' | 'FCA' | 'DDP' | 'DAP' | 'CPT' | 'CIP';
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

// Sales API
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

// Export all APIs
export const api = {
  banks: bankApi,
  companies: companyApi,
  customers: customerApi,
  leads: leadApi,
  rateRequests: rateRequestApi,
  quotations: quotationApi,
};

export default api;
