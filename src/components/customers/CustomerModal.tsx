import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronDown, Check, Loader2 } from "lucide-react";
import { useState, useEffect, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useCreateCustomer, useUpdateCustomer } from "@/hooks/useCustomers";
import { Customer, customerApi, settingsApi, NextCustomerCodes, CurrencyType, CustomerCategoryType } from "@/services/api";
import { useQuery } from "@tanstack/react-query";

interface CustomerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: Customer | null;
  mode: "add" | "edit";
}

const masterTypes = ["Debtors", "Neutral", "Creditors"];

export function CustomerModal({ open, onOpenChange, customer, mode }: CustomerModalProps) {
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    masterType: "",
    categoryIds: [] as number[],
    phone: "",
    country: "",
    email: "",
    city: "",
    baseCurrency: "",
    taxNo: "",
  });

  const createMutation = useCreateCustomer();
  const updateMutation = useUpdateCustomer();

  // Fetch currencies from API
  const { data: currenciesResponse } = useQuery({
    queryKey: ['currencyTypes', 'all'],
    queryFn: () => settingsApi.getAllCurrencyTypes(),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
  const currencies = currenciesResponse?.data ?? [];

  // Fetch customer category types from API
  const { data: categoryTypesResponse } = useQuery({
    queryKey: ['customerCategoryTypes', 'all'],
    queryFn: () => settingsApi.getAllCustomerCategoryTypes(),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
  const categoryTypes = useMemo(() => categoryTypesResponse?.data ?? [], [categoryTypesResponse?.data]);

  // Fetch next customer codes from API
  const { data: nextCodesResponse, refetch: refetchNextCodes } = useQuery({
    queryKey: ['customers', 'nextCodes'],
    queryFn: () => customerApi.getNextCodes(),
    enabled: open && mode === 'add', // Only fetch when modal is open in add mode
  });
  const nextCodes = nextCodesResponse?.data;

  // Helper function to get code based on master type
  const getCodeForMasterType = useCallback((masterType: string): string => {
    if (!nextCodes) return '';
    switch (masterType) {
      case 'Debtors': return nextCodes.debtorsCode;
      case 'Creditors': return nextCodes.creditorsCode;
      case 'Neutral': return nextCodes.neutralCode;
      default: return '';
    }
  }, [nextCodes]);

  const isLoading = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (!open) return; // Don't run when modal is closed

    if (customer && mode === "edit") {
      // Extract category IDs from the customer's categories array
      const categoryIds = (customer.categories || []).map(cat => cat.id);

      setFormData({
        code: customer.code || "",
        name: customer.name || "",
        masterType: customer.masterType || "",
        categoryIds: categoryIds,
        phone: customer.phone || "",
        country: customer.country || "",
        email: customer.email || "",
        city: customer.city || "",
        baseCurrency: customer.baseCurrency || "",
        taxNo: customer.taxNo || "",
      });
    } else if (mode === "add") {
      // Reset form for add mode
      setFormData({
        code: "",
        name: "",
        masterType: "",
        categoryIds: [],
        phone: "",
        country: "",
        email: "",
        city: "",
        baseCurrency: "",
        taxNo: "",
      });
      refetchNextCodes();
    }
  }, [customer, mode, open, refetchNextCodes]);

  const toggleCategory = (categoryId: number) => {
    setFormData((prev) => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(categoryId)
        ? prev.categoryIds.filter((id) => id !== categoryId)
        : [...prev.categoryIds, categoryId],
    }));
  };

  const handleSubmit = async () => {
    const requestData = {
      name: formData.name,
      masterType: formData.masterType as 'Debtors' | 'Creditors' | 'Neutral',
      categoryIds: formData.categoryIds,
      phone: formData.phone || undefined,
      email: formData.email || undefined,
      country: formData.country || undefined,
      city: formData.city || undefined,
      baseCurrency: formData.baseCurrency ? formData.baseCurrency as 'USD' | 'EUR' | 'GBP' | 'AED' | 'PKR' | 'INR' | 'CNY' | 'SGD' : undefined,
      taxNo: formData.taxNo || undefined,
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
                placeholder={mode === "add" ? "Select Master Type to generate" : ""}
                className="bg-muted/50"
                readOnly={mode === "add"}
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
                  const newCode = mode === "add" ? getCodeForMasterType(value) : formData.code;
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
                      {formData.categoryIds.length === 0 ? (
                        <span className="text-muted-foreground">Select customer types...</span>
                      ) : (
                        formData.categoryIds.map((categoryId) => {
                          const categoryType = categoryTypes.find(ct => ct.id === categoryId);
                          return (
                            <span
                              key={categoryId}
                              className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-primary text-primary-foreground rounded-md"
                            >
                              {categoryType?.name || `Category ${categoryId}`}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleCategory(categoryId);
                                }}
                                className="hover:bg-primary-foreground/20 rounded-full"
                              >
                                x
                              </button>
                            </span>
                          );
                        })
                      )}
                    </div>
                    <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[var(--radix-popover-trigger-width)] p-0"
                  align="start"
                  onWheel={(e) => e.stopPropagation()}
                >
                  <div
                    className="max-h-[180px] overflow-y-auto p-1 overscroll-contain [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                    onWheel={(e) => {
                      e.stopPropagation();
                      const target = e.currentTarget;
                      target.scrollTop += e.deltaY;
                    }}
                  >
                    {categoryTypes.map((categoryType) => (
                      <div
                        key={categoryType.id}
                        onClick={() => toggleCategory(categoryType.id)}
                        className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                      >
                        <div
                          className={cn(
                            "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                            formData.categoryIds.includes(categoryType.id)
                              ? "bg-primary text-primary-foreground"
                              : "opacity-50"
                          )}
                        >
                          {formData.categoryIds.includes(categoryType.id) && <Check className="h-3 w-3" />}
                        </div>
                        {categoryType.name}
                      </div>
                    ))}
                  </div>
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
                    <SelectItem key={currency.id} value={currency.code}>
                      {currency.code} - {currency.name}
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
