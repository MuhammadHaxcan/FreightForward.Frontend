import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { settingsApi, PackageType, ContainerType, ShipmentContainer } from "@/services/api";

// Extend ShipmentContainer with UI-specific fields
type ContainerModalData = Partial<ShipmentContainer> & {
  sNo?: number | string;
  container?: string; // Alternative field name for containerNumber
};

interface ContainerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  container?: ContainerModalData;
  onSave: (container: ContainerModalData) => void;
  nextSNo: number;
}

const weightUnits = ["Kgs", "Lbs", "MT"];

export function ContainerModal({ open, onOpenChange, container, onSave, nextSNo }: ContainerModalProps) {
  // Fetch container types from API
  const { data: containerTypesResponse, isLoading: isLoadingContainerTypes } = useQuery({
    queryKey: ['containerTypes', 'all'],
    queryFn: () => settingsApi.getAllContainerTypes(),
    staleTime: 60 * 60 * 1000, // Cache for 1 hour
  });

  const containerTypes = useMemo(() => containerTypesResponse?.data ?? [], [containerTypesResponse?.data]);

  // Group container types by category
  const containerTypesByCategory = useMemo(() => {
    const grouped: Record<string, ContainerType[]> = {};
    containerTypes.forEach(ct => {
      if (!grouped[ct.category]) {
        grouped[ct.category] = [];
      }
      grouped[ct.category].push(ct);
    });
    return grouped;
  }, [containerTypes]);

  // Fetch package types from API
  const { data: packageTypesResponse, isLoading: isLoadingPackageTypes } = useQuery({
    queryKey: ['packageTypes', 'all'],
    queryFn: () => settingsApi.getAllPackageTypes(),
    staleTime: 60 * 60 * 1000, // Cache for 1 hour (package types rarely change)
  });

  const packageTypes = useMemo(() => packageTypesResponse?.data ?? [], [packageTypesResponse?.data]);

  // Group package types by category
  const packageTypesByCategory = useMemo(() => {
    const grouped: Record<string, PackageType[]> = {};
    packageTypes.forEach(pt => {
      if (!grouped[pt.category]) {
        grouped[pt.category] = [];
      }
      grouped[pt.category].push(pt);
    });
    return grouped;
  }, [packageTypes]);

  const getInitialFormData = useCallback(() => ({
    sNo: container?.sNo || nextSNo,
    containerTypeId: container?.containerTypeId?.toString() || "",
    containerNo: container?.containerNumber || container?.container || "",
    noOfPcs: container?.noOfPcs?.toString() || "",
    packageTypeId: container?.packageTypeId?.toString() || "",
    actualSeal: container?.sealNo || "",
    grossWeight: container?.grossWeight?.toString() || "",
    weightUnit: "Kgs",
    volume: container?.volume?.toString() || "",
    description: container?.description || "",
  }), [container, nextSNo]);

  const [formData, setFormData] = useState(getInitialFormData);

  // Reset form data when container prop changes or modal opens
  useEffect(() => {
    if (open) {
      setFormData(getInitialFormData());
    }
  }, [open, getInitialFormData]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    // Find the selected container type and package type names for display
    const selectedContainerType = containerTypes.find(ct => ct.id.toString() === formData.containerTypeId);
    const selectedPackageType = packageTypes.find(pt => pt.id.toString() === formData.packageTypeId);

    onSave({
      id: container?.id || Date.now(),
      sNo: formData.sNo,
      containerNumber: formData.containerNo,
      containerTypeId: formData.containerTypeId ? parseInt(formData.containerTypeId) : null,
      containerTypeName: selectedContainerType?.name || null,
      sealNo: formData.actualSeal,
      noOfPcs: parseInt(formData.noOfPcs) || 0,
      packageTypeId: formData.packageTypeId ? parseInt(formData.packageTypeId) : null,
      packageTypeName: selectedPackageType?.name || null,
      grossWeight: parseFloat(formData.grossWeight) || 0,
      volume: parseFloat(formData.volume) || 0,
      description: formData.description,
    });
    onOpenChange(false);
  };

  const isEditing = !!container;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-card border border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground text-lg">{isEditing ? "Edit Container" : "Add Container"}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 p-4">
          {/* Row 1 */}
          <div className="grid grid-cols-5 gap-4">
            <div>
              <Label className="text-sm">SN.No</Label>
              <Input 
                value={formData.sNo} 
                onChange={(e) => handleInputChange("sNo", e.target.value)}
                className="bg-muted"
              />
            </div>
            <div>
              <Label className="text-sm">Container Type</Label>
              <Select
                value={formData.containerTypeId}
                onValueChange={(v) => handleInputChange("containerTypeId", v)}
                disabled={isLoadingContainerTypes}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingContainerTypes ? "Loading..." : "Select container type"} />
                </SelectTrigger>
                <SelectContent className="bg-popover border border-border">
                  {Object.entries(containerTypesByCategory).map(([category, types]) => (
                    <SelectGroup key={category}>
                      <SelectLabel className="text-muted-foreground font-semibold">{category}</SelectLabel>
                      {types.map(ct => (
                        <SelectItem key={ct.id} value={ct.id.toString()}>{ct.name}</SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Container No</Label>
              <Input 
                value={formData.containerNo} 
                onChange={(e) => handleInputChange("containerNo", e.target.value)}
                placeholder="Container No"
              />
            </div>
            <div>
              <Label className="text-sm">No of Pcs</Label>
              <Input 
                value={formData.noOfPcs} 
                onChange={(e) => handleInputChange("noOfPcs", e.target.value)}
                placeholder="No of pcs"
              />
            </div>
            <div>
              <Label className="text-sm">Packages</Label>
              <Select
                value={formData.packageTypeId}
                onValueChange={(v) => handleInputChange("packageTypeId", v)}
                disabled={isLoadingPackageTypes}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingPackageTypes ? "Loading..." : "Select package type"} />
                </SelectTrigger>
                <SelectContent className="bg-popover border border-border">
                  {Object.entries(packageTypesByCategory).map(([category, types]) => (
                    <SelectGroup key={category}>
                      <SelectLabel className="text-muted-foreground font-semibold">{category}</SelectLabel>
                      {types.map(pt => (
                        <SelectItem key={pt.id} value={pt.id.toString()}>{pt.name}</SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-4 gap-4">
            <div>
              <Label className="text-sm">Actual Seal</Label>
              <Input 
                value={formData.actualSeal} 
                onChange={(e) => handleInputChange("actualSeal", e.target.value)}
                placeholder="Actual Seal"
              />
            </div>
            <div>
              <Label className="text-sm">Gross Weight</Label>
              <div className="flex gap-2">
                <Input 
                  value={formData.grossWeight} 
                  onChange={(e) => handleInputChange("grossWeight", e.target.value)}
                  placeholder="Gross Weight"
                  className="flex-1"
                />
                <Select value={formData.weightUnit} onValueChange={(v) => handleInputChange("weightUnit", v)}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border border-border">
                    {weightUnits.map(unit => (
                      <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-sm">Volume</Label>
              <Input 
                value={formData.volume} 
                onChange={(e) => handleInputChange("volume", e.target.value)}
                placeholder="Volume"
              />
            </div>
            <div>
              <Label className="text-sm">Description</Label>
              <Textarea 
                value={formData.description} 
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Description"
                className="min-h-[80px]"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="px-6"
            >
              Close
            </Button>
            <Button
              onClick={handleSave}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-6"
            >
              {isEditing ? "Update" : "Add"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
