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
import { LeadDetailItem, ContainerType } from "@/services/api";

interface EquipmentRowModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipment: LeadDetailItem | null;
  onSave: (equipment: LeadDetailItem) => void;
  containerTypes: ContainerType[];
}

export function EquipmentRowModal({
  open,
  onOpenChange,
  equipment,
  onSave,
  containerTypes,
}: EquipmentRowModalProps) {
  const [formData, setFormData] = useState<LeadDetailItem>({
    detailType: "Equipment",
    quantity: 1,
    containerTypeId: undefined,
    containerTypeName: "",
    subCategory: "",
    weight: 0,
  });

  useEffect(() => {
    if (equipment) {
      setFormData(equipment);
    } else {
      setFormData({
        detailType: "Equipment",
        quantity: 1,
        containerTypeId: undefined,
        containerTypeName: "",
        subCategory: "",
        weight: 0,
      });
    }
  }, [equipment, open]);

  const handleContainerTypeChange = (containerTypeId: string) => {
    const id = parseInt(containerTypeId);
    const containerType = containerTypes.find((ct) => ct.id === id);
    setFormData({
      ...formData,
      containerTypeId: id,
      containerTypeName: containerType?.name || "",
    });
  };

  const handleSave = () => {
    if (!formData.containerTypeId) return;
    onSave(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-modal-md p-0 max-h-[90vh] overflow-hidden flex flex-col gap-0">
        <DialogHeader className="bg-modal-header text-white p-4 rounded-t-lg">
          <DialogTitle className="text-white text-lg font-semibold">
            {equipment ? "Edit Equipment" : "Add Equipment"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0 grid gap-4 p-6">
          <div className="grid gap-2">
            <Label htmlFor="quantity">Quantity *</Label>
            <Input
              id="quantity"
              type="number"
              min={1}
              value={formData.quantity}
              onChange={(e) =>
                setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })
              }
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="containerTypeId">Equipment Type *</Label>
            <SearchableSelect
              options={containerTypes.map((type) => ({
                value: type.id.toString(),
                label: type.name,
              }))}
              value={formData.containerTypeId?.toString() || ""}
              onValueChange={handleContainerTypeChange}
              placeholder="Select equipment type"
              searchPlaceholder="Search equipment types..."
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="subCategory">Sub Category</Label>
            <Input
              id="subCategory"
              value={formData.subCategory || ""}
              onChange={(e) =>
                setFormData({ ...formData, subCategory: e.target.value })
              }
              placeholder="Optional"
            />
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
                setFormData({ ...formData, weight: parseFloat(e.target.value) || 0 })
              }
            />
          </div>

        </div>

        <DialogFooter className="shrink-0 gap-2 border-t border-border bg-card px-6 py-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={!formData.containerTypeId}
              className="btn-success px-8"
            >
              {equipment ? "Update" : "Add"}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
