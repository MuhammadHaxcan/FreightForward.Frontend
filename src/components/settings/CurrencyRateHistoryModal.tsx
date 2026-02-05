import { Loader2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCurrencyRateHistory } from "@/hooks/useSettings";
import { format } from "date-fns";

interface CurrencyRateHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currencyId: number | null;
  currencyName: string;
  currencyCode: string;
}

export function CurrencyRateHistoryModal({
  open,
  onOpenChange,
  currencyId,
  currencyName,
  currencyCode,
}: CurrencyRateHistoryModalProps) {
  const { data: history, isLoading } = useCurrencyRateHistory(open ? currencyId : null);

  const getRoeChangeIcon = (oldRoe: number, newRoe: number) => {
    if (newRoe > oldRoe) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (newRoe < oldRoe) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const formatChange = (oldVal: number, newVal: number) => {
    const diff = newVal - oldVal;
    const sign = diff > 0 ? "+" : "";
    return `${sign}${diff.toFixed(4)}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Rate History - {currencyName} ({currencyCode})
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !history || history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No rate change history found for this currency.
            </div>
          ) : (
            <div
              className="max-h-[400px] overflow-y-auto pr-2 overscroll-contain [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
              onWheel={(e) => {
                e.stopPropagation();
                const target = e.currentTarget;
                target.scrollTop += e.deltaY;
              }}
            >
              <div className="space-y-4">
                {history.map((entry, index) => (
                  <div
                    key={entry.id}
                    className={`relative pl-6 pb-4 ${
                      index !== history.length - 1 ? "border-l-2 border-border" : ""
                    }`}
                  >
                    {/* Timeline dot */}
                    <div className="absolute left-[-5px] top-0 w-3 h-3 rounded-full bg-primary border-2 border-background" />

                    {/* Content */}
                    <div className="bg-secondary/30 rounded-lg p-3 ml-2">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-foreground">
                          {format(new Date(entry.effectiveDate), "MMM dd, yyyy HH:mm")}
                        </span>
                        {entry.changedBy && (
                          <span className="text-xs text-muted-foreground">
                            by {entry.changedBy}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {/* ROE Change */}
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground font-medium">ROE</div>
                          <div className="flex items-center gap-2">
                            <span className="text-foreground">{entry.oldRoe.toFixed(4)}</span>
                            <span className="text-muted-foreground">→</span>
                            <span className="text-foreground font-medium">{entry.newRoe.toFixed(4)}</span>
                            {getRoeChangeIcon(entry.oldRoe, entry.newRoe)}
                          </div>
                          <div className={`text-xs ${entry.newRoe > entry.oldRoe ? "text-green-500" : entry.newRoe < entry.oldRoe ? "text-red-500" : "text-muted-foreground"}`}>
                            {formatChange(entry.oldRoe, entry.newRoe)}
                          </div>
                        </div>

                        {/* USD Rate Change */}
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground font-medium">1 USD Rate</div>
                          <div className="flex items-center gap-2">
                            <span className="text-foreground">{entry.oldUsdRate.toFixed(4)}</span>
                            <span className="text-muted-foreground">→</span>
                            <span className="text-foreground font-medium">{entry.newUsdRate.toFixed(4)}</span>
                            {getRoeChangeIcon(entry.oldUsdRate, entry.newUsdRate)}
                          </div>
                          <div className={`text-xs ${entry.newUsdRate > entry.oldUsdRate ? "text-green-500" : entry.newUsdRate < entry.oldUsdRate ? "text-red-500" : "text-muted-foreground"}`}>
                            {formatChange(entry.oldUsdRate, entry.newUsdRate)}
                          </div>
                        </div>
                      </div>

                      {entry.reason && (
                        <div className="mt-2 pt-2 border-t border-border">
                          <span className="text-xs text-muted-foreground">Reason: </span>
                          <span className="text-xs text-foreground">{entry.reason}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
