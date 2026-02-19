import { fetchApi, PaginatedList } from './base';
import type { ShipmentMode } from './shipment';
export type LeadStatus = 'New' | 'Pending' | 'Converted';
export type RateRequestStatus = 'Pending' | 'Sent' | 'Received';
export type QuotationStatus = 'Pending' | 'Approved' | 'Rejected';

// New Lead form types
export type FreightMode = 'SeaFreight' | 'AirFreight' | 'LandFreight';
export type UnitOfMeasurement = 'KG' | 'LB';
export type ShippingType = 'FTL' | 'LTL';
export type MeasurementType = 'Total' | 'PerUnit';
export type LeadType = 'ManualLead' | 'PortalLead';

// LeadDetail item (for Equipment and BoxPallet)
export interface LeadDetailItem {
  id?: number;
  detailType: string; // "Equipment" or "BoxPallet"
  quantity: number;
  containerTypeId?: number;
  containerTypeName?: string;
  subCategory?: string;
  packageTypeId?: number;
  packageTypeName?: string;
  length?: number;
  width?: number;
  height?: number;
  measurementType?: MeasurementType;
  volume?: number;
  weight: number;
}

// Portal Lead types (from master schema)
export type PortalLeadStatus = 'Available' | 'Accepted';

export interface PortalLead {
  id: number;
  leadNo: string;
  leadDate: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  freightMode: string;
  shippingType: string;
  pickupCountryName?: string;
  deliveryCountryName?: string;
  loadingPortName?: string;
  destinationPortName?: string;
  incoTermCode?: string;
  portalLeadStatus: PortalLeadStatus;
  acceptedByOfficeName?: string;
  createdAt: string;
}

export interface PortalLeadDetail extends PortalLead {
  unitOfMeasurement: string;
  pickupCountryId?: number;
  loadingPortId?: number;
  pickupAddress?: string;
  deliveryCountryId?: number;
  destinationPortId?: number;
  deliveryAddress?: string;
  goodsReadyDate?: string;
  customerReferenceNo?: string;
  hsCode?: string;
  productType?: string;
  productDescription?: string;
  incoTermId?: number;
  details: LeadDetailItem[];
}

export interface AcceptPortalLeadResponse {
  localLeadId: number;
  leadNo: string;
}

export interface Lead {
  id: number;
  leadNo: string;
  leadDate: string;

  // Section 1: Contact Information
  fullName: string;
  email: string;
  phoneNumber: string;
  freightMode: FreightMode;

  // Section 2: Shipping Details
  unitOfMeasurement: UnitOfMeasurement;
  shippingType: ShippingType;
  details?: LeadDetailItem[];

  // Section 3: Pickup & Drop-Off
  pickupCountryId?: number;
  pickupCountryName?: string;
  loadingPortId?: number;
  loadingPortName?: string;
  pickupAddress?: string;
  deliveryCountryId?: number;
  deliveryCountryName?: string;
  destinationPortId?: number;
  destinationPortName?: string;
  deliveryAddress?: string;
  goodsReadyDate?: string;
  customerReferenceNo?: string;
  hsCode?: string;

  // Section 4: Product Details
  productType?: string;
  productDescription?: string;
  incoTermId?: number;
  incoTermCode?: string;

  // Existing fields for compatibility
  customerName: string;
  customerId?: number;
  mode?: ShipmentMode;
  modeDisplay?: string;
  polCountry?: string;
  podCountry?: string;
  quantity?: number;
  weight?: number;
  weightUnit?: string;
  leadStatus: LeadStatus;
  leadType: LeadType;
  portalLeadId?: number;
  status?: string;
  createdAt: string;
}

// Request DTOs
export interface CreateLeadDetailRequest {
  detailType: string;
  quantity: number;
  containerTypeId?: number;
  subCategory?: string;
  packageTypeId?: number;
  length?: number;
  width?: number;
  height?: number;
  measurementType?: string;
  volume?: number;
  weight: number;
}

export interface CreateLeadRequest {
  leadType?: LeadType;
  customerId?: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  freightMode: FreightMode;
  unitOfMeasurement: UnitOfMeasurement;
  shippingType: ShippingType;
  details?: CreateLeadDetailRequest[];
  pickupCountryId?: number;
  loadingPortId?: number;
  pickupAddress?: string;
  deliveryCountryId?: number;
  destinationPortId?: number;
  deliveryAddress?: string;
  goodsReadyDate?: string;
  customerReferenceNo?: string;
  hsCode?: string;
  productType?: string;
  productDescription?: string;
  incoTermId?: number;
}

export interface UpdateLeadRequest extends CreateLeadRequest {
  leadStatus: LeadStatus;
}

export interface RateRequest {
  id: number;
  rateRequestNo: string;
  requestDate: string;
  leadId?: number;
  leadNo?: string;
  mode: ShipmentMode;
  modeDisplay: string;
  vendorName: string;
  vendorId?: number;
  polCountry?: string;
  podCountry?: string;
  requestStatus: RateRequestStatus;
  status?: string;
  createdAt: string;

  // NEW vendor fields
  vendorType?: string;
  vendorEmail?: string;

  // Lead-like fields
  fullName: string;
  email: string;
  phoneNumber: string;
  freightMode: string;
  unitOfMeasurement: string;
  shippingType: string;
  pickupCountryId?: number;
  pickupCountryName?: string;
  loadingPortId?: number;
  loadingPortName?: string;
  pickupAddress?: string;
  deliveryCountryId?: number;
  deliveryCountryName?: string;
  destinationPortId?: number;
  destinationPortName?: string;
  deliveryAddress?: string;
  goodsReadyDate?: string;
  customerReferenceNo?: string;
  hsCode?: string;
  productType?: string;
  productDescription?: string;
  incoTermId?: number;
  incoTermCode?: string;
}

export interface CreateRateRequestRequest {
  leadId?: number;
  mode?: ShipmentMode;
  vendorName: string;
  vendorId?: number;
  polCountry?: string;
  podCountry?: string;
  // NEW vendor fields
  vendorType?: string;
  vendorEmail?: string;
}

export interface UpdateRateRequestRequest {
  status?: string;
}

export interface Quotation {
  id: number;
  quotationNo: string;
  quotationDate: string;
  customerName: string;
  customerId?: number;
  mode: ShipmentMode;
  modeDisplay: string;
  pol?: string;
  pod?: string;
  quoteExpiryDate?: string;
  quotationStatus: QuotationStatus;
  status?: string;
  createdAt: string;

  // New fields
  contactPersonId?: number;
  contactPersonName?: string;
  customerRefCode?: string;
  quotationBookingNo?: string;
  loadingPortId?: number;
  loadingPortName?: string;
  destinationPortId?: number;
  destinationPortName?: string;
  pickupAddress?: string;
  deliveryAddress?: string;
  incoTermId?: number;
  incoTermCode?: string;
  remarks?: string;
  cfs?: string;
  documentRequired?: string;
  notes?: string;
  notesForBooking?: string;
}

export interface QuotationDetail extends Quotation {
  rateRequestId?: number;
  cargoCalculationMode?: string;
  charges: QuotationCharge[];
  cargoDetails: QuotationCargoDetail[];
}

export interface QuotationCharge {
  id: number;
  chargeType?: string;
  chargeItemId?: number;
  costingUnitId?: number;
  bases?: string;
  currencyId?: number;
  currencyCode?: string;
  rate: number;
  roe: number;
  quantity: number;
  amount: number;
}

export interface QuotationCargoDetail {
  id: number;
  calculationMode: string;
  quantity: number;
  packageTypeId?: number;
  packageTypeName?: string;
  loadType?: string;
  length?: number;
  width?: number;
  height?: number;
  volumeUnit?: string;
  cbm?: number;
  weight?: number;
  weightUnit?: string;
  totalCbm?: number;
  totalWeight?: number;
  cargoDescription?: string;
}

export interface CreateQuotationCargoDetailRequest {
  calculationMode: string;
  quantity: number;
  packageTypeId?: number;
  loadType?: string;
  length?: number;
  width?: number;
  height?: number;
  volumeUnit?: string;
  cbm?: number;
  weight?: number;
  weightUnit?: string;
  totalCbm?: number;
  totalWeight?: number;
  cargoDescription?: string;
}

export interface CreateQuotationRequest {
  quotationDate: string;
  rateRequestId?: number;
  customerId?: number;
  customerName: string;
  mode?: ShipmentMode;
  pol?: string;
  pod?: string;
  quoteExpiryDate?: string;
  cargoCalculationMode?: string;
  status?: string;

  // New fields
  contactPersonId?: number;
  customerRefCode?: string;
  quotationBookingNo?: string;
  loadingPortId?: number;
  destinationPortId?: number;
  pickupAddress?: string;
  deliveryAddress?: string;
  incoTermId?: number;
  remarks?: string;
  cfs?: string;
  documentRequired?: string;
  notes?: string;
  notesForBooking?: string;

  charges?: {
    chargeType?: string;
    chargeItemId?: number;
    costingUnitId?: number;
    bases?: string;
    currencyId?: number;
    rate: number;
    roe: number;
    quantity: number;
    amount: number;
  }[];
  cargoDetails?: CreateQuotationCargoDetailRequest[];
}

export type UpdateQuotationRequest = CreateQuotationRequest;

// RateRequest for conversion to Quotation
export interface RateRequestForConversion {
  id: number;
  rateRequestNo: string;
  rateRequestDate: string;
  leadId?: number;
  leadNo?: string;

  // Customer/Contact info
  customerId?: number;
  customerName?: string;
  fullName: string;
  email: string;
  phoneNumber: string;

  // Shipping info
  freightMode: string;
  unitOfMeasurement: string;
  shippingType: string;
  shipmentDirection?: string;
  shipmentMode?: string;

  // Location info
  pickupCountryId?: number;
  pickupCountryName?: string;
  loadingPortId?: number;
  loadingPortName?: string;
  pickupAddress?: string;
  deliveryCountryId?: number;
  deliveryCountryName?: string;
  destinationPortId?: number;
  destinationPortName?: string;
  deliveryAddress?: string;

  // Additional info
  goodsReadyDate?: string;
  customerReferenceNo?: string;
  hsCode?: string;
  productType?: string;
  productDescription?: string;
  incoTermId?: number;
  incoTermCode?: string;

  // Lead details for cargo
  leadDetails: LeadDetailItem[];
}

// Quotation for Shipment conversion
export interface QuotationForShipment {
  id: number;
  quotationNo: string;
  quotationBookingNo?: string;

  // Customer/Party Info
  customerId?: number;
  customerName: string;
  contactPersonId?: number;
  contactPersonName?: string;

  // Shipping Info
  mode?: string;  // SeaFreightFCL, SeaFreightLCL, AirFreight, BreakBulk, RoRo
  incoTermCode?: string;

  // Ports
  loadingPortId?: number;
  loadingPortName?: string;
  destinationPortId?: number;
  destinationPortName?: string;

  // Addresses
  pickupAddress?: string;
  deliveryAddress?: string;

  // Notes
  notes?: string;
  notesForBooking?: string;
  remarks?: string;

  // RateRequest/Vendor Info
  rateRequestId?: number;
  vendorId?: number;
  vendorName?: string;

  // Collections
  charges: QuotationCharge[];
  cargoDetails: QuotationCargoDetail[];
}

// Sales APIs
export const portalLeadApi = {
  getAll: (params?: {
    pageNumber?: number;
    pageSize?: number;
    searchTerm?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.pageNumber) query.append('pageNumber', params.pageNumber.toString());
    if (params?.pageSize) query.append('pageSize', params.pageSize.toString());
    if (params?.searchTerm) query.append('searchTerm', params.searchTerm);
    return fetchApi<PaginatedList<PortalLead>>(`/sales/portal-leads?${query}`);
  },
  getById: (id: number) => fetchApi<PortalLeadDetail>(`/sales/portal-leads/${id}`),
  accept: (id: number, existingCustomerId?: number) =>
    fetchApi<AcceptPortalLeadResponse>(`/sales/portal-leads/${id}/accept`, {
      method: 'POST',
      body: JSON.stringify({ existingCustomerId }),
    }),
  revert: (id: number) =>
    fetchApi<{ message: string }>(`/sales/portal-leads/${id}/revert`, { method: 'POST' }),
};

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
  getById: (id: number) => fetchApi<Lead>(`/sales/leads/${id}`),
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
    return fetchApi<PaginatedList<RateRequest>>(`/sales/rate-requests?${query}`);
  },
  getById: (id: number) => fetchApi<RateRequest>(`/sales/rate-requests/${id}`),
  getForConversion: (id: number) => fetchApi<RateRequestForConversion>(`/sales/rate-requests/${id}/for-conversion`),
  create: (data: CreateRateRequestRequest) =>
    fetchApi<number>('/sales/rate-requests', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: UpdateRateRequestRequest) =>
    fetchApi<void>(`/sales/rate-requests/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
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
  getForShipment: (id: number) => fetchApi<QuotationForShipment>(`/sales/quotations/${id}/for-shipment`),
  create: (data: CreateQuotationRequest) =>
    fetchApi<number>('/sales/quotations', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: UpdateQuotationRequest) =>
    fetchApi<void>(`/sales/quotations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) =>
    fetchApi<void>(`/sales/quotations/${id}`, { method: 'DELETE' }),
  approve: (id: number) =>
    fetchApi<{ bookingNo: string }>(`/sales/quotations/${id}/approve`, { method: 'POST' }),
  convertToShipment: (id: number) =>
    fetchApi<void>(`/sales/quotations/${id}/convert-to-shipment`, { method: 'POST' }),
};
