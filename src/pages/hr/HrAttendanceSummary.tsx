import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Printer } from "lucide-react";
import { hrAttendanceApi, hrEmployeeApi, hrAttendancePolicyApi } from "@/services/api/hr";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const monthOptions = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

const statusColors: Record<string, string> = {
  Present: "bg-green-500",
  Absent: "bg-red-500",
  Late: "bg-yellow-500",
  HalfDay: "bg-orange-500",
  SickLeave: "bg-teal-500",
  PaidLeave: "bg-blue-500",
  AnnualLeave: "bg-cyan-500",
  Holiday: "bg-purple-500",
};

const statusLabels: Record<string, string> = {
  Present: "Present",
  Absent: "Absent",
  Late: "Late",
  HalfDay: "Half Day",
  SickLeave: "Sick Leave",
  PaidLeave: "Paid Leave",
  AnnualLeave: "Annual Leave",
  Holiday: "Holiday",
};

const statusOptions = Object.entries(statusLabels)
  .filter(([value]) => value !== "SickLeave" && value !== "PaidLeave")
  .map(([value, label]) => ({ value, label }));

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface UnlockModalState {
  open: boolean;
  dateStr: string;
  dayLabel: string;
  recordId?: number;
  employeeId: number;
}

const HrAttendanceSummary = () => {
  const currentDate = new Date();
  const todayStr = currentDate.toISOString().split("T")[0];

  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState((currentDate.getMonth() + 1).toString());
  const [selectedEmployee, setSelectedEmployee] = useState("");

  // Unlock modal state
  const [unlockModal, setUnlockModal] = useState<UnlockModalState>({
    open: false,
    dateStr: "",
    dayLabel: "",
    employeeId: 0,
  });
  const [unlockStatus, setUnlockStatus] = useState("Present");
  const [unlockReason, setUnlockReason] = useState("");

  const queryClient = useQueryClient();

  const { data: hrPolicy } = useQuery({
    queryKey: ["hr-attendance-policy"],
    queryFn: async () => {
      const result = await hrAttendancePolicyApi.get();
      if (result.error) throw new Error(result.error);
      return result.data;
    },
  });
  const weeklyOffDays = hrPolicy?.weeklyOffDays ?? [];

  const yearOptions = Array.from({ length: 5 }, (_, i) => {
    const y = currentDate.getFullYear() - 2 + i;
    return { value: y.toString(), label: y.toString() };
  });

  const isEmployeeView = selectedEmployee !== "";

  // Fetch employee dropdown
  const { data: empDropdown } = useQuery({
    queryKey: ["hr-employees-dropdown"],
    queryFn: async () => {
      const result = await hrEmployeeApi.getDropdown();
      if (result.error) throw new Error(result.error);
      return result.data;
    },
  });
  const employees = empDropdown || [];

  // Fetch all-employees summary
  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ["hr-attendance-summary", selectedYear, selectedMonth],
    queryFn: async () => {
      const result = await hrAttendanceApi.getSummary(parseInt(selectedYear), parseInt(selectedMonth));
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    enabled: !isEmployeeView,
  });

  // Fetch single-employee monthly detail
  const { data: employeeMonthlyData, isLoading: employeeLoading } = useQuery({
    queryKey: ["hr-attendance-employee-monthly", selectedEmployee, selectedYear, selectedMonth],
    queryFn: async () => {
      const result = await hrAttendanceApi.getEmployeeMonthly(
        parseInt(selectedEmployee),
        parseInt(selectedYear),
        parseInt(selectedMonth)
      );
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    enabled: isEmployeeView,
  });

  // Unlock mutation
  const unlockMutation = useMutation({
    mutationFn: async () => {
      const { recordId, employeeId, dateStr } = unlockModal;
      if (recordId) {
        const result = await hrAttendanceApi.update(recordId, {
          status: unlockStatus,
          remarks: unlockReason,
        });
        if (result.error) throw new Error(result.error);
      } else {
        const result = await hrAttendanceApi.create({
          employeeId,
          date: dateStr,
          status: unlockStatus,
          remarks: unlockReason,
        });
        if (result.error) throw new Error(result.error);
      }
    },
    onSuccess: () => {
      toast.success("Attendance updated successfully");
      queryClient.invalidateQueries({
        queryKey: ["hr-attendance-employee-monthly", selectedEmployee, selectedYear, selectedMonth],
      });
      setUnlockModal({ open: false, dateStr: "", dayLabel: "", employeeId: 0 });
      setUnlockReason("");
      setUnlockStatus("Present");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update attendance");
    },
  });

  const summaryItems = summaryData || [];
  const employeeRecords = employeeMonthlyData?.records || [];
  const empJoiningDate = employeeMonthlyData?.joiningDate || "";
  const empLastWorkingDate = employeeMonthlyData?.lastWorkingDate;
  const isLoading = isEmployeeView ? employeeLoading : summaryLoading;

  // Build day-by-day data for employee view
  const year = parseInt(selectedYear);
  const month = parseInt(selectedMonth);
  const daysInMonth = new Date(year, month, 0).getDate();

  const dayRows = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const d = new Date(dateStr + "T00:00:00");
    const dayName = dayNames[d.getDay()];
    const record = employeeRecords.find((r) => {
      const rd = new Date(r.date + "T00:00:00");
      return rd.getDate() === day;
    });
    return { day, dateStr, dayName, record };
  });

  // Totals for employee view
  const empTotals = {
    present: employeeRecords.filter((r) => r.status === "Present").length,
    absent: employeeRecords.filter((r) => r.status === "Absent").length,
    late: employeeRecords.filter((r) => r.status === "Late").length,
    halfDay: employeeRecords.filter((r) => r.status === "HalfDay").length,
    annualLeave: employeeRecords.filter((r) => r.status === "AnnualLeave").length,
    holiday: employeeRecords.filter((r) => r.status === "Holiday").length,
  };

  const handlePrint = () => {
    const params = new URLSearchParams({ year: selectedYear, month: selectedMonth });
    if (selectedEmployee) params.append("employeeId", selectedEmployee);
    window.open(`/hr/attendance/print?${params.toString()}`, "_blank");
  };

  const getStatusBadge = (status: string) => {
    const label = statusLabels[status] || status;
    return (
      <span
        className={`px-2 py-0.5 rounded text-xs font-medium text-white ${statusColors[status] || "bg-gray-400"}`}
      >
        {label}
      </span>
    );
  };

  const openUnlockModal = (dateStr: string, dayLabel: string, recordId?: number) => {
    setUnlockStatus(recordId ? (employeeRecords.find((r) => r.id === recordId)?.status || "Present") : "Present");
    setUnlockReason("");
    setUnlockModal({
      open: true,
      dateStr,
      dayLabel,
      recordId,
      employeeId: parseInt(selectedEmployee),
    });
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-foreground">Attendance Summary</h1>
          <Button variant="outline" className="gap-2" onClick={handlePrint}>
            <Printer size={16} />
            Print
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-muted/30 border rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-green-600 mb-1 block">Year</label>
              <SearchableSelect options={yearOptions} value={selectedYear} onValueChange={setSelectedYear} />
            </div>
            <div>
              <label className="text-sm font-medium text-green-600 mb-1 block">Month</label>
              <SearchableSelect options={monthOptions} value={selectedMonth} onValueChange={setSelectedMonth} />
            </div>
            <div>
              <label className="text-sm font-medium text-green-600 mb-1 block">Employee</label>
              <SearchableSelect
                options={[
                  { value: "", label: "All Employees" },
                  ...employees.map((e) => ({
                    value: e.id.toString(),
                    label: `${e.employeeCode} - ${e.fullName}`,
                  })),
                ]}
                value={selectedEmployee}
                onValueChange={setSelectedEmployee}
                placeholder="All Employees"
                searchPlaceholder="Search employees..."
              />
            </div>
          </div>
        </div>

        {/* All Employees Summary View */}
        {!isEmployeeView && (
          <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-table-header text-table-header-foreground">
                    <th className="px-4 py-3 text-left text-sm font-semibold">Employee</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Code</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Working Days</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Present</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Absent</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Late</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Half Day</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Annual Leave</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Holiday</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Eff. Absent</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">Loading...</td>
                    </tr>
                  ) : summaryItems.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">No records found</td>
                    </tr>
                  ) : (
                    summaryItems.map((item, index) => (
                      <tr
                        key={item.employeeId}
                        className={`border-b border-border hover:bg-table-row-hover transition-colors cursor-pointer ${
                          index % 2 === 0 ? "bg-card" : "bg-secondary/30"
                        }`}
                        onClick={() => setSelectedEmployee(item.employeeId.toString())}
                      >
                        <td className="px-4 py-3 text-sm font-medium">{item.employeeName}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{item.employeeCode}</td>
                        <td className="px-4 py-3 text-sm text-right font-medium">{item.totalWorkingDays}</td>
                        <td className="px-4 py-3 text-sm text-right">
                          <span className="text-green-600 font-medium">{item.presentDays}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          <span className={item.absentDays > 0 ? "text-red-500 font-medium" : ""}>{item.absentDays}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          <span className={item.lateDays > 0 ? "text-yellow-600 font-medium" : ""}>{item.lateDays}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          <span className={item.halfDays > 0 ? "text-orange-500 font-medium" : ""}>{item.halfDays}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          <span className={item.annualLeaveDays > 0 ? "text-cyan-500 font-medium" : ""}>{item.annualLeaveDays}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          <span className="text-purple-500">{item.holidays}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          <span className={item.effectiveAbsentDays > 0 ? "text-red-600 font-bold" : ""}>{item.effectiveAbsentDays}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Employee Detail View */}
        {isEmployeeView && (
          <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-table-header text-table-header-foreground">
                    <th className="px-4 py-3 text-left text-sm font-semibold w-[80px]">Day</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold w-[120px]">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold w-[60px]">Day</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold w-[140px]">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Remarks</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold w-[100px]">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Loading...</td>
                    </tr>
                  ) : (
                    dayRows.map(({ day, dateStr, dayName, record }, index) => {
                      const d = new Date(dateStr + "T00:00:00");
                      const isOffDay = weeklyOffDays.includes(d.getDay());
                      const isBeforeJoining = empJoiningDate && dateStr < empJoiningDate.split("T")[0];
                      const isAfterLastWorking = empLastWorkingDate && dateStr > empLastWorkingDate.split("T")[0];
                      const isNA = isBeforeJoining || isAfterLastWorking;
                      const isPast = dateStr < todayStr;
                      const showUnlock = isPast && !isNA && !isOffDay;
                      const effectiveStatus = record?.status ?? (isOffDay && !isNA ? "Holiday" : null);
                      return (
                        <tr
                          key={day}
                          className={`border-b border-border ${
                            isNA ? "bg-gray-100 dark:bg-gray-800/30" : isOffDay ? "bg-red-50 dark:bg-red-950/20" : index % 2 === 0 ? "bg-card" : "bg-secondary/30"
                          }`}
                        >
                          <td className="px-4 py-2 text-sm font-medium">{day}</td>
                          <td className="px-4 py-2 text-sm text-muted-foreground">
                            {new Date(dateStr + "T00:00:00").toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                          <td className={`px-4 py-2 text-sm font-medium ${isOffDay ? "text-red-500" : ""}`}>
                            {dayName}
                          </td>
                          <td className="px-4 py-2 text-sm">
                            {isNA ? (
                              <span className="px-2 py-0.5 rounded text-xs font-medium text-white bg-gray-400">N/A</span>
                            ) : effectiveStatus ? getStatusBadge(effectiveStatus) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-sm text-muted-foreground">
                            {record?.remarks || ""}
                          </td>
                          <td className="px-4 py-2">
                            {showUnlock && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs px-2"
                                onClick={() => openUnlockModal(dateStr, `${dayName} ${day}`, record?.id)}
                              >
                                Unlock
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {employeeRecords.length > 0 && (
                  <tfoot>
                    <tr className="bg-muted/50 font-semibold">
                      <td className="px-4 py-3 text-sm" colSpan={3}>Total ({daysInMonth} days)</td>
                      <td className="px-4 py-3 text-sm" colSpan={3}>
                        <div className="flex flex-wrap gap-3 text-xs">
                          <span className="text-green-600">Present: {empTotals.present}</span>
                          <span className="text-red-500">Absent: {empTotals.absent}</span>
                          <span className="text-yellow-600">Late: {empTotals.late}</span>
                          <span className="text-orange-500">Half Day: {empTotals.halfDay}</span>
                          <span className="text-cyan-500">Annual Leave: {empTotals.annualLeave}</span>
                          <span className="text-purple-500">Holiday: {empTotals.holiday}</span>
                        </div>
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Unlock Attendance Modal */}
      <Dialog
        open={unlockModal.open}
        onOpenChange={(open) => {
          if (!open) {
            setUnlockModal({ open: false, dateStr: "", dayLabel: "", employeeId: 0 });
            setUnlockReason("");
            setUnlockStatus("Present");
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Unlock Attendance</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Updating attendance for <span className="font-medium text-foreground">{unlockModal.dayLabel}</span>
            </p>
            <div className="space-y-1.5">
              <Label>Attendance Status</Label>
              <Select value={unlockStatus} onValueChange={setUnlockStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Reason</Label>
              <Textarea
                placeholder="Enter reason for updating this attendance..."
                value={unlockReason}
                onChange={(e) => setUnlockReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setUnlockModal({ open: false, dateStr: "", dayLabel: "", employeeId: 0 });
                setUnlockReason("");
                setUnlockStatus("Present");
              }}
              disabled={unlockMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => unlockMutation.mutate()}
              disabled={unlockMutation.isPending || !unlockReason.trim()}
            >
              {unlockMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default HrAttendanceSummary;
