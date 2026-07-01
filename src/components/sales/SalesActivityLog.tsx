import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SalesActivityLogEntry } from "@/services/api/sales";
import {
  FilePlus,
  Pencil,
  Trash2,
  ArrowRightCircle,
  MessageSquare,
  Clock,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SalesActivityLogProps {
  entries: SalesActivityLogEntry[];
  onAdd: (note: string) => Promise<void>;
  isReadOnly?: boolean;
}

const ACTION_ICON: Record<string, JSX.Element> = {
  Created: <FilePlus className="h-4 w-4" />,
  Updated: <Pencil className="h-4 w-4" />,
  Deleted: <Trash2 className="h-4 w-4" />,
  ConvertedToRateRequest: <ArrowRightCircle className="h-4 w-4" />,
  ConvertedToQuotation: <ArrowRightCircle className="h-4 w-4" />,
  ConvertedToShipment: <ArrowRightCircle className="h-4 w-4" />,
  Note: <MessageSquare className="h-4 w-4" />,
};

const ACTION_COLOR: Record<string, string> = {
  Created: "text-emerald-600",
  Updated: "text-amber-600",
  Deleted: "text-destructive",
  ConvertedToRateRequest: "text-cyan-600",
  ConvertedToQuotation: "text-cyan-600",
  ConvertedToShipment: "text-cyan-600",
  Note: "text-primary",
};

function formatTimestamp(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function RelatedLinks({ entry }: { entry: SalesActivityLogEntry }) {
  const links: JSX.Element[] = [];
  if (entry.relatedLeadId) {
    links.push(
      <Link key="lead" to={`/sales/leads/${entry.relatedLeadId}/edit`} className="underline hover:text-primary">
        View Lead
      </Link>
    );
  }
  if (entry.relatedRateRequestId) {
    links.push(
      <Link key="rr" to={`/sales/rate-requests/${entry.relatedRateRequestId}/edit`} className="underline hover:text-primary">
        View Rate Request
      </Link>
    );
  }
  if (entry.relatedQuotationId) {
    links.push(
      <Link key="q" to={`/sales/quotations/${entry.relatedQuotationId}/edit`} className="underline hover:text-primary">
        View Quotation
      </Link>
    );
  }
  if (links.length === 0) return null;
  return <div className="flex gap-3 mt-1 text-xs text-muted-foreground">{links}</div>;
}

export function SalesActivityLog({ entries, onAdd, isReadOnly = false }: SalesActivityLogProps) {
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleAdd = async () => {
    if (!note.trim()) return;
    setSubmitting(true);
    try {
      await onAdd(note.trim());
      setNote("");
    } finally {
      setSubmitting(false);
    }
  };

  const sorted = [...(entries ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() || b.id - a.id
  );

  return (
    <div className="space-y-4">
      {!isReadOnly && (
        <div className="space-y-2">
          <Textarea
            placeholder="Add a note..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
          />
          <div className="flex justify-end">
            <Button type="button" size="sm" onClick={handleAdd} disabled={submitting || !note.trim()}>
              {submitting && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
              Add Note
            </Button>
          </div>
        </div>
      )}

      {sorted.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No activity recorded yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((entry) =>
            entry.actionType === "Note" ? (
              <div key={entry.id} className="border-l-2 border-primary/40 bg-muted/30 rounded-r-md p-3">
                <p className="text-sm text-foreground whitespace-pre-wrap">{entry.message}</p>
                <div className="text-xs text-muted-foreground mt-1">
                  {entry.createdBy ?? "Unknown"} &middot; {formatTimestamp(entry.createdAt)}
                </div>
              </div>
            ) : (
              <div key={entry.id} className="flex items-start gap-2 text-sm">
                <span className={cn("mt-0.5 flex-shrink-0", ACTION_COLOR[entry.actionType] ?? "text-muted-foreground")}>
                  {ACTION_ICON[entry.actionType] ?? <Clock className="h-4 w-4" />}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="text-foreground">
                    <span className="font-medium">{entry.createdBy ?? "Unknown"}</span> {entry.message}
                  </span>
                  <div className="text-xs text-muted-foreground">{formatTimestamp(entry.createdAt)}</div>
                  <RelatedLinks entry={entry} />
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
