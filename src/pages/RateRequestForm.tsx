import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Loader2, ArrowLeft } from "lucide-react";
import { useRateRequest, useLead } from "@/hooks/useSales";
import { useAllCountries, useAllPorts, useAllIncoTerms, useAllCustomerCategoryTypes } from "@/hooks/useSettings";
import { useAllCreditors } from "@/hooks/useCustomers";
import { EquipmentGridReadOnly } from "@/components/leads/EquipmentGridReadOnly";
import { BoxPalletsGridReadOnly } from "@/components/leads/BoxPalletsGridReadOnly";

export default function RateRequestForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const rateRequestId = id ? parseInt(id) : null;
  const isEditing = !!rateRequestId;

  // Fetch rate request data when editing
  const { data: rateRequest, isLoading: isRateRequestLoading } = useRateRequest(rateRequestId || 0);

  // Fetch lead data for package details
  const { data: leadData, isLoading: isLeadLoading } = useLead(rateRequest?.leadId || 0);

  // Load reference data for dropdowns
  const { data: countriesData } = useAllCountries();
  const { data: portsData } = useAllPorts();
  const { data: incoTermsData } = useAllIncoTerms();
  const { data: categoryTypesData } = useAllCustomerCategoryTypes();
  const { data: vendorsData } = useAllCreditors();

  const countries = useMemo(() => Array.isArray(countriesData) ? countriesData : [], [countriesData]);
  const ports = useMemo(() => Array.isArray(portsData) ? portsData : [], [portsData]);
  const incoTerms = useMemo(() => Array.isArray(incoTermsData) ? incoTermsData : [], [incoTermsData]);
  const categoryTypes = useMemo(() => Array.isArray(categoryTypesData) ? categoryTypesData : [], [categoryTypesData]);
  const vendors = useMemo(() => Array.isArray(vendorsData) ? vendorsData : [], [vendorsData]);

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate("/sales/rate-requests")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-semibold text-foreground">
            {isEditing ? "Edit Rate Request" : "Add Rate Request"}
          </h1>
        </div>

        {isEditing && isRateRequestLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading rate request data...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* General Details */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg text-primary">General Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-red-500">* Rate code</Label>
                    <Input
                      value={rateRequest?.rateRequestNo || "Auto-generated"}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-red-500">* Shipment Mode</Label>
                    <SearchableSelect
                      options={[
                        { value: "air", label: "Air Freight" },
                        { value: "fcl", label: "FCL-Sea Freight" },
                        { value: "lcl", label: "LCL-Sea Freight" },
                      ]}
                      value={rateRequest?.mode === "SeaFreightFCL" ? "fcl" : rateRequest?.mode === "SeaFreightLCL" ? "lcl" : "air"}
                      onValueChange={() => {}}
                      placeholder="Select"
                      searchPlaceholder="Search..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Incoterm</Label>
                    <SearchableSelect
                      options={incoTerms.map((term) => ({
                        value: term.id.toString(),
                        label: `${term.code}-${term.name}`,
                      }))}
                      value={rateRequest?.incoTermId?.toString() || ""}
                      onValueChange={() => {}}
                      placeholder="Select"
                      searchPlaceholder="Search..."
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Package Details */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg text-primary">Package Details</CardTitle>
              </CardHeader>
              <CardContent>
                {isLeadLoading && rateRequest?.leadId ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-green-600" />
                    <span className="ml-2 text-muted-foreground">Loading package details...</span>
                  </div>
                ) : leadData?.details && leadData.details.length > 0 ? (
                  <div className="space-y-4">
                    {leadData.details.some(d => d.detailType === "Equipment") && (
                      <EquipmentGridReadOnly
                        equipments={leadData.details.filter(d => d.detailType === "Equipment")}
                      />
                    )}
                    {leadData.details.some(d => d.detailType === "BoxPallet") && (
                      <BoxPalletsGridReadOnly
                        boxPallets={leadData.details.filter(d => d.detailType === "BoxPallet")}
                      />
                    )}
                    <div className="mt-4 space-y-2">
                      <Label>Commodity</Label>
                      <Textarea
                        defaultValue={rateRequest?.productDescription || ""}
                        placeholder="Enter commodity description"
                        className="min-h-[40px]"
                        readOnly
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No package details available for this rate request.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Vendor Details */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg text-primary">Vendor Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Vendors</Label>
                    <SearchableSelect
                      options={vendors.map((vendor) => ({
                        value: vendor.id.toString(),
                        label: vendor.name,
                      }))}
                      value={rateRequest?.vendorId?.toString() || ""}
                      onValueChange={() => {}}
                      placeholder="Select"
                      searchPlaceholder="Search..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Vendor Type</Label>
                    <SearchableSelect
                      options={categoryTypes.map((type) => ({
                        value: type.name,
                        label: type.name,
                      }))}
                      value={rateRequest?.vendorType || ""}
                      onValueChange={() => {}}
                      placeholder="Select"
                      searchPlaceholder="Search..."
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between mb-1">
                      <Label>Vendor Email to</Label>
                      <div className="flex items-center gap-2">
                        <Checkbox id="selectAll" />
                        <label htmlFor="selectAll" className="text-sm text-muted-foreground cursor-pointer">
                          Select All
                        </label>
                      </div>
                    </div>
                    <Input defaultValue={rateRequest?.vendorEmail || ""} placeholder="vendor@email.com" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Port Details */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg text-primary">Port Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label className="text-red-500">* Arriving Country</Label>
                    <SearchableSelect
                      options={countries.map((country) => ({
                        value: country.id.toString(),
                        label: country.name,
                      }))}
                      value={rateRequest?.deliveryCountryId?.toString() || ""}
                      onValueChange={() => {}}
                      placeholder="Select"
                      searchPlaceholder="Search..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-red-500">* Arrival Port</Label>
                    <SearchableSelect
                      options={ports.map((port) => ({
                        value: port.id.toString(),
                        label: `${port.seaPortName}${port.seaPortCode ? ` (${port.seaPortCode})` : ''} / ${port.airPortName}${port.airPortCode ? ` (${port.airPortCode})` : ''} - ${port.city}, ${port.country}`,
                      }))}
                      value={rateRequest?.destinationPortId?.toString() || ""}
                      onValueChange={() => {}}
                      placeholder="Select"
                      searchPlaceholder="Search..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-red-500">* Departure Country</Label>
                    <SearchableSelect
                      options={countries.map((country) => ({
                        value: country.id.toString(),
                        label: country.name,
                      }))}
                      value={rateRequest?.pickupCountryId?.toString() || ""}
                      onValueChange={() => {}}
                      placeholder="Select"
                      searchPlaceholder="Search..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Departure Port</Label>
                    <SearchableSelect
                      options={ports.map((port) => ({
                        value: port.id.toString(),
                        label: `${port.seaPortName}${port.seaPortCode ? ` (${port.seaPortCode})` : ''} / ${port.airPortName}${port.airPortCode ? ` (${port.airPortCode})` : ''} - ${port.city}, ${port.country}`,
                      }))}
                      value={rateRequest?.loadingPortId?.toString() || ""}
                      onValueChange={() => {}}
                      placeholder="Select"
                      searchPlaceholder="Search..."
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-red-500">* Pickup Address</Label>
                    <Textarea defaultValue={rateRequest?.pickupAddress || ""} placeholder="Enter pickup address" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-red-500">* Delivery Address</Label>
                    <Textarea defaultValue={rateRequest?.deliveryAddress || ""} placeholder="Enter delivery address" />
                  </div>
                  <div className="space-y-2">
                    <Label>Remarks Notes</Label>
                    <Textarea placeholder="Additional notes..." />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-2 pb-6">
              <Button variant="outline" onClick={() => navigate("/sales/rate-requests")}>
                Cancel
              </Button>
              {!isEditing && (
                <Button className="btn-success">
                  Send Rate Request
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
