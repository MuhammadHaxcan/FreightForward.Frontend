import { MainLayout } from "@/components/layout/MainLayout";
import { Users, Search, Plus, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const customers = [
  { id: 1, name: "John Smith", company: "ABC Logistics", email: "john@abc.com", phone: "+1-555-0123" },
  { id: 2, name: "Sarah Johnson", company: "XYZ Trading", email: "sarah@xyz.com", phone: "+1-555-0124" },
  { id: 3, name: "Michael Brown", company: "Fast Freight Inc", email: "michael@ff.com", phone: "+1-555-0125" },
  { id: 4, name: "Emily Davis", company: "Global Shipping", email: "emily@gs.com", phone: "+1-555-0126" },
];

const MasterCustomers = () => {
  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Master Customers</h1>
            <p className="text-muted-foreground">Manage your customer database</p>
          </div>
          <Button className="btn-success gap-2">
            <Plus size={16} />
            Add Customer
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search customers..." className="pl-10" />
        </div>

        {/* Customers Table */}
        <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-table-header text-table-header-foreground">
                <th className="px-4 py-3 text-left text-sm font-semibold">Customer</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Company</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Email</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Phone</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer, index) => (
                <tr
                  key={customer.id}
                  className={`border-b border-border hover:bg-table-row-hover transition-colors ${
                    index % 2 === 0 ? "bg-card" : "bg-secondary/30"
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {customer.name.charAt(0)}
                        </span>
                      </div>
                      <span className="font-medium text-foreground">{customer.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{customer.company}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail size={14} />
                      {customer.email}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone size={14} />
                      {customer.phone}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </MainLayout>
  );
};

export default MasterCustomers;
