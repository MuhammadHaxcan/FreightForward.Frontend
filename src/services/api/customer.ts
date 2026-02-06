import { fetchApi, PaginatedList, MasterType, PaymentStatus } from './base';
import type { CurrencyType } from './settings';

// Customer Types
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
  currencyId?: number;
  currencyCode?: string;
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
  accountDetail?: CustomerAccountDetail;
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
  taxIdType?: string;
  taxId?: string;
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  swiftCode?: string;
  creditLimit?: number;
  creditDays?: number;
}

export interface InvoiceReceipt {
  receiptId: number;
  receiptNo: string;
  receiptDate: string;
  amount: number;
  currencyId?: number;
  currencyCode?: string;
}

export interface Invoice {
  id: number;
  invoiceDate: string;
  invoiceNo: string;
  jobNo?: string;
  hblNo?: string;
  amount: number;
  currencyId?: number;
  currencyCode?: string;
  paymentStatus: PaymentStatus;
  status?: string;
  paidAmount: number;
  balanceAmount: number;
  receipts?: InvoiceReceipt[];
}

export interface Receipt {
  id: number;
  receiptDate: string;
  receiptNo: string;
  type?: string;
  amount: number;
  currencyId?: number;
  currencyCode?: string;
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
  currencyId?: number;
  currencyCode?: string;
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
  currencyId?: number;
  currencyCode?: string;
  debit: number;
  balance: number;
  paymentStatus: PaymentStatus;
  agingDays: number;
  status?: string;
}

export interface AccountPayable {
  id: number;
  invoiceDate: string;
  purchaseInvoiceNo: string;
  vendorInvoiceNo?: string;
  vendorRef?: string;
  jobHblNo?: string;
  currencyId?: number;
  currencyCode?: string;
  credit: number;
  balance: number;
  paymentStatus: PaymentStatus;
  agingDays: number;
  status?: string;
}

// Statement of Account types
export interface StatementEntry {
  date: string;
  invoiceNo: string;
  receiptNo: string;
  description: string;
  jobNo: string;
  blAwbNo: string;
  debit: number;
  credit: number;
  balance: number;
  remarks: string;
}

export interface CustomerStatement {
  entries: StatementEntry[];
  currency: string;
  totalDebit: number;
  totalCredit: number;
  netOutstandingReceivable: number;
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
  currencyId?: number;
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
  currencyId?: number;
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
    currencyId?: number;
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

  // Account Payables (for Creditors/Vendors)
  getAccountPayables: (
    customerId: number,
    params?: { pageNumber?: number; pageSize?: number }
  ) => {
    const query = new URLSearchParams();
    if (params?.pageNumber) query.append('pageNumber', params.pageNumber.toString());
    if (params?.pageSize) query.append('pageSize', params.pageSize.toString());
    return fetchApi<PaginatedList<AccountPayable>>(
      `/customers/${customerId}/account-payables?${query}`
    );
  },

  // Statement of Account
  getStatement: (customerId: number, fromDate: string, toDate: string) =>
    fetchApi<CustomerStatement>(
      `/customers/${customerId}/statement?fromDate=${fromDate}&toDate=${toDate}`
    ),
};
