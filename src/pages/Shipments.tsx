import { MainLayout } from "@/components/layout/MainLayout";
import { Truck, Package, MapPin, Calendar, Search, Filter, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const shipments = [
  { id: "SHP001", origin: "Dubai, UAE", destination: "London, UK", status: "In Transit", date: "2024-01-15" },
  { id: "SHP002", origin: "New York, USA", destination: "Tokyo, Japan", status: "Delivered", date: "2024-01-14" },
  { id: "SHP003", origin: "Singapore", destination: "Sydney, Australia", status: "Pending", date: "2024-01-16" },
  { id: "SHP004", origin: "Mumbai, India", destination: "Frankfurt, Germany", status: "In Transit", date: "2024-01-15" },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "Delivered":
      return "bg-primary/10 text-primary";
    case "In Transit":
      return "bg-info/10 text-info";
    case "Pending":
      return "bg-warning/10 text-warning";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const Shipments = () => {
  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Shipments</h1>
            <p className="text-muted-foreground">Manage and track all shipments</p>
          </div>
          <Button className="btn-success gap-2">
            <Plus size={16} />
            New Shipment
          </Button>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search shipments..." className="pl-10" />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter size={16} />
            Filters
          </Button>
        </div>

        {/* Shipments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {shipments.map((shipment, index) => (
            <div
              key={shipment.id}
              className="bg-card rounded-lg border border-border p-5 shadow-sm hover:shadow-md transition-all hover:border-primary/30 animate-fade-in cursor-pointer"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-accent rounded-lg">
                    <Truck size={18} className="text-primary" />
                  </div>
                  <span className="font-semibold text-foreground">{shipment.id}</span>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${getStatusColor(shipment.status)}`}>
                  {shipment.status}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin size={14} className="text-muted-foreground" />
                  <span className="text-muted-foreground">From:</span>
                  <span className="text-foreground">{shipment.origin}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin size={14} className="text-primary" />
                  <span className="text-muted-foreground">To:</span>
                  <span className="text-foreground">{shipment.destination}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar size={14} className="text-muted-foreground" />
                  <span className="text-muted-foreground">{shipment.date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
};

export default Shipments;
