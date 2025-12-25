import { MainLayout } from "@/components/layout/MainLayout";
import { 
  Truck, 
  Users, 
  Building2, 
  DollarSign,
  TrendingUp,
  Package,
  Clock,
  CheckCircle
} from "lucide-react";

const stats = [
  { title: "Total Shipments", value: "1,234", icon: Truck, change: "+12.5%", changeType: "positive" },
  { title: "Active Customers", value: "856", icon: Users, change: "+8.2%", changeType: "positive" },
  { title: "Companies", value: "45", icon: Building2, change: "+3", changeType: "positive" },
  { title: "Revenue", value: "$124,500", icon: DollarSign, change: "+15.3%", changeType: "positive" },
];

const recentActivity = [
  { id: 1, action: "New shipment created", company: "TFS Global", time: "2 mins ago", icon: Package },
  { id: 2, action: "Customer registered", company: "ABC Logistics", time: "15 mins ago", icon: Users },
  { id: 3, action: "Payment received", company: "XYZ Trading", time: "1 hour ago", icon: DollarSign },
  { id: 4, action: "Shipment delivered", company: "Fast Freight", time: "2 hours ago", icon: CheckCircle },
];

const Dashboard = () => {
  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back! Here's your overview.</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock size={16} />
            <span>Last updated: Just now</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div
              key={stat.title}
              className="bg-card rounded-lg border border-border p-6 shadow-sm hover:shadow-md transition-shadow animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                </div>
                <div className="p-3 bg-accent rounded-lg">
                  <stat.icon className="text-primary" size={24} />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1">
                <TrendingUp size={14} className="text-primary" />
                <span className="text-sm text-primary font-medium">{stat.change}</span>
                <span className="text-sm text-muted-foreground">vs last month</span>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="bg-card rounded-lg border border-border shadow-sm">
          <div className="p-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">Recent Activity</h2>
          </div>
          <div className="divide-y divide-border">
            {recentActivity.map((activity, index) => (
              <div
                key={activity.id}
                className="p-4 flex items-center gap-4 hover:bg-secondary/50 transition-colors animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="p-2 bg-accent rounded-lg">
                  <activity.icon size={18} className="text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{activity.action}</p>
                  <p className="text-sm text-muted-foreground">{activity.company}</p>
                </div>
                <span className="text-xs text-muted-foreground">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
