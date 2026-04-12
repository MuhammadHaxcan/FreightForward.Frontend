import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { ArrowLeft, Loader2, Play, AlertTriangle, Info } from "lucide-react";
import { hrPayrollApi, hrEmployeeApi } from "@/services/api/hr";

const monthNames = [
  "", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const months = monthNames.slice(1).map((name, i) => ({
  value: (i + 1).toString(),
  label: name,
}));

const HrPayrollGenerate = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentDate = new Date();

  const [employeeId, setEmployeeId] = useState("");
  const [year, setYear] = useState(currentDate.getFullYear().toString());
  const [month, setMonth] = useState((currentDate.getMonth() + 1).toString());
  const [annualLeavesToConsume, setAnnualLeavesToConsume] = useState("0");

  const canFetchInfo = !!employeeId && !!year && !!month;

  // Employee dropdown
  const { data: empDropdown } = useQuery({
    queryKey: ["hr-employees-dropdown"],
    queryFn: async () => {
      const result = await hrEmployeeApi.getDropdown();
      if (result.error) throw new Error(result.error);
      return result.data;
    },
  });
  const employees = empDropdown || [];

  // Pre-generate info
  const { data: preGenInfo, isLoading: infoLoading, isFetching: infoFetching } = useQuery({
    queryKey: ["hr-payroll-pregenerate", employeeId, year, month],
    queryFn: async () => {
      const result = await hrPayrollApi.getPreGenerateInfo(parseInt(employeeId), parseInt(year), parseInt(month));
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    enabled: canFetchInfo,
  });

  // Check if payroll already exists for this employee/period
  const { data: existingPayrollData, isLoading: existingPayrollLoading } = useQuery({
    queryKey: ["hr-payroll-exists", employeeId, year, month],
    queryFn: async () => {
      const result = await hrPayrollApi.getAll({
        employeeId: parseInt(employeeId),
        year: parseInt(year),
        monthFrom: parseInt(month),
        monthTo: parseInt(month),
        pageSize: 1,
      });
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    enabled: canFetchInfo,
  });

  const existingPayroll = existingPayrollData?.items?.[0] ?? null;
  const isPayrollPaid = existingPayroll?.status === "Paid";
  const isPayrollDraft = existingPayroll?.status === "Draft";
  const isPayrollBlocked = isPayrollPaid || isPayrollDraft;

  // Year options
  const yearOptions = Array.from({ length: 10 }, (_, i) => {
    const y = currentDate.getFullYear() - 5 + i;
    return { value: y.toString(), label: y.toString() };
  });

  // R5: Capture employeeId at mutate() call time so onSuccess invalidates the correct employee
  // even if user switched employees while mutation was in-flight
  const generateMutation = useMutation({
    mutationFn: async (empId: number) => {
      const result = await hrPayrollApi.generate(empId, {
        year: parseInt(year),
        month: parseInt(month),
        annualLeavesToConsume: parseInt(annualLeavesToConsume) || 0,
      });
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: (_data, empId) => {
      toast.success("Payroll generated successfully");
      queryClient.invalidateQueries({ queryKey: ["hr-payroll"] });
      queryClient.invalidateQueries({ queryKey: ["hr-payroll-pregenerate"] });
      queryClient.invalidateQueries({ queryKey: ["hr-payroll-exists"] });
      queryClient.invalidateQueries({ queryKey: ["hr-payroll-emp", empId] });
      navigate("/hr/payroll");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to generate payroll");
    },
  });

  // Guard against future periods
  const selectedPeriodYear = parseInt(year);
  const selectedPeriodMonth = parseInt(month);
  const isFuturePeriod =
    selectedPeriodYear > currentDate.getFullYear() ||
    (selectedPeriodYear === currentDate.getFullYear() && selectedPeriodMonth > currentDate.getMonth() + 1);

  const maxLeavesToConsume = preGenInfo
    ? Math.max(0, Math.min(preGenInfo.availableAnnualLeaves, preGenInfo.totalAbsentsThisMonth))
    : 0;

  // C4/C5: Invalidate stale payroll pregenerate/exists queries when employee changes
  const prevEmployeeIdRef = useRef<string>("");
  useEffect(() => {
    if (prevEmployeeIdRef.current && prevEmployeeIdRef.current !== employeeId) {
      queryClient.invalidateQueries({ queryKey: ["hr-payroll-pregenerate", prevEmployeeIdRef.current] });
      queryClient.invalidateQueries({ queryKey: ["hr-payroll-exists", prevEmployeeIdRef.current] });
    }
    prevEmployeeIdRef.current = employeeId;
  }, [employeeId, queryClient]);

  const isGenerateDisabled =
    generateMutation.isPending ||
    !employeeId ||
    infoLoading ||
    infoFetching ||
    !preGenInfo ||
    existingPayrollLoading ||
    isPayrollBlocked ||
    isFuturePeriod;

  return (
    <MainLayout>
      <div className="p-6 space-y-6 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => navigate("/hr/payroll")}
          >
            <ArrowLeft size={16} />
            Back
          </Button>
          <h1 className="text-2xl font-semibold text-foreground">Generate Payroll</h1>
        </div>

        {/* Form Card */}
        <div className="bg-card rounded-lg border border-border shadow-sm p-6 space-y-6">
          {/* Employee + Period selectors */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-3">
              <Label className="text-sm mb-1 block">Employee</Label>
              <SearchableSelect
                options={employees.map((e) => ({
                  value: e.id.toString(),
                  label: `${e.employeeCode} - ${e.fullName}`,
                }))}
                value={employeeId}
                onValueChange={(v) => {
                  setEmployeeId(v);
                  setAnnualLeavesToConsume("0");
                }}
                placeholder="Select an employee..."
                searchPlaceholder="Search employees..."
              />
            </div>
            <div>
              <Label className="text-sm mb-1 block">Year</Label>
              <SearchableSelect
                options={yearOptions}
                value={year}
                onValueChange={(v) => {
                  setYear(v);
                  setAnnualLeavesToConsume("0");
                }}
              />
            </div>
            <div className="md:col-span-2">
              <Label className="text-sm mb-1 block">Month</Label>
              <SearchableSelect
                options={months}
                value={month}
                onValueChange={(v) => {
                  setMonth(v);
                  setAnnualLeavesToConsume("0");
                }}
              />
            </div>
          </div>

          {/* Pre-generate info */}
          {canFetchInfo && (
            <div className="border-t border-border pt-5">
              {infoLoading || infoFetching ? (
                <div className="flex items-center justify-center py-6 text-muted-foreground gap-2">
                  <Loader2 size={18} className="animate-spin" />
                  Loading payroll info...
                </div>
              ) : preGenInfo ? (
                <div className="space-y-4">
                  {/* U7: No absent deduction message */}
                  {preGenInfo.totalAbsentsThisMonth === 0 && (
                    <div className="flex gap-2 items-start rounded-lg border border-blue-300 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800 p-3 text-sm">
                      <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-medium text-blue-800 dark:text-blue-300">No Absent Deduction</p>
                        <p className="text-blue-700 dark:text-blue-400 text-xs mt-0.5">
                          No absences this month — no absent deduction will be applied.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Lates breakdown */}
                  {preGenInfo.currentMonthLates === 0 && preGenInfo.previousCarryForwardLates > 0 ? (
                    <div className="bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-sm">
                      <p className="font-medium text-gray-700 dark:text-gray-300">Late Carry Forward Discarded</p>
                      <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">
                        No lates this month — carry forward of <span className="font-semibold text-gray-700 dark:text-gray-300">{preGenInfo.previousCarryForwardLates} late(s)</span> from previous month will be reset to 0.
                      </p>
                    </div>
                  ) : (preGenInfo.currentMonthLates > 0 || preGenInfo.previousCarryForwardLates > 0) ? (
                    <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded-lg p-3 text-sm space-y-1">
                      <p className="font-medium text-yellow-800 dark:text-yellow-400">Late Attendance</p>
                      <div className="text-yellow-700 dark:text-yellow-500 space-y-0.5 text-xs">
                        <p>This month: <span className="font-semibold">{preGenInfo.currentMonthLates}</span> late(s)</p>
                        {preGenInfo.previousCarryForwardLates > 0 && (
                          <p>Carried forward: <span className="font-semibold">{preGenInfo.previousCarryForwardLates}</span> late(s)</p>
                        )}
                        <p className="border-t border-yellow-200 dark:border-yellow-800 pt-1 mt-1">
                          Total: <span className="font-semibold">{preGenInfo.currentMonthLates + preGenInfo.previousCarryForwardLates}</span> →{" "}
                          <span className="font-semibold text-red-600">{preGenInfo.latesDaysConverted} absent day(s)</span>
                          {preGenInfo.carryForwardLatesAfter > 0 && (
                            <span className="text-muted-foreground"> + {preGenInfo.carryForwardLatesAfter} carry to next month</span>
                          )}
                        </p>
                      </div>
                    </div>
                  ) : null}

                  {/* Absents + leaves summary */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg text-center">
                      <p className="text-3xl font-bold text-red-600">{preGenInfo.totalAbsentsThisMonth}</p>
                      <p className="text-xs text-red-500 mt-1">Effective Absents</p>
                      {preGenInfo.latesDaysConverted > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {preGenInfo.rawAbsentDays} actual + {preGenInfo.latesDaysConverted} from lates
                        </p>
                      )}
                    </div>
                    <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg text-center">
                      <p className="text-3xl font-bold text-green-600">
                        {preGenInfo.availableAnnualLeaves - (parseInt(annualLeavesToConsume) || 0)}
                      </p>
                      <p className="text-xs text-green-500 mt-1">Remaining Annual Leaves</p>
                      <div className="mt-2 flex justify-center gap-3 text-xs text-muted-foreground">
                        <span>Total: <span className="font-medium text-foreground">{preGenInfo.totalAnnualLeaves}</span></span>
                        <span>Used: <span className="font-medium text-orange-500">{preGenInfo.consumedAnnualLeaves + (parseInt(annualLeavesToConsume) || 0)}</span></span>
                      </div>
                    </div>
                  </div>

                  {/* Annual leaves to consume */}
                  <div className="space-y-1.5">
                    <Label className="text-sm">
                      Annual Leaves to Consume
                      <span className="text-muted-foreground font-normal ml-1">(max {maxLeavesToConsume})</span>
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      max={maxLeavesToConsume}
                      value={annualLeavesToConsume}
                      onChange={(e) => {
                        const val = Math.min(Math.max(0, parseInt(e.target.value) || 0), maxLeavesToConsume);
                        setAnnualLeavesToConsume(val.toString());
                      }}
                      placeholder="0"
                      className="max-w-[160px]"
                    />
                    {preGenInfo.totalAbsentsThisMonth > 0 ? (
                      <p className="text-xs text-muted-foreground">
                        Uncovered absents:{" "}
                        <span className="font-medium text-red-500">
                          {Math.max(0, preGenInfo.totalAbsentsThisMonth - (parseInt(annualLeavesToConsume) || 0))} day(s)
                        </span>{" "}
                        will be deducted from salary.
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">No absents this month — no absent deduction will apply.</p>
                    )}
                  </div>
                </div>
              ) : null}

              {/* Future period warning */}
              {isFuturePeriod && (
                <div className="flex gap-2 items-start rounded-lg border border-red-300 bg-red-50 dark:bg-red-950/20 dark:border-red-800 p-3 text-sm mb-4">
                  <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-red-800 dark:text-red-300">Future Period</p>
                    <p className="text-red-700 dark:text-red-400 text-xs mt-0.5">
                      Cannot generate payroll for a future period ({monthNames[selectedPeriodMonth]} {selectedPeriodYear}).
                    </p>
                  </div>
                </div>
              )}

              {/* Existing payroll conflict alerts */}
              {!existingPayrollLoading && isPayrollPaid && (
                <div className="flex gap-2 items-start rounded-lg border border-blue-300 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800 p-3 text-sm mt-4">
                  <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-blue-800 dark:text-blue-300">Payroll Already Paid</p>
                    <p className="text-blue-700 dark:text-blue-400 text-xs mt-0.5">
                      Payroll for this employee and period has already been generated and marked as paid. It cannot be regenerated.
                    </p>
                  </div>
                </div>
              )}
              {!existingPayrollLoading && isPayrollDraft && (
                <div className="flex gap-2 items-start rounded-lg border border-yellow-300 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-800 p-3 text-sm mt-4">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-yellow-800 dark:text-yellow-300">Draft Payroll Exists</p>
                    <p className="text-yellow-700 dark:text-yellow-400 text-xs mt-0.5">
                      A draft payroll already exists for this employee and period. Please delete it from the Payroll list before regenerating.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Generate button */}
          <div className="border-t border-border pt-4 flex justify-end">
            <Button
              className="btn-success gap-2 px-6"
              onClick={() => generateMutation.mutate(parseInt(employeeId))}
              disabled={isGenerateDisabled}
            >
              {generateMutation.isPending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Play size={16} />
              )}
              {generateMutation.isPending ? "Generating..." : "Generate"}
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default HrPayrollGenerate;
