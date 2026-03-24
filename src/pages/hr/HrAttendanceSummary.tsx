import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Printer } from "lucide-react";
import { hrAttendanceApi, hrEmployeeApi } from "@/services/api/hr";

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

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const HrAttendanceSummary = () => {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState((currentDate.getMonth() + 1).toString());
  const [selectedEmployee, setSelectedEmployee] = useState("");

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
    sickLeave: employeeRecords.filter((r) => r.status === "SickLeave").length,
    paidLeave: employeeRecords.filter((r) => r.status === "PaidLeave").length,
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
                    <th className="px-4 py-3 text-right text-sm font-semibold">Sick Leave</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Paid Leave</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Annual Leave</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Holiday</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Eff. Absent</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={12} className="px-4 py-8 text-center text-muted-foreground">Loading...</td>
                    </tr>
                  ) : summaryItems.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="px-4 py-8 text-center text-muted-foreground">No records found</td>
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
                          <span className={item.sickLeaveDays > 0 ? "text-teal-500 font-medium" : ""}>{item.sickLeaveDays}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          <span className={item.paidLeaveDays > 0 ? "text-blue-500 font-medium" : ""}>{item.paidLeaveDays}</span>
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
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Loading...</td>
                    </tr>
                  ) : (
                    dayRows.map(({ day, dateStr, dayName, record }, index) => {
                      const isSunday = dayName === "Sun";
                      const isBeforeJoining = empJoiningDate && dateStr < empJoiningDate.split("T")[0];
                      const isAfterLastWorking = empLastWorkingDate && dateStr > empLastWorkingDate.split("T")[0];
                      const isNA = isBeforeJoining || isAfterLastWorking;
                      return (
                        <tr
                          key={day}
                          className={`border-b border-border ${
                            isNA ? "bg-gray-100 dark:bg-gray-800/30" : isSunday ? "bg-red-50 dark:bg-red-950/20" : index % 2 === 0 ? "bg-card" : "bg-secondary/30"
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
                          <td className={`px-4 py-2 text-sm font-medium ${isSunday ? "text-red-500" : ""}`}>
                            {dayName}
                          </td>
                          <td className="px-4 py-2 text-sm">
                            {isNA ? (
                              <span className="px-2 py-0.5 rounded text-xs font-medium text-white bg-gray-400">N/A</span>
                            ) : record ? getStatusBadge(record.status) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-sm text-muted-foreground">
                            {record?.remarks || ""}
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
                      <td className="px-4 py-3 text-sm" colSpan={2}>
                        <div className="flex flex-wrap gap-3 text-xs">
                          <span className="text-green-600">Present: {empTotals.present}</span>
                          <span className="text-red-500">Absent: {empTotals.absent}</span>
                          <span className="text-yellow-600">Late: {empTotals.late}</span>
                          <span className="text-orange-500">Half Day: {empTotals.halfDay}</span>
                          <span className="text-teal-500">Sick Leave: {empTotals.sickLeave}</span>
                          <span className="text-blue-500">Paid Leave: {empTotals.paidLeave}</span>
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
    </MainLayout>
  );
};

export default HrAttendanceSummary;
