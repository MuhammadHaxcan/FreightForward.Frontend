import { fetchApi, PaginatedList } from './base';

// General Document Types
export interface GeneralDocument {
  id: number;
  documentName: string;
  filePath?: string;
  originalFileName?: string;
  remarks?: string;
  createdAt: string;
}

export interface CreateGeneralDocumentRequest {
  documentName: string;
  filePath?: string;
  originalFileName?: string;
  remarks?: string;
}

// General Document API
export const generalDocumentApi = {
  getAll: (params?: { pageNumber?: number; pageSize?: number; searchTerm?: string }) => {
    const query = new URLSearchParams();
    if (params?.pageNumber) query.append('pageNumber', params.pageNumber.toString());
    if (params?.pageSize) query.append('pageSize', params.pageSize.toString());
    if (params?.searchTerm) query.append('searchTerm', params.searchTerm);
    return fetchApi<PaginatedList<GeneralDocument>>(`/general-documents?${query}`);
  },
  create: (data: CreateGeneralDocumentRequest) =>
    fetchApi<number>('/general-documents', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id: number) => fetchApi<void>(`/general-documents/${id}`, { method: 'DELETE' }),
};
