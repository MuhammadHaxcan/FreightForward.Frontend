// Re-export everything from all API modules for backward compatibility

// Import APIs for use in combined object
import { bankApi as _bankApi } from './bank';
import { companyApi as _companyApi } from './company';
import { customerApi as _customerApi } from './customer';
import { leadApi as _leadApi, rateRequestApi as _rateRequestApi, quotationApi as _quotationApi } from './sales';
import { shipmentApi as _shipmentApi, fileApi as _fileApi } from './shipment';
import { settingsApi as _settingsApi } from './settings';
import { invoiceApi as _invoiceApi, receiptApi as _receiptApi } from './invoice';
import { costSheetApi as _costSheetApi } from './costSheet';
import { expenseApi as _expenseApi } from './expense';

// Base types and utilities
export { fetchApi, type PaginatedList, type ApiResponse, type MasterType, type PaymentStatus } from './base';

// Bank
export { bankApi, type Bank, type CreateBankRequest, type UpdateBankRequest } from './bank';

// Company
export { companyApi, type Company, type CreateCompanyRequest, type UpdateCompanyRequest } from './company';

// Customer
export {
    customerApi,
    type CustomerCategory,
    type CustomerCategoryInfo,
    type Customer,
    type CustomerDetail,
    type CustomerContact,
    type CustomerAccountDetail,
    type InvoiceReceipt,
    type Invoice,
    type Receipt,
    type CreditNote,
    type CreditNoteDetail,
    type AccountReceivable,
    type AccountPayable,
    type StatementEntry,
    type CustomerStatement,
    type CreateCustomerRequest,
    type NextCustomerCodes,
    type UpdateCustomerRequest,
    type CreateCustomerContactRequest,
    type CreateCreditNoteRequest,
} from './customer';

// Sales
export {
  leadApi,
  rateRequestApi,
  quotationApi,
  type ShippingMode,
  type Incoterms,
  type LeadStatus,
  type RateRequestStatus,
  type QuotationStatus,
  type FreightMode,
  type UnitOfMeasurement,
  type ShippingType,
  type MeasurementType,
  type LeadDetailItem,
  type Lead,
  type CreateLeadDetailRequest,
  type CreateLeadRequest,
  type UpdateLeadRequest,
  type RateRequest,
  type CreateRateRequestRequest,
  type Quotation,
  type QuotationDetail,
  type QuotationCharge,
  type QuotationCargoDetail,
  type QuotationForShipment,
  type CreateQuotationRequest,
} from './sales';

// Shipment
export {
  shipmentApi,
  fileApi,
  type ShipmentStatus,
  type ShipmentDirection,
  type ShipmentMode,
  type BLStatus,
  type BLServiceType,
  type FreightType,
  type PartyType,
  type Shipment,
  type ShipmentDetail,
  type ShipmentParty,
  type ShipmentContainer,
  type ShipmentCosting,
  type ShipmentCargo,
  type ShipmentDocument,
  type ShipmentStatusLog,
  type CreateShipmentRequest,
  type UpdateShipmentRequest,
  type AddShipmentPartyRequest,
  type AddShipmentContainerRequest,
  type UpdateShipmentContainerRequest,
  type AddShipmentCostingRequest,
  type UpdateShipmentCostingRequest,
  type AddShipmentCargoRequest,
  type UpdateShipmentCargoRequest,
  type AddShipmentDocumentRequest,
  type AddShipmentStatusLogRequest,
  type FileUploadResponse,
  type ShipmentInvoiceDto,
  type ShipmentPurchaseInvoiceDto,
  type ShipmentInvoicesResult,
} from './shipment';

// Settings
export {
  settingsApi,
  type PaymentType,
  type TransportMode,
  type CurrencyType,
  type Port,
  type ChargeItem,
  type ExpenseType,
  type IncoTerm,
  type CustomerCategoryType,
  type PackageType,
  type NetworkPartner,
  type BLType,
  type CostingUnit,
  type ContainerType,
  type DocumentType,
  type Country,
  type CreateCurrencyTypeRequest,
  type UpdateCurrencyTypeRequest,
  type CreatePortRequest,
  type UpdatePortRequest,
  type CreateChargeItemRequest,
  type UpdateChargeItemRequest,
  type CreateExpenseTypeRequest,
  type UpdateExpenseTypeRequest,
} from './settings';

// Invoice
export {
  invoiceApi,
  receiptApi,
  type PaymentMode,
  type CreateInvoiceItemRequest,
  type CreateInvoiceRequest,
  type CreatePurchaseInvoiceItemRequest,
  type CreatePurchaseInvoiceRequest,
  type AccountInvoice,
  type AccountInvoiceDetail,
  type AccountInvoiceItem,
  type AccountPurchaseInvoice,
  type AccountPurchaseInvoiceDetail,
  type AccountPurchaseInvoiceItem,
  type Receipt as ReceiptVoucher,
  type ReceiptInvoice,
  type ReceiptDetail,
  type CreateReceiptInvoiceRequest,
  type CreateReceiptRequest,
  type UpdateReceiptRequest,
  type UnpaidInvoice,
  type VatReportItem,
  type VatReportTotals,
  type VatReportResult,
} from './invoice';

// Cost Sheet
export {
  costSheetApi,
  type CostSheetSummaryDto,
  type CostSheetDetailDto,
  type CostSheetCostingDto,
  type CostSheetBillToDto,
  type CostSheetVendorDto,
  type CostSheetInvoiceDto,
  type CostSheetPurchaseInvoiceDto,
} from './costSheet';

// Expense
export {
  expenseApi,
  type ExpensePaymentType,
  type Expense,
  type CreateExpenseRequest,
  type UpdateExpenseRequest,
} from './expense';

// Export combined API object for convenience
export const api = {
  banks: _bankApi,
  companies: _companyApi,
  customers: _customerApi,
  leads: _leadApi,
  rateRequests: _rateRequestApi,
  quotations: _quotationApi,
  shipments: _shipmentApi,
  invoices: _invoiceApi,
  receipts: _receiptApi,
  settings: _settingsApi,
  costSheet: _costSheetApi,
  expenses: _expenseApi,
};

export default api;
