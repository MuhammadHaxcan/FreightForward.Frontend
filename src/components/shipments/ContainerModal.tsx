import { useState } from "react";
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
} from "@/components/ui/select";

interface ContainerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  container?: any;
  onSave: (container: any) => void;
  nextSNo: number;
}

const containerTypes = ["20'DC", "40'DC", "40HC", "45HC", "20'RF", "40'RF"];
const packageTypes = ["BAGS", "BOXES", "CARTONS", "PALLETS", "DRUMS", "CRATES"];
const weightUnits = ["Kgs", "Lbs", "MT"];

export function ContainerModal({ open, onOpenChange, container, onSave, nextSNo }: ContainerModalProps) {
  const [formData, setFormData] = useState({
    sNo: container?.sNo || nextSNo,
    containerType: container?.type || "20'DC",
    containerNo: container?.container || "",
    noOfPcs: container?.noOfPcs || "",
    packages: container?.packageType || "BAGS",
    actualSeal: container?.sealNo || "",
    grossWeight: container?.grossWeight || "",
    weightUnit: "Kgs",
    volume: container?.volume || "",
    description: container?.description || "",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSave({
      id: container?.id || Date.now(),
      sNo: formData.sNo,
      container: formData.containerNo,
      type: formData.containerType,
      sealNo: formData.actualSeal,
      noOfPcs: parseInt(formData.noOfPcs) || 0,
      packageType: formData.packages,
      grossWeight: parseFloat(formData.grossWeight) || 0,
      volume: parseFloat(formData.volume) || 0,
      description: formData.description,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-[#2c3e50] text-white border-0">
        <DialogHeader>
          <DialogTitle className="text-white text-lg">Add Container</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 p-4">
          {/* Row 1 */}
          <div className="grid grid-cols-5 gap-4">
            <div>
              <Label className="text-sm text-gray-300">SN.No</Label>
              <Input 
                value={formData.sNo} 
                onChange={(e) => handleInputChange("sNo", e.target.value)}
                className="bg-[#34495e] border-[#4a5568] text-white"
              />
            </div>
            <div>
              <Label className="text-sm text-gray-300">Container Type</Label>
              <Select value={formData.containerType} onValueChange={(v) => handleInputChange("containerType", v)}>
                <SelectTrigger className="bg-white text-black border-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-300">
                  {containerTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm text-gray-300">Container No</Label>
              <Input 
                value={formData.containerNo} 
                onChange={(e) => handleInputChange("containerNo", e.target.value)}
                placeholder="Container No"
                className="bg-white text-black border-gray-300"
              />
            </div>
            <div>
              <Label className="text-sm text-gray-300">No of Pcs</Label>
              <Input 
                value={formData.noOfPcs} 
                onChange={(e) => handleInputChange("noOfPcs", e.target.value)}
                placeholder="No of pcs"
                className="bg-white text-black border-gray-300"
              />
            </div>
            <div>
              <Label className="text-sm text-gray-300">Packages</Label>
              <Select value={formData.packages} onValueChange={(v) => handleInputChange("packages", v)}>
                <SelectTrigger className="bg-white text-black border-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-300">
                  {packageTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-4 gap-4">
            <div>
              <Label className="text-sm text-gray-300">Actual Seal</Label>
              <Input 
                value={formData.actualSeal} 
                onChange={(e) => handleInputChange("actualSeal", e.target.value)}
                placeholder="Actual Seal"
                className="bg-white text-black border-gray-300"
              />
            </div>
            <div>
              <Label className="text-sm text-gray-300">Gross Weight</Label>
              <div className="flex gap-2">
                <Input 
                  value={formData.grossWeight} 
                  onChange={(e) => handleInputChange("grossWeight", e.target.value)}
                  placeholder="Gross Weight"
                  className="bg-white text-black border-gray-300 flex-1"
                />
                <Select value={formData.weightUnit} onValueChange={(v) => handleInputChange("weightUnit", v)}>
                  <SelectTrigger className="bg-white text-black border-gray-300 w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-300">
                    {weightUnits.map(unit => (
                      <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-sm text-gray-300">Volume</Label>
              <Input 
                value={formData.volume} 
                onChange={(e) => handleInputChange("volume", e.target.value)}
                placeholder="Volume"
                className="bg-white text-black border-gray-300"
              />
            </div>
            <div>
              <Label className="text-sm text-gray-300">Description</Label>
              <Textarea 
                value={formData.description} 
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Description"
                className="bg-white text-black border-gray-300 min-h-[80px]"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="bg-[#34495e] hover:bg-[#4a5568] text-white border-[#4a5568] px-6"
            >
              Close
            </Button>
            <Button 
              onClick={handleSave}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-6"
            >
              Add
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
