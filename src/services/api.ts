// API Configuration and Base Client
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://localhost:7001/api';

// Types
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

// Generic fetch wrapper
async function fetchApi<T>(
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

// Customer Types
export type MasterType = 'Debtors' | 'Creditors' | 'Neutral';
export type CustomerCategory = 'Shipper' | 'Consignee' | 'BookingParty' | 'Agents' | 'Forwarder' | 'Customer' | 'DeliveryAgent' | 'OriginAgent' | 'NotifyParty' | 'CoLoader';
export type Currency = 'USD' | 'EUR' | 'GBP' | 'AED' | 'PKR' | 'INR' | 'CNY' | 'SGD';
export type PaymentStatus = 'Pending' | 'Paid' | 'PartiallyPaid' | 'Overdue' | 'Closed';

export interface Customer {
  id: number;
  code: string;
  name: string;
  masterType: MasterType;
  masterTypeDisplay: string;
  categoryList: string[];
  phone?: string;
  email?: string;
  country?: string;
  city?: string;
  baseCurrency: Currency;
  taxNo?: string;
  status?: string;
  createdAt: string;
}

export interface CustomerDetail extends Customer {
  fax?: string;
  address?: string;
  taxPercentage?: number;
  carrierCode?: string;
  contacts: CustomerContact[];
  accountDetails: CustomerAccountDetail[];
}

export interface CustomerContact {
  id: number;
  name: string;
  email?: string;
  mobile?: string;
  position?: string;
  phone?: string;
  designation?: string;
  department?: string;
  directTel?: string;
  whatsapp?: string;
  skype?: string;
  enableRateRequest: boolean;
}

export interface CustomerAccountDetail {
  id: number;
  acName?: string;
  bankAcNo?: string;
  currency: Currency;
  type?: string;
  notes?: string;
  swiftCode?: string;
  acType?: string;
  approvedCreditDays?: number;
  alertCreditDays?: number;
  approvedCreditAmount?: number;
  alertCreditAmount?: number;
  cc?: string;
  bcc?: string;
}

export interface Invoice {
  id: number;
  invoiceDate: string;
  invoiceNo: string;
  jobNo?: string;
  hblNo?: string;
  amount: number;
  currency: Currency;
  paymentStatus: PaymentStatus;
  status?: string;
}

export interface Receipt {
  id: number;
  receiptDate: string;
  receiptNo: string;
  type?: string;
  amount: number;
  currency: Currency;
  narration?: string;
}

export interface CreditNote {
  id: number;
  creditNoteNo: string;
  jobNumber?: string;
  creditNoteDate: string;
  referenceNo?: string;
  addedBy?: string;
  status?: string;
  details: CreditNoteDetail[];
}

export interface CreditNoteDetail {
  id: number;
  chargeDetails?: string;
  bases?: string;
  currency: Currency;
  rate: number;
  roe: number;
  quantity: number;
  amount: number;
}

export interface AccountReceivable {
  id: number;
  invoiceDate: string;
  invoiceNo: string;
  customerRef?: string;
  jobHblNo?: string;
  debit: number;
  balance: number;
  paymentStatus: PaymentStatus;
  agingDays: number;
  status?: string;
}

export interface CreateCustomerRequest {
  name: string;
  masterType: MasterType;
  categories?: string[];
  phone?: string;
  fax?: string;
  email?: string;
  country?: string;
  city?: string;
  address?: string;
  baseCurrency?: Currency;
  taxNo?: string;
  taxPercentage?: number;
  carrierCode?: string;
}

export interface UpdateCustomerRequest extends CreateCustomerRequest {
  id: number;
  status?: string;
}

export interface CreateCustomerContactRequest {
  customerId: number;
  name: string;
  email?: string;
  mobile?: string;
  position?: string;
  phone?: string;
  designation?: string;
  department?: string;
  directTel?: string;
  whatsapp?: string;
  skype?: string;
  enableRateRequest?: boolean;
}

export interface CreateCreditNoteRequest {
  customerId: number;
  jobNumber?: string;
  creditNoteDate: string;
  referenceNo?: string;
  email?: string;
  additionalContents?: string;
  details?: {
    chargeDetails?: string;
    bases?: string;
    currency: Currency;
    rate: number;
    roe: number;
    quantity: number;
    amount: number;
  }[];
}

// Customer API
export const customerApi = {
  getAll: (params?: {
    pageNumber?: number;
    pageSize?: number;
    searchTerm?: string;
    masterType?: MasterType;
    category?: CustomerCategory;
  }) => {
    const query = new URLSearchParams();
    if (params?.pageNumber) query.append('pageNumber', params.pageNumber.toString());
    if (params?.pageSize) query.append('pageSize', params.pageSize.toString());
    if (params?.searchTerm) query.append('searchTerm', params.searchTerm);
    if (params?.masterType) query.append('masterType', params.masterType);
    if (params?.category) query.append('category', params.category);
    return fetchApi<PaginatedList<Customer>>(`/customers?${query}`);
  },
  getById: (id: number) => fetchApi<CustomerDetail>(`/customers/${id}`),
  create: (data: CreateCustomerRequest) =>
    fetchApi<number>('/customers', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: UpdateCustomerRequest) =>
    fetchApi<void>(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => fetchApi<void>(`/customers/${id}`, { method: 'DELETE' }),

  // Contacts
  createContact: (customerId: number, data: CreateCustomerContactRequest) =>
    fetchApi<number>(`/customers/${customerId}/contacts`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Invoices
  getInvoices: (customerId: number, params?: { pageNumber?: number; pageSize?: number }) => {
    const query = new URLSearchParams();
    if (params?.pageNumber) query.append('pageNumber', params.pageNumber.toString());
    if (params?.pageSize) query.append('pageSize', params.pageSize.toString());
    return fetchApi<PaginatedList<Invoice>>(`/customers/${customerId}/invoices?${query}`);
  },

  // Receipts
  getReceipts: (customerId: number, params?: { pageNumber?: number; pageSize?: number }) => {
    const query = new URLSearchParams();
    if (params?.pageNumber) query.append('pageNumber', params.pageNumber.toString());
    if (params?.pageSize) query.append('pageSize', params.pageSize.toString());
    return fetchApi<PaginatedList<Receipt>>(`/customers/${customerId}/receipts?${query}`);
  },

  // Credit Notes
  getCreditNotes: (customerId: number, params?: { pageNumber?: number; pageSize?: number }) => {
    const query = new URLSearchParams();
    if (params?.pageNumber) query.append('pageNumber', params.pageNumber.toString());
    if (params?.pageSize) query.append('pageSize', params.pageSize.toString());
    return fetchApi<PaginatedList<CreditNote>>(`/customers/${customerId}/credit-notes?${query}`);
  },
  createCreditNote: (customerId: number, data: CreateCreditNoteRequest) =>
    fetchApi<number>(`/customers/${customerId}/credit-notes`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Account Receivables
  getAccountReceivables: (
    customerId: number,
    params?: { pageNumber?: number; pageSize?: number }
  ) => {
    const query = new URLSearchParams();
    if (params?.pageNumber) query.append('pageNumber', params.pageNumber.toString());
    if (params?.pageSize) query.append('pageSize', params.pageSize.toString());
    return fetchApi<PaginatedList<AccountReceivable>>(
      `/customers/${customerId}/account-receivables?${query}`
    );
  },
};

// Sales Types
export type ShippingMode = 'FCLSeaFreight' | 'LCLSeaFreight' | 'AirFreight';
export type Incoterms = 'EXW' | 'FOB' | 'CFR' | 'CIF' | 'DDU' | 'FCA' | 'DDP' | 'DAP' | 'CPT' | 'CIP';
export type LeadStatus = 'New' | 'Pending' | 'Converted';
export type RateRequestStatus = 'Pending' | 'Sent' | 'Received';
export type QuotationStatus = 'Pending' | 'Approved' | 'Rejected';

export interface Lead {
  id: number;
  leadNo: string;
  leadDate: string;
  customerName: string;
  customerId?: number;
  mode: ShippingMode;
  modeDisplay: string;
  incoterms: Incoterms;
  polCountry?: string;
  podCountry?: string;
  quantity: number;
  weight?: number;
  weightUnit?: string;
  leadStatus: LeadStatus;
  status?: string;
  createdAt: string;
}

export interface CreateLeadRequest {
  customerName: string;
  customerId?: number;
  mode: ShippingMode;
  incoterms: Incoterms;
  polCountry?: string;
  podCountry?: string;
  quantity: number;
  weight?: number;
  weightUnit?: string;
}

export interface UpdateLeadRequest extends CreateLeadRequest {
  id: number;
  leadStatus: LeadStatus;
}

export interface RateRequest {
  id: number;
  rateRequestNo: string;
  requestDate: string;
  leadId?: number;
  mode: ShippingMode;
  modeDisplay: string;
  incoterms: Incoterms;
  vendorName: string;
  vendorId?: number;
  polCountry?: string;
  podCountry?: string;
  requestStatus: RateRequestStatus;
  status?: string;
  createdAt: string;
}

export interface CreateRateRequestRequest {
  leadId?: number;
  mode: ShippingMode;
  incoterms: Incoterms;
  vendorName: string;
  vendorId?: number;
  polCountry?: string;
  podCountry?: string;
}

export interface Quotation {
  id: number;
  quotationNo: string;
  quotationDate: string;
  customerName: string;
  customerId?: number;
  incoterms: Incoterms;
  mode: ShippingMode;
  modeDisplay: string;
  pol?: string;
  pod?: string;
  quoteExpiryDate?: string;
  quotationStatus: QuotationStatus;
  status?: string;
  createdAt: string;
}

export interface QuotationDetail extends Quotation {
  rateRequestId?: number;
  cargoCalculationMode?: string;
  charges: QuotationCharge[];
}

export interface QuotationCharge {
  id: number;
  chargeType?: string;
  bases?: string;
  currency: Currency;
  rate: number;
  roe: number;
  quantity: number;
  amount: number;
}

export interface CreateQuotationRequest {
  rateRequestId?: number;
  customerId?: number;
  customerName: string;
  incoterms: Incoterms;
  mode: ShippingMode;
  pol?: string;
  pod?: string;
  quoteExpiryDate?: string;
  cargoCalculationMode?: string;
  charges?: {
    chargeType?: string;
    bases?: string;
    currency: Currency;
    rate: number;
    roe: number;
    quantity: number;
    amount: number;
  }[];
}

// Sales API
export const leadApi = {
  getAll: (params?: {
    pageNumber?: number;
    pageSize?: number;
    searchTerm?: string;
    status?: LeadStatus;
  }) => {
    const query = new URLSearchParams();
    if (params?.pageNumber) query.append('pageNumber', params.pageNumber.toString());
    if (params?.pageSize) query.append('pageSize', params.pageSize.toString());
    if (params?.searchTerm) query.append('searchTerm', params.searchTerm);
    if (params?.status) query.append('status', params.status);
    return fetchApi<PaginatedList<Lead>>(`/sales/leads?${query}`);
  },
  create: (data: CreateLeadRequest) =>
    fetchApi<number>('/sales/leads', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: UpdateLeadRequest) =>
    fetchApi<void>(`/sales/leads/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
};

export const rateRequestApi = {
  getAll: (params?: {
    pageNumber?: number;
    pageSize?: number;
    searchTerm?: string;
    status?: RateRequestStatus;
  }) => {
    const query = new URLSearchParams();
    if (params?.pageNumber) query.append('pageNumber', params.pageNumber.toString());
    if (params?.pageSize) query.append('pageSize', params.pageSize.toString());
    if (params?.searchTerm) query.append('searchTerm', params.searchTerm);
    if (params?.status) query.append('status', params.status);
    return fetchApi<PaginatedList<RateRequest>>(`/sales/raterequests?${query}`);
  },
  create: (data: CreateRateRequestRequest) =>
    fetchApi<number>('/sales/raterequests', { method: 'POST', body: JSON.stringify(data) }),
};

export const quotationApi = {
  getAll: (params?: {
    pageNumber?: number;
    pageSize?: number;
    searchTerm?: string;
    status?: QuotationStatus;
  }) => {
    const query = new URLSearchParams();
    if (params?.pageNumber) query.append('pageNumber', params.pageNumber.toString());
    if (params?.pageSize) query.append('pageSize', params.pageSize.toString());
    if (params?.searchTerm) query.append('searchTerm', params.searchTerm);
    if (params?.status) query.append('status', params.status);
    return fetchApi<PaginatedList<Quotation>>(`/sales/quotations?${query}`);
  },
  getById: (id: number) => fetchApi<QuotationDetail>(`/sales/quotations/${id}`),
  create: (data: CreateQuotationRequest) =>
    fetchApi<number>('/sales/quotations', { method: 'POST', body: JSON.stringify(data) }),
};

// Shipment Types
export type ShipmentStatus = 'Opened' | 'Closed' | 'Cancelled';
export type ShipmentDirection = 'Import' | 'Export' | 'CrossTrade';
export type ShipmentMode = 'SeaFreightFCL' | 'SeaFreightLCL' | 'AirFreight';
export type BLStatus = 'HBL' | 'MBL' | 'Express';
export type BLServiceType = 'FCLFCL' | 'LCLLCL';
export type FreightType = 'Prepaid' | 'Collect';
export type PartyType = 'Shipper' | 'Consignee' | 'BookingParty' | 'Agents' | 'Forwarder' | 'ShippingLine' | 'AirLine' | 'DeliveryAgent' | 'OriginAgent' | 'NotifyParty' | 'Customer';

export interface Shipment {
  id: number;
  jobNumber: string;
  jobDate: string;
  jobStatus: ShipmentStatus;
  direction: ShipmentDirection;
  directionDisplay: string;
  mode: ShipmentMode;
  modeDisplay: string;
  houseBLNo?: string;
  mblNumber?: string;
  customerName?: string;
  portOfLoading?: string;
  portOfDischarge?: string;
  etd?: string;
  eta?: string;
  carrier?: string;
  vessel?: string;
  addedBy?: string;
  invoiceGenerated: boolean;
  status?: string;
  createdAt: string;
}

export interface ShipmentDetail extends Shipment {
  incoterms?: Incoterms;
  houseBLDate?: string;
  houseBLStatus?: BLStatus;
  hblServiceType?: BLServiceType;
  hblNoBLIssued?: string;
  hblFreight?: FreightType;
  mblDate?: string;
  mblStatus?: BLStatus;
  mblServiceType?: BLServiceType;
  mblNoBLIssued?: string;
  mblFreight?: FreightType;
  placeOfBLIssue?: string;
  freeTime?: string;
  networkPartner?: string;
  assignedTo?: string;
  placeOfReceipt?: string;
  portOfReceipt?: string;
  portOfFinalDestination?: string;
  placeOfDelivery?: string;
  voyage?: string;
  secondLegVessel: boolean;
  secondLegVesselName?: string;
  secondLegVoyage?: string;
  secondLegETD?: string;
  secondLegETA?: string;
  marksNumbers?: string;
  notes?: string;
  internalNotes?: string;
  parties: ShipmentParty[];
  containers: ShipmentContainer[];
  costings: ShipmentCosting[];
  cargos: ShipmentCargo[];
  documents: ShipmentDocument[];
  statusLogs: ShipmentStatusLog[];
}

export interface ShipmentParty {
  id: number;
  masterType: MasterType;
  partyType: PartyType;
  customerId?: number;
  customerName: string;
  mobile?: string;
  phone?: string;
  email?: string;
}

export interface ShipmentContainer {
  id: number;
  containerNumber: string;
  containerType?: string;
  sealNo?: string;
  noOfPcs: number;
  packageType?: string;
  grossWeight: number;
  volume: number;
}

export interface ShipmentCosting {
  id: number;
  description: string;
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
  unit?: string;
  gp: number;
  billToCustomerId?: number;
  billToName?: string;
  voucherNumber?: string;
  voucherStatus?: string;
}

export interface ShipmentCargo {
  id: number;
  quantity: number;
  loadType?: string;
  totalCBM?: number;
  totalWeight?: number;
  description?: string;
}

export interface ShipmentDocument {
  id: number;
  documentType: string;
  documentNo: string;
  docDate: string;
  filePath?: string;
}

export interface ShipmentStatusLog {
  id: number;
  statusDate: string;
  remarks?: string;
}

export interface CreateShipmentRequest {
  direction: ShipmentDirection;
  mode: ShipmentMode;
  incoterms?: Incoterms;
  houseBLNo?: string;
  houseBLDate?: string;
  houseBLStatus?: BLStatus;
  hblServiceType?: BLServiceType;
  hblNoBLIssued?: string;
  hblFreight?: FreightType;
  mblNumber?: string;
  mblDate?: string;
  mblStatus?: BLStatus;
  mblServiceType?: BLServiceType;
  mblNoBLIssued?: string;
  mblFreight?: FreightType;
  placeOfBLIssue?: string;
  carrier?: string;
  freeTime?: string;
  networkPartner?: string;
  placeOfReceipt?: string;
  portOfReceipt?: string;
  portOfLoading?: string;
  portOfDischarge?: string;
  portOfFinalDestination?: string;
  placeOfDelivery?: string;
  vessel?: string;
  voyage?: string;
  etd?: string;
  eta?: string;
  secondLegVessel?: boolean;
  secondLegVesselName?: string;
  secondLegVoyage?: string;
  secondLegETD?: string;
  secondLegETA?: string;
  marksNumbers?: string;
  notes?: string;
  internalNotes?: string;
}

export interface UpdateShipmentRequest extends CreateShipmentRequest {
  id: number;
  jobStatus: ShipmentStatus;
  assignedTo?: string;
}

export interface AddShipmentPartyRequest {
  shipmentId: number;
  masterType: MasterType;
  partyType: PartyType;
  customerId?: number;
  customerName: string;
  mobile?: string;
  phone?: string;
  email?: string;
}

export interface AddShipmentContainerRequest {
  shipmentId: number;
  containerNumber: string;
  containerType?: string;
  sealNo?: string;
  noOfPcs: number;
  packageType?: string;
  grossWeight: number;
  volume: number;
}

export interface AddShipmentCostingRequest {
  shipmentId: number;
  description: string;
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
  unit?: string;
  gp: number;
  billToCustomerId?: number;
  billToName?: string;
}

// Shipment API
export const shipmentApi = {
  getAll: (params?: {
    pageNumber?: number;
    pageSize?: number;
    searchTerm?: string;
    status?: ShipmentStatus;
    fromDate?: string;
    toDate?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.pageNumber) query.append('pageNumber', params.pageNumber.toString());
    if (params?.pageSize) query.append('pageSize', params.pageSize.toString());
    if (params?.searchTerm) query.append('searchTerm', params.searchTerm);
    if (params?.status) query.append('status', params.status);
    if (params?.fromDate) query.append('fromDate', params.fromDate);
    if (params?.toDate) query.append('toDate', params.toDate);
    return fetchApi<PaginatedList<Shipment>>(`/shipments?${query}`);
  },
  getById: (id: number) => fetchApi<ShipmentDetail>(`/shipments/${id}`),
  create: (data: CreateShipmentRequest) =>
    fetchApi<number>('/shipments', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: UpdateShipmentRequest) =>
    fetchApi<void>(`/shipments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => fetchApi<void>(`/shipments/${id}`, { method: 'DELETE' }),

  // Parties
  addParty: (shipmentId: number, data: AddShipmentPartyRequest) =>
    fetchApi<number>(`/shipments/${shipmentId}/parties`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteParty: (id: number) => fetchApi<void>(`/shipments/parties/${id}`, { method: 'DELETE' }),

  // Containers
  addContainer: (shipmentId: number, data: AddShipmentContainerRequest) =>
    fetchApi<number>(`/shipments/${shipmentId}/containers`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteContainer: (id: number) => fetchApi<void>(`/shipments/containers/${id}`, { method: 'DELETE' }),

  // Costings
  addCosting: (shipmentId: number, data: AddShipmentCostingRequest) =>
    fetchApi<number>(`/shipments/${shipmentId}/costings`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteCosting: (id: number) => fetchApi<void>(`/shipments/costings/${id}`, { method: 'DELETE' }),
};

// Settings Types
export type PaymentType = 'Inwards' | 'Outwards';

export interface CurrencyType {
  id: number;
  name: string;
  code: string;
  symbol: string;
  decimalName?: string;
  usdRate: number;
  roe: number;
}

export interface Port {
  id: number;
  name: string;
  country: string;
  code?: string;
}

export interface ChargeItem {
  id: number;
  name: string;
  description?: string;
}

export interface ExpenseType {
  id: number;
  paymentDirection: PaymentType;
  paymentDirectionName: string;
  name: string;
  description?: string;
}

export interface CreateCurrencyTypeRequest {
  name: string;
  code: string;
  symbol: string;
  decimalName?: string;
  usdRate: number;
  roe: number;
}

export interface UpdateCurrencyTypeRequest extends CreateCurrencyTypeRequest {
  id: number;
}

export interface CreatePortRequest {
  name: string;
  country: string;
  code?: string;
}

export interface UpdatePortRequest extends CreatePortRequest {
  id: number;
}

export interface CreateChargeItemRequest {
  name: string;
  description?: string;
}

export interface UpdateChargeItemRequest extends CreateChargeItemRequest {
  id: number;
}

export interface CreateExpenseTypeRequest {
  paymentDirection: PaymentType;
  name: string;
  description?: string;
}

export interface UpdateExpenseTypeRequest extends CreateExpenseTypeRequest {
  id: number;
}

// Settings API
export const settingsApi = {
  // Currency Types
  getCurrencyTypes: (params?: { pageNumber?: number; pageSize?: number; searchTerm?: string }) => {
    const query = new URLSearchParams();
    if (params?.pageNumber) query.append('pageNumber', params.pageNumber.toString());
    if (params?.pageSize) query.append('pageSize', params.pageSize.toString());
    if (params?.searchTerm) query.append('searchTerm', params.searchTerm);
    return fetchApi<PaginatedList<CurrencyType>>(`/settings/currency-types?${query}`);
  },
  createCurrencyType: (data: CreateCurrencyTypeRequest) =>
    fetchApi<number>('/settings/currency-types', { method: 'POST', body: JSON.stringify(data) }),
  updateCurrencyType: (id: number, data: UpdateCurrencyTypeRequest) =>
    fetchApi<void>(`/settings/currency-types/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCurrencyType: (id: number) =>
    fetchApi<void>(`/settings/currency-types/${id}`, { method: 'DELETE' }),

  // Ports
  getPorts: (params?: { pageNumber?: number; pageSize?: number; searchTerm?: string }) => {
    const query = new URLSearchParams();
    if (params?.pageNumber) query.append('pageNumber', params.pageNumber.toString());
    if (params?.pageSize) query.append('pageSize', params.pageSize.toString());
    if (params?.searchTerm) query.append('searchTerm', params.searchTerm);
    return fetchApi<PaginatedList<Port>>(`/settings/ports?${query}`);
  },
  createPort: (data: CreatePortRequest) =>
    fetchApi<number>('/settings/ports', { method: 'POST', body: JSON.stringify(data) }),
  updatePort: (id: number, data: UpdatePortRequest) =>
    fetchApi<void>(`/settings/ports/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePort: (id: number) =>
    fetchApi<void>(`/settings/ports/${id}`, { method: 'DELETE' }),

  // Charge Items
  getChargeItems: (params?: { pageNumber?: number; pageSize?: number; searchTerm?: string }) => {
    const query = new URLSearchParams();
    if (params?.pageNumber) query.append('pageNumber', params.pageNumber.toString());
    if (params?.pageSize) query.append('pageSize', params.pageSize.toString());
    if (params?.searchTerm) query.append('searchTerm', params.searchTerm);
    return fetchApi<PaginatedList<ChargeItem>>(`/settings/charge-items?${query}`);
  },
  createChargeItem: (data: CreateChargeItemRequest) =>
    fetchApi<number>('/settings/charge-items', { method: 'POST', body: JSON.stringify(data) }),
  updateChargeItem: (id: number, data: UpdateChargeItemRequest) =>
    fetchApi<void>(`/settings/charge-items/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteChargeItem: (id: number) =>
    fetchApi<void>(`/settings/charge-items/${id}`, { method: 'DELETE' }),

  // Expense Types
  getExpenseTypes: (params?: { pageNumber?: number; pageSize?: number; searchTerm?: string; paymentDirection?: PaymentType }) => {
    const query = new URLSearchParams();
    if (params?.pageNumber) query.append('pageNumber', params.pageNumber.toString());
    if (params?.pageSize) query.append('pageSize', params.pageSize.toString());
    if (params?.searchTerm) query.append('searchTerm', params.searchTerm);
    if (params?.paymentDirection) query.append('paymentDirection', params.paymentDirection);
    return fetchApi<PaginatedList<ExpenseType>>(`/settings/expense-types?${query}`);
  },
  getAllExpenseTypes: () =>
    fetchApi<ExpenseType[]>('/settings/expense-types/all'),
  getExpenseTypesByDirection: (paymentDirection: 'Inwards' | 'Outwards') =>
    fetchApi<ExpenseType[]>(`/settings/expense-types/by-direction/${paymentDirection === 'Inwards' ? 0 : 1}`),
  createExpenseType: (data: CreateExpenseTypeRequest) =>
    fetchApi<number>('/settings/expense-types', { method: 'POST', body: JSON.stringify(data) }),
  updateExpenseType: (id: number, data: UpdateExpenseTypeRequest) =>
    fetchApi<void>(`/settings/expense-types/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteExpenseType: (id: number) =>
    fetchApi<void>(`/settings/expense-types/${id}`, { method: 'DELETE' }),
};

// Export all APIs
export const api = {
  banks: bankApi,
  companies: companyApi,
  customers: customerApi,
  leads: leadApi,
  rateRequests: rateRequestApi,
  quotations: quotationApi,
  shipments: shipmentApi,
  settings: settingsApi,
};

export default api;
