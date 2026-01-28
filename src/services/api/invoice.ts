import { fetchApi, PaginatedList, PaymentStatus } from './base';

// Payment Mode enum
export type PaymentMode = 'Cash' | 'Cheque' | 'BankWire' | 'BankTransfer' | 'Card';

// Invoice Types
export interface CreateInvoiceItemRequest {
  shipmentCostingId?: number;
  chargeDetails: string;
  noOfUnit: number;
  ppcc?: string;
  salePerUnit: number;
  currencyId: number;
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
  currencyId: number;
  baseCurrencyId?: number;
  remarks?: string;
  items: CreateInvoiceItemRequest[];
}

export interface CreatePurchaseInvoiceItemRequest {
  shipmentCostingId?: number;
  chargeDetails: string;
  noOfUnit: number;
  ppcc?: string;
  costPerUnit: number;
  currencyId: number;
  fcyAmount: number;
  exRate: number;
  localAmount: number;
  taxPercentage: number;
  taxAmount: number;
}

export interface CreatePurchaseInvoiceRequest {
  shipmentId: number;
  vendorId: number;
  purchaseDate: string;
  vendorInvoiceNo?: string;
  vendorInvoiceDate?: string;
  jobNo?: string;
  currencyId: number;
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
  customerId: number;
  amount: number;
  currencyId?: number;
  currencyCode?: string;
  dueDate?: string;
  agingDays?: number;
  addedBy?: string;
  paymentStatus: PaymentStatus;
  status: string;
}

// Unpaid Invoice for partial payments
export interface UnpaidInvoice {
  id: number;
  invoiceNo: string;
  invoiceDate: string;
  jobNo?: string;
  hblNo?: string;
  currencyId?: number;
  currencyCode?: string;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
}

// Payment Type
export interface PaymentType {
  id: number;
  code: string;
  name: string;
  description?: string;
  requiresBank: boolean;
  requiresChequeDetails: boolean;
  sortOrder: number;
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
  currencyId?: number;
  currencyCode?: string;
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
  currencyId?: number;
  currencyCode?: string;
  rate: number;
  quantity: number;
  roe: number;
  taxPercentage: number;
  taxAmount: number;
  amount: number;
}

// Purchase Invoice Types
export interface AccountPurchaseInvoice {
  id: number;
  purchaseNo: string;
  purchaseDate: string;
  jobNo?: string;
  vendorInvoiceNo?: string;
  vendorInvoiceDate?: string;
  vendorName?: string;
  vendorId: number;
  amount: number;
  currencyId?: number;
  currencyCode?: string;
  totalFCY: number;
  totalLCY: number;
  paymentStatus: PaymentStatus;
  remarks?: string;
  status?: string;
  createdBy?: string;
  createdAt: string;
}

export interface AccountPurchaseInvoiceDetail extends AccountPurchaseInvoice {
  items: AccountPurchaseInvoiceItem[];
}

export interface AccountPurchaseInvoiceItem {
  id: number;
  chargeDetails: string;
  ppcc?: string;
  chargeItemId?: number;
  costingUnitId?: number;
  currencyId?: number;
  currencyCode?: string;
  noOfUnit: number;
  costPerUnit: number;
  fcyAmount: number;
  exRate: number;
  localAmount: number;
  taxPercentage: number;
  taxAmount: number;
  shipmentCostingId?: number;
}

// VAT Report Types
export interface VatReportItem {
  id: number;
  jobNo?: string;
  hblNo?: string;
  invoiceNo: string;
  invoiceDate: string;
  customerName?: string;
  currencyCode?: string;
  amount: number;
  nonTaxableSale: number;
  taxableSale: number;
  taxAmount: number;
  totalInvoice: number;
  remarks?: string;
}

export interface VatReportTotals {
  totalAmount: number;
  totalNonTaxableSale: number;
  totalTaxableSale: number;
  totalTaxAmount: number;
  totalInvoiceAmount: number;
}

export interface VatReportResult {
  items: PaginatedList<VatReportItem>;
  totals: VatReportTotals;
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
  getNextInvoiceNumber: async () => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://localhost:7001/api';
      const response = await fetch(`${API_BASE_URL}/invoices/next-number`);
      if (!response.ok) {
        return { error: `HTTP error! status: ${response.status}` };
      }
      const text = await response.text();
      const data = text.replace(/^"|"$/g, '');
      return { data };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
  },
  getNextPurchaseNumber: async () => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://localhost:7001/api';
      const response = await fetch(`${API_BASE_URL}/invoices/purchases/next-number`);
      if (!response.ok) {
        return { error: `HTTP error! status: ${response.status}` };
      }
      const text = await response.text();
      const data = text.replace(/^"|"$/g, '');
      return { data };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
  },
  createInvoice: (data: CreateInvoiceRequest) =>
    fetchApi<number>('/invoices', { method: 'POST', body: JSON.stringify(data) }),
  createPurchaseInvoice: (data: CreatePurchaseInvoiceRequest) =>
    fetchApi<number>('/invoices/purchases', { method: 'POST', body: JSON.stringify(data) }),

  // Purchase Invoice endpoints
  getAllPurchaseInvoices: (params?: {
    pageNumber?: number;
    pageSize?: number;
    searchTerm?: string;
    vendorId?: number;
    fromDate?: string;
    toDate?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.pageNumber) query.append('pageNumber', params.pageNumber.toString());
    if (params?.pageSize) query.append('pageSize', params.pageSize.toString());
    if (params?.searchTerm) query.append('searchTerm', params.searchTerm);
    if (params?.vendorId) query.append('vendorId', params.vendorId.toString());
    if (params?.fromDate) query.append('fromDate', params.fromDate);
    if (params?.toDate) query.append('toDate', params.toDate);
    return fetchApi<PaginatedList<AccountPurchaseInvoice>>(`/invoices/purchases?${query}`);
  },
  getPurchaseInvoiceById: (id: number) => fetchApi<AccountPurchaseInvoiceDetail>(`/invoices/purchases/${id}`),
  getVatReport: (params?: {
    pageNumber?: number; pageSize?: number;
    customerId?: number; fromDate?: string; toDate?: string;
    searchTerm?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.pageNumber) query.append('pageNumber', params.pageNumber.toString());
    if (params?.pageSize) query.append('pageSize', params.pageSize.toString());
    if (params?.customerId) query.append('customerId', params.customerId.toString());
    if (params?.fromDate) query.append('fromDate', params.fromDate);
    if (params?.toDate) query.append('toDate', params.toDate);
    if (params?.searchTerm) query.append('searchTerm', params.searchTerm);
    return fetchApi<VatReportResult>(`/invoices/vat-report?${query}`);
  },
};

// Receipt Types
export interface Receipt {
  id: number;
  receiptNo: string;
  receiptDate: string;
  customerId: number;
  customerName?: string;
  paymentMode: PaymentMode;
  currencyId?: number;
  currencyCode?: string;
  amount: number;
  narration?: string;
  bankId?: number;
  bankName?: string;
  chequeNo?: string;
  chequeDate?: string;
  chequeBank?: string;
  invoiceCount: number;
  invoiceNumbers?: string;
  jobNumbers?: string;
  createdAt: string;
}

export interface ReceiptInvoice {
  id: number;
  invoiceId: number;
  invoiceNo?: string;
  invoiceDate?: string;
  jobNo?: string;
  hblNo?: string;
  currencyId?: number;
  currencyCode?: string;
  amount: number; // Amount allocated in this receipt
  invoiceAmount: number; // Total invoice amount
  totalReceived: number; // Total received across all receipts
  balance: number; // Remaining balance
}

export interface ReceiptDetail extends Receipt {
  customerCode?: string;
  customerAddress?: string;
  customerPhone?: string;
  customerEmail?: string;
  invoices: ReceiptInvoice[];
}

export interface CreateReceiptInvoiceRequest {
  invoiceId: number;
  amount: number;
  currencyId: number;
}

export interface CreateReceiptRequest {
  receiptDate: string;
  customerId: number;
  paymentMode: PaymentMode;
  currencyId: number;
  amount: number;
  narration?: string;
  bankId?: number;
  chequeNo?: string;
  chequeDate?: string;
  chequeBank?: string;
  invoices: CreateReceiptInvoiceRequest[];
}

export interface UpdateReceiptRequest {
  customerId: number;
  invoiceId?: number;
  paymentMode: PaymentMode;
  receiptDate: string;
  narration?: string;
  remarks?: string;
  currencyId?: number;
  bankId?: number;
  chequeNo?: string;
  chequeDate?: string;
  chequeBank?: string;
  amount: number;
}

// Receipt API
export const receiptApi = {
  getAll: (params?: {
    pageNumber?: number;
    pageSize?: number;
    searchTerm?: string;
    customerId?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.pageNumber) query.append('pageNumber', params.pageNumber.toString());
    if (params?.pageSize) query.append('pageSize', params.pageSize.toString());
    if (params?.searchTerm) query.append('searchTerm', params.searchTerm);
    if (params?.customerId) query.append('customerId', params.customerId.toString());
    return fetchApi<PaginatedList<Receipt>>(`/invoices/receipts?${query}`);
  },
  getById: (id: number) => fetchApi<ReceiptDetail>(`/invoices/receipts/${id}`),
  getNextNumber: async () => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://localhost:7001/api';
      const response = await fetch(`${API_BASE_URL}/invoices/receipts/next-number`);
      if (!response.ok) {
        return { error: `HTTP error! status: ${response.status}` };
      }
      const text = await response.text();
      // Remove quotes if the response is JSON-wrapped string
      const data = text.replace(/^"|"$/g, '');
      return { data };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
  },
  getUnpaidInvoices: (customerId: number) =>
    fetchApi<UnpaidInvoice[]>(`/invoices/receipts/customer/${customerId}/unpaid-invoices`),
  getPaymentTypes: () => fetchApi<PaymentType[]>('/invoices/receipts/payment-types'),
  create: (data: CreateReceiptRequest) =>
    fetchApi<number>('/invoices/receipts', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: UpdateReceiptRequest) =>
    fetchApi<void>(`/invoices/receipts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) =>
    fetchApi<void>(`/invoices/receipts/${id}`, { method: 'DELETE' }),
};
