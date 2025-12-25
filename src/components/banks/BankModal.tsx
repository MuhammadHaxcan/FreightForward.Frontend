import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCreateBank, useUpdateBank } from "@/hooks/useBanks";
import { Bank } from "@/services/api";
import { Loader2 } from "lucide-react";

interface BankModalProps {
  isOpen: boolean;
  onClose: () => void;
  bank?: Bank | null;
  mode: "add" | "edit";
}

export function BankModal({ isOpen, onClose, bank, mode }: BankModalProps) {
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
  }, [bank, mode, isOpen]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "add") {
      createMutation.mutate(formData, {
        onSuccess: () => {
          onClose();
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
            onClose();
          },
        }
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-card">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            <span className="font-bold">{mode === "add" ? "Add New" : "Edit"}</span> Bank
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="py-4">
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
          <div className="flex justify-end gap-3 pt-6">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" className="btn-success px-8" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "add" ? "Save" : "Update"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export type { Bank };
