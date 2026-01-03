import { fetchApi, PaginatedList, Currency, PaymentStatus } from './base';

// Invoice Types
export interface CreateInvoiceItemRequest {
  shipmentCostingId?: number;
  chargeDetails: string;
  noOfUnit: number;
  ppcc?: string;
  salePerUnit: number;
  currency: Currency;
  fcyAmount: number;
  exRate: number;
  localAmount: number;
  taxPercentage: number;
  taxAmount: number;
}

export interface CreateInvoiceRequest {
  shipmentId: number;
  customerId: number;
  invoiceDate: string;
  baseCurrency: Currency;
  remarks?: string;
  items: CreateInvoiceItemRequest[];
}

export interface CreatePurchaseInvoiceItemRequest {
  shipmentCostingId?: number;
  chargeDetails: string;
  noOfUnit: number;
  ppcc?: string;
  costPerUnit: number;
  currency: Currency;
  fcyAmount: number;
  exRate: number;
  localAmount: number;
  taxPercentage: number;
  taxAmount: number;
}

export interface CreatePurchaseInvoiceRequest {
  shipmentId: number;
  vendorId: number;
  invoiceDate: string;
  vendorInvoiceNo?: string;
  vendorInvoiceDate?: string;
  baseCurrency: Currency;
  remarks?: string;
  items: CreatePurchaseInvoiceItemRequest[];
}

// Account Invoice Types
export interface AccountInvoice {
  id: number;
  invoiceNo: string;
  invoiceDate: string;
  jobNumber?: string;
  customerName: string;
  customerId?: number;
  amount: number;
  currency: Currency;
  dueDate?: string;
  agingDays: number;
  addedBy?: string;
  paymentStatus: PaymentStatus;
  status: string;
}

export interface AccountInvoiceDetail {
  id: number;
  invoiceNo: string;
  invoiceDate: string;
  dueDate?: string;
  jobNumber?: string;
  hblNo?: string;
  customerName: string;
  customerAddress?: string;
  customerPhone?: string;
  customerEmail?: string;
  currency: Currency;
  subTotal: number;
  totalTax: number;
  total: number;
  remarks?: string;
  paymentStatus: PaymentStatus;
  items: AccountInvoiceItem[];
}

export interface AccountInvoiceItem {
  id: number;
  chargeDetails: string;
  basis?: string;
  currency: Currency;
  rate: number;
  quantity: number;
  roe: number;
  taxPercentage: number;
  taxAmount: number;
  amount: number;
}

// Invoice API
export const invoiceApi = {
  getAll: (params?: {
    pageNumber?: number;
    pageSize?: number;
    searchTerm?: string;
    customerId?: number;
    fromDate?: string;
    toDate?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.pageNumber) query.append('pageNumber', params.pageNumber.toString());
    if (params?.pageSize) query.append('pageSize', params.pageSize.toString());
    if (params?.searchTerm) query.append('searchTerm', params.searchTerm);
    if (params?.customerId) query.append('customerId', params.customerId.toString());
    if (params?.fromDate) query.append('fromDate', params.fromDate);
    if (params?.toDate) query.append('toDate', params.toDate);
    return fetchApi<PaginatedList<AccountInvoice>>(`/invoices?${query}`);
  },
  getById: (id: number) => fetchApi<AccountInvoiceDetail>(`/invoices/${id}`),
  createInvoice: (data: CreateInvoiceRequest) =>
    fetchApi<number>('/invoices', { method: 'POST', body: JSON.stringify(data) }),
  createPurchaseInvoice: (data: CreatePurchaseInvoiceRequest) =>
    fetchApi<number>('/invoices/purchase', { method: 'POST', body: JSON.stringify(data) }),
};
