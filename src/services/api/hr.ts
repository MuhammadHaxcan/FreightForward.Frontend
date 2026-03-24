import { fetchApi, PaginatedList } from './base';

// ==================== Types ====================

// Employee
export interface EmployeeListItem {
  id: number; userId: number; employeeCode: string; fullName: string;
  email?: string; contactNumber?: string; department?: string; designation?: string;
  joiningDate: string; employmentStatus: string;
  annualLeaveDays: number; sickLeaveDays: number; paidLeaveDays: number;
  createdAt: string;
}
export interface EmployeeDetail {
  id: number; userId: number; employeeCode: string; fullName: string;
  email?: string; contactNumber?: string; department?: string; designation?: string;
  joiningDate: string; confirmationDate?: string; resignationDate?: string; lastWorkingDate?: string;
  employmentStatus: string; bankName?: string; bankAccountNumber?: string; bankIban?: string; bankBranch?: string;
  dateOfBirth?: string; gender?: string; nationalId?: string; passportNumber?: string; passportExpiry?: string;
  emergencyContactName?: string; emergencyContactNumber?: string; address?: string;
  profilePictureUrl?: string;
  annualLeaveDays: number; sickLeaveDays: number; paidLeaveDays: number;
  createdAt: string;
}
export interface EmployeeDropdown { id: number; employeeCode: string; fullName: string; }
export interface CreateEmployeeRequest {
  userId: number; employeeCode: string; department?: string; designation?: string;
  joiningDate: string; confirmationDate?: string; employmentStatus: string;
  bankName?: string; bankAccountNumber?: string; bankIban?: string; bankBranch?: string;
  dateOfBirth?: string; gender?: string; nationalId?: string;
  passportNumber?: string; passportExpiry?: string;
  emergencyContactName?: string; emergencyContactNumber?: string; address?: string;
  annualLeaveDays?: number; sickLeaveDays?: number; paidLeaveDays?: number;
}
export interface UpdateEmployeeRequest extends Omit<CreateEmployeeRequest, 'userId'> {
  resignationDate?: string; lastWorkingDate?: string;
}

// Salary Component
export interface SalaryComponent {
  id: number; name: string; code?: string; componentType: string; isActive: boolean; createdAt: string;
}
export interface CreateSalaryComponentRequest { name: string; code?: string; componentType: string; isActive: boolean; }
export interface UpdateSalaryComponentRequest extends CreateSalaryComponentRequest {}

// Salary Structure
export interface SalaryStructureItem {
  id: number; salaryComponentId: number; componentName: string; componentType: string;
  amount: number; effectiveFrom: string; effectiveTo?: string;
}
export interface SetSalaryStructureRequest {
  lines: { salaryComponentId: number; amount: number; }[];
  effectiveFrom: string;
}

// Payroll
export interface PayrollListItem {
  id: number; employeeId: number; employeeCode: string; employeeName: string;
  year: number; month: number; totalEarnings: number; totalDeductions: number;
  advanceDeduction: number; netSalary: number; status: string; paidDate?: string;
}
export interface Payslip {
  payrollId: number; employeeCode: string; employeeName: string;
  department?: string; designation?: string;
  year: number; month: number;
  earnings: { componentName: string; amount: number; }[];
  deductions: { componentName: string; amount: number; }[];
  totalEarnings: number; totalDeductions: number; advanceDeduction: number;
  netSalary: number; status: string; paidDate?: string; remarks?: string;
}
export interface UpdatePayrollRequest {
  totalEarnings: number; totalDeductions: number; advanceDeduction: number; netSalary: number; remarks?: string;
}
export interface MarkPaidRequest {
  paymentMode: string;
  bankId?: number;
  expenseDate: string;
  chequeNumber?: string;
  chequeDate?: string;
  postDatedValidDate?: string;
}

// Advance
export interface Advance {
  id: number; employeeId: number; employeeCode: string; employeeName: string;
  amount: number; repaidAmount: number; balanceAmount: number; monthlyDeduction: number;
  issueDate: string; reason?: string; status: string; createdAt: string;
}
export interface CreateAdvanceRequest {
  employeeId: number; amount: number; monthlyDeduction: number; issueDate: string; reason?: string;
}
// Attendance
export interface AttendanceRecord {
  id: number; employeeId: number; employeeCode: string; employeeName: string;
  date: string; checkIn?: string; checkOut?: string; status: string;
  workHours?: number; remarks?: string;
}
export interface CreateAttendanceRequest {
  employeeId: number; date: string; checkIn?: string; checkOut?: string; status: string; remarks?: string;
}
export interface UpdateAttendanceRequest {
  checkIn?: string; checkOut?: string; status: string; remarks?: string;
}
export interface AttendanceSummary {
  employeeId: number; employeeCode: string; employeeName: string;
  year: number; month: number;
  presentDays: number; absentDays: number; lateDays: number; halfDays: number;
  sickLeaveDays: number; paidLeaveDays: number; annualLeaveDays: number;
  holidays: number; totalWorkingDays: number;
  latesToAbsentConversions: number; effectiveAbsentDays: number;
}
export interface DailyAttendanceEmployee {
  employeeId: number; employeeCode: string; employeeName: string;
  attendanceId?: number; status: string; remarks?: string;
  joiningDate: string; lastWorkingDate?: string;
}
export interface BulkAttendanceEntry { employeeId: number; status: string; remarks?: string; }
export interface BulkAttendanceRequest { date: string; entries: BulkAttendanceEntry[]; }
export interface AttendancePolicy { id: number; latesPerAbsent: number; }
export interface UpdateAttendancePolicyRequest { latesPerAbsent: number; }
export interface EmployeeMonthlyAttendance { joiningDate: string; lastWorkingDate?: string; records: AttendanceRecord[]; }

// ==================== API ====================

const buildQuery = (params: Record<string, unknown>) => {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') q.append(k, String(v)); });
  return q.toString();
};

export const hrEmployeeApi = {
  getAll: (p?: { pageNumber?: number; pageSize?: number; searchTerm?: string; status?: string }) =>
    fetchApi<PaginatedList<EmployeeListItem>>(`/hr/employees?${buildQuery(p || {})}`),
  getDropdown: () => fetchApi<EmployeeDropdown[]>('/hr/employees/dropdown'),
  getById: (id: number) => fetchApi<EmployeeDetail>(`/hr/employees/${id}`),
  getNextCode: () => fetchApi<string>('/hr/employees/next-code'),
  create: (data: CreateEmployeeRequest) => fetchApi<number>('/hr/employees', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: UpdateEmployeeRequest) => fetchApi<void>(`/hr/employees/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => fetchApi<void>(`/hr/employees/${id}`, { method: 'DELETE' }),
};

export const hrSalaryApi = {
  getComponents: (p?: { pageNumber?: number; pageSize?: number; searchTerm?: string }) =>
    fetchApi<PaginatedList<SalaryComponent>>(`/hr/salary/components?${buildQuery(p || {})}`),
  getActiveComponents: () => fetchApi<SalaryComponent[]>('/hr/salary/components/active'),
  getComponent: (id: number) => fetchApi<SalaryComponent>(`/hr/salary/components/${id}`),
  createComponent: (data: CreateSalaryComponentRequest) => fetchApi<number>('/hr/salary/components', { method: 'POST', body: JSON.stringify(data) }),
  updateComponent: (id: number, data: UpdateSalaryComponentRequest) => fetchApi<void>(`/hr/salary/components/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteComponent: (id: number) => fetchApi<void>(`/hr/salary/components/${id}`, { method: 'DELETE' }),
  getStructure: (employeeId: number) => fetchApi<SalaryStructureItem[]>(`/hr/salary/employees/${employeeId}/structure`),
  setStructure: (employeeId: number, data: SetSalaryStructureRequest) =>
    fetchApi<void>(`/hr/salary/employees/${employeeId}/structure`, { method: 'POST', body: JSON.stringify(data) }),
};

export const hrPayrollApi = {
  getAll: (p?: { pageNumber?: number; pageSize?: number; year?: number; monthFrom?: number; monthTo?: number; employeeId?: number }) =>
    fetchApi<PaginatedList<PayrollListItem>>(`/hr/payroll?${buildQuery(p || {})}`),
  getPayslip: (id: number) => fetchApi<Payslip>(`/hr/payroll/${id}/payslip`),
  generate: (employeeId: number, data: { year: number; month: number }) =>
    fetchApi<number>(`/hr/payroll/generate?employeeId=${employeeId}`, { method: 'POST', body: JSON.stringify(data) }),
  generateBulk: (data: { year: number; month: number }) =>
    fetchApi<number>('/hr/payroll/generate-bulk', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: UpdatePayrollRequest) =>
    fetchApi<void>(`/hr/payroll/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => fetchApi<void>(`/hr/payroll/${id}`, { method: 'DELETE' }),
  markPaid: (id: number, data: MarkPaidRequest) => fetchApi<void>(`/hr/payroll/${id}/mark-paid`, { method: 'POST', body: JSON.stringify(data) }),
  cancel: (id: number) => fetchApi<void>(`/hr/payroll/${id}/cancel`, { method: 'POST' }),
};

export const hrAdvanceApi = {
  getAll: (p?: { pageNumber?: number; pageSize?: number; employeeId?: number }) =>
    fetchApi<PaginatedList<Advance>>(`/hr/advances?${buildQuery(p || {})}`),
  getByEmployee: (employeeId: number) => fetchApi<Advance[]>(`/hr/advances/employee/${employeeId}`),
  getById: (id: number) => fetchApi<Advance>(`/hr/advances/${id}`),
  create: (data: CreateAdvanceRequest) => fetchApi<number>('/hr/advances', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id: number) => fetchApi<void>(`/hr/advances/${id}`, { method: 'DELETE' }),
};

export const hrAttendanceApi = {
  getAll: (p?: { pageNumber?: number; pageSize?: number; date?: string; employeeId?: number }) =>
    fetchApi<PaginatedList<AttendanceRecord>>(`/hr/attendance?${buildQuery(p || {})}`),
  getById: (id: number) => fetchApi<AttendanceRecord>(`/hr/attendance/${id}`),
  create: (data: CreateAttendanceRequest) => fetchApi<number>('/hr/attendance', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: UpdateAttendanceRequest) => fetchApi<void>(`/hr/attendance/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  getDaily: (date: string) => fetchApi<DailyAttendanceEmployee[]>(`/hr/attendance/daily?date=${date}`),
  saveBulk: (data: BulkAttendanceRequest) => fetchApi<void>('/hr/attendance/bulk', { method: 'POST', body: JSON.stringify(data) }),
  getSummary: (year: number, month: number) => fetchApi<AttendanceSummary[]>(`/hr/attendance/summary?year=${year}&month=${month}`),
  getEmployeeMonthly: (employeeId: number, year: number, month: number) => fetchApi<EmployeeMonthlyAttendance>(`/hr/attendance/employee-monthly?employeeId=${employeeId}&year=${year}&month=${month}`),
};

export const hrAttendancePolicyApi = {
  get: () => fetchApi<AttendancePolicy>('/hr/attendance-policy'),
  update: (data: UpdateAttendancePolicyRequest) =>
    fetchApi<AttendancePolicy>('/hr/attendance-policy', { method: 'PUT', body: JSON.stringify(data) }),
};
