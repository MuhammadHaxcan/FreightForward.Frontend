import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Loader2 } from "lucide-react";
import { useCustomers } from "@/hooks/useCustomers";
import { useAllCustomerCategoryTypes } from "@/hooks/useSettings";
import { useCreateRateRequest } from "@/hooks/useSales";
import { toast } from "@/hooks/use-toast";

interface SendRateRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: number;
  onSuccess?: () => void;
}

export function SendRateRequestModal({
  open,
  onOpenChange,
  leadId,
  onSuccess,
}: SendRateRequestModalProps) {
  const [vendorType, setVendorType] = useState<string>("");
  const [vendorId, setVendorId] = useState<string>("");
  const [vendorEmail, setVendorEmail] = useState<string>("");

  // Load customer category types (for Vendor Type dropdown)
  const { data: categoryTypes, isLoading: loadingCategoryTypes } =
    useAllCustomerCategoryTypes();

  // Load customers (Creditors) for Vendor Name dropdown
  const { data: customersData, isLoading: loadingCustomers } = useCustomers({
    masterType: "Creditors",
    pageSize: 1000,
  });

  const createRateRequest = useCreateRateRequest();

  // Filter vendors by selected category type
  const filteredVendors = useMemo(() => {
    if (!customersData?.items) return [];
    if (!vendorType) return customersData.items;

    return customersData.items.filter((customer) =>
      customer.categories?.some((cat) => cat.name === vendorType)
    );
  }, [customersData?.items, vendorType]);

  // Auto-populate email when vendor is selected
  useEffect(() => {
    if (vendorId && customersData?.items) {
      const selectedVendor = customersData.items.find(
        (c) => c.id === parseInt(vendorId)
      );
      if (selectedVendor) {
        setVendorEmail(selectedVendor.email || "");
      }
    }
  }, [vendorId, customersData?.items]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!open) {
      setVendorType("");
      setVendorId("");
      setVendorEmail("");
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!vendorId) {
      toast({
        title: "Validation Error",
        description: "Please select a vendor",
        variant: "destructive",
      });
      return;
    }

    const selectedVendor = customersData?.items?.find(
      (c) => c.id === parseInt(vendorId)
    );

    try {
      await createRateRequest.mutateAsync({
        leadId,
        vendorId: parseInt(vendorId),
        vendorName: selectedVendor?.name || "",
        vendorType,
        vendorEmail,
      });

      toast({
        title: "Success",
        description: "Rate request sent successfully",
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const isLoading = loadingCategoryTypes || loadingCustomers;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0">
        <DialogHeader className="bg-modal-header text-white p-4 rounded-t-lg">
          <DialogTitle className="text-white text-lg font-semibold">
            Send Rate Request
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4 p-6">
            <div className="space-y-2">
              <Label>
                Vendor Type <span className="text-red-500">*</span>
              </Label>
              <SearchableSelect
                options={(categoryTypes || []).map((cat) => ({
                  value: cat.name,
                  label: cat.name,
                }))}
                value={vendorType}
                onValueChange={(value) => {
                  setVendorType(value);
                  setVendorId("");
                  setVendorEmail("");
                }}
                placeholder="Select vendor type"
                searchPlaceholder="Search vendor types..."
              />
            </div>

            <div className="space-y-2">
              <Label>
                Vendor Name <span className="text-red-500">*</span>
              </Label>
              <SearchableSelect
                options={filteredVendors.map((vendor) => ({
                  value: vendor.id.toString(),
                  label: vendor.name,
                }))}
                value={vendorId}
                onValueChange={setVendorId}
                placeholder={vendorType ? "Select vendor" : "Select vendor type first"}
                searchPlaceholder="Search vendors..."
                disabled={!vendorType}
                emptyMessage={loadingCustomers ? "Loading..." : "No vendors found for this category"}
              />
            </div>

            <div className="space-y-2">
              <Label>Vendor Email</Label>
              <Input
                value={vendorEmail}
                onChange={(e) => setVendorEmail(e.target.value)}
                placeholder="vendor@email.com"
              />
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!vendorId || createRateRequest.isPending}
            className="btn-success"
          >
            {createRateRequest.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              "Send"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
