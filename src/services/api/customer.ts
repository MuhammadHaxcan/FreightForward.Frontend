import { fetchApi, PaginatedList, MasterType, Currency, PaymentStatus } from './base';

// Customer Types
export type CustomerCategory = 'Shipper' | 'Consignee' | 'BookingParty' | 'Agents' | 'Forwarder' | 'Customer' | 'DeliveryAgent' | 'OriginAgent' | 'NotifyParty' | 'CoLoader';

export interface CustomerCategoryInfo {
  id: number;
  code: string;
  name: string;
}

export interface Customer {
  id: number;
  code: string;
  name: string;
  masterType: MasterType;
  masterTypeDisplay: string;
  categories: CustomerCategoryInfo[];
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
  categoryIds?: number[];
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

export interface NextCustomerCodes {
  debtorsCode: string;
  creditorsCode: string;
  neutralCode: string;
}

export interface UpdateCustomerRequest {
  id: number;
  name: string;
  masterType: MasterType;
  categoryIds?: number[];
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
    categoryId?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.pageNumber) query.append('pageNumber', params.pageNumber.toString());
    if (params?.pageSize) query.append('pageSize', params.pageSize.toString());
    if (params?.searchTerm) query.append('searchTerm', params.searchTerm);
    if (params?.masterType) query.append('masterType', params.masterType);
    if (params?.categoryId) query.append('categoryId', params.categoryId.toString());
    return fetchApi<PaginatedList<Customer>>(`/customers?${query}`);
  },
  getById: (id: number) => fetchApi<CustomerDetail>(`/customers/${id}`),
  getNextCodes: () => fetchApi<NextCustomerCodes>('/customers/next-codes'),
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
