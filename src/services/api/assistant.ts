import { API_BASE_URL, getAccessToken, fetchApi } from './base';

export const assistantApi = {
  /** Start a new conversation; returns its id. */
  createConversation: () => fetchApi<{ id: string }>('/assistant/conversations', { method: 'POST' }),
};

export interface AssistantPageContext {
  entityType?: 'Invoice' | 'PurchaseInvoice' | 'Shipment' | null;
  entityNumber?: string | null;
  partyName?: string | null;
  shipmentId?: number | null;
  jobNumber?: string | null;
  amount?: number | null;
  currencyCode?: string | null;
  shipmentMode?: string | null;
  shipmentDirection?: string | null;
  portOfLoadingName?: string | null;
  portOfDischargeName?: string | null;
  placeOfReceiptName?: string | null;
  placeOfDeliveryName?: string | null;
  cargoSummary?: string | null;
  containerSummary?: string | null;
  incoTerm?: string | null;
}

export interface AssistantActionEnvelope<TDraft = unknown> {
  kind: 'receipt' | 'payment' | 'shipmentParty' | 'shipmentCosting' | 'salesInvoice' | 'purchaseInvoice';
  source: 'assistant';
  nonce: string;
  draft: TDraft;
}

export interface AssistantRouteState<TDraft = unknown> {
  assistantAction: AssistantActionEnvelope<TDraft>;
}

export interface ReceiptAssistantDraft {
  customerId: number;
  customerName?: string | null;
  receiptDate: string;
  paymentMode: string;
  currencyId?: number | null;
  currencyCode?: string | null;
  bankId?: number | null;
  bankName?: string | null;
  chequeNo?: string | null;
  chequeBank?: string | null;
  chequeDate?: string | null;
  postDatedValidDate?: string | null;
  narration?: string | null;
  selectedInvoices: Array<{
    invoiceId: number;
    invoiceNo: string;
    payingAmount: number;
    outstanding: number;
    currencyId?: number | null;
    currencyCode?: string | null;
  }>;
}

export interface PaymentAssistantDraft {
  vendorId: number;
  vendorName?: string | null;
  paymentDate: string;
  paymentMode: string;
  currencyId?: number | null;
  currencyCode?: string | null;
  bankId?: number | null;
  bankName?: string | null;
  chequeNo?: string | null;
  chequeBank?: string | null;
  chequeDate?: string | null;
  postDatedValidDate?: string | null;
  narration?: string | null;
  selectedInvoices: Array<{
    purchaseInvoiceId: number;
    purchaseNo: string;
    payingAmount: number;
    outstanding: number;
    currencyId?: number | null;
    currencyCode?: string | null;
  }>;
}

export interface ShipmentCostingAssistantDraft {
  shipmentId: number;
  jobNumber: string;
  preferredTab?: 'cost' | 'sale' | null;
  chargeName?: string | null;
  remarks?: string | null;
  billToCustomerId?: number | null;
  billToName?: string | null;
  vendorCustomerId?: number | null;
  vendorName?: string | null;
  saleCurrencyCode?: string | null;
  costCurrencyCode?: string | null;
  saleAmount: number;
  costAmount: number;
  saleQty: number;
  costQty: number;
  saleTaxPercentage: number;
  costTaxPercentage: number;
  unitId?: number | null;
  unitCode?: string | null;
  ppcc?: string | null;
  costReferenceNo?: string | null;
  costDate?: string | null;
  /**
   * When the user asked for several costing lines at once, the full ordered list. The head draft
   * mirrors the first line; the page posts each line in turn (auto-advancing the modal).
   */
  costings?: ShipmentCostingAssistantDraft[] | null;
}

export interface ShipmentPartyAssistantDraft {
  shipmentId: number;
  jobNumber: string;
  customerId: number;
  customerName: string;
  masterType: 'Debtors' | 'Creditors' | 'Neutral';
  categoryId: number;
  categoryCode: string;
  categoryName: string;
  pendingCostings?: ShipmentCostingAssistantDraft[] | null;
}

export interface SalesInvoiceAssistantDraft {
  shipmentId: number;
  jobNumber: string;
  shipmentPartyId: number;
  customerId: number;
  customerName?: string | null;
  invoiceDate: string;
  currencyCode?: string | null;
  remarks?: string | null;
  selectedChargeIds: number[];
}

export interface PurchaseInvoiceAssistantDraft {
  shipmentId: number;
  jobNumber: string;
  shipmentPartyId: number;
  vendorId: number;
  vendorName?: string | null;
  invoiceDate: string;
  currencyCode?: string | null;
  remarks?: string | null;
  vendorInvoiceNo?: string | null;
  vendorInvoiceDate?: string | null;
  selectedChargeIds: number[];
}

export interface AssistantNavigationInstruction {
  entityType: 'Receipt' | 'Payment' | 'ShipmentParty' | 'ShipmentCosting' | 'SalesInvoice' | 'PurchaseInvoice';
  route: string;
  state: AssistantRouteState<
    ReceiptAssistantDraft
    | PaymentAssistantDraft
    | ShipmentPartyAssistantDraft
    | ShipmentCostingAssistantDraft
    | SalesInvoiceAssistantDraft
    | PurchaseInvoiceAssistantDraft
  >;
  message?: string | null;
}

interface StreamChatOptions {
  conversationId: string;
  message: string;
  page?: string;
  pageContext?: AssistantPageContext;
  onToken: (token: string) => void;
  onNavigate?: (instruction: AssistantNavigationInstruction) => void;
  onStatus?: (status: string) => void;
  signal?: AbortSignal;
}

/**
 * POST the message and stream the grounded answer token-by-token over SSE. For supported create
 * instructions, the backend emits `event: navigate` with a route-state draft, or a plain
 * follow-up chat message when more clarification is required.
 */
export async function streamChat(opts: StreamChatOptions): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/assistant/chat`, {
    method: 'POST',
    signal: opts.signal,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getAccessToken() ?? ''}`,
    },
    body: JSON.stringify({
      conversationId: opts.conversationId,
      message: opts.message,
      page: opts.page,
      pageContext: opts.pageContext,
    }),
  });

  if (!response.ok || !response.body) {
    throw new Error('assistant_unavailable');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split('\n\n');
    buffer = events.pop() ?? '';

    for (const event of events) {
      if (event.startsWith('event: error')) {
        throw new Error('assistant_unavailable');
      }

      const match = event.match(/^data: (.*)$/m);
      if (!match) continue;
      const data = match[1];
      if (data === '[DONE]') return;

      if (event.startsWith('event: navigate')) {
        try {
          opts.onNavigate?.(JSON.parse(data.replace(/\\n/g, '\n')) as AssistantNavigationInstruction);
        } catch {
          throw new Error('assistant_unavailable');
        }
        continue;
      }

      if (event.startsWith('event: status')) {
        opts.onStatus?.(data.replace(/\\n/g, '\n'));
        continue;
      }

      opts.onToken(data.replace(/\\n/g, '\n'));
    }
  }
}
