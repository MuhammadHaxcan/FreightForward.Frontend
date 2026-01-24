import { fetchApi, PaginatedList } from './base';

export type ExpensePaymentType = 'Inwards' | 'Outwards';

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
  currencyId?: number;
  amount: number;
}

export type UpdateExpenseRequest = CreateExpenseRequest;

export const expenseApi = {
  getExpenses: (params?: { pageNumber?: number; pageSize?: number; searchTerm?: string }) => {
    const query = new URLSearchParams();
    if (params?.pageNumber) query.append('pageNumber', params.pageNumber.toString());
    if (params?.pageSize) query.append('pageSize', params.pageSize.toString());
    if (params?.searchTerm) query.append('searchTerm', params.searchTerm);
    return fetchApi<PaginatedList<Expense>>(`/settings/expenses?${query}`);
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
