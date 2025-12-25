import { useState, useEffect } from "react";
import { Upload, Loader2 } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCreateCompany, useUpdateCompany } from "@/hooks/useCompanies";
import { Company } from "@/services/api";

interface CompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  company?: Company | null;
  mode: "add" | "edit";
}

const countries = [
  "United States",
  "United Kingdom",
  "United Arab Emirates",
  "Qatar",
  "Saudi Arabia",
  "India",
  "Germany",
  "France",
  "Canada",
  "Australia",
];

export function CompanyModal({ isOpen, onClose, company, mode }: CompanyModalProps) {
  const [formData, setFormData] = useState({
    companyName: "",
    companyType: "",
    legalTradingName: "",
    registrationNumber: "",
    contactNumber: "",
    email: "",
    website: "",
    vatId: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    stateProvince: "",
    zipCode: "",
    country: "",
  });

  const createMutation = useCreateCompany();
  const updateMutation = useUpdateCompany();

  const isLoading = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (company && mode === "edit") {
      setFormData({
        companyName: company.companyName || "",
        companyType: company.companyType || "",
        legalTradingName: company.legalTradingName || "",
        registrationNumber: company.registrationNumber || "",
        contactNumber: company.contactNumber || "",
        email: company.email || "",
        website: company.website || "",
        vatId: company.vatId || "",
        addressLine1: company.addressLine1 || "",
        addressLine2: company.addressLine2 || "",
        city: company.city || "",
        stateProvince: company.stateProvince || "",
        zipCode: company.zipCode || "",
        country: company.country || "",
      });
    } else {
      setFormData({
        companyName: "",
        companyType: "",
        legalTradingName: "",
        registrationNumber: "",
        contactNumber: "",
        email: "",
        website: "",
        vatId: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        stateProvince: "",
        zipCode: "",
        country: "",
      });
    }
  }, [company, mode, isOpen]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "add") {
      createMutation.mutate(formData, {
        onSuccess: () => {
          onClose();
        },
      });
    } else if (company) {
      updateMutation.mutate(
        {
          id: company.id,
          data: { ...formData, id: company.id },
        },
        {
          onSuccess: () => {
            onClose();
          },
        }
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto bg-card">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            <span className="font-bold">{mode === "add" ? "Add New" : "Edit"}</span> Company
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="py-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <Label className="form-label">Company Name *</Label>
                <Input
                  placeholder="Company Name"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange("companyName", e.target.value)}
                  className="form-input"
                  required
                />
              </div>
              <div>
                <Label className="form-label">Company Type</Label>
                <Input
                  placeholder="Legal / Trading Name"
                  value={formData.companyType}
                  onChange={(e) => handleInputChange("companyType", e.target.value)}
                  className="form-input"
                />
              </div>
              <div>
                <Label className="form-label">Registration Number</Label>
                <Input
                  placeholder="Registration Number"
                  value={formData.registrationNumber}
                  onChange={(e) => handleInputChange("registrationNumber", e.target.value)}
                  className="form-input"
                />
              </div>
              <div>
                <Label className="form-label">Email</Label>
                <Input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="form-input"
                />
              </div>
              <div>
                <Label className="form-label">Company Logo</Label>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md cursor-pointer hover:bg-secondary/80 transition-colors text-sm font-medium border border-input">
                    <Upload size={16} />
                    Choose file
                    <input type="file" className="hidden" accept=".gif,.png,.jpg,.jpeg" />
                  </label>
                  <span className="text-sm text-muted-foreground">No file chosen</span>
                </div>
              </div>
            </div>

            {/* Middle Column */}
            <div className="space-y-4">
              <div>
                <Label className="form-label">Legal / Trading Name</Label>
                <Input
                  placeholder="Legal / Trading Name"
                  value={formData.legalTradingName}
                  onChange={(e) => handleInputChange("legalTradingName", e.target.value)}
                  className="form-input"
                />
              </div>
              <div>
                <Label className="form-label">Contact Number</Label>
                <Input
                  placeholder="Contact Number"
                  value={formData.contactNumber}
                  onChange={(e) => handleInputChange("contactNumber", e.target.value)}
                  className="form-input"
                />
              </div>
              <div>
                <Label className="form-label">Website</Label>
                <Input
                  placeholder="Website URL"
                  value={formData.website}
                  onChange={(e) => handleInputChange("website", e.target.value)}
                  className="form-input"
                />
              </div>
              <div>
                <Label className="form-label">Company Seal</Label>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md cursor-pointer hover:bg-secondary/80 transition-colors text-sm font-medium border border-input">
                    <Upload size={16} />
                    Choose file
                    <input type="file" className="hidden" accept=".gif,.png,.jpg,.jpeg" />
                  </label>
                  <span className="text-sm text-muted-foreground">No file chosen</span>
                </div>
              </div>
            </div>

            {/* Right Column - Address */}
            <div className="space-y-4">
              <div>
                <Label className="form-label">VAT ID/TRN</Label>
                <Input
                  placeholder="Tax Number / EIN"
                  value={formData.vatId}
                  onChange={(e) => handleInputChange("vatId", e.target.value)}
                  className="form-input"
                />
              </div>
              <div>
                <Label className="form-label">Address</Label>
                <Input
                  placeholder="Address Line 1"
                  value={formData.addressLine1}
                  onChange={(e) => handleInputChange("addressLine1", e.target.value)}
                  className="form-input"
                />
              </div>
              <div>
                <Input
                  placeholder="Address Line 2"
                  value={formData.addressLine2}
                  onChange={(e) => handleInputChange("addressLine2", e.target.value)}
                  className="form-input"
                />
              </div>
              <div>
                <Input
                  placeholder="City"
                  value={formData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  className="form-input"
                />
              </div>
              <div>
                <Input
                  placeholder="State / Province"
                  value={formData.stateProvince}
                  onChange={(e) => handleInputChange("stateProvince", e.target.value)}
                  className="form-input"
                />
              </div>
              <div>
                <Input
                  placeholder="Zip Code / Postal Code"
                  value={formData.zipCode}
                  onChange={(e) => handleInputChange("zipCode", e.target.value)}
                  className="form-input"
                />
              </div>
              <div>
                <Label className="form-label">Country</Label>
                <Select
                  value={formData.country}
                  onValueChange={(value) => handleInputChange("country", value)}
                >
                  <SelectTrigger className="form-input">
                    <SelectValue placeholder="Select One" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border border-border">
                    {countries.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-6">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" className="btn-success px-8" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "add" ? "Save" : "Update"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export type { Company };
