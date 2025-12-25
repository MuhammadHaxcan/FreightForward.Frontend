import { useState } from "react";
import { ChevronUp, ChevronDown, Upload } from "lucide-react";
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
import { cn } from "@/lib/utils";

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

export function AddCompanyForm() {
  const [isExpanded, setIsExpanded] = useState(true);
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

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
  };

  return (
    <div className="bg-card rounded-lg shadow-sm border border-border animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-xl font-semibold text-foreground">
          <span className="font-bold">Add New</span> Company
        </h2>
        <Button
          variant={isExpanded ? "destructive" : "default"}
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="gap-2"
        >
          {isExpanded ? (
            <>
              <ChevronUp size={16} />
              Hide
            </>
          ) : (
            <>
              <ChevronDown size={16} />
              Show
            </>
          )}
        </Button>
      </div>

      {/* Form */}
      <div
        className={cn(
          "transition-all duration-300 overflow-hidden",
          isExpanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <Label className="form-label">Company Name</Label>
                <Input
                  placeholder="Company Name"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange("companyName", e.target.value)}
                  className="form-input"
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
                <p className="text-xs text-muted-foreground mt-1">
                  Upload files only: gif,png,jpg,jpeg
                </p>
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
                <p className="text-xs text-muted-foreground mt-1">
                  Upload files only: gif,png,jpg,jpeg
                </p>
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
              <div className="flex justify-end pt-2">
                <Button type="submit" className="btn-success px-8">
                  Save
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
