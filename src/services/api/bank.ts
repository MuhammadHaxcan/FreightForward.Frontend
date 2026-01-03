import { fetchApi, PaginatedList } from './base';

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
