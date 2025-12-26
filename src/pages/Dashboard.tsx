import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Calendar, Search, Package, TrendingUp, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip } from "recharts";

// Monthly shipment data for area chart
const monthlyShipmentData = [
  { month: "JAN", shipments: 65 },
  { month: "FEB", shipments: 59 },
  { month: "MAR", shipments: 30 },
  { month: "APR", shipments: 71 },
  { month: "MAY", shipments: 56 },
  { month: "JUN", shipments: 25 },
  { month: "JUL", shipments: 40 },
  { month: "AUG", shipments: 55 },
  { month: "SEP", shipments: 70 },
  { month: "OCT", shipments: 60 },
  { month: "NOV", shipments: 35 },
  { month: "DEC", shipments: 48 },
];

// Pie chart data - shipment distribution
const pieChartData = [
  { name: "43", value: 43, color: "#2ecc71" },
  { name: "67", value: 67, color: "#3498db" },
  { name: "54", value: 54, color: "#9b59b6" },
  { name: "28", value: 28, color: "#1abc9c" },
  { name: "71", value: 71, color: "#e74c3c" },
  { name: "64", value: 64, color: "#f39c12" },
  { name: "34", value: 34, color: "#e91e63" },
  { name: "51", value: 51, color: "#00bcd4" },
  { name: "71", value: 71, color: "#ff5722" },
  { name: "59", value: 59, color: "#795548" },
  { name: "65", value: 65, color: "#607d8b" },
];

const chartConfig = {
  shipments: {
    label: "Shipments",
    color: "hsl(var(--primary))",
  },
};

const Dashboard = () => {
  const [dateRange, setDateRange] = useState("January 1, 2025 - December 31, 2025");

  const stats = [
    {
      title: "IN PROCESS",
      value: "2364",
      label: "Shipments",
      color: "border-l-emerald-500",
      bgColor: "bg-card",
      icon: TrendingUp,
    },
    {
      title: "COMPLETED",
      value: "71",
      label: "Shipments",
      color: "border-l-amber-500",
      bgColor: "bg-card",
      icon: CheckCircle,
    },
    {
      title: "TOTAL",
      value: "2446",
      label: "Shipments",
      color: "border-l-red-500",
      bgColor: "bg-card",
      icon: Package,
    },
    {
      title: "PENDING",
      value: "11",
      label: "Shipments",
      color: "border-l-yellow-500",
      bgColor: "bg-card",
      icon: Clock,
    },
  ];

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
                    {stat.value} <span className="text-base font-normal text-muted-foreground">{stat.label}</span>
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
          <div className="flex items-center gap-2 border border-border rounded-md px-3 py-2 bg-card">
            <Calendar size={16} className="text-muted-foreground" />
            <Input
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="border-0 p-0 h-auto bg-transparent focus-visible:ring-0 w-[220px] text-sm"
              placeholder="Select date range"
            />
          </div>
          <Button variant="outline" size="sm" className="gap-1">
            <Search size={14} />
            Search
          </Button>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Area Chart - No of Shipments */}
          <div className="lg:col-span-2 bg-card rounded-lg border border-border shadow-sm p-4">
            <h3 className="text-emerald-600 font-semibold mb-4">No of Shipments</h3>
            <div className="h-[350px]">
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
                    domain={[0, 80]}
                    ticks={[0, 20, 40, 60, 80]}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
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
            </div>
          </div>

          {/* Pie Chart - Shipment Distribution */}
          <div className="bg-card rounded-lg border border-border shadow-sm p-4">
            <h3 className="text-emerald-600 font-semibold mb-4">No of Shipments</h3>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    innerRadius={0}
                    dataKey="value"
                    label={({ name }) => name}
                    labelLine={true}
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
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
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
