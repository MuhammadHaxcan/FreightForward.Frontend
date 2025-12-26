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

interface DocumentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (document: any) => void;
}

const documentTypes = ["Invoice", "HBL", "MBL", "Packing List", "Commercial Invoice", "Certificate of Origin", "Bill of Lading"];

export function DocumentModal({ open, onOpenChange, onSave }: DocumentModalProps) {
  const [formData, setFormData] = useState({
    documentType: "Invoice",
    documentNo: "",
    docDate: new Date().toISOString().split('T')[0],
    remarks: "",
    file: null as File | null,
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({ ...prev, file: e.target.files![0] }));
    }
  };

  const handleSave = () => {
    onSave({
      id: Date.now(),
      documentType: formData.documentType,
      documentNo: formData.documentNo,
      docDate: formData.docDate,
      remarks: formData.remarks,
      fileName: formData.file?.name || "",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-card border border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground text-lg bg-[#2c3e50] text-white p-4 -m-6 mb-0 rounded-t-lg">
            Documents
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 pt-6">
          {/* Row 1 */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-sm">Document Type</Label>
              <Select value={formData.documentType} onValueChange={(v) => handleInputChange("documentType", v)}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border border-border">
                  {documentTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Document No</Label>
              <Input 
                value={formData.documentNo} 
                onChange={(e) => handleInputChange("documentNo", e.target.value)}
                placeholder="Document No"
                className="bg-background border-border"
              />
            </div>
            <div>
              <Label className="text-sm">Doc. Date</Label>
              <Input 
                type="date"
                value={formData.docDate} 
                onChange={(e) => handleInputChange("docDate", e.target.value)}
                className="bg-background border-border"
              />
            </div>
          </div>

          {/* Add Files Button */}
          <div>
            <label htmlFor="file-upload" className="cursor-pointer">
              <Button 
                type="button"
                className="bg-emerald-500 hover:bg-emerald-600 text-white"
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                +Add Files
              </Button>
            </label>
            <input 
              id="file-upload"
              type="file"
              onChange={handleFileChange}
              className="hidden"
            />
            {formData.file && (
              <span className="ml-2 text-sm text-muted-foreground">{formData.file.name}</span>
            )}
          </div>

          {/* Remarks */}
          <div>
            <Label className="text-sm">Remarks</Label>
            <Textarea 
              value={formData.remarks} 
              onChange={(e) => handleInputChange("remarks", e.target.value)}
              placeholder="Remarks"
              className="bg-background border-border"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-center gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="bg-[#34495e] hover:bg-[#4a5568] text-white border-[#4a5568] px-8"
            >
              Close
            </Button>
            <Button 
              onClick={handleSave}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-8"
            >
              Add
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
