import { fetchApi, PaginatedList, MasterType, Currency, PaymentStatus } from './base';
import { Incoterms } from './sales';

// Shipment Types
export type ShipmentStatus = 'Opened' | 'Closed' | 'Cancelled';
export type ShipmentDirection = 'Import' | 'Export' | 'CrossTrade';
export type ShipmentMode = 'SeaFreightFCL' | 'SeaFreightLCL' | 'AirFreight' | 'BreakBulk' | 'RoRo';
export type BLStatus = 'HBL' | 'MBL' | 'HAWB' | 'MAWB' | 'Express';
export type BLServiceType = 'FCLFCL' | 'LCLLCL';
export type FreightType = 'Prepaid' | 'Collect';
export type PartyType =
  | 'Shipper' | 'Consignee' | 'Buyer' | 'Supplier' | 'Customer' | 'BookingParty' | 'NotifyParty'
  | 'Forwarder' | 'CoLoader' | 'Transporter' | 'Courier' | 'ClearingAgent' | 'DeliveryAgent' | 'OriginAgent' | 'OverseasAgents'
  | 'ShippingLine' | 'AirLine'
  | 'Warehouse' | 'CFS' | 'Terminal'
  | 'Customs' | 'Bank'
  | 'Neutral' | 'ShipperNeutral' | 'ConsigneeNeutral' | 'BuyerNeutral' | 'SupplierNeutral' | 'NotifyPartyNeutral' | 'CustomerNeutral';

export interface Shipment {
  id: number;
  jobNumber: string;
  jobDate: string;
  jobStatus: ShipmentStatus;
  direction: ShipmentDirection;
  directionDisplay: string;
  mode: ShipmentMode;
  modeDisplay: string;
  transportModeId?: number;
  transportModeName?: string;
  houseBLNo?: string;
  mblNumber?: string;
  customerName?: string;
  placeOfReceiptId?: number;
  placeOfDeliveryId?: number;
  portOfReceiptId?: number;
  portOfLoadingId?: number;
  portOfDischargeId?: number;
  portOfFinalDestinationId?: number;
  placeOfReceiptName?: string;
  placeOfDeliveryName?: string;
  portOfReceiptName?: string;
  portOfLoadingName?: string;
  portOfDischargeName?: string;
  portOfFinalDestinationName?: string;
  placeOfReceipt?: string;
  placeOfDelivery?: string;
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
  // House B/L fields - camelCase of backend DTO property names
  hblDate?: string;
  hblStatus?: BLStatus;
  hblServiceType?: BLServiceType;
  hblNoBLIssued?: string;
  hblFreight?: FreightType;
  // MBL fields
  mblDate?: string;
  mblStatus?: BLStatus;
  mblServiceType?: BLServiceType;
  mblNoBLIssued?: string;
  mblFreight?: FreightType;
  // Other info
  placeOfBLIssue?: string;
  freeTime?: string;
  networkPartnerId?: number;
  networkPartnerName?: string;
  assignedTo?: string;
  // Vessel & Schedule
  voyage?: string;
  secondLegVessel: boolean;
  secondLegVesselName?: string;
  secondLegVoyage?: string;
  secondLegEtd?: string;
  secondLegEta?: string;
  // Notes
  marksNumbers?: string;
  notes?: string;
  internalNotes?: string;
  // Collections
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
  containerTypeId?: number;
  containerTypeName?: string;
  sealNo?: string;
  noOfPcs: number;
  packageTypeId?: number;
  packageTypeName?: string;
  grossWeight: number;
  volume: number;
  description?: string;
}

export interface ShipmentCosting {
  id: number;
  description: string;
  remarks?: string;
  saleQty: number;
  saleUnit: number;
  saleCurrency: Currency;
  saleExRate: number;
  saleFCY: number;
  saleLCY: number;
  saleTaxPercentage: number;
  saleTaxAmount: number;
  costQty: number;
  costUnit: number;
  costCurrency: Currency;
  costExRate: number;
  costFCY: number;
  costLCY: number;
  costTaxPercentage: number;
  costTaxAmount: number;
  unitId?: number;
  unitName?: string;
  gp: number;
  billToCustomerId?: number;
  billToName?: string;
  vendorCustomerId?: number;
  vendorName?: string;
  costReferenceNo?: string;
  costDate?: string;
  voucherNumber?: string;
  voucherStatus?: string;
  saleInvoiced: boolean;
  purchaseInvoiced: boolean;
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
  jobDate: string;
  direction: ShipmentDirection;
  mode: ShipmentMode;
  transportModeId?: number;
  incoterms?: Incoterms;
  hblNo?: string;
  hblDate?: string;
  hblStatus?: BLStatus;
  hblServiceType?: BLServiceType;
  hblNoBLIssued?: string;
  hblFreight?: FreightType;
  mblNo?: string;
  mblDate?: string;
  mblStatus?: BLStatus;
  mblServiceType?: BLServiceType;
  mblNoBLIssued?: string;
  mblFreight?: FreightType;
  placeOfBLIssue?: string;
  carrier?: string;
  freeTime?: string;
  networkPartnerId?: number;
  placeOfReceiptId?: number;
  placeOfDeliveryId?: number;
  portOfReceiptId?: number;
  portOfLoadingId?: number;
  portOfDischargeId?: number;
  portOfFinalDestinationId?: number;
  placeOfReceipt?: string;
  placeOfDelivery?: string;
  vessel?: string;
  voyage?: string;
  etd?: string;
  eta?: string;
  secondLegVessel?: boolean;
  secondLegVesselName?: string;
  secondLegVoyage?: string;
  secondLegEtd?: string;
  secondLegEta?: string;
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
  containerTypeId?: number | null;
  sealNo?: string;
  noOfPcs: number;
  packageTypeId?: number | null;
  grossWeight: number;
  volume: number;
  description?: string;
}

export interface UpdateShipmentContainerRequest {
  id: number;
  shipmentId: number;
  containerNumber: string;
  containerTypeId?: number | null;
  sealNo?: string;
  noOfPcs: number;
  packageTypeId?: number | null;
  grossWeight: number;
  volume: number;
  description?: string;
}

export interface AddShipmentCostingRequest {
  shipmentId: number;
  description: string;
  remarks?: string;
  saleQty: number;
  saleUnit: number;
  saleCurrency: Currency;
  saleExRate: number;
  saleFCY: number;
  saleLCY: number;
  saleTaxPercentage: number;
  saleTaxAmount: number;
  costQty: number;
  costUnit: number;
  costCurrency: Currency;
  costExRate: number;
  costFCY: number;
  costLCY: number;
  costTaxPercentage: number;
  costTaxAmount: number;
  unitId?: number;
  unitName?: string;
  gp: number;
  billToCustomerId?: number;
  billToName?: string;
  vendorCustomerId?: number;
  vendorName?: string;
  costReferenceNo?: string;
  costDate?: string;
}

export interface UpdateShipmentCostingRequest {
  id: number;
  shipmentId: number;
  description: string;
  remarks?: string;
  saleQty: number;
  saleUnit: number;
  saleCurrency: Currency;
  saleExRate: number;
  saleFCY: number;
  saleLCY: number;
  saleTaxPercentage: number;
  saleTaxAmount: number;
  costQty: number;
  costUnit: number;
  costCurrency: Currency;
  costExRate: number;
  costFCY: number;
  costLCY: number;
  costTaxPercentage: number;
  costTaxAmount: number;
  unitId?: number;
  unitName?: string;
  gp: number;
  billToCustomerId?: number;
  billToName?: string;
  vendorCustomerId?: number;
  vendorName?: string;
  costReferenceNo?: string;
  costDate?: string;
}

// Shipment Invoice Types
export interface ShipmentInvoiceDto {
  id: number;
  invoiceNo: string;
  partyName?: string;
  amount: number;
  totalTax: number;
  currency: Currency;
  paymentStatus: PaymentStatus;
  invoiceDate: string;
}

export interface ShipmentPurchaseInvoiceDto {
  id: number;
  purchaseNo: string;
  partyName?: string;
  amount: number;
  totalTax: number;
  currency: Currency;
  paymentStatus: PaymentStatus;
  invoiceDate: string;
}

export interface ShipmentInvoicesResult {
  customerInvoices: ShipmentInvoiceDto[];
  vendorInvoices: ShipmentPurchaseInvoiceDto[];
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
  getNextJobNumber: () => fetchApi<{ jobNumber: string }>('/shipments/next-job-number'),
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
  updateContainer: (shipmentId: number, id: number, data: UpdateShipmentContainerRequest) =>
    fetchApi<void>(`/shipments/${shipmentId}/containers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteContainer: (id: number) => fetchApi<void>(`/shipments/containers/${id}`, { method: 'DELETE' }),

  // Costings
  addCosting: (shipmentId: number, data: AddShipmentCostingRequest) =>
    fetchApi<number>(`/shipments/${shipmentId}/costings`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateCosting: (shipmentId: number, id: number, data: UpdateShipmentCostingRequest) =>
    fetchApi<void>(`/shipments/${shipmentId}/costings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteCosting: (id: number) => fetchApi<void>(`/shipments/costings/${id}`, { method: 'DELETE' }),

  // Invoices
  getInvoices: (shipmentId: number) =>
    fetchApi<ShipmentInvoicesResult>(`/shipments/${shipmentId}/invoices`),
};
