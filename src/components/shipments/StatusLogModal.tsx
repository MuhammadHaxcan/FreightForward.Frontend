import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DateInput } from "@/components/ui/date-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AddShipmentStatusLogRequest, StatusEventType } from "@/services/api/shipment";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { getTodayDateOnly } from "@/lib/utils";
import {
  EVENT_TYPE_OPTIONS,
  getEventTypeLabel,
  shouldShowVesselFields,
} from "@/lib/status-event-utils";

interface StatusLogModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (statusLog: AddShipmentStatusLogRequest) => Promise<void>;
}

export function StatusLogModal({ open, onOpenChange, onSave }: StatusLogModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    eventType: '' as StatusEventType | '',
    eventDescription: '',
    eventDate: getTodayDateOnly(),
    location: '',
    vesselName: '',
    voyageNumber: '',
    remarks: '',
  });

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setFormData({
        eventType: '',
        eventDescription: '',
        eventDate: getTodayDateOnly(),
        location: '',
        vesselName: '',
        voyageNumber: '',
        remarks: '',
      });
    }
  }, [open]);

  const handleEventTypeChange = (value: StatusEventType) => {
    setFormData(prev => ({
      ...prev,
      eventType: value,
      eventDescription: getEventTypeLabel(value),
    }));
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!formData.eventType) {
      toast({
        title: "Validation Error",
        description: "Please select an event type",
        variant: "destructive",
      });
      return;
    }

    if (!formData.eventDescription?.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter an event description",
        variant: "destructive",
      });
      return;
    }

    if (!formData.eventDate) {
      toast({
        title: "Validation Error",
        description: "Please select a date",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Convert date string (YYYY-MM-DD) to ISO datetime string
      const eventDateTime = new Date(formData.eventDate + 'T00:00:00Z').toISOString();

      const statusLogData: AddShipmentStatusLogRequest = {
        eventType: formData.eventType as StatusEventType,
        eventDescription: formData.eventDescription.trim(),
        eventDateTime: eventDateTime,
        location: formData.location?.trim() || undefined,
        vesselName: formData.vesselName?.trim() || undefined,
        voyageNumber: formData.voyageNumber?.trim() || undefined,
        remarks: formData.remarks?.trim() || undefined,
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

  const showVesselFields = formData.eventType && shouldShowVesselFields(formData.eventType as StatusEventType);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-card border border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground text-lg bg-[#2c3e50] text-white p-4 -m-6 mb-0 rounded-t-lg">
            Add Tracking Event
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-6">
          {/* Event Type */}
          <div>
            <Label className="text-sm font-semibold">Event Type <span className="text-red-500">*</span></Label>
            <Select
              value={formData.eventType}
              onValueChange={(value) => handleEventTypeChange(value as StatusEventType)}
            >
              <SelectTrigger className="bg-background border-border">
                <SelectValue placeholder="Select event type..." />
              </SelectTrigger>
              <SelectContent>
                {EVENT_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Event Description */}
          <div>
            <Label className="text-sm font-semibold">Event Description <span className="text-red-500">*</span></Label>
            <Input
              value={formData.eventDescription}
              onChange={(e) => handleInputChange("eventDescription", e.target.value)}
              placeholder="e.g., Vessel Departure - HANSA AFRICA"
              className="bg-background border-border"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Auto-filled from event type. You can customize it.
            </p>
          </div>

          {/* Event Date */}
          <div>
            <Label className="text-sm font-semibold">Event Date <span className="text-red-500">*</span></Label>
            <DateInput
              value={formData.eventDate}
              onChange={(v) => handleInputChange("eventDate", v)}
            />
          </div>

          {/* Location */}
          <div>
            <Label className="text-sm font-semibold">Location</Label>
            <Input
              value={formData.location}
              onChange={(e) => handleInputChange("location", e.target.value)}
              placeholder="e.g., Jebel Ali, UAE"
              className="bg-background border-border"
            />
          </div>

          {/* Vessel Fields - Only show for vessel-related events */}
          {showVesselFields && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-semibold">Vessel Name</Label>
                <Input
                  value={formData.vesselName}
                  onChange={(e) => handleInputChange("vesselName", e.target.value)}
                  placeholder="e.g., HANSA AFRICA"
                  className="bg-background border-border"
                />
              </div>
              <div>
                <Label className="text-sm font-semibold">Voyage Number</Label>
                <Input
                  value={formData.voyageNumber}
                  onChange={(e) => handleInputChange("voyageNumber", e.target.value)}
                  placeholder="e.g., 550S"
                  className="bg-background border-border"
                />
              </div>
            </div>
          )}

          {/* Remarks */}
          <div>
            <Label className="text-sm font-semibold">Remarks</Label>
            <Textarea
              value={formData.remarks}
              onChange={(e) => handleInputChange("remarks", e.target.value)}
              placeholder="Additional notes..."
              className="bg-background border-border min-h-[80px]"
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
                "Add Event"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
