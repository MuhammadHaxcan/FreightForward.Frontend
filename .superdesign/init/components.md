# Shared UI Components

Framework: React 18 + TypeScript + Vite. Component system: shadcn-style Radix primitives with Tailwind CSS and CVA.

## Button

- Path: `src/components/ui/button.tsx`
- Description: CVA-based button with default, destructive, outline, secondary, ghost, and link variants.

```tsx
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        data-audit-track="button"
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
```

## Input

- Path: `src/components/ui/input.tsx`
- Description: Shared accessible text input with token-based focus and disabled states.

```tsx
import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
```

## Table primitives

- Path: `src/components/ui/table.tsx`
- Description: Shared table, header, body, row, head, cell, footer, and caption primitives.

```tsx
import * as React from "react";

import { cn } from "@/lib/utils";

const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="relative w-full overflow-auto">
      <table ref={ref} className={cn("w-full caption-bottom text-sm", className)} {...props} />
    </div>
  ),
);
Table.displayName = "Table";

const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />,
);
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tbody ref={ref} className={cn("[&_tr:last-child]:border-0 [&_tr]:hover:bg-muted/50", className)} {...props} />
  ),
);
TableBody.displayName = "TableBody";

const TableFooter = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tfoot ref={ref} className={cn("border-t bg-muted/50 font-medium [&>tr]:last:border-b-0", className)} {...props} />
  ),
);
TableFooter.displayName = "TableFooter";

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn("border-b transition-colors data-[state=selected]:bg-muted", className)}
      {...props}
    />
  ),
);
TableRow.displayName = "TableRow";

const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
        className,
      )}
      {...props}
    />
  ),
);
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <td ref={ref} className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)} {...props} />
  ),
);
TableCell.displayName = "TableCell";

const TableCaption = React.forwardRef<HTMLTableCaptionElement, React.HTMLAttributes<HTMLTableCaptionElement>>(
  ({ className, ...props }, ref) => (
    <caption ref={ref} className={cn("mt-4 text-sm text-muted-foreground", className)} {...props} />
  ),
);
TableCaption.displayName = "TableCaption";

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption };
```

## Badge

- Path: `src/components/ui/badge.tsx`
- Description: Pill badge with default, secondary, destructive, and outline variants.

```tsx
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
```

## SearchableSelect

- Path: `src/components/ui/searchable-select.tsx`
- Description: Popover/command based searchable single-select used by filters and compact controls.

```tsx
import * as React from "react";
import { Check, ChevronDown } from "lucide-react";
import { Command as CommandPrimitive } from "cmdk";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

export interface SearchableSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  emptyMessage?: string;
  defaultSearch?: string;
  autoOpen?: boolean;
}

export function SearchableSelect({
  options,
  value,
  onValueChange,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  disabled = false,
  className,
  triggerClassName,
  emptyMessage = "No results found.",
  defaultSearch = "",
  autoOpen = false,
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState(defaultSearch);

  // Sync when defaultSearch changes externally
  React.useEffect(() => {
    setSearch(defaultSearch);
  }, [defaultSearch]);

  // Auto-open on mount when autoOpen is true
  React.useEffect(() => {
    if (autoOpen && !disabled) {
      // Small delay to let the component render first
      const timer = setTimeout(() => setOpen(true), 100);
      return () => clearTimeout(timer);
    }
  }, [autoOpen, disabled]);

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = React.useMemo(() => {
    if (!search) return options;
    const searchLower = search.toLowerCase();
    return options.filter((opt) =>
      opt.label.toLowerCase().includes(searchLower)
    );
  }, [options, search]);

  return (
    <Popover open={open} onOpenChange={(v) => { if (!disabled) setOpen(v); }}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={selectedOption ? `Selected: ${selectedOption.label}` : placeholder}
          aria-haspopup="listbox"
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal",
            !selectedOption && "text-muted-foreground",
            triggerClassName
          )}
        >
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn("min-w-[120px] w-[var(--radix-popover-trigger-width)] p-0", className)}
        align="start"
        onWheel={(e) => e.stopPropagation()}
      >
        <CommandPrimitive
          className="flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground"
          shouldFilter={false}
        >
          <div className="flex items-center border-b px-3">
            <CommandPrimitive.Input
              value={search}
              onValueChange={setSearch}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <CommandPrimitive.List
            className="max-h-[180px] overflow-y-auto p-1 overscroll-contain [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            onWheel={(e) => {
              e.stopPropagation();
              const target = e.currentTarget;
              target.scrollTop += e.deltaY;
            }}
          >
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                {emptyMessage}
              </div>
            ) : (
              filteredOptions.map((option) => (
                <CommandPrimitive.Item
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  onSelect={() => {
                    onValueChange(option.value);
                    setOpen(false);
                    setSearch("");
                  }}
                  className="relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none data-[disabled=true]:pointer-events-none data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground data-[disabled=true]:opacity-50"
                >
                  <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                    {option.value === value && <Check className="h-4 w-4" />}
                  </span>
                  <span className="break-words whitespace-normal">{option.label}</span>
                </CommandPrimitive.Item>
              ))
            )}
          </CommandPrimitive.List>
        </CommandPrimitive>
      </PopoverContent>
    </Popover>
  );
}
```

## DateRangePicker

- Path: `src/components/ui/date-range-picker.tsx`
- Description: Preset and custom date-range filter with two-month calendar.

```tsx
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
      // Immediately apply and close â€” no calendar needed
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
    : "â€”";

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
            {/* Preset sidebar â€” always visible */}
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

            {/* Calendar â€” only shown for Custom Range */}
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

          {/* Bottom bar â€” only shown for Custom Range */}
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
```

## Dialog primitives

- Path: `src/components/ui/dialog.tsx`
- Description: Radix dialog wrapper with modal overlay, content, header, footer, title, and description.

```tsx
import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

type DialogProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Root> & {
  auditName?: string;
};

const Dialog = ({ onOpenChange, auditName, ...props }: DialogProps) => {
  const handleOpenChange = (open: boolean) => {
    if (typeof window !== 'undefined') {
      const detail = { open, title: auditName };
      window.dispatchEvent(new CustomEvent('ff:dialog-state', { detail }));
    }

    onOpenChange?.(open);
  };

  return <DialogPrimitive.Root {...props} onOpenChange={handleOpenChange} />;
};

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className,
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-[calc(100vw-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className,
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded p-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
        <X className="h-4 w-4 stroke-[3]" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props} />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    data-audit-dialog-title
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
```

## Avatar

- Path: `src/components/ui/avatar.tsx`
- Description: Radix avatar image and fallback primitives.

```tsx
import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";

import { cn } from "@/lib/utils";

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className)}
    {...props}
  />
));
Avatar.displayName = AvatarPrimitive.Root.displayName;

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image ref={ref} className={cn("aspect-square h-full w-full", className)} {...props} />
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn("flex h-full w-full items-center justify-center rounded-full bg-muted", className)}
    {...props}
  />
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

export { Avatar, AvatarImage, AvatarFallback };
```


