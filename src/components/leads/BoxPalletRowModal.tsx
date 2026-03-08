import { useState, useEffect } from "react";
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
import { LeadDetailItem, MeasurementType, PackageType } from "@/services/api";

interface BoxPalletRowModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boxPallet: LeadDetailItem | null;
  onSave: (boxPallet: LeadDetailItem) => void;
  packageTypes: PackageType[];
}

export function BoxPalletRowModal({
  open,
  onOpenChange,
  boxPallet,
  onSave,
  packageTypes,
}: BoxPalletRowModalProps) {
  const [formData, setFormData] = useState<LeadDetailItem>({
    detailType: "BoxPallet",
    packageTypeId: undefined,
    packageTypeName: "",
    quantity: 1,
    length: 0,
    width: 0,
    height: 0,
    measurementType: "Total",
    volume: 0,
    weight: 0,
  });
  const [dimensionUnit, setDimensionUnit] = useState<"CM" | "M" | "IN">("CM");

  useEffect(() => {
    if (boxPallet) {
      setFormData(boxPallet);
    } else {
      setFormData({
        detailType: "BoxPallet",
        packageTypeId: undefined,
        packageTypeName: "",
        quantity: 1,
        length: 0,
        width: 0,
        height: 0,
        measurementType: "Total",
        volume: 0,
        weight: 0,
      });
      setDimensionUnit("CM");
    }
  }, [boxPallet, open]);

  // Auto-calculate CBM when dimensions or unit change
  useEffect(() => {
    const length = formData.length || 0;
    const width = formData.width || 0;
    const height = formData.height || 0;
    const rawVolume = length * width * height;

    // Convert to CBM based on dimension unit
    let cbm: number;
    if (dimensionUnit === "CM") {
      cbm = rawVolume / 1_000_000;
    } else if (dimensionUnit === "IN") {
      cbm = rawVolume / 61_024;
    } else {
      // Meters - already in CBM
      cbm = rawVolume;
    }

    const totalVolume =
      formData.measurementType === "Total"
        ? cbm * formData.quantity
        : cbm;
    setFormData((prev) => ({ ...prev, volume: totalVolume }));
  }, [formData.length, formData.width, formData.height, formData.quantity, formData.measurementType, dimensionUnit]);

  const handlePackageTypeChange = (packageTypeId: string) => {
    const id = parseInt(packageTypeId);
    const packageType = packageTypes.find((pt) => pt.id === id);
    setFormData({
      ...formData,
      packageTypeId: id,
      packageTypeName: packageType?.name || "",
    });
  };

  const handleSave = () => {
    if (!formData.packageTypeId) return;
    onSave(formData);
    onOpenChange(false);
  };

  const updateField = (field: keyof LeadDetailItem, value: string | number | undefined) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0">
        <DialogHeader className="bg-modal-header text-white p-4 rounded-t-lg">
          <DialogTitle className="text-white text-lg font-semibold">
            {boxPallet ? "Edit Box/Pallet" : "Add Box/Pallet"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 p-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="packageTypeId">Packaging Type *</Label>
              <SearchableSelect
                options={packageTypes.map((type) => ({
                  value: type.id.toString(),
                  label: type.name,
                }))}
                value={formData.packageTypeId?.toString() || ""}
                onValueChange={handlePackageTypeChange}
                placeholder="Select type"
                searchPlaceholder="Search package types..."
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                min={1}
                value={formData.quantity}
                onChange={(e) =>
                  updateField("quantity", parseInt(e.target.value) || 1)
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="length">Length</Label>
              <Input
                id="length"
                type="number"
                min={0}
                step="0.01"
                value={formData.length || 0}
                onChange={(e) =>
                  updateField("length", parseFloat(e.target.value) || 0)
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="width">Width</Label>
              <Input
                id="width"
                type="number"
                min={0}
                step="0.01"
                value={formData.width || 0}
                onChange={(e) =>
                  updateField("width", parseFloat(e.target.value) || 0)
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="height">Height</Label>
              <Input
                id="height"
                type="number"
                min={0}
                step="0.01"
                value={formData.height || 0}
                onChange={(e) =>
                  updateField("height", parseFloat(e.target.value) || 0)
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="dimensionUnit">Dimension Unit</Label>
              <SearchableSelect
                options={[
                  { value: "CM", label: "CM" },
                  { value: "M", label: "Meter" },
                  { value: "IN", label: "Inch" },
                ]}
                value={dimensionUnit}
                onValueChange={(value) => setDimensionUnit(value as "CM" | "M" | "IN")}
                placeholder="Select unit"
                searchPlaceholder="Search..."
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="measurementType">Measurement</Label>
              <SearchableSelect
                options={[
                  { value: "Total", label: "Total" },
                  { value: "PerUnit", label: "Per Unit" },
                ]}
                value={formData.measurementType || "Total"}
                onValueChange={(value) =>
                  updateField("measurementType", value as MeasurementType)
                }
                placeholder="Select measurement"
                searchPlaceholder="Search..."
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="volume">CBM (calculated)</Label>
              <Input
                id="volume"
                type="number"
                value={formData.volume?.toFixed(6) || 0}
                disabled
                className="bg-muted"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="weight">Weight *</Label>
            <Input
              id="weight"
              type="number"
              min={0}
              step="0.01"
              value={formData.weight}
              onChange={(e) =>
                updateField("weight", parseFloat(e.target.value) || 0)
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!formData.packageTypeId}
            className="btn-success"
          >
            {boxPallet ? "Update" : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
