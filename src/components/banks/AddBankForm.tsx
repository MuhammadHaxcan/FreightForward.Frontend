import { ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface AddBankFormProps {
  isExpanded: boolean;
  onToggle: () => void;
}

export function AddBankForm({ isExpanded, onToggle }: AddBankFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Bank form submitted");
  };

  return (
    <div className="bg-card rounded-lg shadow-sm border border-border animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-xl font-semibold text-foreground">
          <span className="font-bold">Add New</span> Bank
        </h2>
        <Button
          variant={isExpanded ? "destructive" : "default"}
          size="sm"
          onClick={onToggle}
          className="gap-2"
        >
          {isExpanded ? (
            <>
              <ChevronUp size={16} />
              Hide
            </>
          ) : (
            <>
              <ChevronDown size={16} />
              Show
            </>
          )}
        </Button>
      </div>

      {/* Form */}
      <div
        className={cn(
          "transition-all duration-300 overflow-hidden",
          isExpanded ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <Label className="form-label">Bank Name</Label>
                <Input placeholder="Bank Name" className="form-input" />
              </div>
              <div>
                <Label className="form-label">A/C Holder</Label>
                <Input placeholder="A/C Holder" className="form-input" />
              </div>
              <div>
                <Label className="form-label">A/C Number</Label>
                <Input placeholder="A/C Number" className="form-input" />
              </div>
              <div>
                <Label className="form-label">IBAN Number</Label>
                <Input placeholder="IBAN Number" className="form-input" />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <Label className="form-label">Swift Code</Label>
                <Input placeholder="Swift Code" className="form-input" />
              </div>
              <div>
                <Label className="form-label">Branch</Label>
                <Input placeholder="Branch" className="form-input" />
              </div>
              <div>
                <Label className="form-label">Tel.No</Label>
                <Input placeholder="Tel.Number" className="form-input" />
              </div>
              <div>
                <Label className="form-label">Fax No</Label>
                <Input placeholder="Fax No" className="form-input" />
              </div>
              <div className="flex justify-end pt-2">
                <Button type="submit" className="btn-success px-8">
                  Save
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
