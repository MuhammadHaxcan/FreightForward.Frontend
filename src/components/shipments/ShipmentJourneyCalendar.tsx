import { useState, useMemo } from "react";
import { Ship, Anchor, Flag, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export interface ShipmentJourneyCalendarProps {
  etd?: string; // YYYY-MM-DD
  eta?: string; // YYYY-MM-DD
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseLocalDate(s: string | undefined): Date | null {
  if (!s) return null;
  const parts = s.split("-");
  if (parts.length !== 3) return null;
  const [y, m, d] = parts.map(Number);
  if (!y || isNaN(m) || isNaN(d)) return null;
  return new Date(y, m - 1, d);
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function daysBetween(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

function shiftMonths(base: Date, n: number): Date {
  return new Date(base.getFullYear(), base.getMonth() + n, 1);
}

function formatDate(d: Date | null) {
  if (!d) return "Not set";
  return d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

// ─── Month grid ───────────────────────────────────────────────────────────────

function MonthGrid({
  year, month, today, etdDate, etaDate,
}: {
  year: number;
  month: number;
  today: Date;
  etdDate: Date | null;
  etaDate: Date | null;
}) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Monday-first offset (0 = Mon … 6 = Sun)
  const firstOffset = (new Date(year, month, 1).getDay() + 6) % 7;

  const cells: (number | null)[] = [
    ...Array<null>(firstOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const rangeValid = etdDate && etaDate && etdDate < etaDate;

  return (
    <div className="flex-1 min-w-[196px]">
      {/* Month title */}
      <p className="text-center text-xs font-semibold text-foreground mb-1 tracking-wide">
        {MONTH_NAMES[month]} {year}
      </p>

      <div className="grid grid-cols-7 gap-px">
        {/* Weekday headers */}
        {WEEKDAYS.map((d) => (
          <div key={d} className="h-7 flex items-center justify-center">
            <span className="text-[10px] text-muted-foreground/60 font-medium">{d}</span>
          </div>
        ))}

        {/* Day cells */}
        {cells.map((day, idx) => {
          if (day === null) {
            return <div key={`b${idx}`} className="h-9" />;
          }

          const date = new Date(year, month, day);
          const isToday = sameDay(date, today);
          const isETD = !!etdDate && sameDay(date, etdDate);
          const isETA = !!etaDate && sameDay(date, etaDate);
          const isPast = !isToday && date < today;
          const inRange = rangeValid ? date > etdDate! && date < etaDate! : false;

          // ── Today ──
          if (isToday) {
            const extraLabel = isETD && isETA ? "ETD · ETA" : isETD ? "ETD" : isETA ? "ETA" : null;
            return (
              <Tooltip key={day}>
                <TooltipTrigger asChild>
                  <div className="h-9 flex flex-col items-center justify-center rounded-md bg-cyan-500/20 border border-cyan-500/40 cursor-default select-none">
                    <span className="text-[11px] font-bold text-cyan-700 dark:text-cyan-400 leading-none">{day}</span>
                    <Ship className="h-2.5 w-2.5 text-cyan-600 dark:text-cyan-400 mt-[2px]" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  <p className="font-semibold">Today — {formatDate(today)}</p>
                  {extraLabel && <p className="text-muted-foreground mt-0.5">Also: {extraLabel}</p>}
                </TooltipContent>
              </Tooltip>
            );
          }

          // ── ETD ──
          if (isETD) {
            return (
              <Tooltip key={day}>
                <TooltipTrigger asChild>
                  <div className="h-9 flex flex-col items-center justify-center rounded-md bg-blue-500/15 border border-blue-400/40 cursor-default select-none">
                    <span className="text-[11px] font-bold text-blue-700 dark:text-blue-400 leading-none">{day}</span>
                    <Anchor className="h-2.5 w-2.5 text-blue-600 dark:text-blue-400 mt-[2px]" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  <p className="font-semibold text-blue-500">ETD — Estimated Departure</p>
                  <p>{formatDate(etdDate)}</p>
                  {isPast
                    ? <p className="text-muted-foreground mt-0.5">Departed {daysBetween(etdDate!, today)} days ago</p>
                    : <p className="text-muted-foreground mt-0.5">Departs in {daysBetween(today, etdDate!)} days</p>}
                </TooltipContent>
              </Tooltip>
            );
          }

          // ── ETA ──
          if (isETA) {
            return (
              <Tooltip key={day}>
                <TooltipTrigger asChild>
                  <div className="h-9 flex flex-col items-center justify-center rounded-md bg-emerald-500/15 border border-emerald-400/40 cursor-default select-none">
                    <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 leading-none">{day}</span>
                    <Flag className="h-2.5 w-2.5 text-emerald-600 dark:text-emerald-400 mt-[2px]" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  <p className="font-semibold text-emerald-500">ETA — Estimated Arrival</p>
                  <p>{formatDate(etaDate)}</p>
                  {isPast
                    ? <p className="text-muted-foreground mt-0.5">Arrived {daysBetween(etaDate!, today)} days ago</p>
                    : <p className="text-muted-foreground mt-0.5">Arrives in {daysBetween(today, etaDate!)} days</p>}
                </TooltipContent>
              </Tooltip>
            );
          }

          // ── Voyage-window inner day ──
          if (inRange) {
            return (
              <div key={day} className="h-9 flex items-center justify-center bg-blue-500/[0.07] rounded-sm">
                <span className="text-xs text-blue-600/70 dark:text-blue-400/60">{day}</span>
              </div>
            );
          }

          // ── Ordinary day ──
          return (
            <div key={day} className="h-9 flex items-center justify-center">
              <span className={cn("text-sm", isPast ? "text-muted-foreground/40" : "text-foreground")}>
                {day}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const MAX_VISIBLE = 3;

export function ShipmentJourneyCalendar({ etd, eta }: ShipmentJourneyCalendarProps) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const etdDate = useMemo(() => parseLocalDate(etd), [etd]);
  const etaDate = useMemo(() => parseLocalDate(eta), [eta]);

  // Month range spanning all three dates
  const allDates = [today, etdDate, etaDate].filter((d): d is Date => d !== null);
  const minDate = allDates.reduce((m, d) => (d < m ? d : m), allDates[0]);
  const maxDate = allDates.reduce((m, d) => (d > m ? d : m), allDates[0]);

  const baseYear = minDate.getFullYear();
  const baseMonth = minDate.getMonth();
  const totalMonths =
    (maxDate.getFullYear() - baseYear) * 12 + (maxDate.getMonth() - baseMonth) + 1;

  // Start view so today is visible as the first month if possible
  const todayIdx = (today.getFullYear() - baseYear) * 12 + (today.getMonth() - baseMonth);
  const maxOffset = Math.max(0, totalMonths - MAX_VISIBLE);
  const [offset, setOffset] = useState(Math.min(Math.max(0, todayIdx), maxOffset));

  const monthsVisible = Math.min(totalMonths, MAX_VISIBLE);
  const visibleMonths = useMemo(
    () =>
      Array.from({ length: monthsVisible }, (_, i) => {
        const d = shiftMonths(new Date(baseYear, baseMonth, 1), offset + i);
        return { year: d.getFullYear(), month: d.getMonth() };
      }),
    [baseYear, baseMonth, offset, monthsVisible],
  );

  // Stats
  const transitDays =
    etdDate && etaDate && etdDate < etaDate ? daysBetween(etdDate, etaDate) : null;

  const journeyProgress = useMemo(() => {
    if (!etdDate || !etaDate || !transitDays || today < etdDate || today > etaDate) return null;
    return Math.min(100, Math.max(0, (daysBetween(etdDate, today) / transitDays) * 100));
  }, [etdDate, etaDate, today, transitDays]);

  const statusLine = useMemo(() => {
    if (etdDate && etaDate) {
      if (today < etdDate) {
        const n = daysBetween(today, etdDate);
        return `Departs in ${n} day${n !== 1 ? "s" : ""}`;
      }
      if (today > etaDate) return "Voyage completed";
      const n = daysBetween(today, etaDate);
      return `En route · ${n} day${n !== 1 ? "s" : ""} to arrival`;
    }
    if (etdDate) {
      if (today < etdDate) {
        const n = daysBetween(today, etdDate);
        return `Departs in ${n} day${n !== 1 ? "s" : ""}`;
      }
      return `Departed ${daysBetween(etdDate, today)} days ago`;
    }
    if (etaDate) {
      if (today < etaDate) {
        const n = daysBetween(today, etaDate);
        return `Arriving in ${n} day${n !== 1 ? "s" : ""}`;
      }
      return "Voyage completed";
    }
    return null;
  }, [etdDate, etaDate, today]);

  return (
    <TooltipProvider>
      <div className="bg-muted/30 rounded-lg border border-border p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">Journey Calendar</span>
            {statusLine && (
              <span className="text-xs text-muted-foreground">— {statusLine}</span>
            )}
          </div>

          {totalMonths > MAX_VISIBLE && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setOffset((v) => Math.max(0, v - 1))}
                disabled={offset === 0}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="text-[11px] text-muted-foreground tabular-nums">
                {offset + 1}–{Math.min(offset + MAX_VISIBLE, totalMonths)}/{totalMonths}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setOffset((v) => Math.min(maxOffset, v + 1))}
                disabled={offset >= maxOffset}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>

        {/* Month grids */}
        <div className="flex gap-6 overflow-x-auto">
          {visibleMonths.map(({ year, month }) => (
            <MonthGrid
              key={`${year}-${month}`}
              year={year}
              month={month}
              today={today}
              etdDate={etdDate}
              etaDate={etaDate}
            />
          ))}
        </div>

        {/* Progress bar — only shown when en route */}
        {journeyProgress !== null && transitDays !== null && (
          <div className="pt-1 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Anchor className="h-3 w-3 text-blue-500" />
                {formatDate(etdDate)}
              </span>
              <span className="font-medium text-foreground">
                {Math.round(journeyProgress)}% complete
              </span>
              <span className="flex items-center gap-1">
                {formatDate(etaDate)}
                <Flag className="h-3 w-3 text-emerald-500" />
              </span>
            </div>

            {/* Track */}
            <div className="h-1.5 bg-border rounded-full overflow-visible relative">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 relative"
                style={{ width: `${journeyProgress}%` }}
              >
                {/* Ship marker at the tip */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="absolute -right-2.5 top-1/2 -translate-y-1/2 cursor-default">
                      <div className="w-5 h-5 rounded-md bg-background border border-border flex items-center justify-center shadow-sm">
                        <Ship className="h-3 w-3 text-cyan-500" />
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    <p className="font-semibold">Today — {formatDate(today)}</p>
                    <p className="text-muted-foreground">
                      {daysBetween(etdDate!, today)} elapsed · {daysBetween(today, etaDate!)} remaining
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground text-center">
              {transitDays} day transit · {daysBetween(etdDate!, today)} elapsed · {daysBetween(today, etaDate!)} remaining
            </p>
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-1 border-t border-border text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-cyan-500/15 border border-cyan-400/30">
              <Ship className="h-2.5 w-2.5 text-cyan-600" />
              <span className="font-medium text-cyan-700 dark:text-cyan-400">Today</span>
            </span>
            {formatDate(today)}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-blue-500/15 border border-blue-400/30">
              <Anchor className="h-2.5 w-2.5 text-blue-600" />
              <span className="font-medium text-blue-700 dark:text-blue-400">ETD</span>
            </span>
            {etdDate ? formatDate(etdDate) : "Not set"}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-400/30">
              <Flag className="h-2.5 w-2.5 text-emerald-600" />
              <span className="font-medium text-emerald-700 dark:text-emerald-400">ETA</span>
            </span>
            {etaDate ? formatDate(etaDate) : "Not set"}
          </span>
          {etdDate && etaDate && etdDate < etaDate && (
            <span className="flex items-center gap-1.5">
              <span className="w-5 h-3.5 rounded-sm bg-blue-500/[0.07] border border-blue-400/20 inline-block" />
              Voyage window
            </span>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
