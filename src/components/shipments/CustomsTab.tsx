import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DateInput } from "@/components/ui/date-input";
import { Loader2, Save } from "lucide-react";
import { useShipmentCustoms, useUpsertShipmentCustoms } from "@/hooks/useShipmentCustoms";

interface CustomsTabProps {
  shipmentId: number;
}

export function CustomsTab({ shipmentId }: CustomsTabProps) {
  const { data: customs, isLoading } = useShipmentCustoms(shipmentId);
  const { mutate: upsert, isPending: isSaving } = useUpsertShipmentCustoms(shipmentId);

  const [form, setForm] = useState({
    edBoeNo: "",
    edBoeDate: "",
    docsType: "",
    processBy: "",
    vatInspectionNo: "",
    claimNo: "",
    deliveryOrderNo: "",
    deliveryOrderIssueDate: "",
  });

  useEffect(() => {
    if (customs) {
      setForm({
        edBoeNo: customs.edBoeNo ?? "",
        edBoeDate: customs.edBoeDate ?? "",
        docsType: customs.docsType ?? "",
        processBy: customs.processBy ?? "",
        vatInspectionNo: customs.vatInspectionNo ?? "",
        claimNo: customs.claimNo ?? "",
        deliveryOrderNo: customs.deliveryOrderNo ?? "",
        deliveryOrderIssueDate: customs.deliveryOrderIssueDate ?? "",
      });
    }
  }, [customs]);

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

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
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Loading customs details...
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6 space-y-6">
      <h3 className="text-emerald-600 font-semibold text-lg border-b border-border pb-2">
        Customs Entry Declaration
      </h3>

      <div className="grid grid-cols-2 gap-x-8 gap-y-4">
        {/* Row 1: ED/BOE No | Date */}
        <div className="space-y-1">
          <Label className="text-sm font-medium">ED / BOE No</Label>
          <Input
            value={form.edBoeNo}
            onChange={(e) => handleChange("edBoeNo", e.target.value)}
            placeholder="Enter ED/BOE number"
            className="bg-card"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-sm font-medium">ED / BOE Date</Label>
          <DateInput
            value={form.edBoeDate}
            onChange={(v) => handleChange("edBoeDate", v)}
            placeholder="dd-mm-yyyy"
            className="bg-card"
          />
        </div>

        {/* Row 2: Document Type | Processed By */}
        <div className="space-y-1">
          <Label className="text-sm font-medium">Document Type</Label>
          <Input
            value={form.docsType}
            onChange={(e) => handleChange("docsType", e.target.value)}
            placeholder="e.g. Import Declaration"
            className="bg-card"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-sm font-medium">Processed By</Label>
          <Input
            value={form.processBy}
            onChange={(e) => handleChange("processBy", e.target.value)}
            placeholder="Customs agent / broker"
            className="bg-card"
          />
        </div>

        {/* Row 3: VAT Inspection No | Claim No */}
        <div className="space-y-1">
          <Label className="text-sm font-medium">VAT Inspection No</Label>
          <Input
            value={form.vatInspectionNo}
            onChange={(e) => handleChange("vatInspectionNo", e.target.value)}
            placeholder="Enter VAT inspection number"
            className="bg-card"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-sm font-medium">Claim No</Label>
          <Input
            value={form.claimNo}
            onChange={(e) => handleChange("claimNo", e.target.value)}
            placeholder="Enter claim number"
            className="bg-card"
          />
        </div>

        {/* Row 4: Delivery Order No | Issue Date */}
        <div className="space-y-1">
          <Label className="text-sm font-medium">Delivery Order No</Label>
          <Input
            value={form.deliveryOrderNo}
            onChange={(e) => handleChange("deliveryOrderNo", e.target.value)}
            placeholder="Enter delivery order number"
            className="bg-card"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-sm font-medium">DO Issue Date</Label>
          <DateInput
            value={form.deliveryOrderIssueDate}
            onChange={(v) => handleChange("deliveryOrderIssueDate", v)}
            placeholder="dd-mm-yyyy"
            className="bg-card"
          />
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button
          className="btn-success gap-2"
          onClick={handleSave}
          disabled={isSaving}
        >
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
