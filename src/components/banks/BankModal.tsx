import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useCreateBank, useUpdateBank } from "@/hooks/useBanks";
import { Bank } from "@/services/api";
import { Loader2 } from "lucide-react";

interface BankModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bank?: Bank | null;
  mode: "add" | "edit";
}

export function BankModal({ open, onOpenChange, bank, mode }: BankModalProps) {
  const [formData, setFormData] = useState({
    bankName: "",
    acHolder: "",
    acNumber: "",
    ibanNumber: "",
    swiftCode: "",
    branch: "",
    telNo: "",
    faxNo: "",
  });

  const createMutation = useCreateBank();
  const updateMutation = useUpdateBank();

  const isLoading = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (bank && mode === "edit") {
      setFormData({
        bankName: bank.bankName || "",
        acHolder: bank.acHolder || "",
        acNumber: bank.acNumber || "",
        ibanNumber: bank.ibanNumber || "",
        swiftCode: bank.swiftCode || "",
        branch: bank.branch || "",
        telNo: bank.telNo || "",
        faxNo: bank.faxNo || "",
      });
    } else {
      setFormData({
        bankName: "",
        acHolder: "",
        acNumber: "",
        ibanNumber: "",
        swiftCode: "",
        branch: "",
        telNo: "",
        faxNo: "",
      });
    }
  }, [bank, mode, open]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "add") {
      createMutation.mutate(formData, {
        onSuccess: () => {
          onOpenChange(false);
        },
      });
    } else if (bank) {
      updateMutation.mutate(
        {
          id: bank.id,
          data: { ...formData, id: bank.id },
        },
        {
          onSuccess: () => {
            onOpenChange(false);
          },
        }
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-modal-2xl bg-card p-0 max-h-[90vh] overflow-hidden flex flex-col gap-0">
        <DialogHeader className="bg-modal-header text-white p-4 rounded-t-lg">
          <DialogTitle className="text-white text-lg font-semibold">
            {mode === "add" ? "Add New" : "Edit"} Bank
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
          <div className="flex-1 overflow-y-auto min-h-0 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <Label className="form-label">Bank Name *</Label>
                <Input
                  placeholder="Bank Name"
                  value={formData.bankName}
                  onChange={(e) => handleInputChange("bankName", e.target.value)}
                  className="form-input"
                  required
                />
              </div>
              <div>
                <Label className="form-label">A/C Holder</Label>
                <Input
                  placeholder="A/C Holder"
                  value={formData.acHolder}
                  onChange={(e) => handleInputChange("acHolder", e.target.value)}
                  className="form-input"
                />
              </div>
              <div>
                <Label className="form-label">A/C Number</Label>
                <Input
                  placeholder="A/C Number"
                  value={formData.acNumber}
                  onChange={(e) => handleInputChange("acNumber", e.target.value)}
                  className="form-input"
                />
              </div>
              <div>
                <Label className="form-label">IBAN Number</Label>
                <Input
                  placeholder="IBAN Number"
                  value={formData.ibanNumber}
                  onChange={(e) => handleInputChange("ibanNumber", e.target.value)}
                  className="form-input"
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <Label className="form-label">Swift Code</Label>
                <Input
                  placeholder="Swift Code"
                  value={formData.swiftCode}
                  onChange={(e) => handleInputChange("swiftCode", e.target.value)}
                  className="form-input"
                />
              </div>
              <div>
                <Label className="form-label">Branch</Label>
                <Input
                  placeholder="Branch"
                  value={formData.branch}
                  onChange={(e) => handleInputChange("branch", e.target.value)}
                  className="form-input"
                />
              </div>
              <div>
                <Label className="form-label">Tel.No</Label>
                <Input
                  placeholder="Tel.Number"
                  value={formData.telNo}
                  onChange={(e) => handleInputChange("telNo", e.target.value)}
                  className="form-input"
                />
              </div>
              <div>
                <Label className="form-label">Fax No</Label>
                <Input
                  placeholder="Fax No"
                  value={formData.faxNo}
                  onChange={(e) => handleInputChange("faxNo", e.target.value)}
                  className="form-input"
                />
              </div>
            </div>
          </div>
          </div>
          <DialogFooter className="shrink-0 gap-2 border-t border-border bg-card px-6 py-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" className="btn-success px-8" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "add" ? "Save" : "Update"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export type { Bank };
