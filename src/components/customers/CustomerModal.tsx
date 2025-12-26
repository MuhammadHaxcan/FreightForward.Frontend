import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { ChevronDown, Check, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useCreateCustomer, useUpdateCustomer } from "@/hooks/useCustomers";
import { Customer } from "@/services/api";

interface CustomerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: Customer | null;
  mode: "add" | "edit";
}

// Customer category values (must match backend enum)
const customerCategoryValues = [
  "Shipper",
  "Consignee",
  "BookingParty",
  "Agents",
  "Forwarder",
  "Customer",
  "DeliveryAgent",
  "OriginAgent",
  "NotifyParty",
];

// Display labels for customer categories
const customerCategoryLabels: Record<string, string> = {
  Shipper: "Shipper",
  Consignee: "Consignee",
  BookingParty: "Booking Party",
  Agents: "Agents",
  Forwarder: "Forwarder",
  Customer: "Customer",
  DeliveryAgent: "Delivery Agent",
  OriginAgent: "Origin Agent",
  NotifyParty: "Notify Party",
};

const masterTypes = ["Debtors", "Neutral", "Creditors"];
const currencies = ["USD", "EUR", "GBP", "AED", "PKR", "INR", "CNY"];

const codePrefix: Record<string, string> = {
  Debtors: "DEI",
  Neutral: "NEI",
  Creditors: "CDI",
};

const lastCodeNumber: Record<string, number> = {
  Debtors: 510,
  Neutral: 500,
  Creditors: 470,
};

const generateCode = (masterType: string): string => {
  const prefix = codePrefix[masterType] || "XXX";
  const nextNumber = (lastCodeNumber[masterType] || 0) + 1;
  lastCodeNumber[masterType] = nextNumber;
  return `${prefix}${String(nextNumber).padStart(4, "0")}`;
};

export function CustomerModal({ open, onOpenChange, customer, mode }: CustomerModalProps) {
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    masterType: "",
    category: [] as string[],
    phone: "",
    country: "",
    email: "",
    city: "",
    baseCurrency: "",
    taxNo: "",
  });

  const createMutation = useCreateCustomer();
  const updateMutation = useUpdateCustomer();

  const isLoading = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (customer && mode === "edit") {
      setFormData({
        code: customer.code || "",
        name: customer.name || "",
        masterType: customer.masterType || "",
        category: customer.categoryList || [],
        phone: customer.phone || "",
        country: customer.country || "",
        email: customer.email || "",
        city: customer.city || "",
        baseCurrency: customer.baseCurrency || "",
        taxNo: customer.taxNo || "",
      });
    } else {
      setFormData({
        code: "",
        name: "",
        masterType: "",
        category: [],
        phone: "",
        country: "",
        email: "",
        city: "",
        baseCurrency: "",
        taxNo: "",
      });
    }
  }, [customer, mode, open]);

  const toggleCategory = (type: string) => {
    setFormData((prev) => ({
      ...prev,
      category: prev.category.includes(type)
        ? prev.category.filter((t) => t !== type)
        : [...prev.category, type],
    }));
  };

  const handleSubmit = async () => {
    // Map frontend formData to backend expected format
    const requestData = {
      name: formData.name,
      masterType: formData.masterType as 'Debtors' | 'Creditors' | 'Neutral',
      categories: formData.category,
      phone: formData.phone,
      email: formData.email,
      country: formData.country,
      city: formData.city,
      baseCurrency: formData.baseCurrency as 'USD' | 'EUR' | 'GBP' | 'AED' | 'PKR' | 'INR' | 'CNY' | 'SGD' | undefined,
      taxNo: formData.taxNo,
    };

    if (mode === "add") {
      createMutation.mutate(requestData, {
        onSuccess: () => {
          onOpenChange(false);
        },
      });
    } else if (customer) {
      updateMutation.mutate(
        {
          id: customer.id,
          data: { ...requestData, id: customer.id },
        },
        {
          onSuccess: () => {
            onOpenChange(false);
          },
        }
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            {mode === "add" ? "Add New Customer" : "Edit Customer"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4">
          {/* Left Column */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code" className="text-sm">
                *Customer Code
              </Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="DEI0501"
                className="bg-muted/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm">
                *Name
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Name"
                className="bg-muted/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="masterType" className="text-sm">
                *Master Type
              </Label>
              <Select
                value={formData.masterType}
                onValueChange={(value) => {
                  const newCode = mode === "add" ? generateCode(value) : formData.code;
                  setFormData({ ...formData, masterType: value, code: newCode });
                }}
              >
                <SelectTrigger className="bg-muted/50">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {masterTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">*Customer Type</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between bg-muted/50 font-normal h-auto min-h-[40px] py-2"
                  >
                    <div className="flex flex-wrap gap-1 flex-1">
                      {formData.category.length === 0 ? (
                        <span className="text-muted-foreground">Select customer types...</span>
                      ) : (
                        formData.category.map((type) => (
                          <span
                            key={type}
                            className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-primary text-primary-foreground rounded-md"
                          >
                            {customerCategoryLabels[type] || type}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleCategory(type);
                              }}
                              className="hover:bg-primary-foreground/20 rounded-full"
                            >
                              x
                            </button>
                          </span>
                        ))
                      )}
                    </div>
                    <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[280px] p-0" align="start">
                  <Command>
                    <CommandList>
                      <CommandGroup>
                        {customerCategoryValues.map((value) => (
                          <CommandItem
                            key={value}
                            onSelect={() => toggleCategory(value)}
                            className="cursor-pointer"
                          >
                            <div
                              className={cn(
                                "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                formData.category.includes(value)
                                  ? "bg-primary text-primary-foreground"
                                  : "opacity-50"
                              )}
                            >
                              {formData.category.includes(value) && <Check className="h-3 w-3" />}
                            </div>
                            {customerCategoryLabels[value]}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country" className="text-sm">
                *Country
              </Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder="Country"
                className="bg-muted/50"
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm">
                *General Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Email"
                className="bg-muted/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city" className="text-sm">
                City
              </Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="City"
                className="bg-muted/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm">
                Phone
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Phone"
                className="bg-muted/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="baseCurrency" className="text-sm">
                *Base Currency
              </Label>
              <Select
                value={formData.baseCurrency}
                onValueChange={(value) => setFormData({ ...formData, baseCurrency: value })}
              >
                <SelectTrigger className="bg-muted/50">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency} value={currency}>
                      {currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxNo" className="text-sm">
                NTN/VAT/TAX NO
              </Label>
              <Input
                id="taxNo"
                value={formData.taxNo}
                onChange={(e) => setFormData({ ...formData, taxNo: e.target.value })}
                placeholder="Ref No"
                className="bg-muted/50"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-border">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button className="btn-success" onClick={handleSubmit} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "add" ? "Save" : "Update"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export type { Customer };
