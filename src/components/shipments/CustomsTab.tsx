import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { useShipment } from "@/hooks/useShipments";
import { useShipmentCustoms, useUpsertShipmentCustoms } from "@/hooks/useShipmentCustoms";
import { Button } from "@/components/ui/button";
import { DateInput } from "@/components/ui/date-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";

interface CustomsTabProps {
  shipmentId: number;
  isReadOnly?: boolean;
}

function createEmptyCustomsForm() {
  return {
    edBoeNo: "",
    edBoeDate: "",
    docsType: "",
    processBy: "",
    vatInspectionNo: "",
    claimNo: "",
    deliveryOrderNo: "",
    deliveryOrderIssueDate: "",
    igmEgmNo: "",
    igmEgmDate: "",
    indexNo: "",
    actualArrivalDate: "",
    manifestFilingDate: "",
    vesselColour: "",
    berth: "",
    lastStop: "",
    tallyContractorPartyId: "",
  };
}

const allowedTallyCategoryCodes = new Set([
  "ShippingLine",
  "Agents",
  "DeliveryAgent",
  "ClearingAgent",
  "Terminal",
]);

export function CustomsTab({ shipmentId, isReadOnly = false }: CustomsTabProps) {
  const { data: customs, isLoading } = useShipmentCustoms(shipmentId);
  const { data: shipment } = useShipment(shipmentId);
  const { mutate: upsert, isPending: isSaving } = useUpsertShipmentCustoms(shipmentId);

  const [form, setForm] = useState(createEmptyCustomsForm);

  useEffect(() => {
    if (!customs) {
      setForm(createEmptyCustomsForm());
      return;
    }

    setForm({
      edBoeNo: customs.edBoeNo ?? "",
      edBoeDate: customs.edBoeDate ?? "",
      docsType: customs.docsType ?? "",
      processBy: customs.processBy ?? "",
      vatInspectionNo: customs.vatInspectionNo ?? "",
      claimNo: customs.claimNo ?? "",
      deliveryOrderNo: customs.deliveryOrderNo ?? "",
      deliveryOrderIssueDate: customs.deliveryOrderIssueDate ?? "",
      igmEgmNo: customs.igmEgmNo ?? "",
      igmEgmDate: customs.igmEgmDate ?? "",
      indexNo: customs.indexNo ?? "",
      actualArrivalDate: customs.actualArrivalDate ?? "",
      manifestFilingDate: customs.manifestFilingDate ?? "",
      vesselColour: customs.vesselColour ?? "",
      berth: customs.berth ?? "",
      lastStop: customs.lastStop ?? "",
      tallyContractorPartyId: customs.tallyContractorPartyId?.toString() ?? "",
    });
  }, [customs, shipmentId]);

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const partyOptions = (shipment?.parties ?? [])
    .filter((party) => allowedTallyCategoryCodes.has(party.customerCategoryCode ?? ""))
    .map((party) => ({
      value: party.id.toString(),
      label: `${party.customerCategoryName ?? "Party"} - ${party.customerName}${party.phone ? ` (${party.phone})` : party.mobile ? ` (${party.mobile})` : ""}`,
    }));

  const handleSave = () => {
    upsert({
      edBoeNo: form.edBoeNo || undefined,
      edBoeDate: form.edBoeDate || undefined,
      docsType: form.docsType || undefined,
      processBy: form.processBy || undefined,
      vatInspectionNo: form.vatInspectionNo || undefined,
      claimNo: form.claimNo || undefined,
      deliveryOrderNo: form.deliveryOrderNo || undefined,
      deliveryOrderIssueDate: form.deliveryOrderIssueDate || undefined,
      igmEgmNo: form.igmEgmNo || undefined,
      igmEgmDate: form.igmEgmDate || undefined,
      indexNo: form.indexNo || undefined,
      actualArrivalDate: form.actualArrivalDate || undefined,
      manifestFilingDate: form.manifestFilingDate || undefined,
      vesselColour: form.vesselColour || undefined,
      berth: form.berth || undefined,
      lastStop: form.lastStop || undefined,
      tallyContractorPartyId: form.tallyContractorPartyId ? Number(form.tallyContractorPartyId) : undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading customs details...
      </div>
    );
  }

  return (
    <div className="space-y-6 rounded-lg border border-border bg-card p-6">
      <h3 className="border-b border-border pb-2 text-lg font-semibold text-emerald-600">
        Customs Entry Declaration
      </h3>

      <div className="grid grid-cols-2 gap-x-8 gap-y-4">
        <div className="space-y-1">
          <Label className="text-sm font-medium">ED / BOE No</Label>
          <Input
            value={form.edBoeNo}
            onChange={(e) => handleChange("edBoeNo", e.target.value)}
            placeholder="Enter ED/BOE number"
            className="bg-card"
            disabled={isReadOnly}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-sm font-medium">ED / BOE Date</Label>
          <DateInput
            value={form.edBoeDate}
            onChange={(v) => handleChange("edBoeDate", v)}
            placeholder="dd-mm-yyyy"
            className="bg-card"
            disabled={isReadOnly}
          />
        </div>

        <div className="space-y-1">
          <Label className="text-sm font-medium">Document Type</Label>
          <Input
            value={form.docsType}
            onChange={(e) => handleChange("docsType", e.target.value)}
            placeholder="e.g. Import Declaration"
            className="bg-card"
            disabled={isReadOnly}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-sm font-medium">Processed By</Label>
          <Input
            value={form.processBy}
            onChange={(e) => handleChange("processBy", e.target.value)}
            placeholder="Customs agent / broker"
            className="bg-card"
            disabled={isReadOnly}
          />
        </div>

        <div className="space-y-1">
          <Label className="text-sm font-medium">VAT Inspection No</Label>
          <Input
            value={form.vatInspectionNo}
            onChange={(e) => handleChange("vatInspectionNo", e.target.value)}
            placeholder="Enter VAT inspection number"
            className="bg-card"
            disabled={isReadOnly}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-sm font-medium">Claim No</Label>
          <Input
            value={form.claimNo}
            onChange={(e) => handleChange("claimNo", e.target.value)}
            placeholder="Enter claim number"
            className="bg-card"
            disabled={isReadOnly}
          />
        </div>

        <div className="space-y-1">
          <Label className="text-sm font-medium">Delivery Order No</Label>
          <Input
            value={form.deliveryOrderNo}
            onChange={(e) => handleChange("deliveryOrderNo", e.target.value)}
            placeholder="Enter delivery order number"
            className="bg-card"
            disabled={isReadOnly}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-sm font-medium">DO Issue Date</Label>
          <DateInput
            value={form.deliveryOrderIssueDate}
            onChange={(v) => handleChange("deliveryOrderIssueDate", v)}
            placeholder="dd-mm-yyyy"
            className="bg-card"
            disabled={isReadOnly}
          />
        </div>
      </div>

      <div className="space-y-4 border-t border-border pt-2">
        <div>
          <h4 className="font-semibold text-emerald-600">Pakistan / CSA Header</h4>
          <p className="mt-1 text-sm text-muted-foreground">
            Shipping agent is sourced automatically from the shipment Parties tab using Shipping Line, Agents, then Delivery Agent.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          <div className="space-y-1">
            <Label className="text-sm font-medium">IGM / EGM No</Label>
            <Input
              value={form.igmEgmNo}
            onChange={(e) => handleChange("igmEgmNo", e.target.value)}
            placeholder="Enter IGM / EGM number"
            className="bg-card"
            disabled={isReadOnly}
          />
          </div>
          <div className="space-y-1">
            <Label className="text-sm font-medium">IGM / EGM Date</Label>
            <DateInput
              value={form.igmEgmDate}
            onChange={(v) => handleChange("igmEgmDate", v)}
            placeholder="dd-mm-yyyy"
            className="bg-card"
            disabled={isReadOnly}
          />
          </div>

          <div className="space-y-1">
            <Label className="text-sm font-medium">Index No</Label>
            <Input
              value={form.indexNo}
            onChange={(e) => handleChange("indexNo", e.target.value)}
            placeholder="Enter index number"
            className="bg-card"
            disabled={isReadOnly}
          />
          </div>

          <div className="space-y-1">
            <Label className="text-sm font-medium">Actual Arrival Date</Label>
            <DateInput
              value={form.actualArrivalDate}
              onChange={(v) => handleChange("actualArrivalDate", v)}
              placeholder="dd-mm-yyyy"
              className="bg-card"
              disabled={isReadOnly}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-sm font-medium">Manifest Filing Date</Label>
            <DateInput
              value={form.manifestFilingDate}
              onChange={(v) => handleChange("manifestFilingDate", v)}
              placeholder="dd-mm-yyyy"
              className="bg-card"
              disabled={isReadOnly}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-sm font-medium">Colour</Label>
            <Input
              value={form.vesselColour}
              onChange={(e) => handleChange("vesselColour", e.target.value)}
              placeholder="Enter flag colour"
              className="bg-card"
              disabled={isReadOnly}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-sm font-medium">Berth</Label>
            <Input
              value={form.berth}
              onChange={(e) => handleChange("berth", e.target.value)}
              placeholder="Enter berth"
              className="bg-card"
              disabled={isReadOnly}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-sm font-medium">Last Stop</Label>
            <Input
              value={form.lastStop}
              onChange={(e) => handleChange("lastStop", e.target.value)}
              placeholder="Enter last stop"
              className="bg-card"
              disabled={isReadOnly}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-sm font-medium">Tally Contractor</Label>
            <SearchableSelect
              options={partyOptions}
              value={form.tallyContractorPartyId}
              onValueChange={(value) => handleChange("tallyContractorPartyId", value)}
              disabled={isReadOnly}
              placeholder="Select operational party"
              searchPlaceholder="Search operational parties..."
              triggerClassName="w-full bg-card"
              emptyMessage="No operational shipment parties available."
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button className="btn-success gap-2" onClick={handleSave} disabled={isReadOnly || isSaving}>
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save Customs Details
        </Button>
      </div>
    </div>
  );
}
