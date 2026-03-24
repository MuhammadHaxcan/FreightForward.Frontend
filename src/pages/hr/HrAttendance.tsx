import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Save, Loader2, ChevronLeft, ChevronRight, Calendar, Lock, LockOpen } from "lucide-react";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { useAuth } from "@/contexts/AuthContext";
import { getTodayDateOnly } from "@/lib/utils";
import {
  hrAttendanceApi,
  DailyAttendanceEmployee,
  BulkAttendanceEntry,
} from "@/services/api/hr";

const statusOptions = [
  { value: "Present", label: "Present" },
  { value: "Absent", label: "Absent" },
  { value: "Late", label: "Late" },
  { value: "HalfDay", label: "Half Day" },
  { value: "SickLeave", label: "Sick Leave" },
  { value: "PaidLeave", label: "Paid Leave" },
  { value: "AnnualLeave", label: "Annual Leave" },
  { value: "Holiday", label: "Holiday" },
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

interface LocalEntry {
  employeeId: number;
  employeeCode: string;
  employeeName: string;
  attendanceId?: number;
  status: string;
  remarks: string;
}

const HrAttendance = () => {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const canUnlock = hasPermission("hr_attend_unlock");
  const [selectedDate, setSelectedDate] = useState(getTodayDateOnly());
  const [entries, setEntries] = useState<LocalEntry[]>([]);
  const [isUnlocked, setIsUnlocked] = useState(false);

  // Fetch daily attendance for selected date
  const { data: dailyData, isLoading } = useQuery({
    queryKey: ["hr-attendance-daily", selectedDate],
    queryFn: async () => {
      const result = await hrAttendanceApi.getDaily(selectedDate);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    enabled: !!selectedDate,
  });

  // Initialize local state from fetched data
  useEffect(() => {
    if (dailyData) {
      setEntries(
        dailyData.map((emp: DailyAttendanceEmployee) => ({
          employeeId: emp.employeeId,
          employeeCode: emp.employeeCode,
          employeeName: emp.employeeName,
          attendanceId: emp.attendanceId,
          status: emp.status || "Present",
          remarks: emp.remarks || "",
        }))
      );
    }
  }, [dailyData]);

  // Save bulk mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const bulkEntries: BulkAttendanceEntry[] = entries.map((e) => ({
        employeeId: e.employeeId,
        status: e.status,
        remarks: e.remarks || undefined,
      }));
      const result = await hrAttendanceApi.saveBulk({
        date: selectedDate,
        entries: bulkEntries,
      });
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      toast.success("Attendance saved successfully");
      queryClient.invalidateQueries({ queryKey: ["hr-attendance-daily", selectedDate] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to save attendance");
    },
  });

  const handleStatusChange = (employeeId: number, newStatus: string) => {
    setEntries((prev) =>
      prev.map((e) =>
        e.employeeId === employeeId ? { ...e, status: newStatus } : e
      )
    );
  };

  const handleRemarksChange = (employeeId: number, newRemarks: string) => {
    setEntries((prev) =>
      prev.map((e) =>
        e.employeeId === employeeId ? { ...e, remarks: newRemarks } : e
      )
    );
  };

  const navigateDay = (offset: number) => {
    const d = new Date(selectedDate + "T00:00:00");
    d.setDate(d.getDate() + offset);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    setSelectedDate(`${year}-${month}-${day}`);
  };

  const goToToday = () => setSelectedDate(getTodayDateOnly());

  const isPastDate = selectedDate < getTodayDateOnly();
  const isLocked = isPastDate && !isUnlocked;

  // Reset unlock state when date changes
  useEffect(() => {
    setIsUnlocked(false);
  }, [selectedDate]);

  const handleMarkAll = (status: string) => {
    setEntries((prev) => prev.map((e) => ({ ...e, status })));
  };

  const handleSave = () => {
    if (entries.length === 0) {
      toast.error("No entries to save");
      return;
    }
    saveMutation.mutate();
  };

  const getStatusBadge = (status: string) => {
    const label = statusOptions.find((o) => o.value === status)?.label || status;
    return (
      <span
        className={`px-3 py-1 rounded text-sm font-medium text-white ${statusColors[status] || "bg-gray-500"}`}
      >
        {label}
      </span>
    );
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-foreground">
            Bulk Attendance
          </h1>
          <PermissionGate permission="hr_attend_add">
            <Button
              className="btn-success gap-2"
              onClick={handleSave}
              disabled={saveMutation.isPending || entries.length === 0 || isLocked}
            >
              {saveMutation.isPending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              {saveMutation.isPending ? "Saving..." : "Save Attendance"}
            </Button>
          </PermissionGate>
        </div>

        {/* Date Picker & Controls */}
        <div className="bg-muted/30 border rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-green-600 mb-1 block">
                Date
              </label>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" className="px-2" onClick={() => navigateDay(-1)} title="Previous Day">
                  <ChevronLeft size={16} />
                </Button>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="flex-1"
                />
                <Button variant="outline" size="sm" className="px-2" onClick={() => navigateDay(1)} title="Next Day">
                  <ChevronRight size={16} />
                </Button>
                <Button variant="outline" size="sm" className="px-2" onClick={goToToday} title="Today">
                  <Calendar size={16} />
                </Button>
                {isPastDate && canUnlock && (
                  <Button
                    variant={isUnlocked ? "default" : "outline"}
                    size="sm"
                    className={`px-3 ${isUnlocked ? "bg-amber-600 hover:bg-amber-700" : ""}`}
                    onClick={() => setIsUnlocked(!isUnlocked)}
                    title={isUnlocked ? "Lock attendance" : "Unlock for editing"}
                  >
                    {isUnlocked ? <LockOpen size={16} /> : <Lock size={16} />}
                    <span className="ml-1">{isUnlocked ? "Lock" : "Unlock"}</span>
                  </Button>
                )}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-green-600 mb-1 block">
                Mark All
              </label>
              <SearchableSelect
                options={statusOptions}
                value=""
                onValueChange={(v) => { if (v) handleMarkAll(v); }}
                placeholder="Set all to..."
                disabled={isLocked}
              />
            </div>
            <div className="flex items-end">
              <p className="text-sm text-muted-foreground">
                {entries.length} employee{entries.length !== 1 ? "s" : ""} found
              </p>
            </div>
            {isPastDate && (
              <div className="flex items-end">
                <p className={`text-sm font-medium ${isLocked ? "text-red-600" : "text-amber-600"}`}>
                  {isLocked ? (
                    <span className="flex items-center gap-1">
                      <Lock size={14} /> Attendance is locked for this date
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <LockOpen size={14} /> Attendance unlocked for editing
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-table-header text-table-header-foreground">
                  <th className="px-4 py-3 text-left text-sm font-semibold w-[140px]">
                    Employee Code
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Employee Name
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold w-[200px]">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Remarks
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-8 text-center text-muted-foreground"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 size={18} className="animate-spin" />
                        Loading attendance data...
                      </div>
                    </td>
                  </tr>
                ) : entries.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-8 text-center text-muted-foreground"
                    >
                      No employees found for the selected date
                    </td>
                  </tr>
                ) : (
                  entries.map((entry, index) => (
                    <tr
                      key={entry.employeeId}
                      className={`border-b border-border hover:bg-table-row-hover transition-colors ${
                        index % 2 === 0 ? "bg-card" : "bg-secondary/30"
                      }`}
                    >
                      <td className="px-4 py-3 text-sm font-medium">
                        <div className="flex items-center gap-1.5">
                          {entry.employeeCode}
                          {entry.attendanceId && (
                            <span className="w-2 h-2 rounded-full bg-green-500" title="Saved" />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {entry.employeeName}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {getStatusBadge(entry.status)}
                          <SearchableSelect
                            options={statusOptions}
                            value={entry.status}
                            onValueChange={(v) =>
                              handleStatusChange(entry.employeeId, v)
                            }
                            triggerClassName="w-[140px] h-8"
                            disabled={isLocked}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Input
                          type="text"
                          value={entry.remarks}
                          onChange={(e) =>
                            handleRemarksChange(
                              entry.employeeId,
                              e.target.value
                            )
                          }
                          placeholder="Optional remarks..."
                          className="h-8"
                          disabled={isLocked}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default HrAttendance;
