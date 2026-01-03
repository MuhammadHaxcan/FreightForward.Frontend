// Re-export everything from all API modules for backward compatibility

// Import APIs for use in combined object
import { bankApi as _bankApi } from './bank';
import { companyApi as _companyApi } from './company';
import { customerApi as _customerApi } from './customer';
import { leadApi as _leadApi, rateRequestApi as _rateRequestApi, quotationApi as _quotationApi } from './sales';
import { shipmentApi as _shipmentApi } from './shipment';
import { settingsApi as _settingsApi } from './settings';
import { invoiceApi as _invoiceApi } from './invoice';

// Base types and utilities
export { fetchApi, type PaginatedList, type ApiResponse, type MasterType, type Currency, type PaymentStatus } from './base';

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
  type Invoice,
  type Receipt,
  type CreditNote,
  type CreditNoteDetail,
  type AccountReceivable,
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
  type Lead,
  type CreateLeadRequest,
  type UpdateLeadRequest,
  type RateRequest,
  type CreateRateRequestRequest,
  type Quotation,
  type QuotationDetail,
  type QuotationCharge,
  type CreateQuotationRequest,
} from './sales';

// Shipment
export {
  shipmentApi,
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
  type ShipmentInvoiceDto,
  type ShipmentPurchaseInvoiceDto,
  type ShipmentInvoicesResult,
} from './shipment';

// Settings
export {
  settingsApi,
  type PaymentType,
  type CurrencyType,
  type Port,
  type ChargeItem,
  type ExpenseType,
  type IncoTerm,
  type CustomerCategoryType,
  type PackageType,
  type NetworkPartner,
  type TransportMode,
  type BLType,
  type CostingUnit,
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
  type CreateInvoiceItemRequest,
  type CreateInvoiceRequest,
  type CreatePurchaseInvoiceItemRequest,
  type CreatePurchaseInvoiceRequest,
  type AccountInvoice,
  type AccountInvoiceDetail,
  type AccountInvoiceItem,
} from './invoice';

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
  settings: _settingsApi,
};

export default api;
