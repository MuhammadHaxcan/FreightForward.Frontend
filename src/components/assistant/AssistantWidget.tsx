import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react';
import { MessageCircle, Send, X, Loader2, Bot } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { assistantApi, streamChat, type AssistantPageContext } from '../../services/api/assistant';
import { useInvoiceByIdentifier, usePurchaseInvoiceByIdentifier } from '../../hooks/useInvoices';
import { useShipmentByIdentifier } from '../../hooks/useShipments';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const regex = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*/g;
  let last = 0;
  let key = 0;
  let m: RegExpExecArray | null;

  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    if (m[1] !== undefined && m[2] !== undefined) {
      nodes.push(
        <a
          key={key++}
          href={m[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2"
        >
          {m[1]}
        </a>
      );
    } else if (m[3] !== undefined) {
      nodes.push(<strong key={key++}>{m[3]}</strong>);
    } else if (m[4] !== undefined) {
      nodes.push(<em key={key++}>{m[4]}</em>);
    }
    last = regex.lastIndex;
  }

  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function renderRichText(text: string): ReactNode[] {
  return text.split('\n').map((line, i) => {
    const heading = line.match(/^\s*(#{1,6})\s+(.*)$/);
    if (heading) {
      return (
        <div key={i} className="mb-0.5 mt-2 font-semibold">
          {renderInline(heading[2])}
        </div>
      );
    }

    const normalized = line.replace(/^(\s*)[*-]\s+/, '$1• ');
    return <div key={i}>{normalized ? renderInline(normalized) : '\u00A0'}</div>;
  });
}

export default function AssistantWidget() {
  const { isAuthenticated, hasPermission } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const conversationId = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const purchaseInvoiceMatch = location.pathname.match(/^\/accounts\/purchase-invoices\/([^/]+)$/i);
  const salesInvoiceMatch = location.pathname.match(/^\/accounts\/invoices\/([^/]+)$/i);
  const shipmentMatch = location.pathname.match(/^\/shipments\/([^/]+)\/edit$/i);

  const purchaseInvoiceIdentifier = purchaseInvoiceMatch ? decodeURIComponent(purchaseInvoiceMatch[1]) : undefined;
  const salesInvoiceIdentifier = salesInvoiceMatch ? decodeURIComponent(salesInvoiceMatch[1]) : undefined;
  const shipmentIdentifier = shipmentMatch ? decodeURIComponent(shipmentMatch[1]) : undefined;

  const { data: currentPurchaseInvoice } = usePurchaseInvoiceByIdentifier(purchaseInvoiceIdentifier);
  const { data: currentSalesInvoice } = useInvoiceByIdentifier(salesInvoiceIdentifier);
  const { data: currentShipment } = useShipmentByIdentifier(shipmentIdentifier || '');

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, open]);

  const pageContext: AssistantPageContext | undefined = currentPurchaseInvoice
    ? {
        entityType: 'PurchaseInvoice',
        entityNumber: currentPurchaseInvoice.purchaseNo,
        partyName: currentPurchaseInvoice.vendorName,
        shipmentId: currentPurchaseInvoice.shipmentId,
        jobNumber: currentPurchaseInvoice.jobNo,
        amount: currentPurchaseInvoice.amount,
        currencyCode: currentPurchaseInvoice.currencyCode,
      }
    : currentSalesInvoice
      ? {
          entityType: 'Invoice',
          entityNumber: currentSalesInvoice.invoiceNo,
          partyName: currentSalesInvoice.customerName,
          shipmentId: currentSalesInvoice.shipmentId,
          jobNumber: currentSalesInvoice.jobNumber,
          amount: currentSalesInvoice.total,
          currencyCode: currentSalesInvoice.currencyCode,
        }
      : currentShipment
        ? {
            entityType: 'Shipment',
            entityNumber: currentShipment.jobNumber,
            partyName: currentShipment.customerNames?.[0] || null,
            shipmentId: currentShipment.id,
            jobNumber: currentShipment.jobNumber,
            amount: null,
            currencyCode: null,
            shipmentMode: currentShipment.mode,
            shipmentDirection: currentShipment.direction,
            portOfLoadingName: currentShipment.portOfLoadingName || null,
            portOfDischargeName: currentShipment.portOfDischargeName || null,
            placeOfReceiptName: currentShipment.placeOfReceiptName || currentShipment.placeOfReceipt || null,
            placeOfDeliveryName: currentShipment.placeOfDeliveryName || currentShipment.placeOfDelivery || null,
            cargoSummary: currentShipment.cargos?.slice(0, 3).map(cargo =>
              [cargo.loadType, cargo.description, cargo.totalWeight ? `${cargo.totalWeight} ${cargo.weightUnit || ''}`.trim() : null]
                .filter(Boolean)
                .join(' | ')
            ).filter(Boolean).join('; ') || null,
            containerSummary: currentShipment.containers?.slice(0, 3).map(container =>
              [container.containerTypeName, container.containerNumber].filter(Boolean).join(' ')
            ).filter(Boolean).join('; ') || null,
            incoTerm: currentShipment.incoTermCode || null,
          }
        : undefined;

  const ensureConversation = useCallback(async () => {
    if (conversationId.current) return conversationId.current;
    const res = await assistantApi.createConversation();
    if (!res.data?.id) throw new Error('Could not start a conversation.');
    conversationId.current = res.data.id;
    return res.data.id;
  }, []);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || busy) return;

    setError(null);
    setInput('');
    setStatus('Starting assistant...');
    setMessages(prev => [...prev, { role: 'user', content: text }, { role: 'assistant', content: '' }]);
    setBusy(true);

    try {
      const convId = await ensureConversation();
      await streamChat({
        conversationId: convId,
        message: text,
        page: location.pathname,
        pageContext,
        onToken: token => setMessages(prev => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          if (last && last.role === 'assistant') {
            copy[copy.length - 1] = { role: 'assistant', content: last.content + token };
          }
          return copy;
        }),
        onStatus: nextStatus => setStatus(nextStatus),
        onNavigate: instruction => {
          navigate(instruction.route, { state: instruction.state });
          setMessages(prev => {
            const copy = [...prev];
            const last = copy[copy.length - 1];
            const content = instruction.message || 'Opened the requested form with the resolved draft.';
            if (last && last.role === 'assistant') {
              copy[copy.length - 1] = { role: 'assistant', content };
            } else {
              copy.push({ role: 'assistant', content });
            }
            return copy;
          });
        },
      });
    } catch {
      setError('Assistant is temporarily unavailable. Please try again.');
      setMessages(prev => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        if (last && last.role === 'assistant' && last.content === '') copy.pop();
        return copy;
      });
    } finally {
      setBusy(false);
      setStatus(null);
    }
  }, [input, busy, ensureConversation, location.pathname, navigate, pageContext]);

  if (!isAuthenticated || !hasPermission('assistant_use')) return null;

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open AI assistant"
          className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition hover:opacity-90"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {open && (
        <div className="fixed bottom-5 right-5 z-50 flex h-[32rem] w-96 max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-xl border bg-background shadow-2xl">
          <div className="flex items-center justify-between border-b bg-primary px-4 py-3 text-primary-foreground">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <span className="font-semibold">FreightForward Assistant</span>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close assistant" className="transition hover:opacity-80">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Ask about your shipments and invoices, prepare a voucher or shipment costing, or check live public web rates and carriers.
              </p>
            )}

            {messages.map((m, i) => (
              <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm ${
                    m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
                  }`}
                >
                  {m.content
                    ? (m.role === 'assistant' ? renderRichText(m.content) : m.content)
                    : (busy && i === messages.length - 1 ? <Loader2 className="h-4 w-4 animate-spin" /> : '')}
                </div>
              </div>
            ))}

            {error && <p className="text-sm text-destructive">{error}</p>}
            {busy && status && (
              <p className="text-xs text-muted-foreground">{status}</p>
            )}
          </div>

          <div className="flex items-center gap-2 border-t p-3">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              placeholder="Ask about a shipment..."
              disabled={busy}
              className="flex-1 rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
            />
            <button
              onClick={() => void send()}
              disabled={busy || !input.trim()}
              aria-label="Send"
              className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
