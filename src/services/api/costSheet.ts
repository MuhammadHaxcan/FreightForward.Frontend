import { fetchApi, API_BASE_URL, fetchBlob } from './base';

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
  baseCurrencyCode: string;
  costings: CostSheetCostingDto[];
  billToItems: CostSheetBillToDto[];
  vendorItems: CostSheetVendorDto[];
  unlinkedSaleItems: CostSheetUnlinkedItemDto[];
  unlinkedCostItems: CostSheetUnlinkedItemDto[];
  totalSaleLCY: number;
  totalCostLCY: number;
  profit: number;
  marginPercent: number;
  totalBilledSaleLCY: number;
  totalUnbilledSaleLCY: number;
  totalBilledCostLCY: number;
  totalUnbilledCostLCY: number;
  totalCustomerInvoiceLCY: number;
  totalCustomerPaidLCY: number;
  totalCustomerUnpaidLCY: number;
  totalVendorInvoiceLCY: number;
  totalVendorPaidLCY: number;
  totalVendorUnpaidLCY: number;
}

// Costing line item
export interface CostSheetCostingDto {
  id: number;
  serialNo: number;
  description?: string;
  saleQty: number;
  saleUnit: number;
  saleCurrencyId?: number;
  saleCurrencyCode?: string;
  saleExRate: number;
  saleFCY: number;
  saleLCY: number;
  costQty: number;
  costUnit: number;
  costCurrencyId?: number;
  costCurrencyCode?: string;
  costExRate: number;
  costFCY: number;
  costLCY: number;
  unitName?: string;
  gp: number;
  billedSaleLCY: number;
  unbilledSaleLCY: number;
  billedCostLCY: number;
  unbilledCostLCY: number;
}

// Bill To section
export interface CostSheetBillToDto {
  customerId?: number;
  customerName?: string;
  pSale: number;
  invoiceTotalLCY: number;
  paidLCY: number;
  unpaidLCY: number;
  invoices: CostSheetInvoiceDto[];
}

// Vendor section
export interface CostSheetVendorDto {
  vendorId?: number;
  vendorName?: string;
  pCost: number;
  invoiceTotalLCY: number;
  paidLCY: number;
  unpaidLCY: number;
  purchaseInvoices: CostSheetPurchaseInvoiceDto[];
}

// Invoice info
export interface CostSheetInvoiceDto {
  invoiceId: number;
  invoiceNo?: string;
  invoiceDate: string;
  customerName?: string;
  currencyCode?: string;
  totalLCY: number;
  paidLCY: number;
  unpaidLCY: number;
  status?: string;
  linkedCostingIds: number[];
}

// Purchase Invoice info
export interface CostSheetPurchaseInvoiceDto {
  purchaseInvoiceId: number;
  purchaseNo?: string;
  purchaseDate: string;
  vendorName?: string;
  currencyCode?: string;
  totalLCY: number;
  paidLCY: number;
  unpaidLCY: number;
  status?: string;
  linkedCostingIds: number[];
}

export interface CostSheetUnlinkedItemDto {
  itemId: number;
  documentId: number;
  documentNo?: string;
  documentDate: string;
  partyName?: string;
  chargeDetails?: string;
  currencyCode?: string;
  fcyAmount: number;
  exRate: number;
  localAmount: number;
  taxAmount: number;
}

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
      const response = await fetchBlob(`${API_BASE_URL}/cost-sheet/pdf?fromDate=${fromDate}&toDate=${toDate}`);
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
      const response = await fetchBlob(`${API_BASE_URL}/cost-sheet/${shipmentId}/pdf`);
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
