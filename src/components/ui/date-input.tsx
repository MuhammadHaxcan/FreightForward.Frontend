import { useState } from "react";
import { format, parse } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
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

  // Convert ISO date to dd-mm-yyyy format for display
  const formatDisplayDate = (isoDate: string) => {
    if (!isoDate) return "";
    try {
      const date = new Date(isoDate);
      if (isNaN(date.getTime())) return isoDate;
      return format(date, "dd-MM-yyyy");
    } catch {
      return isoDate;
    }
  };

  // Convert dd-mm-yyyy to ISO format for storage
  const parseInputDate = (displayDate: string) => {
    if (!displayDate) return "";
    try {
      const date = parse(displayDate, "dd-MM-yyyy", new Date());
      if (isNaN(date.getTime())) return displayDate;
      return format(date, "yyyy-MM-dd");
    } catch {
      return displayDate;
    }
  };

  // Get Date object from ISO string
  const getDateFromValue = () => {
    if (!value) return undefined;
    try {
      const date = new Date(value);
      return isNaN(date.getTime()) ? undefined : date;
    } catch {
      return undefined;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    // Allow typing in dd-mm-yyyy format
    if (inputValue.match(/^\d{2}-\d{2}-\d{4}$/)) {
      onChange(parseInputDate(inputValue));
    } else {
      // For partial input, try to preserve it
      onChange(inputValue);
    }
  };

  const handleCalendarSelect = (date: Date | undefined) => {
    if (date) {
      onChange(format(date, "yyyy-MM-dd"));
    }
    setOpen(false);
  };

  return (
    <div className={cn("relative flex items-center", className)}>
      <Input
        value={formatDisplayDate(value)}
        onChange={handleInputChange}
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
