import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Printer, Loader2 } from "lucide-react";
import { costSheetApi } from "@/services/api";

export const CostSheetDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const shipmentId = parseInt(id || "0", 10);

  // Fetch cost sheet detail
  const { data: response, isLoading } = useQuery({
    queryKey: ["cost-sheet-detail", shipmentId],
    queryFn: () => costSheetApi.getDetail(shipmentId),
    enabled: shipmentId > 0,
  });

  const detail = response?.data;

  // Handle print PDF - opens in new tab
  const handlePrint = () => {
    window.open(`/accounts/cost-sheet/${shipmentId}/print`, '_blank');
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="p-6 flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </MainLayout>
    );
  }

  if (!detail) {
    return (
      <MainLayout>
        <div className="p-6 text-center py-20 text-muted-foreground">
          Shipment not found
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={() => navigate("/accounts/cost-sheet")}
            className="h-9"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to List
          </Button>
          <Button
            onClick={handlePrint}
            className="bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>

        {/* Title */}
        <div className="bg-emerald-600 text-white p-4 rounded-lg text-center">
          <h1 className="text-xl font-bold">COST SHEET - {detail.jobNumber}</h1>
        </div>

        {/* Costings Table */}
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-emerald-600">
                <TableHead className="text-white text-xs">SN</TableHead>
                <TableHead className="text-white text-xs">Description</TableHead>
                <TableHead className="text-white text-xs">Sale<br/>Quantity</TableHead>
                <TableHead className="text-white text-xs">Sale Unit</TableHead>
                <TableHead className="text-white text-xs">Curr</TableHead>
                <TableHead className="text-white text-xs">Ex.Rate</TableHead>
                <TableHead className="text-white text-xs">FCY Amount</TableHead>
                <TableHead className="text-white text-xs">LCY Amount</TableHead>
                <TableHead className="text-white text-xs">Cost<br/>Quantity</TableHead>
                <TableHead className="text-white text-xs">Cost/Unit</TableHead>
                <TableHead className="text-white text-xs">Curr</TableHead>
                <TableHead className="text-white text-xs">Ex.Rate</TableHead>
                <TableHead className="text-white text-xs">FCY Amount</TableHead>
                <TableHead className="text-white text-xs">LCY Amount</TableHead>
                <TableHead className="text-white text-xs">Unit</TableHead>
                <TableHead className="text-white text-xs text-right">GP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detail.costings.map((costing, index) => (
                <TableRow key={costing.id} className={index % 2 === 0 ? "bg-card" : "bg-secondary/30"}>
                  <TableCell className="text-xs">{costing.serialNo}</TableCell>
                  <TableCell className="text-xs">{costing.description}</TableCell>
                  <TableCell className="text-xs">{costing.saleQty.toFixed(3)}</TableCell>
                  <TableCell className="text-xs">{costing.saleUnit.toFixed(2)}</TableCell>
                  <TableCell className="text-xs">{costing.saleCurrency}</TableCell>
                  <TableCell className="text-xs">{costing.saleExRate.toFixed(3)}</TableCell>
                  <TableCell className="text-xs">{costing.saleFCY.toFixed(2)}</TableCell>
                  <TableCell className="text-xs">{costing.saleLCY.toFixed(2)}</TableCell>
                  <TableCell className="text-xs">{costing.costQty.toFixed(3)}</TableCell>
                  <TableCell className="text-xs">{costing.costUnit.toFixed(2)}</TableCell>
                  <TableCell className="text-xs">{costing.costCurrency}</TableCell>
                  <TableCell className="text-xs">{costing.costExRate.toFixed(3)}</TableCell>
                  <TableCell className="text-xs">{costing.costFCY.toFixed(2)}</TableCell>
                  <TableCell className="text-xs">{costing.costLCY.toFixed(2)}</TableCell>
                  <TableCell className="text-xs">{costing.unitName}</TableCell>
                  <TableCell className={`text-xs text-right font-medium ${costing.gp >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {costing.gp.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Bill To and Vendor Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Bill To Section */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted">
                  <TableHead className="text-xs font-semibold">Bill To</TableHead>
                  <TableHead className="text-xs font-semibold">P.Sale</TableHead>
                  <TableHead className="text-xs font-semibold">Voucher Number</TableHead>
                  <TableHead className="text-xs font-semibold">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detail.billToItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-xs text-muted-foreground py-4">
                      No invoices
                    </TableCell>
                  </TableRow>
                ) : (
                  detail.billToItems.map((billTo, index) => (
                    <TableRow key={index}>
                      <TableCell className="text-xs">{billTo.customerName}</TableCell>
                      <TableCell className="text-xs text-emerald-600">AED {billTo.pSale.toFixed(2)}</TableCell>
                      <TableCell className="text-xs">
                        {billTo.invoices.map(inv => inv.invoiceNo).join(", ")}
                      </TableCell>
                      <TableCell className="text-xs">{billTo.invoices[0]?.status}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Vendor Section */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted">
                  <TableHead className="text-xs font-semibold">Vendor</TableHead>
                  <TableHead className="text-xs font-semibold">P.Cost</TableHead>
                  <TableHead className="text-xs font-semibold">Voucher Number</TableHead>
                  <TableHead className="text-xs font-semibold">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detail.vendorItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-xs text-muted-foreground py-4">
                      No purchase invoices
                    </TableCell>
                  </TableRow>
                ) : (
                  detail.vendorItems.map((vendor, index) => (
                    <TableRow key={index}>
                      <TableCell className="text-xs">{vendor.vendorName}</TableCell>
                      <TableCell className="text-xs text-red-600">AED {vendor.pCost.toFixed(2)}</TableCell>
                      <TableCell className="text-xs">
                        {vendor.purchaseInvoices.map(pi => pi.purchaseNo).join(", ")}
                      </TableCell>
                      <TableCell className="text-xs">{vendor.purchaseInvoices[0]?.status}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Totals Section */}
        <div className="flex justify-center">
          <div className="grid grid-cols-3 gap-0 border rounded-lg overflow-hidden">
            <div className="border-r p-4 text-center min-w-[180px]">
              <div className="text-sm font-semibold">Total Sale</div>
              <div className="text-emerald-600 font-semibold">[ AED {detail.totalSaleLCY.toFixed(2)}]</div>
            </div>
            <div className="border-r p-4 text-center min-w-[180px]">
              <div className="text-sm font-semibold">Total Cost</div>
              <div className="text-red-600 font-semibold">[ AED {detail.totalCostLCY.toFixed(2)}]</div>
            </div>
            <div className="p-4 text-center min-w-[180px]">
              <div className="text-sm font-semibold">Profit</div>
              <div className={`font-semibold ${detail.profit >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                AED {detail.profit.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default CostSheetDetail;
