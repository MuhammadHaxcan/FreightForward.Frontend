import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { hrPayrollApi, Payslip } from "@/services/api/hr";

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const HrPayslip = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const payrollId = parseInt(id || "0");

  const { data: payslip, isLoading } = useQuery({
    queryKey: ["hr-payslip", payrollId],
    queryFn: async () => {
      const result = await hrPayrollApi.getPayslip(payrollId);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    enabled: payrollId > 0,
  });

  const formatAmount = (amount: number) =>
    amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handlePrint = () => {
    window.open(`/hr/payslip/${payrollId}/print`, '_blank');
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      Draft: "bg-yellow-500",
      Processed: "bg-blue-500",
      Paid: "bg-green-500",
      Cancelled: "bg-red-500",
    };
    return (
      <span className={`px-3 py-1 rounded text-sm font-medium text-white ${colors[status] || "bg-gray-500"}`}>
        {status}
      </span>
    );
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="p-6 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    );
  }

  if (!payslip) {
    return (
      <MainLayout>
        <div className="p-6">
          <p className="text-muted-foreground">Payslip not found.</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/hr/payroll")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Payroll
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6 space-y-4">
        {/* Header (hidden in print) */}
        <div className="flex items-center justify-between print:hidden">
          <Button variant="outline" size="sm" onClick={() => navigate("/hr/payroll")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Payroll
          </Button>
          <Button className="btn-success gap-2" onClick={handlePrint}>
            <Printer size={16} />
            Print
          </Button>
        </div>

        {/* Payslip Content */}
        <div className="bg-card border rounded-lg p-8 max-w-3xl mx-auto print:border-none print:shadow-none print:p-0">
          {/* Company Header */}
          <div className="text-center border-b pb-4 mb-6">
            <h1 className="text-2xl font-bold">PAYSLIP</h1>
            <p className="text-muted-foreground mt-1">
              {months[payslip.month - 1]} {payslip.year}
            </p>
          </div>

          {/* Employee Info */}
          <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
            <div>
              <p><span className="font-medium text-muted-foreground">Employee Name:</span> {payslip.employeeName}</p>
              <p><span className="font-medium text-muted-foreground">Employee Code:</span> {payslip.employeeCode}</p>
              <p><span className="font-medium text-muted-foreground">Department:</span> {payslip.departmentName || "-"}</p>
            </div>
            <div>
              <p><span className="font-medium text-muted-foreground">Designation:</span> {payslip.designationTitle || "-"}</p>
              <p><span className="font-medium text-muted-foreground">Status:</span> {getStatusBadge(payslip.status)}</p>
              {payslip.paidDate && (
                <p><span className="font-medium text-muted-foreground">Paid Date:</span> {formatDate(payslip.paidDate)}</p>
              )}
            </div>
          </div>

          {/* Earnings and Deductions side by side */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            {/* Earnings */}
            <div>
              <h3 className="text-sm font-semibold mb-2 text-green-600">EARNINGS</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-1 font-medium">Component</th>
                    <th className="text-right py-1 font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {payslip.earnings.map((e, i) => (
                    <tr key={i} className="border-b border-border/50">
                      <td className="py-1">{e.componentName}</td>
                      <td className="py-1 text-right">{formatAmount(e.amount)}</td>
                    </tr>
                  ))}
                  <tr className="font-semibold">
                    <td className="py-2">Total Earnings</td>
                    <td className="py-2 text-right">{formatAmount(payslip.totalEarnings)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Deductions */}
            <div>
              <h3 className="text-sm font-semibold mb-2 text-red-600">DEDUCTIONS</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-1 font-medium">Component</th>
                    <th className="text-right py-1 font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {payslip.deductions.map((d, i) => (
                    <tr key={i} className="border-b border-border/50">
                      <td className="py-1">{d.componentName}</td>
                      <td className="py-1 text-right">{formatAmount(d.amount)}</td>
                    </tr>
                  ))}
                  {payslip.advanceDeduction > 0 && (
                    <tr className="border-b border-border/50">
                      <td className="py-1">Advance Deduction</td>
                      <td className="py-1 text-right">{formatAmount(payslip.advanceDeduction)}</td>
                    </tr>
                  )}
                  <tr className="font-semibold">
                    <td className="py-2">Total Deductions</td>
                    <td className="py-2 text-right">{formatAmount(payslip.totalDeductions + payslip.advanceDeduction)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Net Salary */}
          <div className="border-t-2 border-primary pt-4">
            <div className="flex items-center justify-between text-lg font-bold">
              <span>NET SALARY</span>
              <span className="text-primary">{formatAmount(payslip.netSalary)}</span>
            </div>
          </div>

          {/* Remarks */}
          {payslip.remarks && (
            <div className="mt-4 text-sm text-muted-foreground">
              <span className="font-medium">Remarks:</span> {payslip.remarks}
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 pt-4 border-t text-center text-xs text-muted-foreground">
            This is a computer-generated payslip and does not require a signature.
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default HrPayslip;
