import { PaymentMode, PaginatedList, ApiResponse, fetchApi } from './index';

export interface PaymentVoucher {
  id: number;
  paymentNo: string;
  paymentDate: string;
  vendorId: number;
  vendorName?: string;
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
  purchaseInvoiceCount: number;
  purchaseInvoiceNumbers?: string;
  jobNumbers?: string;
  createdAt: string;
}

export interface PaymentVoucherDetail extends PaymentVoucher {
  vendorCode?: string;
  vendorAddress?: string;
  vendorPhone?: string;
  vendorEmail?: string;
  purchaseInvoices: PaymentVoucherPurchaseInvoice[];
}

export interface PaymentVoucherPurchaseInvoice {
  id: number;
  purchaseInvoiceId: number;
  purchaseNo?: string;
  purchaseDate?: string;
  jobNo?: string;
  vesselVoyageBound?: string;
  currencyId?: number;
  currencyCode?: string;
  amount: number;
  invoiceAmount: number;
  totalPaid: number;
  balance: number;
}

export interface UnpaidPurchaseInvoice {
  id: number;
  purchaseNo: string;
  purchaseDate: string;
  jobNo?: string;
  vendorInvoiceNo?: string;
  currencyId?: number;
  currencyCode?: string;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
}

export interface PaymentType {
  id: number;
  code: string;
  name: string;
  description?: string;
  requiresBank: boolean;
  requiresChequeDetails: boolean;
  sortOrder: number;
}

export interface CreatePaymentVoucherRequest {
  paymentDate: string;
  vendorId: number;
  paymentMode: PaymentMode;
  currencyId: number;
  amount: number;
  narration?: string;
  bankId?: number;
  chequeNo?: string;
  chequeDate?: string;
  chequeBank?: string;
  purchaseInvoices: CreatePaymentVoucherPurchaseInvoiceRequest[];
}

export interface CreatePaymentVoucherPurchaseInvoiceRequest {
  purchaseInvoiceId: number;
  amount: number;
  currencyId: number;
}

export interface UpdatePaymentVoucherRequest {
  vendorId: number;
  paymentMode: PaymentMode;
  paymentDate: string;
  narration?: string;
  remarks?: string;
  currencyId?: number;
  bankId?: number;
  chequeNo?: string;
  chequeDate?: string;
  chequeBank?: string;
  amount: number;
}

// Payment Voucher API functions
export async function getPaymentVouchers(params: {
  pageNumber?: number;
  pageSize?: number;
  vendorId?: number;
  searchTerm?: string;
}): Promise<ApiResponse<PaginatedList<PaymentVoucher>>> {
  const queryParams = new URLSearchParams();
  if (params.pageNumber) queryParams.append('pageNumber', params.pageNumber.toString());
  if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
  if (params.vendorId) queryParams.append('vendorId', params.vendorId.toString());
  if (params.searchTerm) queryParams.append('searchTerm', params.searchTerm);

  return fetchApi<PaginatedList<PaymentVoucher>>(`/invoices/payments?${queryParams.toString()}`);
}

export async function getPaymentVoucherById(id: number): Promise<ApiResponse<PaymentVoucherDetail>> {
  return fetchApi<PaymentVoucherDetail>(`/invoices/payments/${id}`);
}

export async function getNextPaymentNumber(): Promise<ApiResponse<string>> {
  try {
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://localhost:7001/api';
    const response = await fetch(`${API_BASE_URL}/invoices/payments/next-number`);
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
}

export async function getUnpaidPurchaseInvoices(vendorId: number): Promise<ApiResponse<UnpaidPurchaseInvoice[]>> {
  return fetchApi<UnpaidPurchaseInvoice[]>(`/invoices/payments/vendor/${vendorId}/unpaid-invoices`);
}

export async function getPaymentVoucherPaymentTypes(): Promise<ApiResponse<PaymentType[]>> {
  return fetchApi<PaymentType[]>('/invoices/payments/payment-types');
}

export async function createPaymentVoucher(request: CreatePaymentVoucherRequest): Promise<ApiResponse<number>> {
  return fetchApi<number>('/invoices/payments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
}

export async function deletePaymentVoucher(id: number): Promise<ApiResponse<void>> {
  return fetchApi<void>(`/invoices/payments/${id}`, {
    method: 'DELETE',
  });
}

export async function updatePaymentVoucher(id: number, request: UpdatePaymentVoucherRequest): Promise<ApiResponse<void>> {
  return fetchApi<void>(`/invoices/payments/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
}

export function getPaymentVoucherPdfUrl(id: number): string {
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://localhost:7001/api';
  return `${API_BASE_URL}/invoices/payments/${id}/pdf`;
}
