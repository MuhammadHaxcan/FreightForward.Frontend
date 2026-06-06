import { useState, useEffect } from "react";
import { toast } from "sonner";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Loader2 } from "lucide-react";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { MutationBlockingOverlay } from "@/components/ui/mutation-blocking-overlay";
import { useHrAttendancePolicy, useUpdateHrAttendancePolicy } from "@/hooks/useHrAttendance";

const HrAttendancePolicy = () => {
  const [latesPerAbsent, setLatesPerAbsent] = useState("3");

  const { data: policy, isLoading } = useHrAttendancePolicy();
  const saveMutation = useUpdateHrAttendancePolicy();

  useEffect(() => {
    if (policy) {
      setLatesPerAbsent(policy.latesPerAbsent.toString());
    }
  }, [policy]);

  const handleSave = () => {
    const value = parseInt(latesPerAbsent);
    if (!value || value < 1) {
      toast.error("Lates per absent must be at least 1");
      return;
    }
    saveMutation.mutate({
      latesPerAbsent: value,
      weeklyOffDays: policy?.weeklyOffDays ?? [],
    });
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-semibold text-foreground">Attendance Policy</h1>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="bg-card rounded-lg border border-border shadow-sm p-6 max-w-md space-y-4 relative">
            <MutationBlockingOverlay isPending={saveMutation.isPending} variant="page" message="Saving..." />
            <div className="space-y-2">
              <Label className="text-sm font-medium">Lates per Absent</Label>
              <Input
                type="number"
                min={1}
                value={latesPerAbsent}
                onChange={(e) => setLatesPerAbsent(e.target.value)}
                disabled={saveMutation.isPending}
              />
              <p className="text-xs text-muted-foreground">
                Number of "Late" marks that count as 1 "Absent" in the attendance summary.
              </p>
            </div>

            <PermissionGate permission="hr_attend_policy">
              <div className="flex justify-end pt-4 border-t border-border">
                <Button
                  className="btn-success gap-2"
                  onClick={handleSave}
                  disabled={saveMutation.isPending}
                >
                  {saveMutation.isPending ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  {saveMutation.isPending ? "Saving..." : "Save"}
                </Button>
              </div>
            </PermissionGate>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default HrAttendancePolicy;
