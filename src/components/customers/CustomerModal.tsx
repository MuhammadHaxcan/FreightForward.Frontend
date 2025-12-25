import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";
import { useState, useEffect } from "react";

export interface Customer {
  id: number;
  code: string;
  name: string;
  masterType: string;
  category: string[];
  phone: string;
  country: string;
  email: string;
  city: string;
  baseCurrency: string;
  taxNo: string;
}

interface CustomerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: Customer | null;
  mode: "add" | "edit";
}

const customerTypes = [
  "Shipper",
  "Consignee",
  "Booking Party",
  "Agents",
  "Forwarder",
  "Customer",
  "Delivery Agent",
  "Origin Agent",
  "Notify Party",
];

const masterTypes = ["Debtors", "Neutral", "Creditors"];
const currencies = ["USD", "EUR", "GBP", "AED", "PKR", "INR", "CNY"];

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

  useEffect(() => {
    if (customer && mode === "edit") {
      setFormData({
        code: customer.code,
        name: customer.name,
        masterType: customer.masterType,
        category: customer.category,
        phone: customer.phone,
        country: customer.country,
        email: customer.email,
        city: customer.city,
        baseCurrency: customer.baseCurrency,
        taxNo: customer.taxNo,
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

  const handleSubmit = () => {
    console.log("Submitting:", formData);
    onOpenChange(false);
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
                onValueChange={(value) => setFormData({ ...formData, masterType: value })}
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
              <div className="flex flex-wrap gap-2 p-2 bg-muted/50 rounded-md border border-input min-h-[80px]">
                {customerTypes.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggleCategory(type)}
                    className={`px-2 py-1 text-xs rounded-md transition-colors ${
                      formData.category.includes(type)
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {formData.category.includes(type) && <span className="mr-1">×</span>}
                    {type}
                  </button>
                ))}
              </div>
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button className="btn-success" onClick={handleSubmit}>
            {mode === "add" ? "Save" : "Update"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
