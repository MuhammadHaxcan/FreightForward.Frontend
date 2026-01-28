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
}

export function DateInput({ value, onChange, placeholder = "dd-mm-yyyy", className, disabled }: DateInputProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");

  // Convert ISO date to dd-MM-yyyy format for display
  const formatDisplayDate = (isoDate: string) => {
    if (!isoDate) return "";
    const date = parseDateOnly(isoDate);
    if (!date) return "";
    return format(date, "dd-MM-yyyy");
  };

  // Sync local input state when parent value changes (e.g., from calendar or external update)
  useEffect(() => {
    setInputValue(formatDisplayDate(value));
  }, [value]);

  // Convert dd-MM-yyyy to ISO format for storage
  const parseInputDate = (displayDate: string): string | null => {
    if (!displayDate || displayDate.length !== 10) return null;
    try {
      const date = parse(displayDate, "dd-MM-yyyy", new Date());
      if (!isValid(date)) return null;
      // Additional validation: ensure the parsed date matches the input
      // This catches cases like 31-02-2024 which would parse to a different date
      const reparsed = format(date, "dd-MM-yyyy");
      if (reparsed !== displayDate) return null;
      return format(date, "yyyy-MM-dd");
    } catch {
      return null;
    }
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
    }
  };

  const handleBlur = () => {
    // On blur, if current input is invalid, reset to the last valid value
    const isoDate = parseInputDate(inputValue);
    if (!isoDate && value) {
      setInputValue(formatDisplayDate(value));
    }
  };

  const handleCalendarSelect = (date: Date | undefined) => {
    if (date) {
      const isoDate = formatDateToISO(date);
      onChange(isoDate);
      setInputValue(format(date, "dd-MM-yyyy"));
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
            initialFocus
            className="p-3 pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
