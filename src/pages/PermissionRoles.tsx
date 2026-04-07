import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Pencil, Trash2, Loader2, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { rolesApi, permissionsApi } from "../services/api/auth";
import { PermissionGate } from "../components/auth/PermissionGate";
import type { Permission, RoleListItem, CreateRoleRequest, UpdateRoleRequest } from "../types/auth";

// Minimum required permissions - always selected, cannot be unchecked
// Settings view permissions are required for dropdowns to work in shipments, customers, etc.
const MINIMUM_REQUIRED_PERMISSION_CODES = [
  'banks_view',
  'company_view',
  'currency_view',
  'port_view',
  'chargeitem_view',
  'expensetype_view',
];

// Sidebar-mirrored module grouping: maps sidebar sections → backend module keys
const SIDEBAR_GROUPS = [
  {
    key: "Dashboard",
    label: "Dashboard",
    modules: [{ backendKey: "Dashboard", label: "Dashboard" }],
  },
  {
    key: "Shipments",
    label: "Shipments",
    modules: [{ backendKey: "Shipments", label: "Shipments" }],
  },
  {
    key: "MasterCustomers",
    label: "Master Customers",
    modules: [{ backendKey: "Customers", label: "Customers" }],
  },
  {
    key: "Sales",
    label: "Sales",
    modules: [
      { backendKey: "Sales-Leads", label: "Leads" },
      { backendKey: "Sales-RateRequests", label: "Rate Requests" },
      { backendKey: "Sales-Quotations", label: "Quotations" },
    ],
  },
  {
    key: "Accounts",
    label: "Accounts",
    modules: [
      { backendKey: "Accounts-Invoices", label: "Invoices" },
      { backendKey: "Accounts-PurchaseInvoices", label: "Purchase Invoices" },
      { backendKey: "Accounts-Receipts", label: "Receipt Vouchers" },
      { backendKey: "Accounts-PaymentVouchers", label: "Payment Vouchers" },
      { backendKey: "Accounts-CreditNotes", label: "Credit Notes" },
      { backendKey: "Accounts-AccountReceivable", label: "Account Receivable" },
      { backendKey: "Accounts-AccountPayable", label: "Account Payable" },
      { backendKey: "Accounts-Expenses", label: "Daily Expenses" },
      { backendKey: "Accounts-PDC", label: "Post Dated Cheques" },
    ],
  },
  {
    key: "Users",
    label: "Users",
    modules: [
      { backendKey: "Users", label: "All Users" },
      { backendKey: "Roles", label: "Permission Roles" },
    ],
  },
  {
    key: "HR",
    label: "HR",
    modules: [
      { backendKey: "HR-Employees", label: "Employees" },
      { backendKey: "HR-Salary", label: "Salary Components" },
      { backendKey: "HR-Payroll", label: "Payroll" },
      { backendKey: "HR-Advances", label: "Advances" },
      { backendKey: "HR-Attendance", label: "Attendance" },
    ],
  },
  {
    key: "Settings",
    label: "Settings",
    modules: [
      { backendKey: "Settings-Banks", label: "Banks" },
      { backendKey: "Settings-Companies", label: "Companies" },
      { backendKey: "Settings-Currencies", label: "Currencies" },
      { backendKey: "Settings-Ports", label: "Ports" },
      { backendKey: "Settings-ChargeItems", label: "Charge Items" },
      { backendKey: "Settings-ExpenseTypes", label: "Expense Types" },
      { backendKey: "Settings-InvoiceNotes", label: "Invoice Notes" },
      { backendKey: "Settings-SMTP", label: "SMTP" },
    ],
  },
  {
    key: "GeneralDocuments",
    label: "General Documents",
    modules: [{ backendKey: "General-Documents", label: "General Documents" }],
  },
  {
    key: "Files",
    label: "Files",
    modules: [{ backendKey: "Files", label: "Files" }],
  },
];

const PermissionRoles = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState("10");
  const [currentPage, setCurrentPage] = useState(1);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleListItem | null>(null);
  const [roleName, setRoleName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<Set<number>>(new Set());
  const [expandedSidebarGroups, setExpandedSidebarGroups] = useState<Set<string>>(new Set());
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<RoleListItem | null>(null);

  // Fetch roles
  const { data: rolesData, isLoading: rolesLoading } = useQuery({
    queryKey: ["roles", currentPage, entriesPerPage, searchTerm],
    queryFn: async () => {
      const result = await rolesApi.getAll({
        pageNumber: currentPage,
        pageSize: parseInt(entriesPerPage, 10) || 10,
        searchTerm: searchTerm || undefined,
      });
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
  });

  // Fetch permissions grouped
  const { data: permissionGroups } = useQuery({
    queryKey: ["permissions", "grouped"],
    queryFn: async () => {
      const result = await permissionsApi.getGrouped();
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
  });

  // Create role mutation
  const createRoleMutation = useMutation({
    mutationFn: async (data: CreateRoleRequest) => {
      const result = await rolesApi.create(data);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    onSuccess: () => {
      toast.success("Role created successfully");
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      closeModal();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create role");
    },
  });

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateRoleRequest }) => {
      const result = await rolesApi.update(id, data);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      toast.success("Role updated successfully");
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      closeModal();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update role");
    },
  });

  // Delete role mutation
  const deleteRoleMutation = useMutation({
    mutationFn: async (id: number) => {
      const result = await rolesApi.delete(id);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      toast.success("Role deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      setDeleteConfirmOpen(false);
      setRoleToDelete(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete role");
    },
  });

  // Get minimum required permission IDs from the permission groups
  const getMinimumRequiredPermissionIds = (groups: Record<string, Permission[]> | undefined): Set<number> => {
    if (!groups) return new Set();
    const ids = new Set<number>();
    Object.values(groups).forEach((permissions) => {
      permissions.forEach((p) => {
        if (MINIMUM_REQUIRED_PERMISSION_CODES.includes(p.code)) {
          ids.add(p.id);
        }
      });
    });
    return ids;
  };

  const minimumRequiredIds = getMinimumRequiredPermissionIds(permissionGroups);

  const togglePermission = (permissionId: number) => {
    if (minimumRequiredIds.has(permissionId)) return;
    setSelectedPermissionIds((prev) => {
      const next = new Set(prev);
      next.has(permissionId) ? next.delete(permissionId) : next.add(permissionId);
      return next;
    });
  };

  // Toggle all permissions in a single backend module (used by sub-module row checkbox)
  const toggleAllInGroup = (backendKey: string) => {
    const groupPermissions = permissionGroups?.[backendKey] || [];
    const allSelected = groupPermissions.every((p) => selectedPermissionIds.has(p.id));
    setSelectedPermissionIds((prev) => {
      const next = new Set(prev);
      groupPermissions.forEach((p) => {
        if (allSelected) {
          if (!minimumRequiredIds.has(p.id)) next.delete(p.id);
        } else {
          next.add(p.id);
        }
      });
      return next;
    });
  };

  // Toggle all permissions across all backend modules in a sidebar group
  const toggleAllInSidebarGroup = (groupKey: string) => {
    const group = SIDEBAR_GROUPS.find((g) => g.key === groupKey);
    if (!group) return;
    const allPerms = group.modules.flatMap((m) => permissionGroups?.[m.backendKey] ?? []);
    const allSelected = allPerms.every((p) => selectedPermissionIds.has(p.id));
    setSelectedPermissionIds((prev) => {
      const next = new Set(prev);
      allPerms.forEach((p) => {
        if (allSelected) {
          if (!minimumRequiredIds.has(p.id)) next.delete(p.id);
        } else {
          next.add(p.id);
        }
      });
      return next;
    });
  };

  const toggleSidebarGroup = (groupKey: string) => {
    setExpandedSidebarGroups((prev) => {
      const next = new Set(prev);
      next.has(groupKey) ? next.delete(groupKey) : next.add(groupKey);
      return next;
    });
  };

  const closeModal = () => {
    setRoleModalOpen(false);
    setEditingRole(null);
    setRoleName("");
    setRoleDescription("");
    setSelectedPermissionIds(new Set());
    setExpandedSidebarGroups(new Set());
  };

  const openAddModal = () => {
    setEditingRole(null);
    setRoleName("");
    setRoleDescription("");
    setSelectedPermissionIds(new Set(minimumRequiredIds));
    setExpandedSidebarGroups(new Set());
    setRoleModalOpen(true);
  };

  const openEditModal = async (role: RoleListItem) => {
    setEditingRole(role);
    setRoleName(role.name);
    setRoleDescription(role.description || "");

    const result = await rolesApi.getById(role.id);
    if (result.error) {
      toast.error("Failed to load role details");
      return;
    }

    const fullRole = result.data!;
    const permIds = new Set<number>(fullRole.permissions?.map((p) => p.id) || []);
    minimumRequiredIds.forEach((id) => permIds.add(id));
    setSelectedPermissionIds(permIds);
    setExpandedSidebarGroups(new Set());
    setRoleModalOpen(true);
  };

  const handleSaveRole = () => {
    if (!roleName.trim()) {
      toast.error("Role name is required");
      return;
    }

    const permissionIds = Array.from(selectedPermissionIds);

    if (editingRole) {
      updateRoleMutation.mutate({
        id: editingRole.id,
        data: {
          name: roleName.trim(),
          description: roleDescription.trim() || undefined,
          permissionIds,
        },
      });
    } else {
      createRoleMutation.mutate({
        name: roleName.trim(),
        description: roleDescription.trim() || undefined,
        permissionIds,
      });
    }
  };

  const handleDeleteClick = (role: RoleListItem) => {
    setRoleToDelete(role);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (roleToDelete) {
      deleteRoleMutation.mutate(roleToDelete.id);
    }
  };

  const roles = rolesData?.items || [];
  const totalCount = rolesData?.totalCount || 0;
  const totalPages = rolesData?.totalPages || 1;

  const isSaving = createRoleMutation.isPending || updateRoleMutation.isPending;

  return (
    <MainLayout>
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-semibold text-foreground">List All Roles</h1>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Show:</span>
            <SearchableSelect
              options={[
                { value: "10", label: "10" },
                { value: "25", label: "25" },
                { value: "50", label: "50" },
                { value: "100", label: "100" },
              ]}
              value={entriesPerPage}
              onValueChange={(v) => { setEntriesPerPage(v); setCurrentPage(1); }}
              triggerClassName="w-[90px] h-8"
            />
            <span className="text-sm text-muted-foreground">entries</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Search:</span>
              <Input
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-[200px] h-8"
              />
            </div>
            <PermissionGate permission="role_add">
              <Button className="btn-success gap-2" onClick={openAddModal}>
                <Plus size={16} />
                Set New Role
              </Button>
            </PermissionGate>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-table-header text-table-header-foreground">
                  <th className="px-4 py-3 text-left text-sm font-semibold">Action</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Role ID</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Role Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Description</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Permissions</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Users</th>
                </tr>
              </thead>
              <tbody>
                {rolesLoading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    </td>
                  </tr>
                ) : roles.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      No roles found
                    </td>
                  </tr>
                ) : (
                  roles.map((role, index) => (
                    <tr
                      key={role.id}
                      className={`border-b border-border hover:bg-table-row-hover transition-colors ${
                        index % 2 === 0 ? "bg-card" : "bg-secondary/30"
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <PermissionGate permission="role_edit">
                            <button
                              className="p-1.5 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                              onClick={() => openEditModal(role)}
                            >
                              <Pencil size={14} />
                            </button>
                          </PermissionGate>
                          <PermissionGate permission="role_delete">
                            <button
                              className="p-1.5 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 transition-colors"
                              onClick={() => handleDeleteClick(role)}
                              disabled={role.isSystemRole}
                              title={role.isSystemRole ? "System roles cannot be deleted" : "Delete role"}
                            >
                              <Trash2 size={14} />
                            </button>
                          </PermissionGate>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">{role.id}</td>
                      <td className="px-4 py-3 text-sm text-primary font-medium">
                        {role.name}
                        {role.isSystemRole && (
                          <span className="ml-2 text-xs bg-secondary px-1.5 py-0.5 rounded">System</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{role.description || "-"}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{role.permissionCount}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{role.userCount}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Showing {roles.length > 0 ? ((currentPage - 1) * (parseInt(entriesPerPage, 10) || 10)) + 1 : 0} to{" "}
            {Math.min(currentPage * (parseInt(entriesPerPage, 10) || 10), totalCount)} of {totalCount} entries
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  className={currentPage === pageNum ? "btn-success" : ""}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Add/Edit Role Modal */}
      <Dialog open={roleModalOpen} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="sm:max-w-[900px] max-h-[85vh] overflow-y-auto p-0 bg-card">
          <DialogHeader className="bg-modal-header text-white p-4 rounded-t-lg">
            <DialogTitle className="text-white">{editingRole ? "Edit Role" : "Set New Role"}</DialogTitle>
          </DialogHeader>

          <div className="p-6 space-y-4">
            {/* Role name & description */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Role Name *</Label>
                <Input
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  placeholder="Role Name"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={roleDescription}
                  onChange={(e) => setRoleDescription(e.target.value)}
                  placeholder="Role description (optional)"
                  rows={1}
                />
              </div>
            </div>

            {/* Permissions — sidebar-style modular drill-down */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">Page Permissions</h3>
              <div className="border border-border rounded-md overflow-hidden">
                {SIDEBAR_GROUPS.map((group) => {
                  const groupPermissions = group.modules.flatMap(
                    (m) => permissionGroups?.[m.backendKey] ?? []
                  );
                  if (groupPermissions.length === 0) return null;

                  const isExpanded = expandedSidebarGroups.has(group.key);
                  const selectedCount = groupPermissions.filter((p) =>
                    selectedPermissionIds.has(p.id)
                  ).length;
                  const allSelected = selectedCount === groupPermissions.length;
                  const someSelected = selectedCount > 0 && !allSelected;
                  const isSingle = group.modules.length === 1;

                  return (
                    <div key={group.key} className="border-b border-border last:border-b-0">
                      {/* Level 1 — group header */}
                      <div
                        className="flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-secondary/50 select-none"
                        onClick={() => toggleSidebarGroup(group.key)}
                      >
                        <ChevronDown
                          size={14}
                          className={cn(
                            "text-muted-foreground transition-transform flex-shrink-0",
                            isExpanded && "rotate-180"
                          )}
                        />
                        <Checkbox
                          checked={allSelected}
                          data-state={
                            allSelected ? "checked" : someSelected ? "indeterminate" : "unchecked"
                          }
                          onCheckedChange={() => toggleAllInSidebarGroup(group.key)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span className="font-semibold text-sm text-foreground">{group.label}</span>
                        <span className="ml-auto text-xs text-muted-foreground">
                          {selectedCount}/{groupPermissions.length}
                        </span>
                      </div>

                      {/* Level 2 — grid table (shown when expanded) */}
                      {isExpanded && (() => {
                        const ACTION_ORDER = ['View', 'Add', 'Edit', 'Delete'];
                        const allActions = [
                          ...new Set(
                            group.modules.flatMap(
                              (m) => (permissionGroups?.[m.backendKey] ?? []).map((p) => p.action)
                            )
                          ),
                        ].sort((a, b) => {
                          const ia = ACTION_ORDER.indexOf(a);
                          const ib = ACTION_ORDER.indexOf(b);
                          if (ia !== -1 && ib !== -1) return ia - ib;
                          if (ia !== -1) return -1;
                          if (ib !== -1) return 1;
                          return a.localeCompare(b);
                        });

                        const rows = group.modules
                          .map((mod) => ({ mod, perms: permissionGroups?.[mod.backendKey] ?? [] }))
                          .filter(({ perms }) => perms.length > 0);

                        return (
                          <div className="bg-secondary/20 border-t border-border overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="border-b border-border">
                                  {!isSingle && (
                                    <th className="pl-8 pr-3 py-1.5 text-left w-44" />
                                  )}
                                  {allActions.map((action) => (
                                    <th
                                      key={action}
                                      className="px-3 py-1.5 text-center font-medium text-muted-foreground min-w-[64px]"
                                    >
                                      {action}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border/40">
                                {rows.map(({ mod, perms }) => {
                                  const modAllSelected = perms.every((p) =>
                                    selectedPermissionIds.has(p.id)
                                  );
                                  const modSomeSelected =
                                    perms.some((p) => selectedPermissionIds.has(p.id)) &&
                                    !modAllSelected;
                                  return (
                                    <tr key={mod.backendKey}>
                                      {!isSingle && (
                                        <td className="pl-8 pr-3 py-2">
                                          <div className="flex items-center gap-1.5">
                                            <Checkbox
                                              checked={modAllSelected}
                                              data-state={
                                                modAllSelected
                                                  ? "checked"
                                                  : modSomeSelected
                                                  ? "indeterminate"
                                                  : "unchecked"
                                              }
                                              onCheckedChange={() =>
                                                toggleAllInGroup(mod.backendKey)
                                              }
                                            />
                                            <span className="font-medium text-foreground">
                                              {mod.label}
                                            </span>
                                          </div>
                                        </td>
                                      )}
                                      {allActions.map((action) => {
                                        const perm = perms.find((p) => p.action === action);
                                        const isRequired = perm
                                          ? minimumRequiredIds.has(perm.id)
                                          : false;
                                        return (
                                          <td key={action} className="px-3 py-2 text-center">
                                            {perm ? (
                                              <div className="flex justify-center">
                                                <Checkbox
                                                  checked={selectedPermissionIds.has(perm.id)}
                                                  onCheckedChange={() => togglePermission(perm.id)}
                                                  disabled={isRequired}
                                                  title={
                                                    isRequired
                                                      ? "Required — cannot be removed"
                                                      : (perm.description || "")
                                                  }
                                                />
                                              </div>
                                            ) : (
                                              <span className="text-muted-foreground/30">—</span>
                                            )}
                                          </td>
                                        );
                                      })}
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        );
                      })()}
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                * Required — cannot be removed
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-border">
              <Button variant="outline" onClick={closeModal} disabled={isSaving}>
                Cancel
              </Button>
              <Button className="btn-success" onClick={handleSaveRole} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingRole ? "Update" : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[400px] p-0 bg-card">
          <DialogHeader className="bg-modal-header text-white p-4 rounded-t-lg">
            <DialogTitle className="text-white">Confirm Delete</DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete the role "{roleToDelete?.name}"? This action cannot be undone.
            </p>
            {roleToDelete && roleToDelete.userCount > 0 && (
              <p className="text-sm text-destructive mt-2">
                Warning: This role is assigned to {roleToDelete.userCount} user(s).
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirmOpen(false)}
                disabled={deleteRoleMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                disabled={deleteRoleMutation.isPending}
              >
                {deleteRoleMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Delete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default PermissionRoles;
