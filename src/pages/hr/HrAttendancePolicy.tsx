import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Loader2 } from "lucide-react";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { hrAttendancePolicyApi } from "@/services/api/hr";

const HrAttendancePolicy = () => {
  const queryClient = useQueryClient();
  const [latesPerAbsent, setLatesPerAbsent] = useState("3");

  const { data: policy, isLoading } = useQuery({
    queryKey: ["hr-attendance-policy"],
    queryFn: async () => {
      const result = await hrAttendancePolicyApi.get();
      if (result.error) throw new Error(result.error);
      return result.data;
    },
  });

  useEffect(() => {
    if (policy) {
      setLatesPerAbsent(policy.latesPerAbsent.toString());
    }
  }, [policy]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const result = await hrAttendancePolicyApi.update({
        latesPerAbsent: parseInt(latesPerAbsent) || 3,
        weeklyOffDays: policy?.weeklyOffDays ?? [],
      });
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      toast.success("Attendance policy updated successfully");
      queryClient.invalidateQueries({ queryKey: ["hr-attendance-policy"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update policy");
    },
  });

  const handleSave = () => {
    const value = parseInt(latesPerAbsent);
    if (!value || value < 1) {
      toast.error("Lates per absent must be at least 1");
      return;
    }
    saveMutation.mutate();
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
          <div className="bg-card rounded-lg border border-border shadow-sm p-6 max-w-md space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Lates per Absent</Label>
              <Input
                type="number"
                min={1}
                value={latesPerAbsent}
                onChange={(e) => setLatesPerAbsent(e.target.value)}
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
