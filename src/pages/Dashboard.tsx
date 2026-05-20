import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Search, Loader2, TrendingUp, TrendingDown, Wallet, Receipt, PiggyBank, Percent, FileWarning, Building2, Banknote, Gauge } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LabelList,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useDashboardStats } from "@/hooks/useDashboard";
import { format } from "date-fns";
import { DateRangePicker, DateRangeValue } from "@/components/ui/date-range-picker";
import type { ShipmentDistribution } from "@/services/api/dashboard";

const Dashboard = () => {
  const currentYear = new Date().getFullYear();
  const [dateRange, setDateRange] = useState<DateRangeValue | undefined>({
    from: new Date(currentYear, 0, 1),
    to: new Date(currentYear, 11, 31),
  });
  const [appliedDateRange, setAppliedDateRange] = useState<{ fromDate?: string; toDate?: string }>({
    fromDate: `${currentYear}-01-01`,
    toDate: `${currentYear}-12-31`,
  });

  const { data: stats, isLoading, error } = useDashboardStats(appliedDateRange);

  const handleSearch = () => {
    setAppliedDateRange({
      fromDate: dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
      toDate: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
    });
  };

  const currency = stats?.currency ?? "AED";

  const kpis = [
    {
      title: "REVENUE",
      value: formatCurrency(stats?.revenue ?? 0, currency),
      label: "Billed this period",
      borderColor: "border-l-emerald-500",
      labelColor: "text-emerald-600",
      icon: Wallet,
    },
    {
      title: "DIRECT COST",
      value: formatCurrency(stats?.directCost ?? 0, currency),
      label: "Carrier + vendor side",
      borderColor: "border-l-red-500",
      labelColor: "text-red-600",
      icon: Receipt,
    },
    {
      title: "GROSS PROFIT",
      value: formatCurrency(stats?.grossProfit ?? 0, currency),
      label: "P and L centerpiece",
      borderColor: "border-l-blue-500",
      labelColor: "text-blue-600",
      icon: PiggyBank,
    },
    {
      title: "GROSS MARGIN",
      value: `${(stats?.grossMarginPercent ?? 0).toFixed(1)}%`,
      label: "Across closed shipments",
      borderColor: "border-l-purple-500",
      labelColor: "text-purple-600",
      icon: Percent,
    },
    {
      title: "OPEN AR",
      value: formatCurrency(stats?.openAR ?? 0, currency),
      label: "Outstanding receivables (snapshot, ignores date filter)",
      borderColor: "border-l-amber-500",
      labelColor: "text-amber-600",
      icon: FileWarning,
    },
  ];

  const netProfit = stats?.netProfit ?? 0;
  const netProfitNegative = netProfit < 0;
  const netKpis = [
    {
      title: "OPERATING EXPENSES",
      value: formatCurrency(stats?.operatingExpenses ?? 0, currency),
      label: "Salaries, rent, utilities, bank fees",
      borderColor: "border-l-orange-500",
      labelColor: "text-orange-600",
      icon: Building2,
    },
    {
      title: "NET PROFIT",
      value: formatCurrency(netProfit, currency),
      label: "Gross profit minus operating expenses",
      borderColor: netProfitNegative ? "border-l-red-500" : "border-l-teal-500",
      labelColor: netProfitNegative ? "text-red-600" : "text-teal-600",
      icon: Banknote,
    },
    {
      title: "NET MARGIN",
      value: `${(stats?.netMarginPercent ?? 0).toFixed(1)}%`,
      label: "Net profit as % of revenue",
      borderColor: netProfitNegative ? "border-l-red-500" : "border-l-indigo-500",
      labelColor: netProfitNegative ? "text-red-600" : "text-indigo-600",
      icon: Gauge,
    },
  ];

  const monthlyPnl = stats?.monthlyPnl ?? [];
  const typeMix = stats?.shipmentTypeMix ?? [];
  const directionMix = stats?.directionDistribution ?? [];
  const typeTotal = typeMix.reduce((s, d) => s + d.value, 0);
  const directionTotal = directionMix.reduce((s, d) => s + d.value, 0);

  const expenseTrend = stats?.expenseTrendPercent ?? 0;
  const expenseTrendUp = expenseTrend >= 0;

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>

        {/* Gross P&L strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {kpis.map((k, i) => (
            <div
              key={k.title}
              className={`bg-card rounded-lg border border-border ${k.borderColor} border-l-4 p-4 shadow-sm hover:shadow-md transition-shadow animate-fade-in`}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <p className={`text-xs font-semibold uppercase tracking-wide ${k.labelColor}`}>
                    {k.title}
                  </p>
                  <p className="text-2xl font-bold text-foreground mt-1 truncate">
                    {isLoading ? <Loader2 className="h-6 w-6 animate-spin inline" /> : k.value}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{k.label}</p>
                </div>
                <div className="p-2 bg-muted rounded-lg opacity-50 shrink-0">
                  <k.icon className="text-muted-foreground" size={20} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Net P&L strip — OpEx, Net Profit, Net Margin */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {netKpis.map((k, i) => (
            <div
              key={k.title}
              className={`bg-card rounded-lg border border-border ${k.borderColor} border-l-4 p-4 shadow-sm hover:shadow-md transition-shadow animate-fade-in`}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <p className={`text-xs font-semibold uppercase tracking-wide ${k.labelColor}`}>
                    {k.title}
                  </p>
                  <p className="text-2xl font-bold text-foreground mt-1 truncate">
                    {isLoading ? <Loader2 className="h-6 w-6 animate-spin inline" /> : k.value}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{k.label}</p>
                </div>
                <div className="p-2 bg-muted rounded-lg opacity-50 shrink-0">
                  <k.icon className="text-muted-foreground" size={20} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Date range */}
        <div className="flex justify-start items-center gap-2">
          <DateRangePicker value={dateRange} onApply={setDateRange} className="w-[280px]" />
          <Button variant="outline" size="sm" className="gap-1" onClick={handleSearch}>
            <Search size={14} />
            Search
          </Button>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
            Failed to load dashboard data: {error.message}
          </div>
        )}

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Monthly P&L bar chart */}
          <div className="lg:col-span-2 bg-card rounded-lg border border-border shadow-sm p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Monthly P and L Report
                </p>
                <h3 className="text-lg font-semibold text-foreground mt-1">
                  Revenue versus direct cost with GP by month
                </h3>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-1 rounded">
                ● Finance
              </span>
            </div>
            <div className="h-[340px]">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : monthlyPnl.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No P&amp;L data available for the selected period
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyPnl} margin={{ top: 30, right: 20, left: 0, bottom: 0 }} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                      tickFormatter={(v: number) => compactNumber(v)}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number, name: string) => [formatCurrency(value, currency), name]}
                    />
                    <Legend
                      verticalAlign="bottom"
                      iconType="circle"
                      wrapperStyle={{ paddingTop: "8px", fontSize: "12px" }}
                    />
                    <Bar dataKey="revenue" name="Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={28}>
                      <LabelList
                        dataKey="grossProfit"
                        position="top"
                        content={(props) => <GpLabel {...(props as GpLabelProps)} currency={currency} />}
                      />
                    </Bar>
                    <Bar dataKey="directCost" name="Direct Cost" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={28} />
                    {/* Hidden bar to keep GP visible in legend */}
                    <Bar dataKey="grossProfit" name="Gross Profit" fill="#10b981" maxBarSize={0} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Right column: donuts + highlights */}
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <DonutKpi
                title="Shipment Type Mix"
                data={typeMix}
                total={typeTotal}
                isLoading={isLoading}
              />
              <DonutKpi
                title="Direction Mix"
                data={directionMix}
                total={directionTotal}
                isLoading={isLoading}
              />
            </div>

            <div className="bg-card rounded-lg border border-border shadow-sm p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                P and L Highlights
              </p>
              <div className="grid grid-cols-3 gap-3">
                <HighlightCard
                  label="Best Lane"
                  value={
                    stats?.bestLane
                      ? `${stats.bestLane.from} → ${stats.bestLane.to}`
                      : "—"
                  }
                  sub={
                    stats?.bestLane
                      ? `${stats.bestLane.grossMarginPercent.toFixed(1)}% GP margin`
                      : ""
                  }
                  isLoading={isLoading}
                />
                <HighlightCard
                  label="Top Customer"
                  value={stats?.topCustomer?.name ?? "—"}
                  sub={
                    stats?.topCustomer
                      ? `${currency} ${compactNumber(stats.topCustomer.revenue)} revenue`
                      : ""
                  }
                  isLoading={isLoading}
                />
                <HighlightCard
                  label="Expense Trend"
                  value={
                    isLoading
                      ? ""
                      : `${expenseTrendUp ? "+" : ""}${expenseTrend.toFixed(1)}%`
                  }
                  sub="Latest month vs prior (calendar)"
                  trendUp={expenseTrendUp}
                  isLoading={isLoading}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

// ---- Helpers / sub-components ----

function compactNumber(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toFixed(0);
}

function formatCurrency(value: number, currency: string): string {
  return `${currency} ${compactNumber(value)}`;
}

interface GpLabelProps {
  x?: number;
  y?: number;
  width?: number;
  value?: number;
}

function GpLabel({ x = 0, y = 0, width = 0, value = 0, currency }: GpLabelProps & { currency: string }) {
  const cx = x + width / 2;
  const cy = y - 14;
  const text = `GP ${compactNumber(value)}`;
  const textWidth = Math.max(46, text.length * 6);
  return (
    <g>
      <rect
        x={cx - textWidth / 2}
        y={cy - 10}
        width={textWidth}
        height={18}
        rx={9}
        fill="#ecfdf5"
        stroke="#10b981"
      />
      <text x={cx} y={cy + 3} textAnchor="middle" fontSize={10} fill="#059669" fontWeight={600}>
        {text}
      </text>
    </g>
  );
}

function DonutKpi({
  title,
  data,
  total,
  isLoading,
}: {
  title: string;
  data: ShipmentDistribution[];
  total: number;
  isLoading: boolean;
}) {
  return (
    <div className="bg-card rounded-lg border border-border shadow-sm p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
        {title}
      </p>
      <div className="relative h-[140px]">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
            No data
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={62}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {data.map((entry, idx) => (
                    <Cell key={`${title}-${idx}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-bold text-foreground leading-none">{total}</span>
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground mt-1">
                Shipments
              </span>
            </div>
          </>
        )}
      </div>
      {!isLoading && data.length > 0 && (
        <ul className="mt-3 space-y-1">
          {data.map((d) => (
            <li key={d.name} className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2">
                <span
                  className="inline-block w-2 h-2 rounded-full"
                  style={{ backgroundColor: d.color }}
                />
                <span className="text-muted-foreground">{d.name}</span>
              </span>
              <span className="font-medium text-foreground">{d.value}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function HighlightCard({
  label,
  value,
  sub,
  trendUp,
  isLoading,
}: {
  label: string;
  value: string;
  sub: string;
  trendUp?: boolean;
  isLoading: boolean;
}) {
  return (
    <div className="rounded-md border border-border bg-muted/30 p-3">
      <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mt-1" />
      ) : (
        <>
          <p className="text-sm font-bold text-foreground mt-1 flex items-center gap-1">
            {trendUp !== undefined &&
              (trendUp ? (
                <TrendingUp size={14} className="text-emerald-600" />
              ) : (
                <TrendingDown size={14} className="text-red-600" />
              ))}
            <span className="truncate">{value}</span>
          </p>
          {sub && <p className="text-[10px] text-muted-foreground mt-1 truncate">{sub}</p>}
        </>
      )}
    </div>
  );
}

export default Dashboard;
