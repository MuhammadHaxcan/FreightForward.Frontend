import { useState, useEffect, useMemo } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
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
  ChevronLeft,
  ChevronDown,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface SubMenuItem {
  title: string;
  path: string;
  permission?: string;
}

interface SidebarItem {
  title: string;
  icon: React.ElementType;
  path: string;
  permission?: string;
  hasSubmenu?: boolean;
  subMenuItems?: SubMenuItem[];
}

const allSidebarItems: SidebarItem[] = [
  { title: "Dashboard", icon: LayoutDashboard, path: "/", permission: "dash_view" },
  {
    title: "Shipments",
    icon: Truck,
    path: "/shipments",
    permission: "ship_view",
    hasSubmenu: true,
    subMenuItems: [
      { title: "Shipments", path: "/shipments", permission: "ship_view" },
      { title: "Add New", path: "/shipments/add", permission: "ship_add" },
    ]
  },
  { title: "Master Customers", icon: Users, path: "/master-customers", permission: "cust_view" },
  {
    title: "Sales",
    icon: TrendingUp,
    path: "/sales",
    hasSubmenu: true,
    subMenuItems: [
      { title: "Leads", path: "/sales/leads", permission: "leads_view" },
      { title: "Rate Requests", path: "/sales/rate-requests", permission: "ratereq_view" },
      { title: "Quotations", path: "/sales/quotations", permission: "quot_view" },
    ]
  },
  {
    title: "Accounts",
    icon: Wallet,
    path: "/accounts",
    hasSubmenu: true,
    subMenuItems: [
      { title: "Invoices", path: "/accounts/invoices", permission: "invoice_view" },
      { title: "Purchase Invoices", path: "/accounts/purchase-invoices", permission: "invoice_view" },
      { title: "Receipt Vouchers", path: "/accounts/receipt-vouchers", permission: "receipt_view" },
      { title: "Payment Vouchers", path: "/accounts/payment-vouchers", permission: "paymentvoucher_view" },
      { title: "Daily Expenses", path: "/accounts/daily-expenses", permission: "expense_view" },
      { title: "Cost Sheet", path: "/accounts/cost-sheet", permission: "ship_view" },
      { title: "VAT Report", path: "/accounts/vat-report", permission: "invoice_view" },
    ]
  },
  {
    title: "Users",
    icon: UserCircle,
    path: "/users",
    hasSubmenu: true,
    subMenuItems: [
      { title: "All Users", path: "/users/all", permission: "user_view" },
      { title: "Permission Roles", path: "/users/roles", permission: "role_view" },
    ]
  },
  { title: "General Document", icon: FileText, path: "/general-document" },
  { title: "Settings", icon: Settings, path: "/settings" },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, hasPermission } = useAuth();

  // Filter sidebar items based on permissions
  const sidebarItems = useMemo(() => {
    return allSidebarItems.map(item => {
      // Filter sub-items based on permissions
      if (item.subMenuItems) {
        const filteredSubItems = item.subMenuItems.filter(
          subItem => !subItem.permission || hasPermission(subItem.permission)
        );

        // Only show parent if it has visible sub-items or no permission required
        if (filteredSubItems.length === 0 && item.subMenuItems.length > 0) {
          return null;
        }

        return { ...item, subMenuItems: filteredSubItems };
      }

      // Check permission for items without sub-menus
      if (item.permission && !hasPermission(item.permission)) {
        return null;
      }

      return item;
    }).filter((item): item is SidebarItem => item !== null);
  }, [hasPermission]);

  // Auto-expand parent menu based on current path on mount and path change
  useEffect(() => {
    const currentPath = location.pathname;
    const parentToExpand = sidebarItems.find(item =>
      item.subMenuItems?.some(sub =>
        currentPath === sub.path || currentPath.startsWith(sub.path + "/")
      )
    );

    if (parentToExpand && !expandedMenus.includes(parentToExpand.title)) {
      setExpandedMenus(prev => [...prev, parentToExpand.title]);
    }
  }, [location.pathname, sidebarItems]);

  const toggleSubmenu = (title: string) => {
    // If sidebar is collapsed, expand it and open the dropdown
    if (collapsed) {
      setCollapsed(false);
      // Ensure the menu is expanded
      if (!expandedMenus.includes(title)) {
        setExpandedMenus(prev => [...prev, title]);
      }
      return;
    }

    // Normal toggle behavior when sidebar is expanded
    setExpandedMenus(prev =>
      prev.includes(title)
        ? prev.filter(t => t !== title)
        : [...prev, title]
    );
  };

  const isMenuActive = (item: SidebarItem) => {
    const currentPath = location.pathname;
    if (item.subMenuItems) {
      return item.subMenuItems.some(sub =>
        currentPath === sub.path || currentPath.startsWith(sub.path + "/")
      );
    }
    return currentPath === item.path || currentPath.startsWith(item.path + "/");
  };

  const isSubItemActive = (subPath: string, siblings: SubMenuItem[]) => {
    const currentPath = location.pathname;

    // Exact match always wins
    if (currentPath === subPath) return true;

    // Check if current path exactly matches any sibling - if so, don't use startsWith
    const matchesSibling = siblings.some(s => currentPath === s.path);
    if (matchesSibling) return false;

    // No sibling exact match - check if this is a parent of current path (e.g., /invoices/123)
    return currentPath.startsWith(subPath + "/");
  };

  const handleLogout = async () => {
    await logout();
  };

  // Get primary role for badge
  const primaryRole = user?.roles?.[0] || 'User';

  return (
    <aside
      className={cn(
        "h-screen bg-sidebar flex flex-col transition-all duration-300 sticky top-0",
        collapsed ? "w-16" : "w-56"
      )}
    >
      {/* Header */}
      <div className={cn(
        "flex items-center border-b border-sidebar-border",
        collapsed ? "justify-center p-3" : "justify-between p-4"
      )}>
        {collapsed ? (
          <img
            src="/icon.png"
            alt="TFS"
            className="h-8 w-8 object-contain cursor-pointer"
            onClick={() => setCollapsed(false)}
          />
        ) : (
          <>
            <div className="flex items-center gap-2 animate-fade-in">
              <img
                src="/icon.png"
                alt="TFS"
                className="h-9 w-9 object-contain"
              />
              <img
                src="/logo-black.png"
                alt="Transparent Freight Services"
                className="h-8 w-auto object-contain"
              />
            </div>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-2 rounded-md hover:bg-sidebar-accent text-sidebar-foreground transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
          </>
        )}
      </div>

      {/* User Info */}
      {user && (
        <div className={cn(
          "border-b border-sidebar-border",
          collapsed ? "px-2 py-3 flex justify-center" : "px-4 py-3"
        )}>
          <button
            onClick={() => navigate('/profile')}
            className={cn(
              "hover:opacity-80 transition-opacity",
              collapsed ? "flex justify-center" : "flex items-center gap-3 w-full text-left"
            )}
          >
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.profilePictureUrl} alt={user.fullName} />
              <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-sm font-medium">
                {user.firstName?.[0]}{user.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {user.fullName}
                </p>
                <Badge variant="secondary" className="text-xs mt-0.5">
                  {primaryRole}
                </Badge>
              </div>
            )}
          </button>
        </div>
      )}

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
                        {item.subMenuItems.map((subItem) => (
                            <li key={subItem.path}>
                              <NavLink
                                to={subItem.path}
                                className={cn(
                                  "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-all duration-200",
                                  isSubItemActive(subItem.path, item.subMenuItems!)
                                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                                )}
                              >
                                {subItem.title}
                              </NavLink>
                            </li>
                          ))}
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
          onClick={handleLogout}
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
