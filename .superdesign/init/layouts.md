# Shared Layouts

## MainLayout

- Path: `src/components/layout/MainLayout.tsx`
- Description: Desktop/mobile app shell: persistent collapsible sidebar, scrollable content, and floating CBM calculator.

```tsx
import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { CBMCalculatorWidget } from "@/components/CBMCalculatorWidget";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      {/* pt-14 on mobile clears the fixed top app bar rendered by <Sidebar /> */}
      <main className="flex-1 overflow-auto pt-14 lg:pt-0 min-w-0">
        {children}
      </main>
      <CBMCalculatorWidget />
    </div>
  );
}
```

## Sidebar

- Path: `src/components/layout/Sidebar.tsx`
- Description: WayBill deep-teal responsive navigation with logo, office/user identity, permission-filtered menus, active shipment submenu, and logout.

```tsx
import { useState, useEffect, useMemo } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Radar,
  Container,
  Globe,
  Handshake,
  ReceiptText,
  UserCog,
  IdCard,
  FileText,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronDown,
  Menu,
  X,
  TriangleAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BRAND } from "@/config/branding";

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
  { title: "Dashboard", icon: Radar, path: "/", permission: "dash_view" },
  { title: "Exceptions", icon: TriangleAlert, path: "/exceptions", permission: "dash_view" },
  {
    title: "Shipments",
    icon: Container,
    path: "/shipments",
    permission: "ship_view",
    hasSubmenu: true,
    subMenuItems: [
      { title: "Shipments", path: "/shipments", permission: "ship_view" },
      { title: "Add New", path: "/shipments/add", permission: "ship_add" },
      { title: "Bill of Lading", path: "/shipments/bill-of-lading", permission: "bl_view" },
    ]
  },
  { title: "Master Customers", icon: Globe, path: "/master-customers", permission: "cust_view" },
  {
    title: "Sales",
    icon: Handshake,
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
    icon: ReceiptText,
    path: "/accounts",
    hasSubmenu: true,
    subMenuItems: [
      { title: "Invoices", path: "/accounts/invoices", permission: "invoice_view" },
      { title: "Purchase Invoices", path: "/accounts/purchase-invoices", permission: "purchase_view" },
      { title: "Receipt Vouchers", path: "/accounts/receipt-vouchers", permission: "receipt_view" },
      { title: "Payment Vouchers", path: "/accounts/payment-vouchers", permission: "paymentvoucher_view" },
      { title: "Daily Expenses", path: "/accounts/daily-expenses", permission: "expense_view" },
      { title: "Post Dated Cheques", path: "/accounts/post-dated-cheques", permission: "pdc_view" },
      { title: "Cost Sheet", path: "/accounts/cost-sheet", permission: "ship_view" },
      { title: "VAT Report", path: "/accounts/vat-report", permission: "invoice_view" },
      { title: "Credit Notes", path: "/accounts/credit-notes", permission: "creditnote_view" },
      { title: "Account Receivable", path: "/accounts/account-receivable", permission: "accrec_view" },
      { title: "Account Payable", path: "/accounts/account-payable", permission: "accpay_view" },
    ]
  },
  {
    title: "Users",
    icon: UserCog,
    path: "/users",
    hasSubmenu: true,
    subMenuItems: [
      { title: "All Users", path: "/users/all", permission: "user_view" },
      { title: "Permission Roles", path: "/users/roles", permission: "role_view" },
    ]
  },
  {
    title: "HR",
    icon: IdCard,
    path: "/hr",
    hasSubmenu: true,
    subMenuItems: [
      { title: "Employees", path: "/hr/employees", permission: "hr_emp_view" },
      { title: "Salary Components", path: "/hr/salary-components", permission: "hr_salary_view" },
      { title: "Attendance", path: "/hr/attendance", permission: "hr_attend_view" },
      { title: "Attendance Summary", path: "/hr/attendance-summary", permission: "hr_attend_view" },
      { title: "Payroll", path: "/hr/payroll", permission: "hr_payroll_view" },
      { title: "Advances", path: "/hr/advances", permission: "hr_advance_view" },
    ]
  },
  { title: "General Document", icon: FileText, path: "/general-document" },
  { title: "Settings", icon: Settings, path: "/settings" },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, hasPermission, officeName } = useAuth();

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

  // Close the mobile drawer whenever the route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Lock body scroll while the mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  // Close the mobile drawer on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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
    <>
      {/* Mobile top app bar (hidden on desktop) */}
      <header className="lg:hidden fixed top-0 inset-x-0 z-30 h-14 flex items-center gap-3 px-4 bg-sidebar border-b border-sidebar-border">
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation menu"
          className="p-2 -ml-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent active:bg-sidebar-accent transition-colors"
        >
          <Menu size={22} strokeWidth={1.5} />
        </button>
        <img
          src={BRAND.assets.wordmarkDarkBackground}
          alt={`${BRAND.productName} logo`}
          className="h-8 w-auto rounded-sm"
        />
      </header>

      {/* Backdrop behind the mobile drawer */}
      <div
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
        className={cn(
          "lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300",
          mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      />

      <aside
        className={cn(
          "h-screen bg-sidebar flex flex-col",
          // Mobile: off-canvas drawer that slides in over the content
          "fixed inset-y-0 left-0 z-50 w-72 transition-transform duration-300 ease-in-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          // Desktop: in-flow, sticky, collapsible sidebar
          "lg:sticky lg:top-0 lg:z-auto lg:translate-x-0 lg:transition-[width]",
          collapsed ? "lg:w-16" : "lg:w-56"
        )}
      >
      {/* Header */}
      <div className={cn(
        "flex items-center border-b border-sidebar-border transition-all duration-300 overflow-hidden",
        collapsed ? "justify-center p-3" : "justify-between p-4"
      )}>
        <div
          className={cn(
            "flex items-center cursor-pointer",
            collapsed ? "justify-center" : "flex-1"
          )}
          onClick={() => collapsed && setCollapsed(false)}
        >
          <img
            src={collapsed ? BRAND.assets.iconDarkBackground : BRAND.assets.wordmarkDarkBackground}
            alt={`${BRAND.productName} logo`}
            className={cn(
              "rounded-sm object-contain transition-all duration-300",
              collapsed ? "h-9 w-9" : "w-full h-auto"
            )}
          />
        </div>
        {/* Close drawer (mobile only) */}
        <button
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation menu"
          className="lg:hidden p-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
        >
          <X size={20} strokeWidth={1.5} />
        </button>
        {/* Collapse sidebar (desktop only) */}
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="hidden lg:flex p-2 rounded-md hover:bg-sidebar-accent text-sidebar-foreground transition-colors"
          >
            <ChevronLeft size={20} strokeWidth={1.5} />
          </button>
        )}
      </div>

      {/* Office Name Badge */}
      {officeName && !collapsed && (
        <div className="px-4 py-2 border-b border-sidebar-border">
          <div className="bg-sidebar-primary/10 text-sidebar-primary rounded-md px-3 py-1.5 text-center">
            <span className="text-xs font-medium uppercase tracking-wider">{officeName}</span>
          </div>
        </div>
      )}

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
      <nav className="flex-1 py-4 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
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
                      <item.icon size={20} strokeWidth={1.5} className="flex-shrink-0" />
                      {!collapsed && (
                        <>
                          <span className="flex-1 text-sm font-medium animate-fade-in text-left">
                            {item.title}
                          </span>
                          <ChevronDown
                            size={16}
                            strokeWidth={1.5}
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
                                onClick={() => setMobileOpen(false)}
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
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-md text-sidebar-foreground transition-all duration-200",
                      location.pathname === item.path
                        ? "bg-sidebar-accent border-l-4 border-sidebar-primary text-sidebar-primary"
                        : "hover:bg-sidebar-accent"
                    )}
                  >
                    <item.icon size={20} strokeWidth={1.5} className="flex-shrink-0" />
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
          <LogOut size={20} strokeWidth={1.5} className="flex-shrink-0" />
          {!collapsed && (
            <span className="text-sm font-medium animate-fade-in">Logout</span>
          )}
        </button>
      </div>
      </aside>
    </>
  );
}
```

## CBMCalculatorWidget

- Path: `src/components/CBMCalculatorWidget.tsx`
- Description: Floating utility trigger and calculator overlay available throughout the authenticated app.

```tsx
import { useState } from "react";
import { Package, Plus, X, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type Unit = "cm" | "mm" | "m" | "in" | "ft";
type Mode = "air" | "courier" | "sea_lcl" | "sea_fcl";

interface Row {
  id: string;
  length: string;
  width: string;
  height: string;
  qty: string;
  weight: string;
}

const UNIT_DIVISORS: Record<Unit, number> = {
  cm: 1_000_000,
  mm: 1_000_000_000,
  m: 1,
  in: 61_023.7,
  ft: 35.3147,
};

const CONTAINERS = [
  { name: "20'GP", cbm: 25,  kg: 21_700 },
  { name: "40'GP", cbm: 67,  kg: 26_500 },
  { name: "40'HC", cbm: 76,  kg: 28_690 },
];

const UNITS: Unit[] = ["cm", "mm", "m", "in", "ft"];

const MODES: { value: Mode; label: string }[] = [
  { value: "air", label: "Air" },
  { value: "courier", label: "Courier" },
  { value: "sea_lcl", label: "Sea LCL" },
  { value: "sea_fcl", label: "Sea FCL" },
];

function newRow(): Row {
  return {
    id: Math.random().toString(36).slice(2),
    length: "",
    width: "",
    height: "",
    qty: "1",
    weight: "",
  };
}

function toPositive(val: string): number {
  const n = parseFloat(val);
  return isNaN(n) || n < 0 ? 0 : n;
}

function calcRowCbm(row: Row, unit: Unit): number {
  const l = toPositive(row.length);
  const w = toPositive(row.width);
  const h = toPositive(row.height);
  const q = toPositive(row.qty);
  return (l * w * h * q) / UNIT_DIVISORS[unit];
}

export function CBMCalculatorWidget() {
  const [open, setOpen] = useState(false);
  const [unit, setUnit] = useState<Unit>("cm");
  const [weightUnit, setWeightUnit] = useState<"kg" | "lbs">("kg");
  const [mode, setMode] = useState<Mode>("air");
  const [rows, setRows] = useState<Row[]>([newRow()]);

  const totalCbm = rows.reduce((sum, r) => sum + calcRowCbm(r, unit), 0);
  const totalWeightKg = rows.reduce((sum, r) => {
    const q = toPositive(r.qty);
    const w = toPositive(r.weight);
    const wKg = weightUnit === "lbs" ? w * 0.453592 : w;
    return sum + q * wKg;
  }, 0);

  let volWeight = 0;
  let volLabel = "";
  if (mode === "air") { volWeight = totalCbm * (1_000_000 / 6_000); volLabel = "Ã·6000"; }
  else if (mode === "courier") { volWeight = totalCbm * (1_000_000 / 5_000); volLabel = "Ã·5000"; }
  else if (mode === "sea_lcl") { volWeight = totalCbm * 1000; volLabel = "Ã—1000 kg/CBM"; }

  const chargeableWeight = mode === "sea_fcl" ? totalWeightKg : Math.max(totalWeightKg, volWeight);
  const chargeableIsVol = mode !== "sea_fcl" && volWeight > 0 && chargeableWeight === volWeight;

  const updateRow = (id: string, field: keyof Row, value: string) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));

  const addRow = () => setRows((prev) => [...prev, newRow()]);
  const removeRow = (id: string) =>
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));
  const reset = () => { setRows([newRow()]); setUnit("cm"); setWeightUnit("kg"); setMode("air"); };

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={() => setOpen(true)}
            aria-label="Open CBM calculator"
            className="fixed right-5 top-1/2 z-40 h-12 w-12 -translate-y-1/2 rounded-full p-0 shadow-lg hover:shadow-xl"
          >
            <Package size={22} />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">CBM Calculator</TooltipContent>
      </Tooltip>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Package size={17} />
              CBM Calculator
            </DialogTitle>
          </DialogHeader>

          {/* Unit + Mode selectors */}
          <div className="flex flex-wrap gap-4 items-center pb-1">
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground font-medium mr-1">Unit:</span>
              {UNITS.map((u) => (
                <button
                  key={u}
                  onClick={() => setUnit(u)}
                  className={cn(
                    "px-2.5 py-1 text-xs rounded border transition-colors",
                    unit === u
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border hover:bg-muted"
                  )}
                >
                  {u}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground font-medium mr-1">Mode:</span>
              {MODES.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setMode(m.value)}
                  className={cn(
                    "px-2.5 py-1 text-xs rounded border transition-colors",
                    mode === m.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border hover:bg-muted"
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground font-medium mr-1">Weight:</span>
              {(["kg", "lbs"] as const).map((wu) => (
                <button
                  key={wu}
                  onClick={() => setWeightUnit(wu)}
                  className={cn(
                    "px-2.5 py-1 text-xs rounded border transition-colors",
                    weightUnit === wu
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border hover:bg-muted"
                  )}
                >
                  {wu}
                </button>
              ))}
            </div>
          </div>

          {/* Rows table */}
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-xs text-muted-foreground">
                  <th className="text-left py-2 pl-3 w-7">#</th>
                  <th className="text-center py-2 px-1">L ({unit})</th>
                  <th className="text-center py-2 px-1">W ({unit})</th>
                  <th className="text-center py-2 px-1">H ({unit})</th>
                  <th className="text-center py-2 px-1">Qty</th>
                  <th className="text-center py-2 px-1">Wt/unit ({weightUnit})</th>
                  <th className="text-center py-2 px-2">CBM</th>
                  <th className="w-8"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => {
                  const rowCbm = calcRowCbm(row, unit);
                  return (
                    <tr key={row.id} className="border-t">
                      <td className="py-1.5 pl-3 text-muted-foreground text-xs">{i + 1}</td>
                      {(["length", "width", "height", "qty", "weight"] as const).map((field) => (
                        <td key={field} className="py-1.5 px-1">
                          <Input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={row[field]}
                            onChange={(e) => updateRow(row.id, field, e.target.value)}
                            className="h-7 text-xs text-center px-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </td>
                      ))}
                      <td className="py-1.5 px-2 text-center text-xs font-semibold tabular-nums text-foreground">
                        {rowCbm > 0 ? rowCbm.toFixed(4) : <span className="text-muted-foreground">â€”</span>}
                      </td>
                      <td className="py-1.5 pr-2">
                        <button
                          onClick={() => removeRow(row.id)}
                          disabled={rows.length === 1}
                          className="text-muted-foreground hover:text-destructive disabled:opacity-25 transition-colors flex items-center justify-center w-6 h-6"
                        >
                          <X size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Button variant="outline" size="sm" onClick={addRow} className="w-fit gap-1.5 text-xs h-7">
            <Plus size={13} /> Add Row
          </Button>

          {/* Results */}
          <div className="border-t pt-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Results
            </p>
            <div className={cn(
              "grid gap-3",
              mode === "sea_fcl" ? "grid-cols-2 sm:grid-cols-2" : "grid-cols-2 sm:grid-cols-4"
            )}>
              <div className="bg-muted/40 rounded-lg p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Total CBM</p>
                <p className="text-2xl font-bold mt-1 tabular-nums">
                  {totalCbm > 0 ? totalCbm.toFixed(4) : <span className="text-muted-foreground text-lg">â€”</span>}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">mÂ³</p>
              </div>

              <div className="bg-muted/40 rounded-lg p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Actual Weight</p>
                <p className="text-2xl font-bold mt-1 tabular-nums">
                  {totalWeightKg > 0 ? totalWeightKg.toFixed(2) : <span className="text-muted-foreground text-lg">â€”</span>}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">kg</p>
              </div>

              {mode !== "sea_fcl" && (
                <div className="bg-muted/40 rounded-lg p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Vol. Weight</p>
                  <p className="text-2xl font-bold mt-1 tabular-nums">
                    {volWeight > 0 ? volWeight.toFixed(2) : <span className="text-muted-foreground text-lg">â€”</span>}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">kg ({volLabel})</p>
                </div>
              )}

              <div className={cn(
                "rounded-lg p-3 border",
                chargeableIsVol
                  ? "bg-amber-500/10 border-amber-500/40"
                  : "bg-primary/10 border-primary/30"
              )}>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
                  Chargeable Wt
                </p>
                <p className="text-2xl font-bold mt-1 tabular-nums">
                  {chargeableWeight > 0 ? chargeableWeight.toFixed(2) : <span className="text-muted-foreground text-lg">â€”</span>}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  kg
                  {mode !== "sea_fcl" && chargeableWeight > 0 && (
                    <span className="ml-1 font-medium">
                      ({chargeableIsVol ? "volumetric" : "actual"})
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Container utilisation â€” FCL mode only */}
          {mode === "sea_fcl" && totalCbm > 0 && (
            <div className="border-t pt-4 space-y-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Container Utilisation
              </p>
              {CONTAINERS.map((c) => {
                const cbmRaw = (totalCbm / c.cbm) * 100;
                const wgtRaw = (totalWeightKg / c.kg) * 100;
                const cbmPct = Math.min(cbmRaw, 100);
                const wgtPct = Math.min(wgtRaw, 100);
                const cbmOver = cbmRaw >= 100;
                const wgtOver = wgtRaw >= 100;
                return (
                  <div key={c.name} className="space-y-1.5">
                    <span className="text-xs font-semibold">{c.name}</span>
                    {/* CBM bar */}
                    <div className="space-y-0.5">
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>Volume</span>
                        <span className={cn("tabular-nums", cbmOver && "text-destructive font-medium")}>
                          {totalCbm.toFixed(2)} / {c.cbm} CBM ({cbmRaw.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn("h-full rounded-full transition-all duration-300", cbmOver ? "bg-destructive" : "bg-primary")}
                          style={{ width: `${cbmPct}%` }}
                        />
                      </div>
                    </div>
                    {/* Weight bar */}
                    {totalWeightKg > 0 && (
                      <div className="space-y-0.5">
                        <div className="flex justify-between text-[10px] text-muted-foreground">
                          <span>Weight</span>
                          <span className={cn("tabular-nums", wgtOver && "text-destructive font-medium")}>
                            {totalWeightKg.toFixed(0)} / {c.kg.toLocaleString()} kg ({wgtRaw.toFixed(0)}%)
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn("h-full rounded-full transition-all duration-300", wgtOver ? "bg-destructive" : "bg-amber-500")}
                            style={{ width: `${wgtPct}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex justify-end border-t pt-3 mt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={reset}
              className="gap-1.5 text-xs text-muted-foreground h-7"
            >
              <RotateCcw size={12} /> Reset
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
```


