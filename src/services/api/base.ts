// API Configuration and Base Client
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://localhost:7001/api';

// Common Types
export interface PaginatedList<T> {
  items: T[];
  pageNumber: number;
  totalPages: number;
  totalCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  errors?: string[];
}

// Enums and Common Types
export type MasterType = 'Debtors' | 'Creditors' | 'Neutral';
export type Currency = 'USD' | 'EUR' | 'GBP' | 'AED' | 'PKR' | 'INR' | 'CNY' | 'SGD';
export type PaymentStatus = 'Pending' | 'Paid' | 'PartiallyPaid' | 'Overdue' | 'Closed';

// Generic fetch wrapper
export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return {
        error: errorData?.message || `HTTP error! status: ${response.status}`,
        errors: errorData?.errors || [],
      };
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return { data: undefined as T };
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'An unknown error occurred',
    };
  }
}
