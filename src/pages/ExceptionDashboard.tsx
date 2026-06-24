import { useEffect, useMemo, useRef, useState } from "react";
import type { ElementType, ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Banknote,
  CalendarClock,
  ChevronRight,
  FileWarning,
  Loader2,
  PackageOpen,
  RotateCcw,
  Search,
  ShieldAlert,
  Truck,
  Wallet,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { MainLayout } from "@/components/layout/MainLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDashboardExceptions } from "@/hooks/useDashboard";
import { useAllDebtors } from "@/hooks/useCustomers";

const todayIso = () => {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
};

const modeOptions = [
  { value: "all", label: "All Modes" },
  { value: "SeaFreightFCL", label: "Sea FCL" },
  { value: "SeaFreightLCL", label: "Sea LCL" },
  { value: "AirFreight", label: "Air" },
  { value: "BreakBulk", label: "Break-Bulk" },
  { value: "RoRo", label: "RoRo" },
  { value: "Courier", label: "Courier" },
];

const directionOptions = [
  { value: "all", label: "All Directions" },
  { value: "Import", label: "Import" },
  { value: "Export", label: "Export" },
  { value: "CrossTrade", label: "Cross-Trade" },
];

const quickAges = [15, 30, 45, 60, 90];

interface FilterState {
  asOfDate: string;
  overdueDays: string;
  customerId: string;
  salesperson: string;
  mode: string;
  direction: string;
}

const defaultFilters = (): FilterState => ({
  asOfDate: todayIso(),
  overdueDays: "30",
  customerId: "all",
  salesperson: "all",
  mode: "all",
  direction: "all",
});

export default function ExceptionDashboard() {
  const [filters, setFilters] = useState<FilterState>(() => defaultFilters());
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(() => defaultFilters());
  const { data: customers = [] } = useAllDebtors();

  const params = useMemo(() => ({
    asOfDate: appliedFilters.asOfDate || undefined,
    overdueDays: Math.max(parseInt(appliedFilters.overdueDays, 10) || 30, 1),
    customerId: appliedFilters.customerId !== "all" ? parseInt(appliedFilters.customerId, 10) : undefined,
    salesperson: appliedFilters.salesperson !== "all" ? appliedFilters.salesperson : undefined,
    mode: appliedFilters.mode !== "all" ? appliedFilters.mode : undefined,
    direction: appliedFilters.direction !== "all" ? appliedFilters.direction : undefined,
  }), [appliedFilters]);

  const { data, isLoading, error } = useDashboardExceptions(params);
  const currency = data?.currency ?? "AED";

  const salespersonOptions = useMemo(() => [
    { value: "all", label: "All Salespeople" },
    ...(data?.salespeople ?? []).map((name) => ({ value: name, label: name })),
  ], [data?.salespeople]);

  const customerOptions = useMemo(() => [
    { value: "all", label: "All Customers" },
    ...customers.map((customer) => ({
      value: customer.id.toString(),
      label: customer.name,
    })),
  ], [customers]);

  const filterSummary = useMemo(() => {
    const labels = [];
    if (appliedFilters.customerId !== "all") {
      labels.push(customerOptions.find((item) => item.value === appliedFilters.customerId)?.label ?? "Customer");
    }
    if (appliedFilters.salesperson !== "all") labels.push(appliedFilters.salesperson);
    if (appliedFilters.mode !== "all") labels.push(modeOptions.find((item) => item.value === appliedFilters.mode)?.label ?? appliedFilters.mode);
    if (appliedFilters.direction !== "all") labels.push(directionOptions.find((item) => item.value === appliedFilters.direction)?.label ?? appliedFilters.direction);
    return labels;
  }, [appliedFilters, customerOptions]);

  const agingData = useMemo(() => {
    const bucket30 = data?.customerCollections.reduce((sum, item) => sum + item.bucket30LCY, 0) ?? 0;
    const bucket60 = data?.customerCollections.reduce((sum, item) => sum + item.bucket60LCY, 0) ?? 0;
    const bucket90 = data?.customerCollections.reduce((sum, item) => sum + item.bucket90LCY, 0) ?? 0;
    return [
      { name: "30+", value: bucket30, fill: "#f59e0b" },
      { name: "60+", value: bucket60, fill: "#f97316" },
      { name: "90+", value: bucket90, fill: "#dc2626" },
    ];
  }, [data?.customerCollections]);

  const exceptionMix = useMemo(() => [
    { name: "AR", value: data?.kpis.overdueInvoiceCount ?? 0, fill: "#f97316" },
    { name: "Shipments", value: data?.kpis.overdueShipmentCount ?? 0, fill: "#0ea5e9" },
    { name: "Unbilled", value: data?.kpis.unbilledJobCount ?? 0, fill: "#8b5cf6" },
    { name: "AP", value: data?.vendorPaymentExceptions.length ?? 0, fill: "#64748b" },
  ].filter((item) => item.value > 0), [data]);

  const unbilledTotal = data?.unbilledJobs.reduce((sum, item) => sum + item.unbilledSaleLCY + item.unbilledCostLCY, 0) ?? 0;
  const maxCustomerBalance = Math.max(...(data?.customerCollections.map((item) => item.overdueBalanceLCY) ?? [0]), 1);
  const applyFilters = () => setAppliedFilters(filters);
  const resetFilters = () => {
    const next = defaultFilters();
    setFilters(next);
    setAppliedFilters(next);
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-6 bg-slate-50/40 min-h-screen">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-foreground">Exception Dashboard</h1>
                <p className="text-sm text-muted-foreground">
                  Operational and finance risks as of {formatDate(data?.asOfDate ?? appliedFilters.asOfDate)}.
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="rounded-md px-2.5 py-1">
              {appliedFilters.overdueDays}+ days
            </Badge>
            {filterSummary.length ? (
              filterSummary.map((label) => (
                <Badge key={label} variant="outline" className="rounded-md px-2.5 py-1 bg-white">
                  {label}
                </Badge>
              ))
            ) : (
              <Badge variant="outline" className="rounded-md px-2.5 py-1 bg-white">
                All records
              </Badge>
            )}
          </div>
        </div>

        <section className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
              <FilterField label="As Of" className="lg:w-[160px]">
                <Input
                  type="date"
                  value={filters.asOfDate}
                  onChange={(event) => setFilters((prev) => ({ ...prev, asOfDate: event.target.value }))}
                />
              </FilterField>

              <FilterField label="Overdue Age" className="lg:w-[330px]">
                <div className="flex gap-2">
                  {quickAges.map((days) => (
                    <Button
                      key={days}
                      type="button"
                      variant={filters.overdueDays === days.toString() ? "default" : "outline"}
                      size="sm"
                      className="h-10 flex-1 px-2"
                      onClick={() => setFilters((prev) => ({ ...prev, overdueDays: days.toString() }))}
                    >
                      {days}d
                    </Button>
                  ))}
                </div>
              </FilterField>

              <FilterField label="Custom Days" className="lg:w-[120px]">
                <Input
                  type="number"
                  min={1}
                  value={filters.overdueDays}
                  onChange={(event) => setFilters((prev) => ({ ...prev, overdueDays: event.target.value }))}
                />
              </FilterField>

              <div className="flex gap-2 lg:ml-auto">
                <Button onClick={applyFilters} className="gap-2">
                  <Search className="h-4 w-4" />
                  Apply
                </Button>
                <Button onClick={resetFilters} variant="outline" size="icon" title="Reset">
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              <FilterField label="Customer">
                <SearchableSelect
                  options={customerOptions}
                  value={filters.customerId}
                  onValueChange={(value) => setFilters((prev) => ({ ...prev, customerId: value }))}
                  placeholder="All Customers"
                  searchPlaceholder="Search customers..."
                />
              </FilterField>
              <FilterField label="Salesperson">
                <SearchableSelect
                  options={salespersonOptions}
                  value={filters.salesperson}
                  onValueChange={(value) => setFilters((prev) => ({ ...prev, salesperson: value }))}
                  placeholder="All Salespeople"
                  searchPlaceholder="Search salespeople..."
                />
              </FilterField>
              <FilterField label="Mode">
                <SearchableSelect
                  options={modeOptions}
                  value={filters.mode}
                  onValueChange={(value) => setFilters((prev) => ({ ...prev, mode: value }))}
                  placeholder="All Modes"
                />
              </FilterField>
              <FilterField label="Direction">
                <SearchableSelect
                  options={directionOptions}
                  value={filters.direction}
                  onValueChange={(value) => setFilters((prev) => ({ ...prev, direction: value }))}
                  placeholder="All Directions"
                />
              </FilterField>
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Failed to load exception dashboard: {error.message}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <KpiCard title="Overdue AR" value={formatMoneyCompact(currency, data?.kpis.overdueAR)} icon={Wallet} tone="amber" loading={isLoading} />
          <KpiCard title="Invoices" value={data?.kpis.overdueInvoiceCount ?? 0} icon={FileWarning} tone="red" loading={isLoading} />
          <KpiCard title="Critical Customers" value={data?.kpis.criticalCustomerCount ?? 0} icon={ShieldAlert} tone="red" loading={isLoading} />
          <KpiCard title="Late Shipments" value={data?.kpis.overdueShipmentCount ?? 0} icon={Truck} tone="blue" loading={isLoading} />
          <KpiCard title="Unbilled Jobs" value={data?.kpis.unbilledJobCount ?? 0} icon={PackageOpen} tone="violet" loading={isLoading} />
          <KpiCard title="Vendor Due" value={formatMoneyCompact(currency, data?.kpis.vendorPayablesDue)} icon={Banknote} tone="slate" loading={isLoading} />
        </div>

        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-12">
          <section className="rounded-lg border bg-card p-4 shadow-sm xl:col-span-5">
            <PanelTitle eyebrow="Receivables" title="Aging Exposure" />
            <div className="h-[230px]">
              {isLoading ? <ChartLoading /> : hasChartValue(agingData) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={agingData} margin={{ top: 20, right: 14, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(value) => compactNumber(Number(value))} />
                    <Tooltip content={<MoneyTooltip currency={currency} />} cursor={{ fill: "hsl(var(--muted) / 0.35)" }} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={62}>
                      {agingData.map((entry) => <Cell key={entry.name} fill={entry.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : <EmptyVisual label="No aging exposure" />}
            </div>
          </section>

          <section className="rounded-lg border bg-card p-4 shadow-sm xl:col-span-3">
            <PanelTitle eyebrow="Workload" title="Exception Mix" />
            <div className="relative">
              {isLoading ? <ChartLoading /> : exceptionMix.length ? (
                <>
                  <div className="h-[190px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={exceptionMix}
                        cx="50%"
                        cy="50%"
                        innerRadius={48}
                        outerRadius={72}
                        paddingAngle={3}
                        dataKey="value"
                        stroke="none"
                      >
                        {exceptionMix.map((entry) => <Cell key={entry.name} fill={entry.fill} />)}
                      </Pie>
                      <Tooltip
                        content={<CountTooltip />}
                        position={{ x: 18, y: 12 }}
                        wrapperStyle={{ outline: "none", pointerEvents: "none" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  </div>
                  <div className="absolute inset-x-0 top-[68px] flex flex-col items-center pointer-events-none">
                    <span className="text-2xl font-bold">{exceptionMix.reduce((sum, item) => sum + item.value, 0)}</span>
                    <span className="text-[10px] uppercase text-muted-foreground">Open Items</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                    {exceptionMix.map((item) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.fill }} />
                        <span className="text-muted-foreground">{item.name}</span>
                        <span className="ml-auto font-semibold">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : <EmptyVisual label="No open exceptions" />}
            </div>
          </section>

          <section className="rounded-lg border bg-card p-4 shadow-sm xl:col-span-4">
            <PanelTitle eyebrow="Priority" title="Top Customer Exposure" />
            <div className="space-y-2">
              {isLoading ? (
                <StackLoading />
              ) : data?.customerCollections.length ? (
                data.customerCollections.slice(0, 3).map((item) => (
                  <Link
                    key={item.customerId}
                    to={`/master-customers/${item.customerId}/edit`}
                    className="block rounded-md border bg-slate-50/60 px-3 py-2.5 transition-colors hover:border-primary/40 hover:bg-primary/5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{item.customerName || "-"}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.overdueInvoiceCount} invoices | oldest {formatDurationDays(item.oldestInvoiceAge)}
                        </p>
                      </div>
                      <p className="shrink-0 text-sm font-bold">{formatMoneyCompact(currency, item.overdueBalanceLCY)}</p>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className={item.oldestInvoiceAge >= 90 ? "h-full rounded-full bg-red-500" : item.oldestInvoiceAge >= 60 ? "h-full rounded-full bg-orange-500" : "h-full rounded-full bg-amber-500"}
                        style={{ width: `${Math.max((item.overdueBalanceLCY / maxCustomerBalance) * 100, 4)}%` }}
                      />
                    </div>
                  </Link>
                ))
              ) : <EmptyVisual label="No collection exposure" />}
            </div>
          </section>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <ActionPanel
            title="Collect First"
            icon={Wallet}
            loading={isLoading}
            empty={!data?.overdueInvoices.length}
          >
            {data?.overdueInvoices.slice(0, 5).map((item) => (
              <ExceptionLink
                key={item.invoiceId}
                to={`/accounts/invoices/${encodeURIComponent(item.invoiceNo)}`}
                title={item.invoiceNo}
                subtitle={`${item.customerName || "-"} | ${formatDurationDays(item.ageDays)} overdue`}
                value={formatMoneyCompact(currency, item.balanceLCY)}
                severity={item.ageDays}
              />
            ))}
          </ActionPanel>

          <ActionPanel
            title="Move Shipments"
            icon={Truck}
            loading={isLoading}
            empty={!data?.shipmentExceptions.length}
          >
            {data?.shipmentExceptions.slice(0, 5).map((item) => (
              <ExceptionLink
                key={item.shipmentId}
                to={`/shipments/${item.shipmentId}/edit`}
                title={item.jobNumber}
                subtitle={`${item.customerNames.join(", ") || "-"} | ${item.billedStatus}`}
                value={formatDurationDays(item.daysLate)}
                severity={item.daysLate * 6}
              />
            ))}
          </ActionPanel>

          <ActionPanel
            title="Bill / Pay Watch"
            icon={CalendarClock}
            loading={isLoading}
            empty={!data?.unbilledJobs.length && !data?.vendorPaymentExceptions.length}
          >
            <ExceptionLink
              to="#details"
              title="Unbilled sale and cost"
              subtitle={`${data?.kpis.unbilledJobCount ?? 0} jobs need billing review`}
              value={formatMoneyCompact(currency, unbilledTotal)}
              severity={60}
            />
            {data?.vendorPaymentExceptions.slice(0, 4).map((item) => (
              <ExceptionLink
                key={item.purchaseInvoiceId}
                to={`/accounts/purchase-invoices/${encodeURIComponent(item.purchaseNo)}`}
                title={item.purchaseNo}
                subtitle={`${item.vendorName || "-"} | ${formatDurationDays(item.ageDays)} unpaid`}
                value={formatMoneyCompact(currency, item.balanceLCY)}
                severity={item.ageDays}
              />
            ))}
          </ActionPanel>
        </div>

        <section id="details" className="rounded-lg border bg-card shadow-sm">
          <div className="border-b px-4 py-3">
            <PanelTitle eyebrow="Drill Down" title="Exception Details" />
          </div>
          <Tabs defaultValue="customers" className="p-4">
            <TabsList className="mb-4 h-auto flex-wrap justify-start rounded-lg bg-muted/60 p-1">
              <TabsTrigger value="customers">Customers</TabsTrigger>
              <TabsTrigger value="shipments">Shipments</TabsTrigger>
              <TabsTrigger value="invoices">Customer Invoices</TabsTrigger>
              <TabsTrigger value="unbilled">Unbilled Jobs</TabsTrigger>
              <TabsTrigger value="vendors">Vendor Payments</TabsTrigger>
            </TabsList>

            <TabsContent value="customers" className="mt-0">
              <DataTable>
                <Table className={detailTableClass}>
                  <TableHeader>
                    <TableRow className={detailHeaderRowClass}>
                      <TableHead>Customer</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                      <TableHead className="text-right">Invoices</TableHead>
                      <TableHead className="text-right">Oldest</TableHead>
                      <TableHead className="text-right">30+</TableHead>
                      <TableHead className="text-right">60+</TableHead>
                      <TableHead className="text-right">90+</TableHead>
                      <TableHead>Latest</TableHead>
                    </TableRow>
                  </TableHeader>
                  <WindowedTableBody
                    items={data?.customerCollections ?? []}
                    isLoading={isLoading}
                    colSpan={8}
                    renderRow={(item) => (
                        <TableRow key={item.customerId} className={riskRowClass(item.oldestInvoiceAge)}>
                          <TableCell className="max-w-[360px] whitespace-normal break-words leading-snug">
                            <LinkPill to={`/master-customers/${item.customerId}/edit`} tone="customer">
                              {item.customerName || "-"}
                            </LinkPill>
                          </TableCell>
                          <TableCell className="text-right">
                            <AmountStatusPill currency={currency} value={item.overdueBalanceLCY} tone="due" />
                          </TableCell>
                          <TableCell className="text-right">
                            <CountPill value={item.overdueInvoiceCount} />
                          </TableCell>
                          <TableCell className="text-right">
                            <LateStatusPill daysLate={item.oldestInvoiceAge} />
                          </TableCell>
                          <TableCell className="text-right text-slate-600">{formatMoney(currency, item.bucket30LCY)}</TableCell>
                          <TableCell className="text-right text-slate-600">{formatMoney(currency, item.bucket60LCY)}</TableCell>
                          <TableCell className="text-right">
                            <AmountStatusPill currency={currency} value={item.bucket90LCY} tone="due" />
                          </TableCell>
                          <TableCell>
                            {item.latestInvoiceNo ? (
                              <LinkPill to={`/accounts/invoices/${encodeURIComponent(item.latestInvoiceNo)}`} tone="invoice">
                                {item.latestInvoiceNo}
                              </LinkPill>
                            ) : "-"}
                          </TableCell>
                        </TableRow>
                    )}
                  />
                </Table>
              </DataTable>
            </TabsContent>

            <TabsContent value="shipments" className="mt-0">
              <DataTable>
                <Table className={detailTableClass}>
                  <TableHeader>
                    <TableRow className={detailHeaderRowClass}>
                      <TableHead>Job</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Mode</TableHead>
                      <TableHead>Direction</TableHead>
                      <TableHead className="text-right">Late</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <WindowedTableBody
                    items={data?.shipmentExceptions ?? []}
                    isLoading={isLoading}
                    colSpan={6}
                    renderRow={(item) => (
                        <TableRow key={item.shipmentId} className={shipmentRiskClass(item.daysLate)}>
                          <TableCell>
                            <LinkPill to={`/shipments/${item.shipmentId}/edit`} tone="job">
                              {item.jobNumber}
                            </LinkPill>
                          </TableCell>
                          <TableCell className="max-w-[360px] whitespace-normal break-words leading-snug">
                            {item.customerNames.join(", ") || "-"}
                          </TableCell>
                          <TableCell><TextBadge>{item.mode}</TextBadge></TableCell>
                          <TableCell><TextBadge>{item.direction}</TextBadge></TableCell>
                          <TableCell className="text-right">
                            <LateStatusPill daysLate={item.daysLate} />
                          </TableCell>
                          <TableCell className="text-xs">
                            <BilledStatusPill status={item.billedStatus} />
                            <div className="mt-1 text-[11px] text-muted-foreground truncate">{item.lastEvent || "No event"}</div>
                          </TableCell>
                        </TableRow>
                    )}
                  />
                </Table>
              </DataTable>
            </TabsContent>

            <TabsContent value="invoices" className="mt-0">
              <DataTable>
                <Table className={detailTableClass}>
                  <TableHeader>
                    <TableRow className={detailHeaderRowClass}>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Job</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Age</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Paid/CN</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <WindowedTableBody
                    items={data?.overdueInvoices ?? []}
                    isLoading={isLoading}
                    colSpan={8}
                    renderRow={(item) => (
                        <TableRow key={item.invoiceId} className={riskRowClass(item.ageDays)}>
                          <TableCell>
                            <LinkPill to={`/accounts/invoices/${encodeURIComponent(item.invoiceNo)}`} tone="invoice">
                              {item.invoiceNo}
                            </LinkPill>
                          </TableCell>
                          <TableCell className="max-w-[320px] whitespace-normal break-words leading-snug">
                            {item.customerName || "-"}
                          </TableCell>
                          <TableCell>
                            {item.shipmentId ? (
                              <LinkPill to={`/shipments/${item.shipmentId}/edit`} tone="job">
                                {item.jobNo || "-"}
                              </LinkPill>
                            ) : item.jobNo || "-"}
                          </TableCell>
                          <TableCell>
                            <DatePill value={item.invoiceDate} />
                          </TableCell>
                          <TableCell className="text-right">
                            <LateStatusPill daysLate={item.ageDays} />
                          </TableCell>
                          <TableCell className="text-right text-slate-600">{formatMoney(currency, item.totalLCY)}</TableCell>
                          <TableCell className="text-right">
                            <AmountStatusPill currency={currency} value={item.paidLCY + item.creditLCY} tone="paid" />
                          </TableCell>
                          <TableCell className="text-right">
                            <AmountStatusPill currency={currency} value={item.balanceLCY} tone="due" />
                          </TableCell>
                        </TableRow>
                    )}
                  />
                </Table>
              </DataTable>
            </TabsContent>

            <TabsContent value="unbilled" className="mt-0">
              <DataTable>
                <Table className={detailTableClass}>
                  <TableHeader>
                    <TableRow className={detailHeaderRowClass}>
                      <TableHead>Job</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead className="text-right">Expected Sale</TableHead>
                      <TableHead className="text-right">Billed Sale</TableHead>
                      <TableHead className="text-right">Unbilled Sale</TableHead>
                      <TableHead className="text-right">Expected Cost</TableHead>
                      <TableHead className="text-right">Billed Cost</TableHead>
                      <TableHead className="text-right">Unbilled Cost</TableHead>
                    </TableRow>
                  </TableHeader>
                  <WindowedTableBody
                    items={data?.unbilledJobs ?? []}
                    isLoading={isLoading}
                    colSpan={8}
                    renderRow={(item) => (
                        <TableRow key={item.shipmentId} className="border-l-4 border-amber-200/80 bg-amber-50/10 hover:bg-amber-50/40">
                          <TableCell>
                            <LinkPill to={`/shipments/${item.shipmentId}/edit`} tone="job">
                              {item.jobNumber}
                            </LinkPill>
                            <div className="mt-1 flex flex-wrap gap-1">
                              <TextBadge>{item.mode}</TextBadge>
                              <TextBadge>{item.direction}</TextBadge>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[260px] whitespace-normal break-words leading-snug">
                            {item.customerNames.join(", ") || "-"}
                          </TableCell>
                          <TableCell className="text-right text-slate-600">{formatMoney(currency, item.expectedSaleLCY)}</TableCell>
                          <TableCell className="text-right">
                            <AmountStatusPill currency={currency} value={item.billedSaleLCY} tone="paid" />
                          </TableCell>
                          <TableCell className="text-right">
                            <AmountStatusPill currency={currency} value={item.unbilledSaleLCY} tone="due" />
                          </TableCell>
                          <TableCell className="text-right text-slate-600">{formatMoney(currency, item.expectedCostLCY)}</TableCell>
                          <TableCell className="text-right">
                            <AmountStatusPill currency={currency} value={item.billedCostLCY} tone="paid" />
                          </TableCell>
                          <TableCell className="text-right">
                            <AmountStatusPill currency={currency} value={item.unbilledCostLCY} tone="due" />
                          </TableCell>
                        </TableRow>
                    )}
                  />
                </Table>
              </DataTable>
            </TabsContent>

            <TabsContent value="vendors" className="mt-0">
              <DataTable>
                <Table className={detailTableClass}>
                  <TableHeader>
                    <TableRow className={detailHeaderRowClass}>
                      <TableHead>Purchase</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Job</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Age</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Paid</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <WindowedTableBody
                    items={data?.vendorPaymentExceptions ?? []}
                    isLoading={isLoading}
                    colSpan={8}
                    renderRow={(item) => (
                        <TableRow key={item.purchaseInvoiceId} className={riskRowClass(item.ageDays)}>
                          <TableCell className="align-middle">
                            <LinkPill to={`/accounts/purchase-invoices/${encodeURIComponent(item.purchaseNo)}`} tone="purchase">
                              {item.purchaseNo}
                            </LinkPill>
                          </TableCell>
                          <TableCell className="max-w-[320px] whitespace-normal break-words leading-snug text-slate-700">
                            {item.vendorName || "-"}
                          </TableCell>
                          <TableCell>
                            {item.shipmentId ? (
                              <LinkPill to={`/shipments/${item.shipmentId}/edit`} tone="job">
                                {item.jobNo || "-"}
                              </LinkPill>
                            ) : item.jobNo || "-"}
                          </TableCell>
                          <TableCell>
                            <DatePill value={item.purchaseDate} />
                          </TableCell>
                          <TableCell className="text-right">
                            <LateStatusPill daysLate={item.ageDays} />
                          </TableCell>
                          <TableCell className="text-right text-slate-700">{formatMoney(currency, item.totalLCY)}</TableCell>
                          <TableCell className="text-right">
                            <AmountStatusPill currency={currency} value={item.paidLCY} tone="paid" />
                          </TableCell>
                          <TableCell className="text-right">
                            <AmountStatusPill currency={currency} value={item.balanceLCY} tone="due" />
                          </TableCell>
                        </TableRow>
                    )}
                  />
                </Table>
              </DataTable>
            </TabsContent>
          </Tabs>
        </section>
      </div>
    </MainLayout>
  );
}

function FilterField({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

function PanelTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{eyebrow}</p>
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
    </div>
  );
}

function KpiCard({
  title,
  value,
  icon: Icon,
  tone,
  loading,
}: {
  title: string;
  value: string | number;
  icon: ElementType;
  tone: "amber" | "red" | "blue" | "violet" | "slate";
  loading: boolean;
}) {
  const tones = {
    amber: "border-l-amber-500 text-amber-700 bg-amber-50/30",
    red: "border-l-red-500 text-red-700 bg-red-50/30",
    blue: "border-l-sky-500 text-sky-700 bg-sky-50/30",
    violet: "border-l-violet-500 text-violet-700 bg-violet-50/30",
    slate: "border-l-slate-500 text-slate-700 bg-slate-50/40",
  };

  return (
    <div className={`rounded-lg border border-border border-l-4 bg-card p-4 shadow-sm transition-shadow hover:shadow-md ${tones[tone]}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wide">{title}</p>
          <p className="mt-1 truncate text-xl font-bold text-foreground">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : value}
          </p>
        </div>
        <div className="rounded-md bg-white/70 p-2 text-muted-foreground">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function ActionPanel({
  title,
  icon: Icon,
  loading,
  empty,
  children,
}: {
  title: string;
  icon: ElementType;
  loading: boolean;
  empty: boolean;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <div className="rounded-md bg-muted p-2 text-muted-foreground">
          <Icon className="h-4 w-4" />
        </div>
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      <div className="space-y-2">
        {loading ? <StackLoading /> : empty ? <EmptyVisual label="Nothing urgent here" /> : children}
      </div>
    </section>
  );
}

function ExceptionLink({
  to,
  title,
  subtitle,
  value,
  severity,
}: {
  to: string;
  title: string;
  subtitle: string;
  value: string;
  severity: number;
}) {
  return (
    <Link to={to} className="group flex items-center gap-3 rounded-md border bg-slate-50/60 p-3 hover:border-primary/40 hover:bg-primary/5">
      <span className={severityPipClass(severity)} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{title}</p>
        <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <span className="shrink-0 text-sm font-bold">{value}</span>
      <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

function DataTable({ children }: { children: ReactNode }) {
  return (
    <div data-detail-scroll className="max-h-[1344px] overflow-auto rounded-md border bg-white shadow-sm [&_thead]:sticky [&_thead]:top-0 [&_thead]:z-10">
      {children}
    </div>
  );
}

function WindowedTableBody<T>({
  items,
  isLoading,
  colSpan,
  renderRow,
}: {
  items: T[];
  isLoading: boolean;
  colSpan: number;
  renderRow: (item: T) => ReactNode;
}) {
  const bodyRef = useRef<HTMLTableSectionElement>(null);
  const [scrollState, setScrollState] = useState({ top: 0, height: 1344 });
  const rowHeight = 56;
  const headerHeight = 44;
  const overscan = 6;

  useEffect(() => {
    const scroller = bodyRef.current?.closest("[data-detail-scroll]") as HTMLElement | null;
    if (!scroller) return;

    const updateScrollState = () => {
      setScrollState({ top: scroller.scrollTop, height: scroller.clientHeight || 1344 });
    };

    updateScrollState();
    scroller.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);

    return () => {
      scroller.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [items.length]);

  if (isLoading) {
    return (
      <TableBody ref={bodyRef}>
        <LoadingRow colSpan={colSpan} />
      </TableBody>
    );
  }

  if (!items.length) {
    return (
      <TableBody ref={bodyRef}>
        <EmptyRow colSpan={colSpan} />
      </TableBody>
    );
  }

  const visibleCount = Math.ceil(scrollState.height / rowHeight) + overscan * 2;
  const startIndex = Math.max(0, Math.floor(Math.max(scrollState.top - headerHeight, 0) / rowHeight) - overscan);
  const endIndex = Math.min(items.length, startIndex + visibleCount);
  const visibleItems = items.slice(startIndex, endIndex);
  const topHeight = startIndex * rowHeight;
  const bottomHeight = Math.max((items.length - endIndex) * rowHeight, 0);

  return (
    <TableBody ref={bodyRef}>
      {topHeight > 0 && <SpacerRow colSpan={colSpan} height={topHeight} />}
      {visibleItems.map(renderRow)}
      {bottomHeight > 0 && <SpacerRow colSpan={colSpan} height={bottomHeight} />}
    </TableBody>
  );
}

function SpacerRow({ colSpan, height }: { colSpan: number; height: number }) {
  return (
    <TableRow aria-hidden="true" className="border-0 hover:bg-transparent">
      <TableCell colSpan={colSpan} className="border-0 p-0" style={{ height }} />
    </TableRow>
  );
}

const detailTableClass = "text-sm [&_td]:py-3 [&_th]:h-11 [&_th]:text-xs [&_th]:font-semibold [&_th]:uppercase [&_th]:tracking-wide";
const detailHeaderRowClass = "border-b bg-slate-100/90 hover:bg-slate-100";

function LinkPill({
  to,
  tone,
  children,
}: {
  to: string;
  tone: "customer" | "invoice" | "purchase" | "job";
  children: ReactNode;
}) {
  const className = {
    customer: "border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50",
    invoice: "border-indigo-100 bg-indigo-50/70 text-indigo-700 hover:border-indigo-200 hover:bg-indigo-50",
    purchase: "border-emerald-100 bg-emerald-50/70 text-emerald-700 hover:border-emerald-200 hover:bg-emerald-50",
    job: "border-sky-100 bg-sky-50/70 text-sky-700 hover:border-sky-200 hover:bg-sky-50",
  }[tone];

  return (
    <Link to={to} className={`inline-flex max-w-full items-center rounded-md border px-2.5 py-1 text-xs font-semibold leading-tight transition-colors ${className}`}>
      <span className="truncate">{children}</span>
    </Link>
  );
}

function TextBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600">
      {children}
    </span>
  );
}

function CountPill({ value }: { value: number }) {
  return (
    <span className="inline-flex min-w-[44px] justify-center rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700">
      {value}
    </span>
  );
}

function AmountStatusPill({
  currency,
  value,
  tone,
}: {
  currency: string;
  value: number;
  tone?: "auto" | "paid" | "due";
}) {
  const className = tone === "paid"
    ? value <= 0.005
      ? "border-slate-200 bg-slate-50 text-slate-500"
      : "border-emerald-100 bg-emerald-50/70 text-emerald-700"
    : tone === "due"
      ? value <= 0.005
        ? "border-slate-200 bg-slate-50 text-slate-500"
        : value >= 1000
          ? "border-red-100 bg-red-50/70 text-red-700"
          : "border-amber-100 bg-amber-50/70 text-amber-700"
      : value <= 0.005
        ? "border-emerald-100 bg-emerald-50/70 text-emerald-700"
        : value >= 10000
          ? "border-red-100 bg-red-50/70 text-red-700"
          : "border-amber-100 bg-amber-50/70 text-amber-700";

  return (
    <span className={`inline-flex min-w-[112px] justify-end rounded-md border px-2.5 py-1 text-xs font-semibold tabular-nums ${className}`}>
      {formatMoney(currency, value)}
    </span>
  );
}

function DatePill({ value }: { value?: string }) {
  return (
    <span className="inline-flex min-w-[104px] justify-center rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold tabular-nums text-slate-700">
      {formatDate(value)}
    </span>
  );
}

function LateStatusPill({ daysLate }: { daysLate: number }) {
  const className =
    daysLate >= 90
      ? "border-red-100 bg-red-50/70 text-red-700"
      : daysLate >= 30
        ? "border-orange-100 bg-orange-50/70 text-orange-700"
        : "border-amber-100 bg-amber-50/70 text-amber-700";

  return (
    <span className={`inline-flex min-w-[120px] justify-center rounded-md border px-2.5 py-1 text-xs font-semibold ${className}`}>
      {formatDurationDays(daysLate)}
    </span>
  );
}

function BilledStatusPill({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const className = normalized.includes("partially")
    ? "border-amber-100 bg-amber-50/70 text-amber-700"
    : normalized.includes("unbilled")
      ? "border-red-100 bg-red-50/70 text-red-700"
      : normalized.includes("billed")
        ? "border-emerald-100 bg-emerald-50/70 text-emerald-700"
        : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <span className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-semibold ${className}`}>
      {status}
    </span>
  );
}

function LoadingRow({ colSpan }: { colSpan: number }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="py-8 text-center text-muted-foreground">
        <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
        Loading...
      </TableCell>
    </TableRow>
  );
}

function EmptyRow({ colSpan }: { colSpan: number }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="py-8 text-center text-muted-foreground">
        No exceptions found
      </TableCell>
    </TableRow>
  );
}

function ChartLoading() {
  return (
    <div className="flex h-full items-center justify-center">
      <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
    </div>
  );
}

function StackLoading() {
  return (
    <div className="space-y-2">
      {[0, 1, 2].map((item) => (
        <div key={item} className="h-[58px] animate-pulse rounded-md bg-muted" />
      ))}
    </div>
  );
}

function EmptyVisual({ label }: { label: string }) {
  return (
    <div className="flex min-h-[112px] items-center justify-center rounded-md border border-dashed bg-slate-50/60 text-sm text-muted-foreground">
      {label}
    </div>
  );
}

function MoneyTooltip({ active, payload, label, currency }: {
  active?: boolean;
  payload?: Array<{ value?: number }>;
  label?: string;
  currency: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border bg-card px-3 py-2 text-sm shadow-sm">
      <p className="font-medium">{label}</p>
      <p className="text-muted-foreground">{formatMoney(currency, Number(payload[0].value ?? 0))}</p>
    </div>
  );
}

function CountTooltip({ active, payload }: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number }>;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="min-w-[130px] rounded-md border bg-white/95 px-3 py-2 text-xs shadow-lg backdrop-blur">
      <p className="font-semibold text-slate-900">{item.name}</p>
      <p className="mt-0.5 text-muted-foreground">
        <span className="font-semibold text-slate-700">{item.value}</span> open items
      </p>
    </div>
  );
}

function riskRowClass(ageDays: number) {
  if (ageDays >= 90) return "border-l-4 border-red-300 bg-red-50/20 hover:bg-red-50/45";
  if (ageDays >= 60) return "border-l-4 border-orange-300 bg-orange-50/15 hover:bg-orange-50/45";
  return "border-l-4 border-amber-300 bg-amber-50/15 hover:bg-amber-50/45";
}

function shipmentRiskClass(daysLate: number) {
  if (daysLate >= 90) return "border-l-4 border-red-300 bg-red-50/20 hover:bg-red-50/45";
  if (daysLate >= 30) return "border-l-4 border-orange-300 bg-orange-50/15 hover:bg-orange-50/45";
  return "border-l-4 border-amber-300 bg-amber-50/15 hover:bg-amber-50/45";
}

function severityPipClass(score: number) {
  if (score >= 90) return "h-8 w-1.5 shrink-0 rounded-full bg-red-500";
  if (score >= 60) return "h-8 w-1.5 shrink-0 rounded-full bg-orange-500";
  return "h-8 w-1.5 shrink-0 rounded-full bg-amber-500";
}

function hasChartValue(items: Array<{ value: number }>) {
  return items.some((item) => item.value > 0);
}

function compactNumber(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toFixed(0);
}

function formatMoney(currency: string, value: number | undefined) {
  return `${currency} ${(value ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatMoneyCompact(currency: string, value: number | undefined) {
  return `${currency} ${compactNumber(value ?? 0)}`;
}

function formatDurationDays(totalDays: number) {
  const days = Math.max(Math.floor(totalDays), 0);
  const months = Math.floor(days / 30);
  const remainingDays = days % 30;

  if (months === 0) {
    return `${remainingDays} ${remainingDays === 1 ? "day" : "days"}`;
  }

  if (remainingDays === 0) {
    return `${months} ${months === 1 ? "month" : "months"}`;
  }

  return `${months} ${months === 1 ? "month" : "months"} ${remainingDays} ${remainingDays === 1 ? "day" : "days"}`;
}

function formatDate(value?: string) {
  if (!value) return "-";
  const datePart = value.split("T")[0];
  const [year, month, day] = datePart.split("-").map(Number);

  if (!year || !month || !day) {
    const fallback = new Date(value);
    if (Number.isNaN(fallback.getTime())) return value;
    return `${String(fallback.getDate()).padStart(2, "0")}-${monthNames[fallback.getMonth()]}-${fallback.getFullYear()}`;
  }

  return `${String(day).padStart(2, "0")}-${monthNames[month - 1]}-${year}`;
}

const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
