import { useState, useEffect } from "react";
import { format, parse, isValid } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn, parseDateOnly, formatDateToISO } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

interface DateInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  minDate?: string;
  onValidityChange?: (isValid: boolean) => void;
}

export function DateInput({
  value,
  onChange,
  placeholder = "dd-Mmm-yyyy",
  className,
  disabled,
  minDate,
  onValidityChange,
}: DateInputProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const minimumDate = parseDateOnly(minDate);

  // Convert ISO date to the standard user-visible format.
  const formatDisplayDate = (isoDate: string) => {
    if (!isoDate) return "";
    const date = parseDateOnly(isoDate);
    if (!date) return "";
    return format(date, "dd-MMM-yyyy");
  };

  // Sync local input state when parent value changes (e.g., from calendar or external update)
  useEffect(() => {
    setInputValue(formatDisplayDate(value));
  }, [value]);

  // Convert the standard display format to ISO for storage. Continue accepting the
  // previous numeric format while users transition to the new presentation standard.
  const parseInputDate = (displayDate: string): string | null => {
    if (!displayDate) return null;

    for (const displayFormat of ["dd-MMM-yyyy", "dd-MM-yyyy"]) {
      try {
        const date = parse(displayDate, displayFormat, new Date());
        if (!isValid(date)) continue;
        const reparsed = format(date, displayFormat);
        if (reparsed.toLowerCase() !== displayDate.toLowerCase()) continue;
        return format(date, "yyyy-MM-dd");
      } catch {
        // Try the next supported display format.
      }
    }

    return null;
  };

  // Get Date object from ISO string for calendar
  const getDateFromValue = () => {
    if (!value) return undefined;
    return parseDateOnly(value) ?? undefined;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;

    // Allow free typing - just update local state
    setInputValue(newValue);

    // Only update parent if we have a valid complete date
    const isoDate = parseInputDate(newValue);
    if (isoDate) {
      onChange(isoDate);
      onValidityChange?.(true);
    } else {
      onValidityChange?.(false);
    }
  };

  const handleBlur = () => {
    // On blur, if current input is invalid, reset to the last valid value
    const isoDate = parseInputDate(inputValue);
    if (!isoDate && value) {
      setInputValue(formatDisplayDate(value));
      onValidityChange?.(true);
    }
  };

  const handleCalendarSelect = (date: Date | undefined) => {
    if (date) {
      const isoDate = formatDateToISO(date);
      onChange(isoDate);
      onValidityChange?.(true);
      setInputValue(format(date, "dd-MMM-yyyy"));
    }
    setOpen(false);
  };

  return (
    <div className={cn("relative flex items-center", className)}>
      <Input
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        className="pr-10"
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled}
            className="absolute right-0 h-full px-3 hover:bg-transparent"
          >
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 z-50" align="end">
          <Calendar
            mode="single"
            selected={getDateFromValue()}
            onSelect={handleCalendarSelect}
            disabled={minimumDate ? { before: minimumDate } : undefined}
            initialFocus
            className="p-3 pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
