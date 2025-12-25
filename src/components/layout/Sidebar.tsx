import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Truck,
  Users,
  TrendingUp,
  Wallet,
  UserCircle,
  Building2,
  Landmark,
  FileText,
  Settings,
  LogOut,
  ChevronRight,
  ChevronLeft,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarItem {
  title: string;
  icon: React.ElementType;
  path: string;
  hasSubmenu?: boolean;
}

const sidebarItems: SidebarItem[] = [
  { title: "Dashboard", icon: LayoutDashboard, path: "/" },
  { title: "Shipments", icon: Truck, path: "/shipments", hasSubmenu: true },
  { title: "Master Customers", icon: Users, path: "/master-customers" },
  { title: "Sales", icon: TrendingUp, path: "/sales", hasSubmenu: true },
  { title: "Accounts", icon: Wallet, path: "/accounts", hasSubmenu: true },
  { title: "Users", icon: UserCircle, path: "/users", hasSubmenu: true },
  { title: "Companies", icon: Building2, path: "/companies" },
  { title: "Banks", icon: Landmark, path: "/banks" },
  { title: "General Document", icon: FileText, path: "/general-document" },
  { title: "Settings", icon: Settings, path: "/settings" },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <aside
      className={cn(
        "h-screen bg-sidebar flex flex-col transition-all duration-300 sticky top-0",
        collapsed ? "w-16" : "w-56"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        {!collapsed && (
          <span className="text-sidebar-foreground font-semibold text-lg animate-fade-in">
            Admin Panel
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-md hover:bg-sidebar-accent text-sidebar-foreground transition-colors"
        >
          {collapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {sidebarItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-md text-sidebar-foreground transition-all duration-200",
                    isActive
                      ? "bg-sidebar-accent border-l-4 border-sidebar-primary text-sidebar-primary"
                      : "hover:bg-sidebar-accent"
                  )}
                >
                  <item.icon size={20} className="flex-shrink-0" />
                  {!collapsed && (
                    <span className="flex-1 text-sm font-medium animate-fade-in">
                      {item.title}
                    </span>
                  )}
                  {!collapsed && item.hasSubmenu && (
                    <ChevronRight size={16} className="text-sidebar-muted" />
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-2 border-t border-sidebar-border">
        <button
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-md text-sidebar-foreground hover:bg-sidebar-accent transition-all duration-200 w-full"
          )}
        >
          <LogOut size={20} className="flex-shrink-0" />
          {!collapsed && (
            <span className="text-sm font-medium animate-fade-in">Logout</span>
          )}
        </button>
      </div>
    </aside>
  );
}
