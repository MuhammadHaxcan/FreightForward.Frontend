import { fetchApi, PaginatedList } from './base';

export type ExpensePaymentType = 'Inwards' | 'Outwards';
export type ExpensePaymentMode = 'Cash' | 'Cheque' | 'BankWire' | 'BankTransfer' | 'Card' | 'PostDatedCheque';

export interface ExpenseListFilters {
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  startDate?: string;
  endDate?: string;
  bankId?: number;
  expenseTypeId?: number;
  paymentType?: ExpensePaymentType;
  paymentMode?: ExpensePaymentMode;
}

export type ExpenseSummaryFilters = Omit<ExpenseListFilters, 'pageNumber' | 'pageSize'>;

export interface ExpenseSummary {
  totalCashReceipts: number;
  totalBankReceipts: number;
  totalCashPayments: number;
  totalBankPayments: number;
  netCashFlow: number;
  totalCount: number;
}

export interface Expense {
  id: number;
  expenseDate: string;
  paymentType: ExpensePaymentType;
  paymentMode: string;
  category: string;
  expenseTypeId?: number;
  bankId?: number;
  bankName?: string;
  description?: string;
  receiptRef?: string;
  chequeNumber?: string;
  chequeDate?: string;
  postDatedValidDate?: string;
  currencyId?: number;
  currencyCode?: string;
  amount: number;
}

export interface CreateExpenseRequest {
  expenseDate: string;
  paymentType: ExpensePaymentType;
  paymentMode: string;
  category: string;
  expenseTypeId?: number;
  bankId?: number;
  description?: string;
  receiptRef?: string;
  chequeNumber?: string;
  chequeDate?: string;
  postDatedValidDate?: string;
  currencyId?: number;
  amount: number;
}

export type UpdateExpenseRequest = CreateExpenseRequest;

function appendExpenseFilters(query: URLSearchParams, params?: ExpenseListFilters | ExpenseSummaryFilters) {
  if (!params) return;
  if (params.searchTerm) query.append('searchTerm', params.searchTerm);
  if (params.startDate) query.append('startDate', params.startDate);
  if (params.endDate) query.append('endDate', params.endDate);
  if (params.bankId !== undefined) query.append('bankId', params.bankId.toString());
  if (params.expenseTypeId !== undefined) query.append('expenseTypeId', params.expenseTypeId.toString());
  if (params.paymentType) query.append('paymentType', params.paymentType);
  if (params.paymentMode) query.append('paymentMode', params.paymentMode);
}

export const expenseApi = {
  getExpenses: (params?: ExpenseListFilters) => {
    const query = new URLSearchParams();
    if (params?.pageNumber) query.append('pageNumber', params.pageNumber.toString());
    if (params?.pageSize) query.append('pageSize', params.pageSize.toString());
    appendExpenseFilters(query, params);
    return fetchApi<PaginatedList<Expense>>(`/settings/expenses?${query}`);
  },

  getExpenseSummary: (params?: ExpenseSummaryFilters) => {
    const query = new URLSearchParams();
    appendExpenseFilters(query, params);
    return fetchApi<ExpenseSummary>(`/settings/expenses/summary?${query}`);
  },

  getExpenseById: (id: number) =>
    fetchApi<Expense>(`/settings/expenses/${id}`),

  createExpense: (data: CreateExpenseRequest) =>
    fetchApi<number>('/settings/expenses', { method: 'POST', body: JSON.stringify(data) }),

  updateExpense: (id: number, data: UpdateExpenseRequest) =>
    fetchApi<void>(`/settings/expenses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteExpense: (id: number) =>
    fetchApi<void>(`/settings/expenses/${id}`, { method: 'DELETE' }),
};
