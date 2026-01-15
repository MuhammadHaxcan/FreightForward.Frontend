import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Truck,
  Users,
  TrendingUp,
  Wallet,
  UserCircle,
  FileText,
  Settings,
  LogOut,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SubMenuItem {
  title: string;
  path: string;
}

interface SidebarItem {
  title: string;
  icon: React.ElementType;
  path: string;
  hasSubmenu?: boolean;
  subMenuItems?: SubMenuItem[];
}

const sidebarItems: SidebarItem[] = [
  { title: "Dashboard", icon: LayoutDashboard, path: "/" },
  { 
    title: "Shipments", 
    icon: Truck, 
    path: "/shipments", 
    hasSubmenu: true,
    subMenuItems: [
      { title: "Shipments", path: "/shipments" },
      { title: "Add New", path: "/shipments/add" },
    ]
  },
  { title: "Master Customers", icon: Users, path: "/master-customers" },
  { 
    title: "Sales", 
    icon: TrendingUp, 
    path: "/sales", 
    hasSubmenu: true,
    subMenuItems: [
      { title: "Leads", path: "/sales/leads" },
      { title: "Rate Requests", path: "/sales/rate-requests" },
      { title: "Quotations", path: "/sales/quotations" },
    ]
  },
  {
    title: "Accounts",
    icon: Wallet,
    path: "/accounts",
    hasSubmenu: true,
    subMenuItems: [
      { title: "Invoices", path: "/accounts/invoices" },
      { title: "Purchase Invoices", path: "/accounts/purchase-invoices" },
      { title: "Receipt Vouchers", path: "/accounts/receipt-vouchers" },
      { title: "Payment Vouchers", path: "/accounts/payment-vouchers" },
      { title: "Daily Expenses", path: "/accounts/daily-expenses" },
      { title: "Cost Sheet", path: "/accounts/cost-sheet" },
    ]
  },
  {
    title: "Users",
    icon: UserCircle,
    path: "/users",
    hasSubmenu: true,
    subMenuItems: [
      { title: "All Users", path: "/users/all" },
      { title: "Permission Roles", path: "/users/roles" },
    ]
  },
  { title: "General Document", icon: FileText, path: "/general-document" },
  { title: "Settings", icon: Settings, path: "/settings" },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const location = useLocation();

  const toggleSubmenu = (title: string) => {
    setExpandedMenus(prev =>
      prev.includes(title)
        ? prev.filter(t => t !== title)
        : [...prev, title]
    );
  };

  const isMenuActive = (item: SidebarItem) => {
    if (item.subMenuItems) {
      return item.subMenuItems.some(sub => location.pathname === sub.path);
    }
    return location.pathname === item.path;
  };

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
            FreightFlow
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "p-2 rounded-md hover:bg-sidebar-accent text-sidebar-foreground transition-colors",
            collapsed && "mx-auto"
          )}
        >
          {collapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {sidebarItems.map((item) => {
            const isActive = isMenuActive(item);
            const isExpanded = expandedMenus.includes(item.title);
            const hasSubItems = item.subMenuItems && item.subMenuItems.length > 0;

            return (
              <li key={item.path}>
                {hasSubItems ? (
                  <>
                    <button
                      onClick={() => toggleSubmenu(item.title)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-md text-sidebar-foreground transition-all duration-200 w-full",
                        isActive
                          ? "bg-sidebar-accent border-l-4 border-sidebar-primary text-sidebar-primary"
                          : "hover:bg-sidebar-accent"
                      )}
                    >
                      <item.icon size={20} className="flex-shrink-0" />
                      {!collapsed && (
                        <>
                          <span className="flex-1 text-sm font-medium animate-fade-in text-left">
                            {item.title}
                          </span>
                          <ChevronDown
                            size={16}
                            className={cn(
                              "text-sidebar-muted transition-transform",
                              isExpanded && "rotate-180"
                            )}
                          />
                        </>
                      )}
                    </button>
                    {!collapsed && isExpanded && (
                      <ul className="ml-6 mt-1 space-y-1">
                        {item.subMenuItems.map((subItem) => {
                          const isSubActive = location.pathname === subItem.path;
                          return (
                            <li key={subItem.path}>
                              <NavLink
                                to={subItem.path}
                                className={cn(
                                  "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-all duration-200",
                                  isSubActive
                                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                                )}
                              >
                                {subItem.title}
                              </NavLink>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </>
                ) : (
                  <NavLink
                    to={item.path}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-md text-sidebar-foreground transition-all duration-200",
                      location.pathname === item.path
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
                    {!collapsed && item.hasSubmenu && !hasSubItems && (
                      <ChevronRight size={16} className="text-sidebar-muted" />
                    )}
                  </NavLink>
                )}
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
