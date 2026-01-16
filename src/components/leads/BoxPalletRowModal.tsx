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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
    }
  }, [boxPallet, open]);

  // Auto-calculate volume when dimensions change
  useEffect(() => {
    const length = formData.length || 0;
    const width = formData.width || 0;
    const height = formData.height || 0;
    const volume = length * width * height;
    const totalVolume =
      formData.measurementType === "PerUnit"
        ? volume * formData.quantity
        : volume;
    setFormData((prev) => ({ ...prev, volume: totalVolume }));
  }, [formData.length, formData.width, formData.height, formData.quantity, formData.measurementType]);

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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {boxPallet ? "Edit Box/Pallet" : "Add Box/Pallet"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="packageTypeId">Packaging Type *</Label>
              <Select
                value={formData.packageTypeId?.toString() || ""}
                onValueChange={handlePackageTypeChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {packageTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id.toString()}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="measurementType">Measurement</Label>
              <Select
                value={formData.measurementType || "Total"}
                onValueChange={(value) =>
                  updateField("measurementType", value as MeasurementType)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Total">Total</SelectItem>
                  <SelectItem value="PerUnit">Per Unit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="volume">Volume (calculated)</Label>
              <Input
                id="volume"
                type="number"
                value={formData.volume?.toFixed(2) || 0}
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
            className="bg-green-600 hover:bg-green-700"
          >
            {boxPallet ? "Update" : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
