import { fetchApi } from './base';

export interface SalespersonLookup {
  id: number;
  employeeCode: string;
  fullName: string;
}

export const lookupApi = {
  getSalespersons: () => fetchApi<SalespersonLookup[]>('/lookups/salespersons'),
};
