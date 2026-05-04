import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Ship, Plane, Truck, Container, Package, Lock } from "lucide-react";
import { EquipmentGridReadOnly } from "@/components/leads/EquipmentGridReadOnly";
import { BoxPalletsGridReadOnly } from "@/components/leads/BoxPalletsGridReadOnly";
import type { Lead } from "@/services/api";

const READONLY_INPUT = "bg-muted cursor-not-allowed";
const EM_DASH = "—";

const renderText = (value: string | number | null | undefined): string =>
  value === null || value === undefined || value === "" ? EM_DASH : String(value);

interface LockedLeadSectionsProps {
  lead: Lead;
}

/**
 * Renders the lead's data as 4 read-only Cards mirroring LeadForm's layout:
 *   1. Contact Information
 *   2. What is being shipped
 *   3. Pickup & Drop-Off Information
 *   4. Product Details
 *
 * Used by RateRequestForm and QuotationForm to surface the source lead's
 * context for downstream forms. Inputs are `readOnly`; toggle groups are
 * `disabled`; empty optional fields render an em-dash placeholder.
 */
export function LockedLeadSections({ lead }: LockedLeadSectionsProps) {
  const equipments = useMemo(
    () => (lead.details ?? []).filter((d) => d.detailType === "Equipment"),
    [lead.details]
  );
  const boxPallets = useMemo(
    () => (lead.details ?? []).filter((d) => d.detailType === "BoxPallet"),
    [lead.details]
  );

  return (
    <>
      {/* 1. Contact Information */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg text-primary flex items-center justify-between">
            <span>Contact Information</span>
            <span className="text-xs font-normal text-muted-foreground inline-flex items-center gap-1">
              <Lock className="h-3 w-3" /> from lead
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Customer Name</Label>
              <Input value={renderText(lead.customerName || lead.fullName)} readOnly className={READONLY_INPUT} />
            </div>
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input value={renderText(lead.email)} readOnly className={READONLY_INPUT} />
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input value={renderText(lead.phoneNumber)} readOnly className={READONLY_INPUT} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Mode of Freight</Label>
            <ToggleGroup
              type="single"
              value={lead.freightMode}
              disabled
              className="justify-start"
            >
              <ToggleGroupItem value="SeaFreight" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground px-6">
                <Ship className="h-4 w-4 mr-2" /> Sea Freight
              </ToggleGroupItem>
              <ToggleGroupItem value="AirFreight" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground px-6">
                <Plane className="h-4 w-4 mr-2" /> Air Freight
              </ToggleGroupItem>
              <ToggleGroupItem value="LandFreight" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground px-6">
                <Truck className="h-4 w-4 mr-2" /> Land Freight
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </CardContent>
      </Card>

      {/* 2. What is being shipped */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg text-primary flex items-center justify-between">
            <span>What is being shipped</span>
            <span className="text-xs font-normal text-muted-foreground inline-flex items-center gap-1">
              <Lock className="h-3 w-3" /> from lead
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Unit of Measurement</Label>
              <Input value={renderText(lead.unitOfMeasurement)} readOnly className={READONLY_INPUT} />
            </div>
            <div className="space-y-2">
              <Label>Shipping Type</Label>
              <ToggleGroup
                type="single"
                value={lead.shippingType}
                disabled
                className="justify-start"
              >
                <ToggleGroupItem value="FTL" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground px-6">
                  <Container className="h-4 w-4 mr-2" /> Equipment (FTL)
                </ToggleGroupItem>
                <ToggleGroupItem value="LTL" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground px-6">
                  <Package className="h-4 w-4 mr-2" /> Box/Pallets (LTL)
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>

          {equipments.length === 0 && boxPallets.length === 0 ? (
            <div className="text-sm text-muted-foreground py-4 border border-dashed rounded-md text-center">
              No cargo details on the lead.
            </div>
          ) : (
            <div className="space-y-4">
              {equipments.length > 0 && <EquipmentGridReadOnly equipments={equipments} />}
              {boxPallets.length > 0 && <BoxPalletsGridReadOnly boxPallets={boxPallets} />}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3. Pickup & Drop-Off */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg text-primary flex items-center justify-between">
            <span>Pickup &amp; Drop-Off Information</span>
            <span className="text-xs font-normal text-muted-foreground inline-flex items-center gap-1">
              <Lock className="h-3 w-3" /> from lead
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground">Pickup goods from:</h4>
              <div className="space-y-2">
                <Label>Country</Label>
                <Input value={renderText(lead.pickupCountryName)} readOnly className={READONLY_INPUT} />
              </div>
              <div className="space-y-2">
                <Label>Loading Port</Label>
                <Input value={renderText(lead.loadingPortName)} readOnly className={READONLY_INPUT} />
              </div>
              <div className="space-y-2">
                <Label>Pickup Address</Label>
                <Textarea
                  value={lead.pickupAddress || ""}
                  readOnly
                  className={READONLY_INPUT}
                  placeholder={EM_DASH}
                  rows={3}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground">Deliver goods to:</h4>
              <div className="space-y-2">
                <Label>Country</Label>
                <Input value={renderText(lead.deliveryCountryName)} readOnly className={READONLY_INPUT} />
              </div>
              <div className="space-y-2">
                <Label>Destination Port</Label>
                <Input value={renderText(lead.destinationPortName)} readOnly className={READONLY_INPUT} />
              </div>
              <div className="space-y-2">
                <Label>Delivery Address</Label>
                <Textarea
                  value={lead.deliveryAddress || ""}
                  readOnly
                  className={READONLY_INPUT}
                  placeholder={EM_DASH}
                  rows={3}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground">Shipment Details:</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Goods Ready Date</Label>
                <Input
                  value={renderText(lead.goodsReadyDate ? lead.goodsReadyDate.split("T")[0] : null)}
                  readOnly
                  className={READONLY_INPUT}
                />
              </div>
              <div className="space-y-2">
                <Label>Customer Reference No</Label>
                <Input value={renderText(lead.customerReferenceNo)} readOnly className={READONLY_INPUT} />
              </div>
              <div className="space-y-2">
                <Label>HS Code</Label>
                <Input value={renderText(lead.hsCode)} readOnly className={READONLY_INPUT} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. Product Details */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg text-primary flex items-center justify-between">
            <span>Product Details</span>
            <span className="text-xs font-normal text-muted-foreground inline-flex items-center gap-1">
              <Lock className="h-3 w-3" /> from lead
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Product Type</Label>
              <Input value={renderText(lead.productType)} readOnly className={READONLY_INPUT} />
            </div>
            <div className="space-y-2">
              <Label>Product Description</Label>
              <Input value={renderText(lead.productDescription)} readOnly className={READONLY_INPUT} />
            </div>
            <div className="space-y-2">
              <Label>Inco Term</Label>
              <Input value={renderText(lead.incoTermCode)} readOnly className={READONLY_INPUT} />
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
