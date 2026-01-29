import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Calendar as CalendarIcon, Search, Package, TrendingUp, CheckCircle, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip } from "recharts";
import { useDashboardStats } from "@/hooks/useDashboard";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";

const Dashboard = () => {
  const currentYear = new Date().getFullYear();
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(currentYear, 0, 1),
    to: new Date(currentYear, 11, 31),
  });
  const [appliedDateRange, setAppliedDateRange] = useState<{ fromDate?: string; toDate?: string }>({
    fromDate: `${currentYear}-01-01`,
    toDate: `${currentYear}-12-31`,
  });

  const { data: dashboardStats, isLoading, error } = useDashboardStats(appliedDateRange);

  const handleSearch = () => {
    setAppliedDateRange({
      fromDate: dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
      toDate: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
    });
  };

  const stats = [
    {
      title: "IN PROCESS",
      value: dashboardStats?.inProcess ?? 0,
      label: "Shipments",
      color: "border-l-emerald-500",
      bgColor: "bg-card",
      icon: TrendingUp,
    },
    {
      title: "COMPLETED",
      value: dashboardStats?.completed ?? 0,
      label: "Shipments",
      color: "border-l-amber-500",
      bgColor: "bg-card",
      icon: CheckCircle,
    },
    {
      title: "TOTAL",
      value: dashboardStats?.total ?? 0,
      label: "Shipments",
      color: "border-l-red-500",
      bgColor: "bg-card",
      icon: Package,
    },
    {
      title: "PENDING",
      value: dashboardStats?.pending ?? 0,
      label: "Shipments",
      color: "border-l-yellow-500",
      bgColor: "bg-card",
      icon: Clock,
    },
  ];

  const monthlyShipmentData = dashboardStats?.monthlyShipments ?? [];
  const modeDistribution = dashboardStats?.modeDistribution ?? [];
  const directionDistribution = dashboardStats?.directionDistribution ?? [];

  const maxShipments = Math.max(...monthlyShipmentData.map(d => d.shipments), 80);
  const yAxisMax = Math.ceil(maxShipments / 20) * 20;

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <div
              key={stat.title}
              className={`${stat.bgColor} rounded-lg border border-border ${stat.color} border-l-4 p-4 shadow-sm hover:shadow-md transition-shadow animate-fade-in`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-wide ${
                    stat.title === "IN PROCESS" ? "text-emerald-600" :
                    stat.title === "COMPLETED" ? "text-amber-600" :
                    stat.title === "TOTAL" ? "text-red-600" :
                    "text-yellow-600"
                  }`}>
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {isLoading ? (
                      <Loader2 className="h-6 w-6 animate-spin inline" />
                    ) : (
                      <>
                        {stat.value} <span className="text-base font-normal text-muted-foreground">{stat.label}</span>
                      </>
                    )}
                  </p>
                </div>
                <div className="p-2 bg-muted rounded-lg opacity-50">
                  <stat.icon className="text-muted-foreground" size={24} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Date Range Filter */}
        <div className="flex justify-end items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[280px] justify-start text-left font-normal",
                  !dateRange && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "MMM d, yyyy")} - {format(dateRange.to, "MMM d, yyyy")}
                    </>
                  ) : (
                    format(dateRange.from, "MMM d, yyyy")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
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

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Area Chart - No of Shipments */}
          <div className="lg:col-span-2 bg-card rounded-lg border border-border shadow-sm p-4">
            <h3 className="text-emerald-600 font-semibold mb-4">No of Shipments</h3>
            <div className="h-[350px]">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : monthlyShipmentData.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No shipment data available for the selected period
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyShipmentData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorShipments" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6b9bd1" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#6b9bd1" stopOpacity={0.2}/>
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      domain={[0, yAxisMax]}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => [value, 'Shipments']}
                    />
                    <Area
                      type="monotone"
                      dataKey="shipments"
                      stroke="#6b9bd1"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorShipments)"
                      name="Shipments"
                      dot={{ fill: '#6b9bd1', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, fill: '#6b9bd1' }}
                    />
                    <Legend
                      verticalAlign="top"
                      align="right"
                      wrapperStyle={{ paddingBottom: '20px' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Pie Charts Container */}
          <div className="space-y-6">
            {/* Mode Distribution Pie Chart */}
            <div className="bg-card rounded-lg border border-border shadow-sm p-4">
              <h3 className="text-emerald-600 font-semibold mb-4">By Mode</h3>
              <div className="h-[160px]">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : modeDistribution.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                    No data
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={modeDistribution}
                        cx="50%"
                        cy="50%"
                        outerRadius={50}
                        innerRadius={0}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                        labelLine={false}
                      >
                        {modeDistribution.map((entry, index) => (
                          <Cell key={`cell-mode-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Direction Distribution Pie Chart */}
            <div className="bg-card rounded-lg border border-border shadow-sm p-4">
              <h3 className="text-emerald-600 font-semibold mb-4">By Direction</h3>
              <div className="h-[160px]">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : directionDistribution.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                    No data
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={directionDistribution}
                        cx="50%"
                        cy="50%"
                        outerRadius={50}
                        innerRadius={0}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                        labelLine={false}
                      >
                        {directionDistribution.map((entry, index) => (
                          <Cell key={`cell-dir-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
