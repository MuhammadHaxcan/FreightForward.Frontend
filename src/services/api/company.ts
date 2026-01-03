import { fetchApi, PaginatedList } from './base';

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
