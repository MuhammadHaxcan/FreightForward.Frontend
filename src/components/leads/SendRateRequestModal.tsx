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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

  // Load customers (Debtors) for Vendor Name dropdown
  const { data: customersData, isLoading: loadingCustomers } = useCustomers({
    masterType: "Debtors",
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-green-600">
            Send Rate Request
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>
                Vendor Type <span className="text-red-500">*</span>
              </Label>
              <Select value={vendorType} onValueChange={(value) => {
                setVendorType(value);
                setVendorId("");
                setVendorEmail("");
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select vendor type" />
                </SelectTrigger>
                <SelectContent>
                  {categoryTypes?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.name}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>
                Vendor Name <span className="text-red-500">*</span>
              </Label>
              <Select
                value={vendorId}
                onValueChange={setVendorId}
                disabled={!vendorType}
              >
                <SelectTrigger>
                  <SelectValue placeholder={vendorType ? "Select vendor" : "Select vendor type first"} />
                </SelectTrigger>
                <SelectContent>
                  {filteredVendors.map((vendor) => (
                    <SelectItem key={vendor.id} value={vendor.id.toString()}>
                      {vendor.name}
                    </SelectItem>
                  ))}
                  {filteredVendors.length === 0 && (
                    <div className="px-2 py-1 text-sm text-muted-foreground">
                      No vendors found for this category
                    </div>
                  )}
                </SelectContent>
              </Select>
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
            className="bg-green-600 hover:bg-green-700 text-white"
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
