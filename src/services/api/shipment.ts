import { fetchApi, PaginatedList, MasterType, PaymentStatus, getAccessToken, isDevAuthDisabled, attemptTokenRefresh } from './base';

// Shipment Types
export type ShipmentStatus = 'Opened' | 'Closed' | 'Cancelled';
export type ShipmentDirection = 'Import' | 'Export' | 'CrossTrade';
export type ShipmentMode = 'SeaFreightFCL' | 'SeaFreightLCL' | 'AirFreight' | 'BreakBulk' | 'RoRo';
export type BLServiceType = 'FCLFCL' | 'LCLLCL' | 'LCLFCL' | 'FCLLCL';
export type FreightType = 'Prepaid' | 'Collect';
export type StatusEventType =
  | 'GateOutEmpty' | 'GateIn' | 'LoadOnVessel' | 'VesselDeparture'
  | 'VesselArrival' | 'Discharge' | 'OnRail' | 'OffRail'
  | 'CustomsClearance' | 'Delivered' | 'EmptyContainerReturn' | 'Other';
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
  latestEvent?: LatestStatusEvent;
  houseBLCount: number;
}

export interface ShipmentDetail extends Shipment {
  incoTermId?: number;
  incoTermCode?: string;
  // House B/L fields - camelCase of backend DTO property names
  hblDate?: string;
  hblStatus?: string;
  hblServiceType?: BLServiceType;
  hblNoBLIssued?: string;
  hblFreight?: FreightType;
  // MBL fields
  mblDate?: string;
  mblStatus?: string;
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
  houseBLs: ShipmentHouseBL[];
}

export interface ShipmentParty {
  id: number;
  masterType: MasterType;
  customerCategoryId?: number;
  customerCategoryName?: string;
  customerId?: number;
  customerName: string;
  mobile?: string;
  phone?: string;
  email?: string;
  houseBLId?: number;
  houseBLNo?: string;
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
  saleCurrencyId?: number;
  saleCurrencyCode?: string;
  saleExRate: number;
  saleFCY: number;
  saleLCY: number;
  saleTaxPercentage: number;
  saleTaxAmount: number;
  costQty: number;
  costUnit: number;
  costCurrencyId?: number;
  costCurrencyCode?: string;
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
  ppcc?: string;
  houseBLId?: number;
  houseBLNo?: string;
  isMasterCost: boolean;
  proratedFromCostingId?: number;
  prorationMethod?: string;
}

export interface ShipmentCargo {
  id: number;
  quantity: number;
  packageTypeId?: number;
  packageTypeName?: string;
  totalCBM?: number;
  totalWeight?: number;
  description?: string;
  houseBLId?: number;
  houseBLNo?: string;
}

export interface AddShipmentCargoRequest {
  quantity: number;
  packageTypeId?: number | null;
  totalCBM?: number | null;
  totalWeight?: number | null;
  description?: string;
  houseBLId?: number | null;
}

export interface UpdateShipmentCargoRequest extends AddShipmentCargoRequest {
  id: number;
}

export interface ShipmentDocument {
  id: number;
  documentTypeId?: number;
  documentTypeName?: string;
  documentNo: string;
  docDate: string;
  filePath?: string;
  originalFileName?: string;
  remarks?: string;
}

export interface AddShipmentDocumentRequest {
  documentTypeId?: number | null;
  documentNo: string;
  docDate: string;
  filePath?: string;
  originalFileName?: string;
  remarks?: string;
}

export interface FileUploadResponse {
  fileName: string;
  originalFileName: string;
  size: number;
  contentType: string;
}

export interface ShipmentStatusLog {
  id: number;
  eventType: StatusEventType;
  eventTypeDisplay: string;
  eventDescription: string;
  eventDateTime: string;
  location?: string;
  vesselName?: string;
  voyageNumber?: string;
  remarks?: string;
}

export interface LatestStatusEvent {
  eventType?: StatusEventType;
  eventTypeDisplay?: string;
  eventDescription?: string;
  location?: string;
  eventDateTime?: string;
}

export interface AddShipmentStatusLogRequest {
  eventType: StatusEventType;
  eventDescription: string;
  eventDateTime: string;
  location?: string;
  vesselName?: string;
  voyageNumber?: string;
  remarks?: string;
}

export interface CreateShipmentRequest {
  jobDate: string;
  direction: ShipmentDirection;
  mode: ShipmentMode;
  incoTermId?: number;
  hblNo?: string;
  hblDate?: string;
  hblStatus?: string;
  hblServiceType?: BLServiceType;
  hblNoBLIssued?: string;
  hblFreight?: FreightType;
  mblNo?: string;
  mblDate?: string;
  mblStatus?: string;
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
  customerCategoryId?: number;
  customerId?: number;
  customerName: string;
  mobile?: string;
  phone?: string;
  email?: string;
  houseBLId?: number;
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
  saleCurrencyId?: number;
  saleExRate: number;
  saleFCY: number;
  saleLCY: number;
  saleTaxPercentage: number;
  saleTaxAmount: number;
  costQty: number;
  costUnit: number;
  costCurrencyId?: number;
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
  ppcc?: string;
  houseBLId?: number;
  isMasterCost?: boolean;
}

export interface UpdateShipmentCostingRequest {
  id: number;
  shipmentId: number;
  description: string;
  remarks?: string;
  saleQty: number;
  saleUnit: number;
  saleCurrencyId?: number;
  saleExRate: number;
  saleFCY: number;
  saleLCY: number;
  saleTaxPercentage: number;
  saleTaxAmount: number;
  costQty: number;
  costUnit: number;
  costCurrencyId?: number;
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
  ppcc?: string;
  houseBLId?: number;
  isMasterCost?: boolean;
}

// House BL Types
export type ProrationMethod = 'ByWeight' | 'ByCBM' | 'EqualSplit' | 'Manual';

export interface ContainerHouseBLAllocation {
  id?: number;
  shipmentContainerId: number;
  containerNumber?: string;
  containerTypeName?: string;
  houseBLId: number;
  pieces: number;
  grossWeight: number;
  volume: number;
}

export interface ShipmentHouseBL {
  id: number;
  houseBLNo?: string;
  houseBLDate?: string;
  houseBLStatus?: string;
  hblServiceType?: string;
  hblNoBLIssued?: string;
  hblFreight?: string;
  shipperName?: string;
  consigneeName?: string;
  notifyPartyName?: string;
  marksNumbers?: string;
  notes?: string;
  totalWeight: number;
  totalCBM: number;
  totalSaleLCY: number;
  totalCostLCY: number;
  gp: number;
  containerAllocations?: ContainerHouseBLAllocation[];
}

export interface CreateShipmentHouseBLRequest {
  houseBLNo?: string;
  houseBLDate?: string;
  houseBLStatus?: string;
  hblServiceType?: BLServiceType;
  hblNoBLIssued?: string;
  hblFreight?: FreightType;
  shipperName?: string;
  consigneeName?: string;
  notifyPartyName?: string;
  marksNumbers?: string;
  notes?: string;
  containerAllocations?: { shipmentContainerId: number; pieces: number; grossWeight: number; volume: number }[];
}

export interface ProrationPreview {
  costingId: number;
  description: string;
  totalAmount: number;
  method: ProrationMethod;
  allocations: ProrationAllocation[];
  costCurrencyId?: number;
  costCurrencyCode?: string;
  costExRate: number;
  ppcc?: string;
}

export interface ProrationAllocation {
  houseBLId: number;
  houseBLNo?: string;
  weight: number;
  cbm: number;
  allocationPercent: number;
  allocatedAmount: number;
  debtors?: { customerId?: number; customerName: string }[];
}

export interface ProrateRequest {
  method: ProrationMethod;
  manualAllocations?: Record<number, number>;
  billToAllocations?: Record<number, number>;
  saleCurrencyId?: number;
  saleExRate?: number;
  saleTaxPercentage?: number;
}

// Shipment Invoice Types
export interface ShipmentInvoiceDto {
  id: number;
  invoiceNo: string;
  partyName?: string;
  amount: number;
  totalTax: number;
  currencyId?: number;
  currencyCode?: string;
  paymentStatus: PaymentStatus;
  invoiceDate: string;
}

export interface ShipmentPurchaseInvoiceDto {
  id: number;
  purchaseNo: string;
  partyName?: string;
  amount: number;
  totalTax: number;
  currencyId?: number;
  currencyCode?: string;
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

  // Cargos
  addCargo: (shipmentId: number, data: AddShipmentCargoRequest) =>
    fetchApi<number>(`/shipments/${shipmentId}/cargos`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateCargo: (cargoId: number, data: AddShipmentCargoRequest) =>
    fetchApi<void>(`/shipments/cargos/${cargoId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteCargo: (cargoId: number) => fetchApi<void>(`/shipments/cargos/${cargoId}`, { method: 'DELETE' }),

  // Documents
  addDocument: (shipmentId: number, data: AddShipmentDocumentRequest) =>
    fetchApi<number>(`/shipments/${shipmentId}/documents`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateDocument: (documentId: number, data: AddShipmentDocumentRequest) =>
    fetchApi<void>(`/shipments/documents/${documentId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteDocument: (documentId: number) => fetchApi<void>(`/shipments/documents/${documentId}`, { method: 'DELETE' }),

  // Status Logs
  addStatusLog: (shipmentId: number, data: AddShipmentStatusLogRequest) =>
    fetchApi<number>(`/shipments/${shipmentId}/status-logs`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteStatusLog: (statusLogId: number) => fetchApi<void>(`/shipments/status-logs/${statusLogId}`, { method: 'DELETE' }),

  // House BLs
  getHouseBLs: (shipmentId: number) =>
    fetchApi<ShipmentHouseBL[]>(`/shipments/${shipmentId}/house-bls`),
  addHouseBL: (shipmentId: number, data: CreateShipmentHouseBLRequest) =>
    fetchApi<number>(`/shipments/${shipmentId}/house-bls`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateHouseBL: (houseBLId: number, data: CreateShipmentHouseBLRequest) =>
    fetchApi<void>(`/shipments/house-bls/${houseBLId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteHouseBL: (houseBLId: number) =>
    fetchApi<void>(`/shipments/house-bls/${houseBLId}`, { method: 'DELETE' }),

  // Proration
  getProrationPreview: (shipmentId: number, costingId: number, method: ProrationMethod) =>
    fetchApi<ProrationPreview>(`/shipments/${shipmentId}/costings/${costingId}/proration-preview?method=${method}`),
  prorate: (shipmentId: number, costingId: number, data: ProrateRequest) =>
    fetchApi<void>(`/shipments/${shipmentId}/costings/${costingId}/prorate`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  removeProration: (shipmentId: number, costingId: number) =>
    fetchApi<void>(`/shipments/${shipmentId}/costings/${costingId}/prorate`, { method: 'DELETE' }),

  // Invoices
  getInvoices: (shipmentId: number) =>
    fetchApi<ShipmentInvoicesResult>(`/shipments/${shipmentId}/invoices`),
};

// File Upload API - Import base URL from base module
import { API_BASE_URL } from './base';

export const fileApi = {
  upload: async (file: File, subfolder?: string): Promise<FileUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const uploadUrl = subfolder
      ? `${API_BASE_URL}/files/upload?subfolder=${encodeURIComponent(subfolder)}`
      : `${API_BASE_URL}/files/upload`;

    const makeRequest = async (token: string | null) => {
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      return fetch(uploadUrl, {
        method: 'POST',
        headers,
        body: formData,
      });
    };

    let response = await makeRequest(isDevAuthDisabled() ? null : getAccessToken());

    // Handle 401 with token refresh
    if (response.status === 401 && !isDevAuthDisabled()) {
      const refreshed = await attemptTokenRefresh();
      if (refreshed) {
        response = await makeRequest(getAccessToken());
      }
    }

    if (!response.ok) {
      throw new Error(`File upload failed: ${response.statusText}`);
    }

    return response.json();
  },

  getDownloadUrl: (fileName: string): string => {
    // fileName may contain subdirectory path (e.g. "documents/office/guid_file.pdf")
    const encodedPath = fileName.split('/').map(encodeURIComponent).join('/');
    return `${API_BASE_URL}/files/${encodedPath}`;
  },

  delete: async (fileName: string): Promise<void> => {
    const makeRequest = async (token: string | null) => {
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const encodedPath = fileName.split('/').map(encodeURIComponent).join('/');
      return fetch(`${API_BASE_URL}/files/${encodedPath}`, {
        method: 'DELETE',
        headers,
      });
    };

    let response = await makeRequest(isDevAuthDisabled() ? null : getAccessToken());

    // Handle 401 with token refresh
    if (response.status === 401 && !isDevAuthDisabled()) {
      const refreshed = await attemptTokenRefresh();
      if (refreshed) {
        response = await makeRequest(getAccessToken());
      }
    }

    if (!response.ok) {
      throw new Error(`File delete failed: ${response.statusText}`);
    }
  },
};
