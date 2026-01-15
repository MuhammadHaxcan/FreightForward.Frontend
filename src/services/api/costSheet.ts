import { fetchApi, Currency } from './base';

// Cost Sheet Summary DTO (for list)
export interface CostSheetSummaryDto {
  shipmentId: number;
  jobNumber?: string;
  jobDate: string;
  jobStatus?: string;
  direction?: string;
  mode?: string;
  salesPerson?: string;
  totalSaleLCY: number;
  totalCostLCY: number;
  gp: number;
}

// Cost Sheet Detail DTO
export interface CostSheetDetailDto {
  shipmentId: number;
  jobNumber?: string;
  jobDate: string;
  jobStatus?: string;
  direction?: string;
  mode?: string;
  costings: CostSheetCostingDto[];
  billToItems: CostSheetBillToDto[];
  vendorItems: CostSheetVendorDto[];
  totalSaleLCY: number;
  totalCostLCY: number;
  profit: number;
}

// Costing line item
export interface CostSheetCostingDto {
  id: number;
  serialNo: number;
  description?: string;
  saleQty: number;
  saleUnit: number;
  saleCurrency: Currency;
  saleExRate: number;
  saleFCY: number;
  saleLCY: number;
  costQty: number;
  costUnit: number;
  costCurrency: Currency;
  costExRate: number;
  costFCY: number;
  costLCY: number;
  unitName?: string;
  gp: number;
}

// Bill To section
export interface CostSheetBillToDto {
  customerId?: number;
  customerName?: string;
  pSale: number;
  invoices: CostSheetInvoiceDto[];
}

// Vendor section
export interface CostSheetVendorDto {
  vendorId?: number;
  vendorName?: string;
  pCost: number;
  purchaseInvoices: CostSheetPurchaseInvoiceDto[];
}

// Invoice info
export interface CostSheetInvoiceDto {
  invoiceId: number;
  invoiceNo?: string;
  status?: string;
}

// Purchase Invoice info
export interface CostSheetPurchaseInvoiceDto {
  purchaseInvoiceId: number;
  purchaseNo?: string;
  status?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://localhost:7001/api';

export const costSheetApi = {
  // Get cost sheet summary list
  getList: (fromDate: string, toDate: string) =>
    fetchApi<CostSheetSummaryDto[]>(`/cost-sheet?fromDate=${fromDate}&toDate=${toDate}`),

  // Get cost sheet detail for a shipment
  getDetail: (shipmentId: number) =>
    fetchApi<CostSheetDetailDto>(`/cost-sheet/${shipmentId}`),

  // Download cost sheet report PDF
  getReportPdf: async (fromDate: string, toDate: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/cost-sheet/pdf?fromDate=${fromDate}&toDate=${toDate}`);
      if (!response.ok) {
        return { error: `HTTP error! status: ${response.status}` };
      }
      const blob = await response.blob();
      return { data: blob };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
  },

  // Download cost sheet detail PDF
  getDetailPdf: async (shipmentId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/cost-sheet/${shipmentId}/pdf`);
      if (!response.ok) {
        return { error: `HTTP error! status: ${response.status}` };
      }
      const blob = await response.blob();
      return { data: blob };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
  },
};
