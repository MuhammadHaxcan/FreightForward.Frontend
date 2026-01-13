import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Expense {
  id: string;
  date: string;
  paymentType: string;
  paymentMode: string;
  category: string;
  bank: string;
  description: string;
  receipt: string;
  currency: string;
  amount: number;
}

interface ExpensePrintViewProps {
  expenses: Expense[];
  startDate: string;
  endDate: string;
  onClose: () => void;
}

export function ExpensePrintView({ expenses, startDate, endDate, onClose }: ExpensePrintViewProps) {
  const handlePrint = () => {
    window.print();
  };

  // Using formatDate from utils to avoid timezone issues with DateOnly strings

  // Group expenses by payment method and type
  const cashPayments = expenses.filter(e => e.paymentMode === "CASH" && e.paymentType === "Outwards");
  const bankPayments = expenses.filter(e => e.paymentMode !== "CASH" && e.paymentType === "Outwards");
  const cashReceipts = expenses.filter(e => e.paymentMode === "CASH" && e.paymentType === "Inwards");
  const bankReceipts = expenses.filter(e => e.paymentMode !== "CASH" && e.paymentType === "Inwards");

  const totalCashPayments = cashPayments.reduce((sum, e) => sum + e.amount, 0);
  const totalBankPayments = bankPayments.reduce((sum, e) => sum + e.amount, 0);
  const totalCashReceipts = cashReceipts.reduce((sum, e) => sum + e.amount, 0);
  const totalBankReceipts = bankReceipts.reduce((sum, e) => sum + e.amount, 0);

  const allExpensesSorted = [...expenses].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="min-h-screen bg-gray-600">
      {/* Print Controls - Hidden when printing */}
      <div className="print:hidden bg-white border-b border-gray-200 p-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <Button variant="outline" onClick={onClose}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Expenses
          </Button>
          <Button onClick={handlePrint} className="bg-green-600 hover:bg-green-700 text-white">
            <Printer className="h-4 w-4 mr-2" />
            Print Report
          </Button>
        </div>
      </div>

      {/* Print Document */}
      <div className="py-4 print:py-0">
        <div className="max-w-4xl mx-auto bg-white shadow-lg print:shadow-none" style={{ transform: 'scale(0.85)', transformOrigin: 'top center' }}>
          <div className="p-8 print:p-6">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              {/* Company Logo and Name */}
              <div className="flex flex-col items-start">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-3xl font-bold">
                    <span className="text-green-600">TRANS</span>
                    <span className="text-gray-800">PA</span>
                    <span className="text-green-600">RENT</span>
                  </span>
                </div>
                <div className="text-base font-semibold text-gray-700 tracking-wider">
                  FREIGHT SERVICES
                </div>
                <div className="text-sm text-green-600 italic">
                  Your Trusted Logistics Provider
                </div>
              </div>

              {/* Company Contact Info */}
              <div className="text-right text-xs">
                <p className="font-bold text-gray-800">TRANSPARENT FREIGHT SERVICES LLC</p>
                <p className="text-blue-600">Email : info@tfs-global.com</p>
                <p className="text-gray-600">Phone : 04-2396853</p>
                <p className="text-gray-600">Address: M110, M FLOOR, SHAIKHA MHARA AL-QUSAIS BLDG., AL QUSAIS 2</p>
                <p className="text-green-600">United Arab Emirates</p>
                <p className="text-gray-600">TRN :</p>
              </div>
            </div>

            {/* Report Title */}
            <div className="text-center mb-4">
              <h1 className="text-xl font-bold text-gray-800">CASH FLOW REPORT</h1>
              <p className="text-sm text-gray-600">{formatDate(startDate)} TO {formatDate(endDate)}</p>
            </div>

            {/* Date Info */}
            <div className="border border-gray-300 mb-4">
              <table className="w-full text-sm">
                <tbody>
                  <tr>
                    <td className="p-2 text-center font-semibold text-green-700 border-r border-gray-300">CASH & BANK</td>
                    <td className="p-2 text-center border-r border-gray-300"></td>
                    <td className="p-2 text-center border-r border-gray-300">Statement Date</td>
                    <td className="p-2 text-center text-green-700">From : {formatDate(startDate)}</td>
                  </tr>
                  <tr>
                    <td className="p-2 text-center border-r border-gray-300"></td>
                    <td className="p-2 text-center border-r border-gray-300"></td>
                    <td className="p-2 text-center text-green-700 border-r border-gray-300">{formatDate(endDate)}</td>
                    <td className="p-2 text-center text-green-700">To : {formatDate(endDate)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Main Table */}
            <div className="border border-gray-300 mb-4">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-300">
                    <th className="p-2 text-left font-semibold text-green-700 border-r border-gray-300" rowSpan={2}>Date</th>
                    <th className="p-2 text-left font-semibold text-green-700 border-r border-gray-300" rowSpan={2}>Particular</th>
                    <th className="p-2 text-center font-semibold text-green-700 border-r border-gray-300" colSpan={2}>Receipts</th>
                    <th className="p-2 text-center font-semibold text-green-700" colSpan={2}>Payments</th>
                  </tr>
                  <tr className="border-b border-gray-300">
                    <th className="p-2 text-center font-semibold text-green-700 border-r border-gray-300">Cash/Cheque/Card</th>
                    <th className="p-2 text-center font-semibold text-green-700 border-r border-gray-300">Bank</th>
                    <th className="p-2 text-center font-semibold text-green-700 border-r border-gray-300">Cash/Cheque/Card</th>
                    <th className="p-2 text-center font-semibold text-green-700">Bank</th>
                  </tr>
                </thead>
                <tbody>
                  {allExpensesSorted.map((expense) => {
                    const isCash = expense.paymentMode === "CASH";
                    const isInward = expense.paymentType === "Inwards";
                    
                    return (
                      <tr key={expense.id} className="border-b border-gray-300">
                        <td className="p-2 border-r border-gray-300 text-green-700">{formatDate(expense.date)}</td>
                        <td className="p-2 border-r border-gray-300 text-green-700">
                          {expense.category} ({expense.paymentType})
                        </td>
                        <td className="p-2 text-center border-r border-gray-300">
                          {isInward && isCash ? expense.amount.toLocaleString("en-US", { minimumFractionDigits: 2 }) : ""}
                        </td>
                        <td className="p-2 text-center border-r border-gray-300">
                          {isInward && !isCash ? expense.amount.toLocaleString("en-US", { minimumFractionDigits: 2 }) : ""}
                        </td>
                        <td className="p-2 text-center border-r border-gray-300">
                          {!isInward && isCash ? expense.amount.toLocaleString("en-US", { minimumFractionDigits: 2 }) : ""}
                        </td>
                        <td className="p-2 text-center">
                          {!isInward && !isCash ? expense.amount.toLocaleString("en-US", { minimumFractionDigits: 2 }) : ""}
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="border-t-2 border-gray-400">
                    <td className="p-2 border-r border-gray-300"></td>
                    <td className="p-2 border-r border-gray-300 text-right font-semibold">Total</td>
                    <td className="p-2 text-center border-r border-gray-300 font-semibold">
                      {totalCashReceipts > 0 ? totalCashReceipts.toLocaleString("en-US", { minimumFractionDigits: 2 }) : "0.00"}
                    </td>
                    <td className="p-2 text-center border-r border-gray-300 font-semibold">
                      {totalBankReceipts > 0 ? totalBankReceipts.toLocaleString("en-US", { minimumFractionDigits: 2 }) : "0.00"}
                    </td>
                    <td className="p-2 text-center border-r border-gray-300 font-semibold">
                      {totalCashPayments > 0 ? totalCashPayments.toLocaleString("en-US", { minimumFractionDigits: 2 }) : "0.00"}
                    </td>
                    <td className="p-2 text-center font-semibold">
                      {totalBankPayments > 0 ? totalBankPayments.toLocaleString("en-US", { minimumFractionDigits: 2 }) : "0.00"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Summary Table */}
            <div className="border border-gray-300">
              <table className="w-full text-xs">
                <tbody>
                  <tr className="border-b border-gray-300">
                    <td className="p-2 border-r border-gray-300 w-1/3"></td>
                    <td className="p-2 border-r border-gray-300 text-center font-semibold text-green-700 w-1/3">CASH & BANK</td>
                    <td className="p-2 w-1/3">
                      <div className="flex justify-between">
                        <span className="text-green-700">CASH:</span>
                        <span className="text-green-700 font-semibold">
                          {(totalCashPayments + totalCashReceipts).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2 border-r border-gray-300"></td>
                    <td className="p-2 border-r border-gray-300"></td>
                    <td className="p-2">
                      <div className="flex justify-between">
                        <span className="text-green-700">BANK:</span>
                        <span className="text-green-700 font-semibold">
                          {(totalBankPayments + totalBankReceipts).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
