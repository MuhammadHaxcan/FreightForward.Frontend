import { useState } from "react";
import {
  format,
  startOfDay,
  endOfDay,
  subDays,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfYear,
  endOfYear,
  subYears,
} from "date-fns";
import { CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export type DateRangeValue = { from: Date | undefined; to: Date | undefined };

type PresetKey =
  | "all"
  | "today"
  | "yesterday"
  | "last7"
  | "last30"
  | "thisMonth"
  | "lastMonth"
  | "thisYear"
  | "lastYear"
  | "custom";

interface Preset {
  key: PresetKey;
  label: string;
  range: DateRangeValue | undefined | null; // null = custom
}

interface DateRangePickerProps {
  value?: DateRangeValue;
  onApply: (range: DateRangeValue | undefined) => void;
  placeholder?: string;
  className?: string;
  excludePresets?: PresetKey[];
}

function buildPresets(): Preset[] {
  const today = new Date();
  return [
    { key: "all", label: "All", range: undefined },
    { key: "today", label: "Today", range: { from: startOfDay(today), to: endOfDay(today) } },
    {
      key: "yesterday",
      label: "Yesterday",
      range: { from: startOfDay(subDays(today, 1)), to: endOfDay(subDays(today, 1)) },
    },
    { key: "last7", label: "Last 7 Days", range: { from: subDays(today, 6), to: today } },
    { key: "last30", label: "Last 30 Days", range: { from: subDays(today, 29), to: today } },
    {
      key: "thisMonth",
      label: "This Month",
      range: { from: startOfMonth(today), to: endOfMonth(today) },
    },
    {
      key: "lastMonth",
      label: "Last Month",
      range: {
        from: startOfMonth(subMonths(today, 1)),
        to: endOfMonth(subMonths(today, 1)),
      },
    },
    {
      key: "thisYear",
      label: "This Year",
      range: { from: startOfYear(today), to: endOfYear(today) },
    },
    {
      key: "lastYear",
      label: "Last Year",
      range: {
        from: startOfYear(subYears(today, 1)),
        to: endOfYear(subYears(today, 1)),
      },
    },
    { key: "custom", label: "Custom Range", range: null },
  ];
}

export function DateRangePicker({
  value,
  onApply,
  placeholder = "Select date range",
  className,
  excludePresets,
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [pendingRange, setPendingRange] = useState<DateRangeValue | undefined>(value);
  const [activePreset, setActivePreset] = useState<PresetKey | null>(null);

  const presets = buildPresets().filter(
    (p) => !excludePresets?.includes(p.key)
  );

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setPendingRange(value);
      setActivePreset(null);
      setShowCalendar(false);
    }
    setOpen(isOpen);
  };

  const handlePresetClick = (preset: Preset) => {
    if (preset.key === "custom") {
      // Show the calendar panel for custom selection
      setActivePreset("custom");
      setShowCalendar(true);
    } else {
      // Immediately apply and close — no calendar needed
      setActivePreset(preset.key);
      onApply(preset.range);
      setOpen(false);
      setShowCalendar(false);
    }
  };

  const handleCalendarSelect = (range: DateRange | undefined) => {
    setPendingRange(range ? { from: range.from, to: range.to } : undefined);
  };

  const handleCancel = () => {
    setShowCalendar(false);
    setActivePreset(null);
    setPendingRange(value);
  };

  const handleApply = () => {
    onApply(pendingRange);
    setOpen(false);
    setShowCalendar(false);
  };

  const triggerLabel = value?.from
    ? value.to
      ? `${format(value.from, "MMM d, yyyy")} - ${format(value.to, "MMM d, yyyy")}`
      : format(value.from, "MMM d, yyyy")
    : placeholder;

  const bottomLabel = pendingRange?.from
    ? pendingRange.to
      ? `${format(pendingRange.from, "MM/dd/yyyy")} - ${format(pendingRange.to, "MM/dd/yyyy")}`
      : format(pendingRange.from, "MM/dd/yyyy")
    : "—";

  const calendarSelected: DateRange | undefined = pendingRange
    ? { from: pendingRange.from, to: pendingRange.to }
    : undefined;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-2 border border-input rounded-md px-3 h-9 bg-background text-sm text-left",
            "hover:bg-accent hover:text-accent-foreground transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
            !value?.from && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="truncate">{triggerLabel}</span>
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0 z-50" align="start" sideOffset={4}>
        <div className="flex flex-col">
          <div className="flex">
            {/* Preset sidebar — always visible */}
            <div className="flex flex-col border-r border-border w-[130px] py-2">
              {presets.map((preset) => (
                <button
                  key={preset.key}
                  onClick={() => handlePresetClick(preset)}
                  className={cn(
                    "text-left px-3 py-1.5 text-sm transition-colors",
                    activePreset === preset.key
                      ? "bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900"
                      : "hover:bg-accent hover:text-accent-foreground text-foreground"
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Calendar — only shown for Custom Range */}
            {showCalendar && (
              <div className="p-2">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={pendingRange?.from ?? new Date()}
                  selected={calendarSelected}
                  onSelect={handleCalendarSelect}
                  numberOfMonths={2}
                />
              </div>
            )}
          </div>

          {/* Bottom bar — only shown for Custom Range */}
          {showCalendar && (
            <div className="flex items-center justify-between border-t border-border px-4 py-2 bg-muted/30">
              <span className="text-sm text-muted-foreground">{bottomLabel}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="bg-slate-800 hover:bg-slate-700 text-white dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-slate-300"
                  onClick={handleApply}
                >
                  Apply
                </Button>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
