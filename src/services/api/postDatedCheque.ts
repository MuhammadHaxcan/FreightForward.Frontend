import { fetchApi, type PaginatedList } from './base';

export interface PostDatedCheque {
  id: number;
  type: string;              // "Incoming" or "Outgoing"
  voucherNo: string;
  voucherDate: string;
  partyName?: string;
  chequeNo?: string;
  chequeDate?: string;
  chequeBank?: string;
  postDatedValidDate?: string;
  currencyCode?: string;
  amount: number;
  status: string;            // "Pending" or "Matured"
}

export function getPostDatedCheques(params?: {
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  type?: string;
  source?: string;
}) {
  const query = new URLSearchParams();
  if (params?.pageNumber) query.append('pageNumber', params.pageNumber.toString());
  if (params?.pageSize) query.append('pageSize', params.pageSize.toString());
  if (params?.searchTerm) query.append('searchTerm', params.searchTerm);
  if (params?.type) query.append('type', params.type);
  if (params?.source) query.append('source', params.source);
  return fetchApi<PaginatedList<PostDatedCheque>>(`/invoices/post-dated-cheques?${query}`);
}
