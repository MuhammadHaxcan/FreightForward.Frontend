// API Configuration and Base Client
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://localhost:7001/api';

// Auth token storage keys
// SECURITY NOTE: Tokens are stored in browser storage which is vulnerable to XSS attacks.
// For production systems with high security requirements, consider migrating to httpOnly
// cookies with CSRF protection. This requires backend changes to set cookies in responses.
const ACCESS_TOKEN_KEY = 'ff_access_token';
const REFRESH_TOKEN_KEY = 'ff_refresh_token';

// Separate keys for system admin tokens to prevent cross-contamination with office user tokens
const SYSTEM_ACCESS_TOKEN_KEY = 'ff_system_access_token';
const SYSTEM_REFRESH_TOKEN_KEY = 'ff_system_refresh_token';

const AUDIT_SESSION_STORAGE_KEY = 'ff_office_interaction_audit_session_id';
const AUDIT_INTERACTION_ENDPOINT = '/audit/interactions';
const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const ACTION_SEGMENTS = new Set([
  'approve',
  'accept',
  'revert',
  'send-email',
  'deny',
  'activate',
  'deactivate',
  'cancel',
  'generate',
  'test',
  'upload',
  'convert-to-shipment',
  'mark-paid',
  'reset-password',
  'fulfill',
  'migrations',
  'apply',
]);

const MANUAL_SHIPMENT_OUTCOME_ENDPOINTS: Array<{ method: string; pattern: RegExp }> = [
  { method: 'POST', pattern: /^\/shipments\/\d+\/parties\/?$/i },
  { method: 'POST', pattern: /^\/shipments\/\d+\/costings\/?$/i },
  { method: 'PUT', pattern: /^\/shipments\/\d+\/costings\/\d+\/?$/i },
];

const REQUEST_REFERENCE_KEYS = [
  'name',
  'title',
  'fullName',
  'companyName',
  'customerName',
  'vendorName',
  'partyName',
  'description',
  'code',
  'invoiceNo',
  'purchaseNo',
  'paymentNo',
  'receiptNo',
  'creditNoteNo',
  'quotationNo',
  'leadNo',
  'rateRequestNo',
  'bookingNo',
  'jobNo',
  'jobNumber',
  'employeeCode',
  'employeeName',
  'documentNo',
  'status',
  'username',
  'email',
  'narration',
  'remarks',
] as const;

type AuditOutcome = 'Succeeded' | 'Failed' | 'ValidationFailed' | 'Unauthorized' | 'Canceled';

interface MutationAuditContext {
  route: string;
  targetType: string;
  targetLabel: string;
  targetId?: string;
  entityType?: string;
  entityId?: string;
  entityReference?: string;
  successMessage: string;
  sessionId?: string;
  correlationId: string;
  actionSegment?: string;
  startedAtMs: number;
}

const ENDPOINT_ENTITY_LABELS: Array<{ pattern: RegExp; entityType: string; label: string }> = [
  { pattern: /^\/customers\/contacts\/?/i, entityType: 'CustomerContact', label: 'Customer Contact' },
  { pattern: /^\/customers\/\d+\/accounts\/?/i, entityType: 'CustomerAccount', label: 'Customer Account' },
  { pattern: /^\/customers\/?/i, entityType: 'Customer', label: 'Customer' },
  { pattern: /^\/sales\/portal-leads\/?/i, entityType: 'PortalLead', label: 'Portal Lead' },
  { pattern: /^\/sales\/rate-requests\/?/i, entityType: 'RateRequest', label: 'Rate Request' },
  { pattern: /^\/sales\/quotations\/?/i, entityType: 'Quotation', label: 'Quotation' },
  { pattern: /^\/sales\/leads\/?/i, entityType: 'Lead', label: 'Lead' },
  { pattern: /^\/hr\/salary\/components\/?/i, entityType: 'SalaryComponent', label: 'Salary Component' },
  { pattern: /^\/hr\/salary\/employees\/\d+\/structure\/?/i, entityType: 'SalaryStructure', label: 'Salary Structure' },
  { pattern: /^\/hr\/payroll\/?/i, entityType: 'Payroll', label: 'Payroll' },
  { pattern: /^\/hr\/employees\/?/i, entityType: 'Employee', label: 'Employee' },
  { pattern: /^\/hr\/attendance-policy\/?/i, entityType: 'AttendancePolicy', label: 'Attendance Policy' },
  { pattern: /^\/hr\/attendance\/?/i, entityType: 'Attendance', label: 'Attendance' },
  { pattern: /^\/hr\/advances\/?/i, entityType: 'EmployeeAdvance', label: 'Employee Advance' },
  { pattern: /^\/invoices\/payments\/?/i, entityType: 'PaymentVoucher', label: 'Payment Voucher' },
  { pattern: /^\/invoices\/purchases\/?/i, entityType: 'PurchaseInvoice', label: 'Purchase Invoice' },
  { pattern: /^\/invoices\/receipts\/?/i, entityType: 'ReceiptVoucher', label: 'Receipt Voucher' },
  { pattern: /^\/invoices\/credit-notes\/?/i, entityType: 'CreditNote', label: 'Credit Note' },
  { pattern: /^\/invoices\/?/i, entityType: 'Invoice', label: 'Invoice' },
  { pattern: /^\/shipments\/status-logs\/?/i, entityType: 'ShipmentStatus', label: 'Shipment Status' },
  { pattern: /^\/shipments\/documents\/?/i, entityType: 'ShipmentDocument', label: 'Shipment Document' },
  { pattern: /^\/shipments\/cargos\/?/i, entityType: 'ShipmentCargo', label: 'Shipment Cargo' },
  { pattern: /^\/shipments\/containers\/?/i, entityType: 'ShipmentContainer', label: 'Shipment Container' },
  { pattern: /^\/shipments\/costings\/?/i, entityType: 'ShipmentCosting', label: 'Shipment Costing' },
  { pattern: /^\/shipments\/\d+\/parties\/?/i, entityType: 'ShipmentParty', label: 'Shipment Party' },
  { pattern: /^\/shipments\/\d+\/customs\/?/i, entityType: 'ShipmentCustoms', label: 'Shipment Customs' },
  { pattern: /^\/shipments\/?/i, entityType: 'Shipment', label: 'Shipment' },
];

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
export type PaymentStatus = 'Pending' | 'Paid' | 'PartiallyPaid' | 'Overdue' | 'Closed';

// Token management - sessionStorage for access (clears on tab close)
// localStorage for refresh (persists for "remember me" and auto-refresh)
export function getAccessToken(): string | null {
  return sessionStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken: string): void {
  sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens(): void {
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

// System admin token management - kept separate from office user tokens
export function getSystemAccessToken(): string | null {
  return sessionStorage.getItem(SYSTEM_ACCESS_TOKEN_KEY);
}

export function getSystemRefreshToken(): string | null {
  return localStorage.getItem(SYSTEM_REFRESH_TOKEN_KEY);
}

export function setSystemTokens(accessToken: string, refreshToken: string): void {
  sessionStorage.setItem(SYSTEM_ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(SYSTEM_REFRESH_TOKEN_KEY, refreshToken);
}

export function clearSystemTokens(): void {
  sessionStorage.removeItem(SYSTEM_ACCESS_TOKEN_KEY);
  localStorage.removeItem(SYSTEM_REFRESH_TOKEN_KEY);
}

// Callback for when auth fails and needs redirect
let onAuthFailure: (() => void) | null = null;
export function setAuthFailureCallback(callback: () => void): void {
  onAuthFailure = callback;
}

function normalizeEndpoint(endpoint: string): string {
  const withoutQuery = endpoint.split('?')[0] ?? endpoint;
  if (!withoutQuery || withoutQuery === '/') {
    return '/';
  }

  return withoutQuery.endsWith('/') ? withoutQuery.slice(0, -1) : withoutQuery;
}

function isNumericSegment(value: string): boolean {
  return /^\d+$/.test(value);
}

function toAuditSafeValue(value: string | null | undefined, maxLength: number): string | undefined {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  return trimmed.length <= maxLength ? trimmed : trimmed.slice(0, maxLength);
}

function toAuditId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function getAuditSessionId(): string | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }

  const existing = sessionStorage.getItem(AUDIT_SESSION_STORAGE_KEY);
  if (existing) {
    return existing;
  }

  const created = toAuditId();
  sessionStorage.setItem(AUDIT_SESSION_STORAGE_KEY, created);
  return created;
}

function getCurrentRouteForAudit(): string {
  if (typeof window === 'undefined') {
    return '/';
  }

  return toAuditSafeValue(`${window.location.pathname}${window.location.search}`, 500) ?? window.location.pathname;
}

function toReadableSegment(segment: string): string {
  return segment
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

const IRREGULAR_SINGULAR_SEGMENTS: Record<string, string> = {
  expenses: 'expense',
  purchases: 'purchase',
  customs: 'customs',
};

function toSingularSegment(segment: string): string {
  const normalized = segment.toLowerCase();
  const irregular = IRREGULAR_SINGULAR_SEGMENTS[normalized];
  if (irregular) {
    return irregular;
  }

  if (normalized.endsWith('ies')) {
    return `${normalized.slice(0, -3)}y`;
  }

  if (normalized.endsWith('ses')) {
    return normalized.slice(0, -2);
  }

  if (normalized.endsWith('s') && normalized.length > 3) {
    return normalized.slice(0, -1);
  }

  return normalized;
}

function getDefaultOutcomeLabel(method: string): string {
  switch (method) {
    case 'POST':
      return 'Created';
    case 'PUT':
    case 'PATCH':
      return 'Updated';
    case 'DELETE':
      return 'Deleted';
    default:
      return 'Submitted';
  }
}

function getActionOutcomeLabel(actionSegment: string): string {
  const normalized = actionSegment.toLowerCase();
  switch (normalized) {
    case 'approve':
      return 'Approved';
    case 'accept':
      return 'Accepted';
    case 'revert':
      return 'Reverted';
    case 'send-email':
      return 'Sent Email';
    case 'deny':
      return 'Denied';
    case 'activate':
      return 'Activated';
    case 'deactivate':
      return 'Deactivated';
    case 'cancel':
      return 'Cancelled';
    case 'mark-paid':
      return 'Marked Paid';
    case 'generate':
      return 'Generated';
    case 'test':
      return 'Tested';
    case 'upload':
      return 'Uploaded';
    case 'convert-to-shipment':
      return 'Converted To Shipment';
    case 'reset-password':
      return 'Reset Password';
    default:
      return toReadableSegment(actionSegment);
  }
}

function parseRequestBodyForAudit(body: RequestInit['body']): Record<string, unknown> | null {
  if (!body || typeof body !== 'string') {
    return null;
  }

  try {
    const parsed = JSON.parse(body);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function getEndpointEntityDefinition(endpoint: string): { entityType: string; label: string } | null {
  for (const entry of ENDPOINT_ENTITY_LABELS) {
    if (entry.pattern.test(endpoint)) {
      return { entityType: entry.entityType, label: entry.label };
    }
  }

  return null;
}

function getPrimitiveAuditValue(value: unknown, maxLength: number): string | undefined {
  if (typeof value === 'string') {
    return toAuditSafeValue(value, maxLength);
  }

  if (typeof value === 'number') {
    return value.toString();
  }

  return undefined;
}

function getReferenceFromMetadata(metadata: Record<string, unknown> | null): string | undefined {
  if (!metadata) {
    return undefined;
  }

  const firstName = typeof metadata.firstName === 'string' ? metadata.firstName.trim() : '';
  const lastName = typeof metadata.lastName === 'string' ? metadata.lastName.trim() : '';
  const fullName = toAuditSafeValue(`${firstName} ${lastName}`.trim(), 200);
  if (fullName) {
    return fullName;
  }

  for (const key of REQUEST_REFERENCE_KEYS) {
    const value = metadata[key];
    const safe = getPrimitiveAuditValue(value, 200);
    if (safe) {
      return safe;
    }
  }

  for (const value of Object.values(metadata)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const nested = getReferenceFromMetadata(value as Record<string, unknown>);
      if (nested) {
        return nested;
      }
    }
  }

  return undefined;
}

function getIdFromMetadata(metadata: Record<string, unknown> | null): string | undefined {
  if (!metadata) {
    return undefined;
  }

  const value = metadata.id ?? metadata.entityId ?? metadata.customerId ?? metadata.employeeId ?? metadata.shipmentId;
  const primitive = getPrimitiveAuditValue(value, 120);
  if (primitive) {
    return primitive;
  }

  return undefined;
}

function getSuccessOutcomeMessage(context: MutationAuditContext): string {
  if (context.entityReference) {
    return `${context.targetLabel} (${context.entityReference}) succeeded`;
  }

  return `${context.targetLabel} succeeded`;
}

function enrichMutationAuditContext(
  context: MutationAuditContext | null,
  metadata: Record<string, unknown> | null,
): MutationAuditContext | null {
  if (!context) {
    return null;
  }

  const metadataId = getIdFromMetadata(metadata);
  const metadataReference = getReferenceFromMetadata(metadata);

  return {
    ...context,
    entityId: context.entityId ?? metadataId,
    entityReference: context.entityReference ?? metadataReference,
    successMessage: getSuccessOutcomeMessage({
      ...context,
      entityId: context.entityId ?? metadataId,
      entityReference: context.entityReference ?? metadataReference,
    }),
  };
}

function isManualShipmentOutcomeEndpoint(endpoint: string, method: string): boolean {
  return MANUAL_SHIPMENT_OUTCOME_ENDPOINTS.some(
    (rule) => rule.method === method && rule.pattern.test(endpoint),
  );
}

function shouldTrackMutationOutcome(
  endpoint: string,
  method: string,
  isSystemRoute: boolean,
  officeAccessToken: string | null,
): boolean {
  if (isSystemRoute || !officeAccessToken || !MUTATION_METHODS.has(method)) {
    return false;
  }

  const normalizedEndpoint = normalizeEndpoint(endpoint);
  if (
    normalizedEndpoint === AUDIT_INTERACTION_ENDPOINT
    || normalizedEndpoint.startsWith('/system/')
    || normalizedEndpoint.startsWith('/auth/')
    || isManualShipmentOutcomeEndpoint(normalizedEndpoint, method)
  ) {
    return false;
  }

  return true;
}

function buildMutationAuditContext(
  endpoint: string,
  method: string,
  requestMetadata: Record<string, unknown> | null,
): MutationAuditContext {
  const normalizedEndpoint = normalizeEndpoint(endpoint);
  const segments = normalizedEndpoint.split('/').filter(Boolean);
  const nonNumericSegments = segments.filter((segment) => !isNumericSegment(segment));
  const lastNonNumeric = nonNumericSegments[nonNumericSegments.length - 1] ?? 'record';
  const previousNonNumeric = nonNumericSegments[nonNumericSegments.length - 2];
  const endpointEntityDefinition = getEndpointEntityDefinition(normalizedEndpoint);

  const hasActionSegment = ACTION_SEGMENTS.has(lastNonNumeric.toLowerCase()) && !!previousNonNumeric;
  const entitySegment = hasActionSegment ? previousNonNumeric! : lastNonNumeric;
  const actionSegment = hasActionSegment ? lastNonNumeric.toLowerCase() : undefined;
  const actionLabel = hasActionSegment
    ? getActionOutcomeLabel(lastNonNumeric)
    : getDefaultOutcomeLabel(method);

  let entityId: string | undefined;
  for (let index = segments.length - 1; index >= 0; index -= 1) {
    if (isNumericSegment(segments[index])) {
      entityId = segments[index];
      break;
    }
  }

  if (hasActionSegment && isNumericSegment(segments[segments.length - 2] ?? '')) {
    entityId = segments[segments.length - 2];
  }

  const singularEntity = toSingularSegment(entitySegment.toLowerCase());
  const fallbackEntityType = toAuditSafeValue(toReadableSegment(singularEntity), 120);
  const entityType = toAuditSafeValue(endpointEntityDefinition?.entityType ?? fallbackEntityType, 120);
  const entityLabel = toAuditSafeValue(endpointEntityDefinition?.label ?? fallbackEntityType, 120) ?? 'Record';

  const context: MutationAuditContext = {
    route: getCurrentRouteForAudit(),
    targetType: 'api',
    targetLabel: toAuditSafeValue(`${actionLabel} ${entityLabel}`, 300) ?? `${actionLabel} Record`,
    targetId: toAuditSafeValue(normalizedEndpoint, 120),
    entityType,
    entityId,
    entityReference: undefined,
    successMessage: '',
    sessionId: getAuditSessionId(),
    correlationId: toAuditId(),
    actionSegment,
    startedAtMs: Date.now(),
  };

  context.successMessage = getSuccessOutcomeMessage(context);

  return enrichMutationAuditContext(context, requestMetadata) ?? context;
}

function getSuccessOutcomeStatus(context: MutationAuditContext): AuditOutcome {
  if (!context.actionSegment) {
    return 'Succeeded';
  }

  if (context.actionSegment === 'cancel' || context.actionSegment === 'revert') {
    return 'Canceled';
  }

  return 'Succeeded';
}

function getFailureOutcomeStatus(statusCode?: number): AuditOutcome {
  if (statusCode === 401 || statusCode === 403) {
    return 'Unauthorized';
  }

  if (statusCode === 400 || statusCode === 409 || statusCode === 422) {
    return 'ValidationFailed';
  }

  return 'Failed';
}

function toDurationSuffix(durationMs?: number): string {
  if (!durationMs || durationMs < 0) {
    return '';
  }

  return ` (${durationMs}ms)`;
}

function toFailureMessage(baseMessage: string, durationMs?: number): string {
  return `${baseMessage}${toDurationSuffix(durationMs)}`;
}

function toSuccessMessage(context: MutationAuditContext, durationMs?: number): string {
  return `${context.successMessage}${toDurationSuffix(durationMs)}`;
}

function extractErrorMessage(errorData: unknown, fallbackStatus?: number): string {
  if (typeof errorData === 'string') {
    return toAuditSafeValue(errorData, 300) ?? 'Request failed';
  }

  if (errorData && typeof errorData === 'object') {
    const candidate = errorData as Record<string, unknown>;
    const message = typeof candidate.error === 'string'
      ? candidate.error
      : typeof candidate.message === 'string'
        ? candidate.message
        : typeof candidate.title === 'string'
          ? candidate.title
          : undefined;

    if (message) {
      return toAuditSafeValue(message, 300) ?? 'Request failed';
    }
  }

  return fallbackStatus ? `HTTP error! status: ${fallbackStatus}` : 'Request failed';
}

function extractErrors(errorData: unknown): string[] {
  if (!errorData || typeof errorData !== 'object') {
    return [];
  }

  const candidate = errorData as Record<string, unknown>;
  return Array.isArray(candidate.errors)
    ? candidate.errors.filter((item): item is string => typeof item === 'string')
    : [];
}

function postMutationOutcomeAudit(
  context: MutationAuditContext | null,
  outcome: AuditOutcome,
  officeAccessToken: string | null,
  outcomeStatusCode?: number,
  outcomeMessage?: string,
): void {
  if (!context || !officeAccessToken) {
    return;
  }

  const payload = {
    eventType: 'ActionAttempted',
    route: context.route,
    targetType: context.targetType,
    targetId: context.targetId,
    targetLabel: context.targetLabel,
    entityType: context.entityType,
    entityId: context.entityId,
    entityReference: context.entityReference,
    outcome,
    outcomeStatusCode,
    outcomeMessage: toAuditSafeValue(outcomeMessage, 300),
    sessionId: context.sessionId,
    correlationId: context.correlationId,
  };

  void fetch(`${API_BASE_URL}${AUDIT_INTERACTION_ENDPOINT}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${officeAccessToken}`,
    },
    body: JSON.stringify(payload),
  }).catch(() => {
    // Silent by design: audit failures must never break user workflows.
  });
}

// Generic fetch wrapper with auth
export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const method = (options.method ?? 'GET').toUpperCase();
  const systemRoute = isSystemAdminRoute();
  const initialOfficeAccessToken = systemRoute ? null : getAccessToken();
  const requestMetadata = parseRequestBodyForAudit(options.body);
  const shouldAuditMutation = shouldTrackMutationOutcome(endpoint, method, systemRoute, initialOfficeAccessToken);
  let mutationAuditContext = shouldAuditMutation
    ? buildMutationAuditContext(endpoint, method, requestMetadata)
    : null;
  if (mutationAuditContext) {
    postMutationAttemptAudit(mutationAuditContext, initialOfficeAccessToken);
  }

  try {
    const isFormDataBody = typeof FormData !== 'undefined' && options.body instanceof FormData;
    const headers: HeadersInit = {
      ...(isFormDataBody ? {} : { 'Content-Type': 'application/json' }),
      ...options.headers,
    };

    const accessToken = systemRoute ? getSystemAccessToken() : getAccessToken();
    if (accessToken) {
      (headers as Record<string, string>).Authorization = `Bearer ${accessToken}`;
    }
    if (mutationAuditContext) {
      (headers as Record<string, string>)['X-Audit-Correlation-Id'] = mutationAuditContext.correlationId;
      if (mutationAuditContext.sessionId) {
        (headers as Record<string, string>)['X-Audit-Session-Id'] = mutationAuditContext.sessionId;
      }
    }
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Handle 401 Unauthorized - attempt refresh or redirect to login
    if (response.status === 401) {
      // Try to refresh the token
      const refreshResult = await attemptTokenRefresh();
      if (refreshResult) {
        // Retry the original request with new token
        const newAccessToken = systemRoute ? getSystemAccessToken() : getAccessToken();
        (headers as Record<string, string>).Authorization = `Bearer ${newAccessToken}`;
        const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
          ...options,
          headers,
        });

        if (retryResponse.ok) {
          if (retryResponse.status === 204) {
            const durationMs = mutationAuditContext ? Date.now() - mutationAuditContext.startedAtMs : undefined;
            postMutationOutcomeAudit(
              mutationAuditContext,
              mutationAuditContext ? getSuccessOutcomeStatus(mutationAuditContext) : 'Succeeded',
              getAccessToken(),
              retryResponse.status,
              mutationAuditContext ? toSuccessMessage(mutationAuditContext, durationMs) : undefined,
            );
            return { data: undefined as T };
          }

          const data = await retryResponse.json();
          const responseMetadata = data && typeof data === 'object'
            ? (data as Record<string, unknown>)
            : (typeof data === 'number' || typeof data === 'string'
              ? { id: data }
              : null);
          mutationAuditContext = enrichMutationAuditContext(mutationAuditContext, responseMetadata);
          const durationMs = mutationAuditContext ? Date.now() - mutationAuditContext.startedAtMs : undefined;
          postMutationOutcomeAudit(
            mutationAuditContext,
            mutationAuditContext ? getSuccessOutcomeStatus(mutationAuditContext) : 'Succeeded',
            getAccessToken(),
            retryResponse.status,
            mutationAuditContext ? toSuccessMessage(mutationAuditContext, durationMs) : undefined,
          );
          return { data };
        }

        // Retry returned a non-auth error (403, 500, etc.) - token is valid, don't log out
        if (retryResponse.status !== 401) {
          const errorData = await retryResponse.json().catch(() => null);
          const errorMessage = extractErrorMessage(errorData, retryResponse.status);
          const durationMs = mutationAuditContext ? Date.now() - mutationAuditContext.startedAtMs : undefined;
          postMutationOutcomeAudit(
            mutationAuditContext,
            getFailureOutcomeStatus(retryResponse.status),
            getAccessToken(),
            retryResponse.status,
            toFailureMessage(errorMessage, durationMs),
          );

          return {
            error: errorMessage,
            errors: extractErrors(errorData),
          };
        }
      }

      const unauthorizedDurationMs = mutationAuditContext ? Date.now() - mutationAuditContext.startedAtMs : undefined;
      postMutationOutcomeAudit(
        mutationAuditContext,
        'Unauthorized',
        getAccessToken(),
        401,
        toFailureMessage('Session expired. Please login again.', unauthorizedDurationMs),
      );

      // Refresh failed or retry also returned 401 - session is truly expired
      if (systemRoute) {
        clearSystemTokens();
      } else {
        clearTokens();
      }
      if (onAuthFailure) {
        onAuthFailure();
      }
      return { error: 'Session expired. Please login again.' };
    }

    // Handle 403 Forbidden
    if (response.status === 403) {
      const forbiddenDurationMs = mutationAuditContext ? Date.now() - mutationAuditContext.startedAtMs : undefined;
      postMutationOutcomeAudit(
        mutationAuditContext,
        'Unauthorized',
        getAccessToken(),
        403,
        toFailureMessage('You do not have permission to perform this action.', forbiddenDurationMs),
      );
      return { error: 'You do not have permission to perform this action.' };
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const errorMessage = extractErrorMessage(errorData, response.status);
      const durationMs = mutationAuditContext ? Date.now() - mutationAuditContext.startedAtMs : undefined;
      postMutationOutcomeAudit(
        mutationAuditContext,
        getFailureOutcomeStatus(response.status),
        getAccessToken(),
        response.status,
        toFailureMessage(errorMessage, durationMs),
      );

      return {
        error: errorMessage,
        errors: extractErrors(errorData),
      };
    }

    // Handle 204 No Content
    if (response.status === 204) {
      const durationMs = mutationAuditContext ? Date.now() - mutationAuditContext.startedAtMs : undefined;
      postMutationOutcomeAudit(
        mutationAuditContext,
        mutationAuditContext ? getSuccessOutcomeStatus(mutationAuditContext) : 'Succeeded',
        getAccessToken(),
        response.status,
        mutationAuditContext ? toSuccessMessage(mutationAuditContext, durationMs) : undefined,
      );
      return { data: undefined as T };
    }

    const data = await response.json();
    const responseMetadata = data && typeof data === 'object'
      ? (data as Record<string, unknown>)
      : (typeof data === 'number' || typeof data === 'string'
        ? { id: data }
        : null);
    mutationAuditContext = enrichMutationAuditContext(mutationAuditContext, responseMetadata);
    const durationMs = mutationAuditContext ? Date.now() - mutationAuditContext.startedAtMs : undefined;
    postMutationOutcomeAudit(
      mutationAuditContext,
      mutationAuditContext ? getSuccessOutcomeStatus(mutationAuditContext) : 'Succeeded',
      getAccessToken(),
      response.status,
      mutationAuditContext ? toSuccessMessage(mutationAuditContext, durationMs) : undefined,
    );
    return { data };
  } catch (error) {
    const durationMs = mutationAuditContext ? Date.now() - mutationAuditContext.startedAtMs : undefined;
    postMutationOutcomeAudit(
      mutationAuditContext,
      'Failed',
      getAccessToken(),
      undefined,
      toFailureMessage(error instanceof Error ? error.message : 'An unknown error occurred', durationMs),
    );

    return {
      error: error instanceof Error ? error.message : 'An unknown error occurred',
    };
  }
}

function postMutationAttemptAudit(
  context: MutationAuditContext | null,
  officeAccessToken: string | null,
): void {
  if (!context || !officeAccessToken) {
    return;
  }

  const payload = {
    eventType: 'ActionAttempted',
    route: context.route,
    targetType: context.targetType,
    targetId: context.targetId,
    targetLabel: context.targetLabel,
    entityType: context.entityType,
    entityId: context.entityId,
    entityReference: context.entityReference,
    sessionId: context.sessionId,
    correlationId: context.correlationId,
  };

  void fetch(`${API_BASE_URL}${AUDIT_INTERACTION_ENDPOINT}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${officeAccessToken}`,
    },
    body: JSON.stringify(payload),
  }).catch(() => {
    // Silent by design: audit failures must never break user workflows.
  });
}

// Authenticated fetch for binary data (PDFs, etc.) and simple API calls
export async function fetchBlob(url: string): Promise<Response> {
  const headers: HeadersInit = {};

  const token = isSystemAdminRoute() ? getSystemAccessToken() : getAccessToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, { headers });

  // Handle 401 - attempt token refresh
  if (response.status === 401) {
    const refreshResult = await attemptTokenRefresh();
    if (refreshResult) {
      // Retry with new token
      const newToken = isSystemAdminRoute() ? getSystemAccessToken() : getAccessToken();
      if (newToken) {
        headers.Authorization = `Bearer ${newToken}`;
      }
      return fetch(url, { headers });
    }

    // Refresh failed, trigger auth failure callback
    if (isSystemAdminRoute()) {
      clearSystemTokens();
    } else {
      clearTokens();
    }
    if (onAuthFailure) {
      onAuthFailure();
    }
  }

  return response;
}

// Token refresh mutex to prevent concurrent refresh attempts
let refreshPromise: Promise<boolean> | null = null;

// Token refresh helper with mutex to prevent race conditions
export async function attemptTokenRefresh(): Promise<boolean> {
  // If refresh already in progress, wait for it
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = doTokenRefresh();
  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

// Check if on system admin routes
function isSystemAdminRoute(): boolean {
  return typeof window !== 'undefined' && window.location.pathname.startsWith('/system');
}

async function doTokenRefresh(): Promise<boolean> {
  const systemRoute = isSystemAdminRoute();
  const refreshToken = systemRoute ? getSystemRefreshToken() : getRefreshToken();
  if (!refreshToken) {
    return false;
  }

  try {
    // Use different refresh endpoint for system admin vs office users
    const refreshEndpoint = systemRoute
      ? `${API_BASE_URL}/auth/system/refresh`
      : `${API_BASE_URL}/auth/refresh`;

    const response = await fetch(refreshEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    if (systemRoute) {
      setSystemTokens(data.accessToken, data.refreshToken);
    } else {
      setTokens(data.accessToken, data.refreshToken);
    }
    return true;
  } catch {
    return false;
  }
}

