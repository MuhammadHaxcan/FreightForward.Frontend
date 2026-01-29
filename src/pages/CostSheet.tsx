import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DateInput } from "@/components/ui/date-input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, Printer, Loader2 } from "lucide-react";
import { costSheetApi, CostSheetSummaryDto } from "@/services/api";

// Helper to get first day of current year
const getFirstDayOfYear = () => {
  const now = new Date();
  return `${now.getFullYear()}-01-01`;
};

// Helper to get today's date
const getTodayDate = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

// Format mode for display
const formatMode = (mode?: string) => {
  switch (mode) {
    case "SeaFreightFCL": return "Sea Freight FCL";
    case "SeaFreightLCL": return "Sea Freight LCL";
    case "AirFreight": return "Air Freight";
    case "BreakBulk": return "Break Bulk";
    case "RoRo": return "RoRo";
    default: return mode || "";
  }
};

export const CostSheet = () => {
  const navigate = useNavigate();
  const [fromDate, setFromDate] = useState(getFirstDayOfYear());
  const [toDate, setToDate] = useState(getTodayDate());

  // Fetch cost sheet data
  const { data: costSheetResponse, isLoading } = useQuery({
    queryKey: ["cost-sheet", fromDate, toDate],
    queryFn: () => costSheetApi.getList(fromDate, toDate),
    enabled: !!fromDate && !!toDate,
  });

  const costSheetData = costSheetResponse?.data || [];

  // Handle print PDF - opens in new tab
  const handlePrint = () => {
    window.open(`/accounts/cost-sheet/print?fromDate=${fromDate}&toDate=${toDate}`, '_blank');
  };

  // Handle view detail
  const handleView = (shipmentId: number) => {
    navigate(`/accounts/cost-sheet/${shipmentId}`);
  };

  // Calculate totals
  const totalSale = costSheetData.reduce((sum, item) => sum + item.totalSaleLCY, 0);
  const totalCost = costSheetData.reduce((sum, item) => sum + item.totalCostLCY, 0);
  const totalGP = costSheetData.reduce((sum, item) => sum + item.gp, 0);

  return (
    <MainLayout>
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Cost Sheet</h1>

        {/* Filters */}
        <div className="bg-muted/30 border rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <Label className="text-xs font-medium">From Date</Label>
              <DateInput
                value={fromDate}
                onChange={setFromDate}
                className="h-9"
              />
            </div>
            <div>
              <Label className="text-xs font-medium">To Date</Label>
              <DateInput
                value={toDate}
                onChange={setToDate}
                className="h-9"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handlePrint}
                disabled={isLoading || costSheetData.length === 0}
                className="btn-success"
              >
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
            </div>
          </div>
        </div>

        {/* Results info */}
        <div className="flex justify-between items-center text-sm text-muted-foreground">
          <span>
            Showing {costSheetData.length} shipments
          </span>
          <span>Amount in AED</span>
        </div>

        {/* Table */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-table-header">
                <TableHead className="text-table-header-foreground">Date</TableHead>
                <TableHead className="text-table-header-foreground">Job No</TableHead>
                <TableHead className="text-table-header-foreground">Job Status</TableHead>
                <TableHead className="text-table-header-foreground">Direction</TableHead>
                <TableHead className="text-table-header-foreground">Mode</TableHead>
                <TableHead className="text-table-header-foreground">Sales Person</TableHead>
                <TableHead className="text-table-header-foreground text-right">Sale Cost</TableHead>
                <TableHead className="text-table-header-foreground text-right">Purchase Cost</TableHead>
                <TableHead className="text-table-header-foreground text-right">GP</TableHead>
                <TableHead className="text-table-header-foreground w-16">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : costSheetData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    No data found for the selected date range
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {costSheetData.map((item, index) => (
                    <TableRow key={item.shipmentId} className={index % 2 === 0 ? "bg-card" : "bg-secondary/30"}>
                      <TableCell className="text-xs">{item.jobDate}</TableCell>
                      <TableCell className="text-xs font-medium">{item.jobNumber}</TableCell>
                      <TableCell className="text-xs">{item.jobStatus}</TableCell>
                      <TableCell className="text-xs">{item.direction}</TableCell>
                      <TableCell className="text-xs">{formatMode(item.mode)}</TableCell>
                      <TableCell className="text-xs">{item.salesPerson || "-"}</TableCell>
                      <TableCell className="text-xs text-right">
                        {item.totalSaleLCY > 0 ? `AED ${item.totalSaleLCY.toFixed(2)}` : ""}
                      </TableCell>
                      <TableCell className="text-xs text-right">
                        {item.totalCostLCY > 0 ? `AED ${item.totalCostLCY.toFixed(2)}` : ""}
                      </TableCell>
                      <TableCell className={`text-xs text-right font-medium ${item.gp >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                        AED {item.gp.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleView(item.shipmentId)}
                          className="h-7 w-7 p-0"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Totals Row */}
                  <TableRow className="bg-muted/50 font-semibold">
                    <TableCell colSpan={6} className="text-right text-xs">Totals:</TableCell>
                    <TableCell className="text-xs text-right">AED {totalSale.toFixed(2)}</TableCell>
                    <TableCell className="text-xs text-right">AED {totalCost.toFixed(2)}</TableCell>
                    <TableCell className={`text-xs text-right ${totalGP >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      AED {totalGP.toFixed(2)}
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </MainLayout>
  );
};

export default CostSheet;
