import { Link, useParams, useNavigate } from "react-router-dom";
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
import { useBaseCurrency } from "@/hooks/useBaseCurrency";

const formatAmount = (currencyCode: string, value: number | undefined) =>
  `${currencyCode} ${(value ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const isOutstanding = (value: number | undefined) => (value ?? 0) > 0.005;

const paymentRowClass = (unpaidAmount: number | undefined) =>
  isOutstanding(unpaidAmount)
    ? "border-l-4 border-yellow-300 bg-yellow-50/70 hover:bg-yellow-50"
    : "border-l-4 border-emerald-300 bg-emerald-50/60 hover:bg-emerald-50";

const billingRowClass = (saleUnbilled: number | undefined, costUnbilled: number | undefined) =>
  isOutstanding(saleUnbilled) || isOutstanding(costUnbilled)
    ? "bg-yellow-50/50 hover:bg-yellow-50"
    : "bg-emerald-50/40 hover:bg-emerald-50";

const paymentBadgeClass = (unpaidAmount: number | undefined) =>
  isOutstanding(unpaidAmount)
    ? "inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-[11px] font-semibold text-yellow-800"
    : "inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800";

const voucherLinkClass = "font-medium text-primary underline-offset-2 hover:underline";

export const CostSheetDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const baseCurrencyCode = useBaseCurrency();
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

  const currencyCode = detail.baseCurrencyCode || baseCurrencyCode;

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
            className="btn-success"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>

        {/* Title */}
        <div className="bg-emerald-700 text-white p-4 rounded-lg text-center shadow-sm">
          <h1 className="text-xl font-bold">COST SHEET - {detail.jobNumber}</h1>
        </div>

        {/* Costings Table */}
        <div className="border rounded-lg overflow-x-auto shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-emerald-700 hover:bg-emerald-700">
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
                <TableRow key={costing.id} className={index % 2 === 0 ? "bg-white hover:bg-slate-50" : "bg-slate-50/70 hover:bg-slate-100/70"}>
                  <TableCell className="text-xs">{costing.serialNo}</TableCell>
                  <TableCell className="text-xs">{costing.description}</TableCell>
                  <TableCell className="text-xs">{costing.saleQty.toFixed(3)}</TableCell>
                  <TableCell className="text-xs">{costing.saleUnit.toFixed(2)}</TableCell>
                  <TableCell className="text-xs">{costing.saleCurrencyCode}</TableCell>
                  <TableCell className="text-xs">{costing.saleExRate.toFixed(3)}</TableCell>
                  <TableCell className="text-xs">{costing.saleFCY.toFixed(2)}</TableCell>
                  <TableCell className="text-xs">{costing.saleLCY.toFixed(2)}</TableCell>
                  <TableCell className="text-xs">{costing.costQty.toFixed(3)}</TableCell>
                  <TableCell className="text-xs">{costing.costUnit.toFixed(2)}</TableCell>
                  <TableCell className="text-xs">{costing.costCurrencyCode}</TableCell>
                  <TableCell className="text-xs">{costing.costExRate.toFixed(3)}</TableCell>
                  <TableCell className="text-xs">{costing.costFCY.toFixed(2)}</TableCell>
                  <TableCell className="text-xs">{costing.costLCY.toFixed(2)}</TableCell>
                  <TableCell className="text-xs">{costing.unitName}</TableCell>
                  <TableCell className={`text-xs text-right font-semibold ${costing.gp >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                    {costing.gp.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Profitability Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="border border-emerald-100 rounded-lg p-4 bg-emerald-50/60 shadow-sm">
            <div className="text-xs font-medium text-muted-foreground">Expected Sale</div>
            <div className="text-lg font-semibold text-emerald-700">{formatAmount(currencyCode, detail.totalSaleLCY)}</div>
          </div>
          <div className="border border-red-100 rounded-lg p-4 bg-red-50/50 shadow-sm">
            <div className="text-xs font-medium text-muted-foreground">Expected Cost</div>
            <div className="text-lg font-semibold text-red-700">{formatAmount(currencyCode, detail.totalCostLCY)}</div>
          </div>
          <div className={`border rounded-lg p-4 shadow-sm ${detail.profit >= 0 ? "border-emerald-100 bg-emerald-50/50" : "border-red-100 bg-red-50/50"}`}>
            <div className="text-xs font-medium text-muted-foreground">Gross Profit</div>
            <div className={`text-lg font-semibold ${detail.profit >= 0 ? "text-emerald-700" : "text-red-700"}`}>
              {formatAmount(currencyCode, detail.profit)}
            </div>
          </div>
          <div className={`border rounded-lg p-4 shadow-sm ${detail.marginPercent >= 0 ? "border-slate-200 bg-slate-50" : "border-red-100 bg-red-50/50"}`}>
            <div className="text-xs font-medium text-muted-foreground">Margin</div>
            <div className={`text-lg font-semibold ${detail.marginPercent >= 0 ? "text-slate-700" : "text-red-700"}`}>
              {detail.marginPercent.toFixed(2)}%
            </div>
          </div>
        </div>

        {/* Billing Breakdown */}
        <div className="border border-emerald-100 rounded-lg overflow-hidden shadow-sm">
          <div className="bg-emerald-600 px-4 py-3 border-b border-emerald-600">
            <h2 className="text-sm font-semibold text-white">Billing Breakdown</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 border-b">
            <div className="p-4 border-r border-emerald-100 bg-emerald-50/60">
              <div className="text-xs font-medium text-muted-foreground">Billed Sale</div>
              <div className="font-semibold text-emerald-700">{formatAmount(currencyCode, detail.totalBilledSaleLCY)}</div>
            </div>
            <div className="p-4 border-r border-yellow-100 bg-yellow-50/50">
              <div className="text-xs font-medium text-muted-foreground">Unbilled Sale</div>
              <div className="font-semibold text-yellow-800">{formatAmount(currencyCode, detail.totalUnbilledSaleLCY)}</div>
            </div>
            <div className="p-4 border-r border-red-100 bg-red-50/50">
              <div className="text-xs font-medium text-muted-foreground">Billed Cost</div>
              <div className="font-semibold text-red-700">{formatAmount(currencyCode, detail.totalBilledCostLCY)}</div>
            </div>
            <div className="p-4 bg-yellow-50/50">
              <div className="text-xs font-medium text-muted-foreground">Unbilled Cost</div>
              <div className="font-semibold text-yellow-800">{formatAmount(currencyCode, detail.totalUnbilledCostLCY)}</div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-100 hover:bg-slate-100">
                  <TableHead className="text-xs text-slate-700">SN</TableHead>
                  <TableHead className="text-xs text-slate-700">Description</TableHead>
                  <TableHead className="text-xs text-right text-slate-700">Expected Sale</TableHead>
                  <TableHead className="text-xs text-right text-emerald-700">Billed Sale</TableHead>
                  <TableHead className="text-xs text-right text-yellow-800">Unbilled Sale</TableHead>
                  <TableHead className="text-xs text-right text-slate-700">Expected Cost</TableHead>
                  <TableHead className="text-xs text-right text-red-700">Billed Cost</TableHead>
                  <TableHead className="text-xs text-right text-yellow-800">Unbilled Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detail.costings.map((costing) => (
                  <TableRow key={`breakdown-${costing.id}`} className={billingRowClass(costing.unbilledSaleLCY, costing.unbilledCostLCY)}>
                    <TableCell className="text-xs">{costing.serialNo}</TableCell>
                    <TableCell className="text-xs">{costing.description}</TableCell>
                    <TableCell className="text-xs text-right">{formatAmount(currencyCode, costing.saleLCY)}</TableCell>
                    <TableCell className="text-xs text-right font-medium text-emerald-700">{formatAmount(currencyCode, costing.billedSaleLCY)}</TableCell>
                    <TableCell className="text-xs text-right font-medium text-yellow-800">{formatAmount(currencyCode, costing.unbilledSaleLCY)}</TableCell>
                    <TableCell className="text-xs text-right">{formatAmount(currencyCode, costing.costLCY)}</TableCell>
                    <TableCell className="text-xs text-right font-medium text-red-700">{formatAmount(currencyCode, costing.billedCostLCY)}</TableCell>
                    <TableCell className="text-xs text-right font-medium text-yellow-800">{formatAmount(currencyCode, costing.unbilledCostLCY)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Payment Breakdown */}
        <div className="border border-emerald-100 rounded-lg overflow-hidden shadow-sm">
          <div className="bg-emerald-600 px-4 py-3 border-b border-emerald-600">
            <h2 className="text-sm font-semibold text-white">Payment Breakdown</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="border-r">
              <div className="grid grid-cols-3 border-b">
                <div className="p-3 bg-slate-50">
                  <div className="text-xs font-medium text-muted-foreground">Customer Invoices</div>
                  <div className="font-semibold text-slate-700">{formatAmount(currencyCode, detail.totalCustomerInvoiceLCY)}</div>
                </div>
                <div className="p-3 bg-emerald-50/60">
                  <div className="text-xs font-medium text-muted-foreground">Received</div>
                  <div className="font-semibold text-emerald-700">{formatAmount(currencyCode, detail.totalCustomerPaidLCY)}</div>
                </div>
                <div className="p-3 bg-yellow-50/60">
                  <div className="text-xs font-medium text-muted-foreground">Unpaid</div>
                  <div className="font-semibold text-yellow-800">{formatAmount(currencyCode, detail.totalCustomerUnpaidLCY)}</div>
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-100 hover:bg-slate-100">
                    <TableHead className="text-xs text-slate-700">Invoice</TableHead>
                    <TableHead className="text-xs text-slate-700">Customer</TableHead>
                    <TableHead className="text-xs text-slate-700">Curr</TableHead>
                    <TableHead className="text-xs text-right text-slate-700">Total</TableHead>
                    <TableHead className="text-xs text-right text-emerald-700">Paid</TableHead>
                    <TableHead className="text-xs text-right text-yellow-800">Unpaid</TableHead>
                    <TableHead className="text-xs text-slate-700">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detail.billToItems.flatMap(item => item.invoices).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-xs text-muted-foreground py-4">
                        No customer invoices
                      </TableCell>
                    </TableRow>
                  ) : (
                    detail.billToItems.flatMap(item => item.invoices).map((invoice) => (
                      <TableRow key={`invoice-${invoice.invoiceId}`} className={paymentRowClass(invoice.unpaidLCY)}>
                        <TableCell className="text-xs">
                          {invoice.invoiceNo ? (
                            <Link
                              to={`/accounts/invoices/${encodeURIComponent(invoice.invoiceNo)}`}
                              className={voucherLinkClass}
                            >
                              {invoice.invoiceNo}
                            </Link>
                          ) : "-"}
                        </TableCell>
                        <TableCell className="text-xs">{invoice.customerName}</TableCell>
                        <TableCell className="text-xs">{invoice.currencyCode || "-"}</TableCell>
                        <TableCell className="text-xs text-right">{formatAmount(currencyCode, invoice.totalLCY)}</TableCell>
                        <TableCell className="text-xs text-right font-medium text-emerald-700">{formatAmount(currencyCode, invoice.paidLCY)}</TableCell>
                        <TableCell className="text-xs text-right font-semibold text-yellow-800">{formatAmount(currencyCode, invoice.unpaidLCY)}</TableCell>
                        <TableCell className="text-xs">
                          <span className={paymentBadgeClass(invoice.unpaidLCY)}>
                            {isOutstanding(invoice.unpaidLCY) ? "Unpaid" : "Paid"}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <div>
              <div className="grid grid-cols-3 border-b">
                <div className="p-3 bg-slate-50">
                  <div className="text-xs font-medium text-muted-foreground">Vendor Invoices</div>
                  <div className="font-semibold text-slate-700">{formatAmount(currencyCode, detail.totalVendorInvoiceLCY)}</div>
                </div>
                <div className="p-3 bg-emerald-50/60">
                  <div className="text-xs font-medium text-muted-foreground">Paid</div>
                  <div className="font-semibold text-emerald-700">{formatAmount(currencyCode, detail.totalVendorPaidLCY)}</div>
                </div>
                <div className="p-3 bg-yellow-50/60">
                  <div className="text-xs font-medium text-muted-foreground">Unpaid</div>
                  <div className="font-semibold text-yellow-800">{formatAmount(currencyCode, detail.totalVendorUnpaidLCY)}</div>
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-100 hover:bg-slate-100">
                    <TableHead className="text-xs text-slate-700">Purchase</TableHead>
                    <TableHead className="text-xs text-slate-700">Vendor</TableHead>
                    <TableHead className="text-xs text-slate-700">Curr</TableHead>
                    <TableHead className="text-xs text-right text-slate-700">Total</TableHead>
                    <TableHead className="text-xs text-right text-emerald-700">Paid</TableHead>
                    <TableHead className="text-xs text-right text-yellow-800">Unpaid</TableHead>
                    <TableHead className="text-xs text-slate-700">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detail.vendorItems.flatMap(item => item.purchaseInvoices).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-xs text-muted-foreground py-4">
                        No vendor invoices
                      </TableCell>
                    </TableRow>
                  ) : (
                    detail.vendorItems.flatMap(item => item.purchaseInvoices).map((purchase) => (
                      <TableRow key={`purchase-${purchase.purchaseInvoiceId}`} className={paymentRowClass(purchase.unpaidLCY)}>
                        <TableCell className="text-xs">
                          {purchase.purchaseNo ? (
                            <Link
                              to={`/accounts/purchase-invoices/${encodeURIComponent(purchase.purchaseNo)}`}
                              className={voucherLinkClass}
                            >
                              {purchase.purchaseNo}
                            </Link>
                          ) : "-"}
                        </TableCell>
                        <TableCell className="text-xs">{purchase.vendorName}</TableCell>
                        <TableCell className="text-xs">{purchase.currencyCode || "-"}</TableCell>
                        <TableCell className="text-xs text-right">{formatAmount(currencyCode, purchase.totalLCY)}</TableCell>
                        <TableCell className="text-xs text-right font-medium text-emerald-700">{formatAmount(currencyCode, purchase.paidLCY)}</TableCell>
                        <TableCell className="text-xs text-right font-semibold text-yellow-800">{formatAmount(currencyCode, purchase.unpaidLCY)}</TableCell>
                        <TableCell className="text-xs">
                          <span className={paymentBadgeClass(purchase.unpaidLCY)}>
                            {isOutstanding(purchase.unpaidLCY) ? "Unpaid" : "Paid"}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        {(detail.unlinkedSaleItems.length > 0 || detail.unlinkedCostItems.length > 0) && (
          <div className="border border-amber-100 rounded-lg overflow-hidden shadow-sm">
            <div className="bg-amber-50 px-4 py-3 border-b border-amber-100">
              <h2 className="text-sm font-semibold text-amber-900">Unlinked Shipment Invoice Items</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="border-r border-amber-100 overflow-x-auto">
                <div className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-50">Customer invoice items</div>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-100 hover:bg-slate-100">
                      <TableHead className="text-xs text-slate-700">Invoice</TableHead>
                      <TableHead className="text-xs text-slate-700">Charge</TableHead>
                      <TableHead className="text-xs text-right text-slate-700">LCY</TableHead>
                      <TableHead className="text-xs text-right text-slate-700">Tax</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detail.unlinkedSaleItems.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center text-xs text-muted-foreground py-4">None</TableCell></TableRow>
                    ) : detail.unlinkedSaleItems.map((item) => (
                      <TableRow key={`unlinked-sale-${item.itemId}`} className="bg-amber-50/40 hover:bg-amber-50">
                        <TableCell className="text-xs">
                          {item.documentNo ? (
                            <Link
                              to={`/accounts/invoices/${encodeURIComponent(item.documentNo)}`}
                              className={voucherLinkClass}
                            >
                              {item.documentNo}
                            </Link>
                          ) : "-"}
                        </TableCell>
                        <TableCell className="text-xs">{item.chargeDetails}</TableCell>
                        <TableCell className="text-xs text-right">{formatAmount(currencyCode, item.localAmount)}</TableCell>
                        <TableCell className="text-xs text-right">{formatAmount(currencyCode, item.taxAmount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="overflow-x-auto">
                <div className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-50">Vendor invoice items</div>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-100 hover:bg-slate-100">
                      <TableHead className="text-xs text-slate-700">Purchase</TableHead>
                      <TableHead className="text-xs text-slate-700">Charge</TableHead>
                      <TableHead className="text-xs text-right text-slate-700">LCY</TableHead>
                      <TableHead className="text-xs text-right text-slate-700">Tax</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detail.unlinkedCostItems.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center text-xs text-muted-foreground py-4">None</TableCell></TableRow>
                    ) : detail.unlinkedCostItems.map((item) => (
                      <TableRow key={`unlinked-cost-${item.itemId}`} className="bg-amber-50/40 hover:bg-amber-50">
                        <TableCell className="text-xs">
                          {item.documentNo ? (
                            <Link
                              to={`/accounts/purchase-invoices/${encodeURIComponent(item.documentNo)}`}
                              className={voucherLinkClass}
                            >
                              {item.documentNo}
                            </Link>
                          ) : "-"}
                        </TableCell>
                        <TableCell className="text-xs">{item.chargeDetails}</TableCell>
                        <TableCell className="text-xs text-right">{formatAmount(currencyCode, item.localAmount)}</TableCell>
                        <TableCell className="text-xs text-right">{formatAmount(currencyCode, item.taxAmount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}

        {/* Bill To and Vendor Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Bill To Section */}
          <div className="border rounded-lg overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-100 hover:bg-slate-100">
                  <TableHead className="text-xs font-semibold text-slate-700">Bill To</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-700">P.Sale</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-700">Voucher Number</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-700">Status</TableHead>
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
                    <TableRow key={index} className={paymentRowClass(billTo.unpaidLCY)}>
                      <TableCell className="text-xs">{billTo.customerName}</TableCell>
                      <TableCell className="text-xs font-medium text-emerald-700">{formatAmount(currencyCode, billTo.pSale)}</TableCell>
                      <TableCell className="text-xs">
                        {billTo.invoices.length === 0 ? "-" : billTo.invoices.map((inv, invoiceIndex) => (
                          <span key={`${inv.invoiceId}-${inv.invoiceNo || invoiceIndex}`}>
                            {invoiceIndex > 0 && ", "}
                            {inv.invoiceNo ? (
                              <Link
                                to={`/accounts/invoices/${encodeURIComponent(inv.invoiceNo)}`}
                                className={voucherLinkClass}
                              >
                                {inv.invoiceNo}
                              </Link>
                            ) : "-"}
                          </span>
                        ))}
                      </TableCell>
                      <TableCell className="text-xs">
                        <span className={paymentBadgeClass(billTo.unpaidLCY)}>
                          {isOutstanding(billTo.unpaidLCY) ? "Unpaid" : "Paid"}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Vendor Section */}
          <div className="border rounded-lg overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-100 hover:bg-slate-100">
                  <TableHead className="text-xs font-semibold text-slate-700">Vendor</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-700">P.Cost</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-700">Voucher Number</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-700">Status</TableHead>
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
                    <TableRow key={index} className={paymentRowClass(vendor.unpaidLCY)}>
                      <TableCell className="text-xs">{vendor.vendorName}</TableCell>
                      <TableCell className="text-xs font-medium text-red-700">{formatAmount(currencyCode, vendor.pCost)}</TableCell>
                      <TableCell className="text-xs">
                        {vendor.purchaseInvoices.length === 0 ? "-" : vendor.purchaseInvoices.map((pi, purchaseIndex) => (
                          <span key={`${pi.purchaseInvoiceId}-${pi.purchaseNo || purchaseIndex}`}>
                            {purchaseIndex > 0 && ", "}
                            {pi.purchaseNo ? (
                              <Link
                                to={`/accounts/purchase-invoices/${encodeURIComponent(pi.purchaseNo)}`}
                                className={voucherLinkClass}
                              >
                                {pi.purchaseNo}
                              </Link>
                            ) : "-"}
                          </span>
                        ))}
                      </TableCell>
                      <TableCell className="text-xs">
                        <span className={paymentBadgeClass(vendor.unpaidLCY)}>
                          {isOutstanding(vendor.unpaidLCY) ? "Unpaid" : "Paid"}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Totals Section */}
        <div className="flex justify-center">
          <div className="grid grid-cols-3 gap-0 border rounded-lg overflow-hidden shadow-sm">
            <div className="border-r p-4 text-center min-w-[180px] bg-emerald-50/50">
              <div className="text-sm font-semibold text-slate-700">Total Sale</div>
              <div className="text-emerald-700 font-semibold">[ {formatAmount(currencyCode, detail.totalSaleLCY)}]</div>
            </div>
            <div className="border-r p-4 text-center min-w-[180px] bg-red-50/50">
              <div className="text-sm font-semibold text-slate-700">Total Cost</div>
              <div className="text-red-700 font-semibold">[ {formatAmount(currencyCode, detail.totalCostLCY)}]</div>
            </div>
            <div className={`p-4 text-center min-w-[180px] ${detail.profit >= 0 ? "bg-emerald-50/50" : "bg-red-50/50"}`}>
              <div className="text-sm font-semibold text-slate-700">Profit</div>
              <div className={`font-semibold ${detail.profit >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                {formatAmount(currencyCode, detail.profit)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default CostSheetDetail;
