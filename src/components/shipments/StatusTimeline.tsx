import { ShipmentStatusLog, StatusEventType } from "@/services/api/shipment";
import { Button } from "@/components/ui/button";
import {
  Ship,
  Train,
  Package,
  FileCheck,
  CheckCircle,
  Truck,
  Clock,
  Trash2,
  MapPin,
} from "lucide-react";
import {
  getEventTypeColor,
  formatEventDateOnly,
} from "@/lib/status-event-utils";
import { cn } from "@/lib/utils";

interface StatusTimelineProps {
  statusLogs: ShipmentStatusLog[];
  onDelete?: (statusLogId: number) => void;
}

const getEventIcon = (eventType: StatusEventType) => {
  const iconClass = "h-5 w-5";
  switch (eventType) {
    case 'LoadOnVessel':
    case 'VesselDeparture':
    case 'VesselArrival':
    case 'Discharge':
      return <Ship className={iconClass} />;
    case 'OnRail':
    case 'OffRail':
      return <Train className={iconClass} />;
    case 'GateOutEmpty':
    case 'GateIn':
      return <Package className={iconClass} />;
    case 'CustomsClearance':
      return <FileCheck className={iconClass} />;
    case 'Delivered':
      return <CheckCircle className={iconClass} />;
    case 'EmptyContainerReturn':
      return <Truck className={iconClass} />;
    case 'Other':
    default:
      return <Clock className={iconClass} />;
  }
};

export function StatusTimeline({ statusLogs, onDelete }: StatusTimelineProps) {
  if (!statusLogs || statusLogs.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No tracking events recorded yet.</p>
        <p className="text-sm mt-1">Click "Add Event" to record the first status update.</p>
      </div>
    );
  }

  // Sort by eventDateTime descending (most recent first)
  const sortedLogs = [...statusLogs].sort(
    (a, b) => new Date(b.eventDateTime).getTime() - new Date(a.eventDateTime).getTime()
  );

  const latestEvent = sortedLogs[0];

  return (
    <div className="space-y-6">
      {/* Latest Event Banner */}
      <div className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className={cn("p-2 rounded-full bg-white/10", getEventTypeColor(latestEvent.eventType))}>
            {getEventIcon(latestEvent.eventType)}
          </div>
          <div className="flex-1">
            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Latest Event</div>
            <div className="font-semibold text-foreground">{latestEvent.eventDescription}</div>
            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
              {latestEvent.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {latestEvent.location}
                </span>
              )}
              <span>{formatEventDateOnly(latestEvent.eventDateTime)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {sortedLogs.map((log, index) => (
          <div key={log.id} className="relative flex gap-4 pb-8 last:pb-0">
            {/* Timeline Line */}
            {index !== sortedLogs.length - 1 && (
              <div className="absolute left-[19px] top-10 w-0.5 h-[calc(100%-2.5rem)] bg-border" />
            )}

            {/* Icon */}
            <div
              className={cn(
                "relative z-10 flex-shrink-0 w-10 h-10 rounded-full border-2 border-border bg-card flex items-center justify-center",
                getEventTypeColor(log.eventType)
              )}
            >
              {getEventIcon(log.eventType)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 bg-muted/30 rounded-lg p-4 border border-border">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  {/* Event Description */}
                  <div className="font-semibold text-foreground">{log.eventDescription}</div>

                  {/* Event Type Badge */}
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {log.eventTypeDisplay}
                  </div>

                  {/* Details */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
                    {log.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {log.location}
                      </span>
                    )}
                    {log.vesselName && (
                      <span className="flex items-center gap-1">
                        <Ship className="h-3 w-3" />
                        {log.vesselName}
                        {log.voyageNumber && ` / ${log.voyageNumber}`}
                      </span>
                    )}
                  </div>

                  {/* Remarks */}
                  {log.remarks && (
                    <div className="mt-2 text-sm text-muted-foreground italic">
                      {log.remarks}
                    </div>
                  )}
                </div>

                {/* Date & Delete */}
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <div className="text-sm font-medium text-foreground">
                    {formatEventDateOnly(log.eventDateTime)}
                  </div>
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => onDelete(log.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
