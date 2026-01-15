import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DateInput } from "@/components/ui/date-input";
import { getTodayDateOnly } from "@/lib/utils";
import { AddShipmentStatusLogRequest } from "@/services/api/shipment";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface StatusLogModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (statusLog: AddShipmentStatusLogRequest) => Promise<void>;
}

export function StatusLogModal({ open, onOpenChange, onSave }: StatusLogModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    statusDate: getTodayDateOnly(),
    remarks: "",
  });

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setFormData({
        statusDate: getTodayDateOnly(),
        remarks: "",
      });
    }
  }, [open]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!formData.remarks?.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter remarks",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const statusLogData: AddShipmentStatusLogRequest = {
        statusDate: formData.statusDate,
        remarks: formData.remarks || undefined,
      };

      await onSave(statusLogData);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save status log:", error);
      toast({
        title: "Error",
        description: "Failed to save status log",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card border border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground text-lg bg-[#2c3e50] text-white p-4 -m-6 mb-0 rounded-t-lg">
            Add Status Log
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-6">
          {/* Date */}
          <div>
            <Label className="text-sm font-semibold">Date</Label>
            <DateInput
              value={formData.statusDate}
              onChange={(v) => handleInputChange("statusDate", v)}
            />
          </div>

          {/* Remarks */}
          <div>
            <Label className="text-sm font-semibold">Text <span className="text-red-500">*</span></Label>
            <Textarea
              value={formData.remarks}
              onChange={(e) => handleInputChange("remarks", e.target.value)}
              placeholder="Enter status remarks..."
              className="bg-background border-border min-h-[100px]"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-center gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="bg-[#34495e] hover:bg-[#4a5568] text-white border-[#4a5568] px-8"
              disabled={loading}
            >
              Close
            </Button>
            <Button
              onClick={handleSave}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-8"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
