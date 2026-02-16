import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { SearchableMultiSelect } from "@/components/ui/searchable-multi-select";
import { Loader2, AlertTriangle } from "lucide-react";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useCreateCustomer, useUpdateCustomer, useSimilarCustomerCheck } from "@/hooks/useCustomers";
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
    currencyId: "",
    taxNo: "",
  });

  const createMutation = useCreateCustomer();
  const updateMutation = useUpdateCustomer();

  // Check for similar customer names
  const { data: similarCustomers } = useSimilarCustomerCheck(
    formData.name,
    mode === "edit" ? customer?.id : undefined
  );

  // Check for exact duplicate (same name + same master type)
  const hasExactDuplicate = useMemo(() => {
    if (!similarCustomers || !formData.masterType || !formData.name.trim()) return false;
    return similarCustomers.some(
      (c) =>
        c.name.trim().toLowerCase() === formData.name.trim().toLowerCase() &&
        c.masterTypeDisplay === formData.masterType
    );
  }, [similarCustomers, formData.name, formData.masterType]);

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
        currencyId: customer.currencyId?.toString() || "",
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
        currencyId: "",
        taxNo: "",
      });
      refetchNextCodes();
    }
  }, [customer, mode, open, refetchNextCodes]);


  const handleSubmit = async () => {
    const requestData = {
      name: formData.name,
      masterType: formData.masterType as 'Debtors' | 'Creditors' | 'Neutral',
      categoryIds: formData.categoryIds,
      phone: formData.phone || undefined,
      email: formData.email || undefined,
      country: formData.country || undefined,
      city: formData.city || undefined,
      currencyId: formData.currencyId ? parseInt(formData.currencyId) : undefined,
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
      <DialogContent className="sm:max-w-[600px] bg-card border-border p-0">
        <DialogHeader className="bg-modal-header text-white p-4 rounded-t-lg">
          <DialogTitle className="text-white text-lg font-semibold">
            {mode === "add" ? "Add New Customer" : "Edit Customer"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 p-6">
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
                className={`bg-muted/50 ${hasExactDuplicate ? "border-destructive" : ""}`}
              />
              {hasExactDuplicate && (
                <p className="text-xs text-destructive">
                  A customer with this exact name and master type already exists.
                </p>
              )}
              {similarCustomers && similarCustomers.length > 0 && (
                <div className="flex gap-2 rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700 p-2 text-xs">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-800 dark:text-amber-400">Similar customers found:</p>
                    <ul className="mt-1 space-y-0.5 text-amber-700 dark:text-amber-500">
                      {similarCustomers.map((c) => (
                        <li key={c.id}>{c.code} — {c.name} ({c.masterTypeDisplay})</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="masterType" className="text-sm">
                *Master Type
              </Label>
              <SearchableSelect
                options={masterTypes.map((type) => ({ value: type, label: type }))}
                value={formData.masterType}
                onValueChange={(value) => {
                  const newCode = mode === "add" ? getCodeForMasterType(value) : formData.code;
                  setFormData({ ...formData, masterType: value, code: newCode });
                }}
                placeholder="Select"
                triggerClassName="bg-muted/50"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm">*Customer Type</Label>
              <SearchableMultiSelect
                options={categoryTypes.map((ct) => ({ value: ct.id.toString(), label: ct.name }))}
                values={formData.categoryIds.map((id) => id.toString())}
                onValuesChange={(vals) => setFormData({ ...formData, categoryIds: vals.map((v) => parseInt(v)) })}
                placeholder="Select customer types..."
                triggerClassName="bg-muted/50"
              />
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
              <Label htmlFor="currencyId" className="text-sm">
                *Base Currency
              </Label>
              <SearchableSelect
                options={currencies.map((currency) => ({
                  value: currency.id.toString(),
                  label: `${currency.code} - ${currency.name}`,
                }))}
                value={formData.currencyId}
                onValueChange={(value) => setFormData({ ...formData, currencyId: value })}
                placeholder="Select"
                triggerClassName="bg-muted/50"
                disabled={mode === "edit"}
              />
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

        <div className="flex justify-end gap-3 px-6 pb-6 pt-4 border-t border-border">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button className="btn-success" onClick={handleSubmit} disabled={isLoading || hasExactDuplicate}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "add" ? "Save" : "Update"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export type { Customer };
