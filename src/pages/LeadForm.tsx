import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { DateInput } from "@/components/ui/date-input";
import { Loader2, Ship, Plane, Truck, Package, Container, ArrowLeft } from "lucide-react";
import {
  CreateLeadRequest,
  UpdateLeadRequest,
  FreightMode,
  UnitOfMeasurement,
  ShippingType,
  CreateLeadDetailRequest,
  LeadDetailItem,
} from "@/services/api";
import { useCreateLead, useUpdateLead, useLead } from "@/hooks/useSales";
import { useCustomers } from "@/hooks/useCustomers";
import {
  useAllCountries,
  useAllPorts,
  useAllIncoTerms,
  useAllContainerTypes,
  useAllPackageTypes,
} from "@/hooks/useSettings";
import { EquipmentGrid } from "@/components/leads/EquipmentGrid";
import { BoxPalletsGrid } from "@/components/leads/BoxPalletsGrid";

const PRODUCT_TYPES = [
  "AGRICULTURE & FOOD",
  "APPAREL, TEXTILES & ACCESSORIES",
  "AUTO & TRANSPORTATION",
  "AUTOMOTIVE",
  "BAGS, SHOES & ACCESSORIES",
  "CHEMICALS",
  "ELECTRICAL EQUIPMENT, COMPONENTS & TELECOMS",
  "ELECTRONICS",
  "FAK",
  "GIFTS, SPORTS & TOYS",
  "HEALTH & BEAUTY",
  "HOME, LIGHTS & CONSTRUCTION",
  "MACHINERY",
  "MACHINERY, INDUSTRIAL PARTS & TOOLS",
  "METALLURGY, CHEMICALS, RUBBER & PLASTICS",
  "OTHER",
  "PACKAGING, ADVERTISING & OFFICE",
  "PHARMACEUTICALS",
  "SCRAP ITEM",
  "TEXTILES",
];

interface FormData {
  customerId?: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  freightMode: FreightMode;
  unitOfMeasurement: UnitOfMeasurement;
  shippingType: ShippingType;
  equipments: LeadDetailItem[];
  boxPallets: LeadDetailItem[];
  pickupCountryId?: number;
  loadingPortId?: number;
  pickupAddress: string;
  deliveryCountryId?: number;
  destinationPortId?: number;
  deliveryAddress: string;
  goodsReadyDate: string;
  customerReferenceNo: string;
  hsCode: string;
  productType: string;
  productDescription: string;
  incoTermId?: number;
}

const initialFormData: FormData = {
  fullName: "",
  email: "",
  phoneNumber: "",
  freightMode: "SeaFreight",
  unitOfMeasurement: "KG",
  shippingType: "FTL",
  equipments: [],
  boxPallets: [],
  pickupCountryId: undefined,
  loadingPortId: undefined,
  pickupAddress: "",
  deliveryCountryId: undefined,
  destinationPortId: undefined,
  deliveryAddress: "",
  goodsReadyDate: "",
  customerReferenceNo: "",
  hsCode: "",
  productType: "",
  productDescription: "",
  incoTermId: undefined,
};

export default function LeadForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const leadId = id ? parseInt(id) : null;

  const [formData, setFormData] = useState<FormData>(initialFormData);
  const createLead = useCreateLead();
  const updateLead = useUpdateLead();

  // Fetch the full lead data when editing (includes details)
  const { data: lead, isLoading: isLeadLoading } = useLead(leadId || 0);

  // Load data from backend
  const { data: customers, isLoading: isLoadingCustomers } = useCustomers({ pageSize: 1000, masterType: 'Debtors' });
  const { data: countries, isLoading: isLoadingCountries } = useAllCountries();
  const { data: ports, isLoading: isLoadingPorts } = useAllPorts();
  const { data: incoTerms, isLoading: isLoadingIncoTerms } = useAllIncoTerms();
  const { data: containerTypes } = useAllContainerTypes();
  const { data: packageTypes } = useAllPackageTypes();

  // Ensure arrays for safe mapping
  const incoTermsArray = Array.isArray(incoTerms) ? incoTerms : [];
  const containerTypesArray = Array.isArray(containerTypes) ? containerTypes : [];
  const packageTypesArray = Array.isArray(packageTypes) ? packageTypes : [];

  const isEditing = !!leadId;
  const isSaving = createLead.isPending || updateLead.isPending;

  // Filter ports by selected country
  const portsArray = Array.isArray(ports) ? ports : [];
  const pickupPorts = portsArray.filter(
    (p) => !formData.pickupCountryId ||
    countries?.find(c => c.id === formData.pickupCountryId)?.name === p.country
  );

  const deliveryPorts = portsArray.filter(
    (p) => !formData.deliveryCountryId ||
    countries?.find(c => c.id === formData.deliveryCountryId)?.name === p.country
  );

  useEffect(() => {
    if (leadId && lead) {
      // Separate lead details into equipments and boxPallets
      const equipments: LeadDetailItem[] = [];
      const boxPallets: LeadDetailItem[] = [];

      lead.details?.forEach((detail) => {
        if (detail.detailType === "Equipment") {
          equipments.push(detail);
        } else if (detail.detailType === "BoxPallet") {
          boxPallets.push(detail);
        }
      });

      // Determine shipping type based on details
      let shippingType: ShippingType = lead.shippingType || "FTL";
      if (!lead.shippingType) {
        // Infer from details if not set
        if (equipments.length > 0) {
          shippingType = "FTL";
        } else if (boxPallets.length > 0) {
          shippingType = "LTL";
        }
      }

      setFormData({
        customerId: lead.customerId,
        fullName: lead.fullName || "",
        email: lead.email || "",
        phoneNumber: lead.phoneNumber || "",
        freightMode: lead.freightMode || "SeaFreight",
        unitOfMeasurement: lead.unitOfMeasurement || "KG",
        shippingType,
        equipments,
        boxPallets,
        pickupCountryId: lead.pickupCountryId,
        loadingPortId: lead.loadingPortId,
        pickupAddress: lead.pickupAddress || "",
        deliveryCountryId: lead.deliveryCountryId,
        destinationPortId: lead.destinationPortId,
        deliveryAddress: lead.deliveryAddress || "",
        goodsReadyDate: lead.goodsReadyDate || "",
        customerReferenceNo: lead.customerReferenceNo || "",
        hsCode: lead.hsCode || "",
        productType: lead.productType || "",
        productDescription: lead.productDescription || "",
        incoTermId: lead.incoTermId,
      });
    } else if (!leadId) {
      // Creating new lead
      setFormData(initialFormData);
    }
  }, [leadId, lead]);

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Handle customer selection - auto-populate email and phone
  const handleCustomerChange = (customerId: string) => {
    const customer = customers?.items.find((c) => c.id === parseInt(customerId));
    if (customer) {
      setFormData((prev) => ({
        ...prev,
        customerId: customer.id,
        fullName: customer.name,
        email: customer.email || "",
        phoneNumber: customer.phone || "",
      }));
    }
  };

  const handleSubmit = async () => {
    // Convert equipments and boxPallets to details array
    const details: CreateLeadDetailRequest[] = [];

    if (formData.shippingType === "FTL") {
      formData.equipments.forEach((eq) => {
        details.push({
          detailType: "Equipment",
          quantity: eq.quantity,
          containerTypeId: eq.containerTypeId,
          subCategory: eq.subCategory,
          weight: eq.weight,
        });
      });
    } else {
      formData.boxPallets.forEach((bp) => {
        details.push({
          detailType: "BoxPallet",
          quantity: bp.quantity,
          packageTypeId: bp.packageTypeId,
          length: bp.length,
          width: bp.width,
          height: bp.height,
          measurementType: bp.measurementType,
          volume: bp.volume,
          weight: bp.weight,
        });
      });
    }

    const request: CreateLeadRequest = {
      leadType: 'ManualLead',
      customerId: formData.customerId,
      fullName: formData.fullName,
      email: formData.email,
      phoneNumber: formData.phoneNumber,
      freightMode: formData.freightMode,
      unitOfMeasurement: formData.unitOfMeasurement,
      shippingType: formData.shippingType,
      details: details.length > 0 ? details : undefined,
      pickupCountryId: formData.pickupCountryId,
      loadingPortId: formData.loadingPortId,
      pickupAddress: formData.pickupAddress || undefined,
      deliveryCountryId: formData.deliveryCountryId,
      destinationPortId: formData.destinationPortId,
      deliveryAddress: formData.deliveryAddress || undefined,
      goodsReadyDate: formData.goodsReadyDate || undefined,
      customerReferenceNo: formData.customerReferenceNo || undefined,
      hsCode: formData.hsCode || undefined,
      productType: formData.productType || undefined,
      productDescription: formData.productDescription || undefined,
      incoTermId: formData.incoTermId,
    };

    try {
      if (isEditing && leadId && lead) {
        const updateRequest: UpdateLeadRequest = {
          ...request,
          leadStatus: lead.leadStatus,
        };
        await updateLead.mutateAsync({ id: leadId, data: updateRequest });
      } else {
        await createLead.mutateAsync(request);
      }
      navigate("/sales/leads");
    } catch {
      // Error handling is done in the hook
    }
  };

  const isFormValid = () => {
    return (
      formData.fullName &&
      formData.email &&
      formData.phoneNumber
    );
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate("/sales/leads")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-semibold text-foreground">
            {isEditing ? "Edit Lead" : "Generate Lead"}
          </h1>
        </div>

        {isEditing && isLeadLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading lead data...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Section 1: Contact Information */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg text-primary">
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerSelect">Customer Name *</Label>
                    <SearchableSelect
                      options={(customers?.items || []).map((customer) => ({
                        value: customer.id.toString(),
                        label: customer.name,
                      }))}
                      value={formData.customerId?.toString() || ""}
                      onValueChange={handleCustomerChange}
                      placeholder="Select customer"
                      searchPlaceholder="Search customers..."
                      emptyMessage={isLoadingCustomers ? "Loading..." : "No customers found"}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateField("email", e.target.value)}
                      placeholder="Enter email address"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number *</Label>
                    <Input
                      id="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={(e) => updateField("phoneNumber", e.target.value)}
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Mode of Freight *</Label>
                  <ToggleGroup
                    type="single"
                    value={formData.freightMode}
                    onValueChange={(value) => {
                      if (value) updateField("freightMode", value as FreightMode);
                    }}
                    className="justify-start"
                  >
                    <ToggleGroupItem
                      value="SeaFreight"
                      className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground px-6"
                    >
                      <Ship className="h-4 w-4 mr-2" />
                      Sea Freight
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      value="AirFreight"
                      className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground px-6"
                    >
                      <Plane className="h-4 w-4 mr-2" />
                      Air Freight
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      value="LandFreight"
                      className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground px-6"
                    >
                      <Truck className="h-4 w-4 mr-2" />
                      Land Freight
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
              </CardContent>
            </Card>

            {/* Section 2: What are you shipping? */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg text-primary">
                  What are you shipping?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="unitOfMeasurement">Unit of Measurement</Label>
                    <SearchableSelect
                      options={[
                        { value: "KG", label: "KG" },
                        { value: "LB", label: "LB" },
                      ]}
                      value={formData.unitOfMeasurement}
                      onValueChange={(value) =>
                        updateField("unitOfMeasurement", value as UnitOfMeasurement)
                      }
                      placeholder="Select unit"
                      searchPlaceholder="Search..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Shipping Type</Label>
                    <ToggleGroup
                      type="single"
                      value={formData.shippingType}
                      onValueChange={(value) => {
                        if (value) updateField("shippingType", value as ShippingType);
                      }}
                      className="justify-start"
                    >
                      <ToggleGroupItem
                        value="FTL"
                        className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground px-6"
                      >
                        <Container className="h-4 w-4 mr-2" />
                        Equipment (FTL)
                      </ToggleGroupItem>
                      <ToggleGroupItem
                        value="LTL"
                        className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground px-6"
                      >
                        <Package className="h-4 w-4 mr-2" />
                        Box/Pallets (LTL)
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </div>
                </div>

                {formData.shippingType === "FTL" ? (
                  <EquipmentGrid
                    equipments={formData.equipments}
                    onChange={(equipments) => updateField("equipments", equipments)}
                    containerTypes={containerTypesArray}
                  />
                ) : (
                  <BoxPalletsGrid
                    boxPallets={formData.boxPallets}
                    onChange={(boxPallets) => updateField("boxPallets", boxPallets)}
                    packageTypes={packageTypesArray}
                  />
                )}
              </CardContent>
            </Card>

            {/* Section 3: Pickup & Drop-Off Information */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg text-primary">
                  Pickup & Drop-Off Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  {/* Pickup */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-sm text-muted-foreground">
                      Pickup goods from:
                    </h4>
                    <div className="space-y-2">
                      <Label htmlFor="pickupCountry">Country *</Label>
                      <SearchableSelect
                        options={(countries || []).map((country) => ({
                          value: country.id.toString(),
                          label: `${country.name} (${country.code})`,
                        }))}
                        value={formData.pickupCountryId?.toString() || ""}
                        onValueChange={(value) => {
                          updateField("pickupCountryId", parseInt(value));
                          updateField("loadingPortId", undefined);
                        }}
                        placeholder="Select country"
                        searchPlaceholder="Search countries..."
                        emptyMessage={isLoadingCountries ? "Loading..." : "No countries found"}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="loadingPort">Loading Port *</Label>
                      <SearchableSelect
                        options={pickupPorts.map((port) => ({
                          value: port.id.toString(),
                          label: `${port.seaPortName}${port.seaPortCode ? ` (${port.seaPortCode})` : ''} / ${port.airPortName}${port.airPortCode ? ` (${port.airPortCode})` : ''} - ${port.city}, ${port.country}`,
                        }))}
                        value={formData.loadingPortId?.toString() || ""}
                        onValueChange={(value) => updateField("loadingPortId", parseInt(value))}
                        placeholder="Select loading port"
                        searchPlaceholder="Search ports..."
                        emptyMessage={isLoadingPorts ? "Loading..." : "No ports found"}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pickupAddress">Pickup Address</Label>
                      <Textarea
                        id="pickupAddress"
                        value={formData.pickupAddress}
                        onChange={(e) => updateField("pickupAddress", e.target.value)}
                        placeholder="Enter pickup address"
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* Delivery */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-sm text-muted-foreground">
                      Deliver goods to:
                    </h4>
                    <div className="space-y-2">
                      <Label htmlFor="deliveryCountry">Country *</Label>
                      <SearchableSelect
                        options={(countries || []).map((country) => ({
                          value: country.id.toString(),
                          label: `${country.name} (${country.code})`,
                        }))}
                        value={formData.deliveryCountryId?.toString() || ""}
                        onValueChange={(value) => {
                          updateField("deliveryCountryId", parseInt(value));
                          updateField("destinationPortId", undefined);
                        }}
                        placeholder="Select country"
                        searchPlaceholder="Search countries..."
                        emptyMessage={isLoadingCountries ? "Loading..." : "No countries found"}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="destinationPort">Destination Port *</Label>
                      <SearchableSelect
                        options={deliveryPorts.map((port) => ({
                          value: port.id.toString(),
                          label: `${port.seaPortName}${port.seaPortCode ? ` (${port.seaPortCode})` : ''} / ${port.airPortName}${port.airPortCode ? ` (${port.airPortCode})` : ''} - ${port.city}, ${port.country}`,
                        }))}
                        value={formData.destinationPortId?.toString() || ""}
                        onValueChange={(value) =>
                          updateField("destinationPortId", parseInt(value))
                        }
                        placeholder="Select destination port"
                        searchPlaceholder="Search ports..."
                        emptyMessage={isLoadingPorts ? "Loading..." : "No ports found"}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="deliveryAddress">Delivery Address</Label>
                      <Textarea
                        id="deliveryAddress"
                        value={formData.deliveryAddress}
                        onChange={(e) => updateField("deliveryAddress", e.target.value)}
                        placeholder="Enter delivery address"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>

                {/* Shipment Details */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground">
                    Shipment Details:
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="goodsReadyDate">Goods ready date</Label>
                      <DateInput
                        value={formData.goodsReadyDate}
                        onChange={(value) => updateField("goodsReadyDate", value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="customerReferenceNo">Customer reference No</Label>
                      <Input
                        id="customerReferenceNo"
                        value={formData.customerReferenceNo}
                        onChange={(e) =>
                          updateField("customerReferenceNo", e.target.value)
                        }
                        placeholder="Optional"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="hsCode">HS Code</Label>
                      <Input
                        id="hsCode"
                        value={formData.hsCode}
                        onChange={(e) => updateField("hsCode", e.target.value)}
                        placeholder="Enter HS code"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 4: Product Details */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg text-primary">
                  Product Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="productType">Product Type</Label>
                    <SearchableSelect
                      options={PRODUCT_TYPES.map((type) => ({
                        value: type,
                        label: type,
                      }))}
                      value={formData.productType}
                      onValueChange={(value) => updateField("productType", value)}
                      placeholder="Select product type"
                      searchPlaceholder="Search product types..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="productDescription">Product description</Label>
                    <Input
                      id="productDescription"
                      value={formData.productDescription}
                      onChange={(e) =>
                        updateField("productDescription", e.target.value)
                      }
                      placeholder="Enter product description"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="incoTerms">Inco Terms</Label>
                    <SearchableSelect
                      options={incoTermsArray.map((term) => ({
                        value: term.id.toString(),
                        label: `${term.code} - ${term.name}`,
                      }))}
                      value={formData.incoTermId?.toString() || ""}
                      onValueChange={(value) =>
                        updateField("incoTermId", parseInt(value))
                      }
                      placeholder="Select Inco Term"
                      searchPlaceholder="Search inco terms..."
                      emptyMessage={isLoadingIncoTerms ? "Loading..." : "No inco terms found"}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Footer buttons */}
            <div className="flex justify-end gap-2 pb-6">
              <Button variant="outline" onClick={() => navigate("/sales/leads")}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!isFormValid() || isSaving || (isEditing && isLeadLoading)}
                className="btn-success"
              >
                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isEditing ? "Update" : "Save"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
