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
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { rolesApi, permissionsApi } from "../services/api/auth";
import { PermissionGate } from "../components/auth/PermissionGate";
import type { Permission, RoleListItem, CreateRoleRequest, UpdateRoleRequest } from "../types/auth";

// Minimum required permissions - these are always selected and cannot be unchecked
// Settings view permissions are required for dropdowns to work in shipments, customers, etc.
const MINIMUM_REQUIRED_PERMISSION_CODES = [
  'banks_view',
  'company_view',
  'currency_view',
  'port_view',
  'chargeitem_view',
  'expensetype_view',
];

interface PermissionGroupState {
  [module: string]: {
    expanded: boolean;
    permissions: Permission[];
  };
}

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
  const [permissionGroupState, setPermissionGroupState] = useState<PermissionGroupState>({});
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<RoleListItem | null>(null);

  // Fetch roles
  const { data: rolesData, isLoading: rolesLoading } = useQuery({
    queryKey: ["roles", currentPage, entriesPerPage, searchTerm],
    queryFn: async () => {
      const result = await rolesApi.getAll({
        pageNumber: currentPage,
        pageSize: parseInt(entriesPerPage),
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

  // Initialize permission group state when permissions load
  const initializePermissionGroupState = (groups: Record<string, Permission[]>) => {
    const state: PermissionGroupState = {};
    Object.entries(groups).forEach(([module, permissions]) => {
      state[module] = {
        expanded: false,
        permissions,
      };
    });
    return state;
  };

  const toggleGroup = (module: string) => {
    setPermissionGroupState((prev) => ({
      ...prev,
      [module]: {
        ...prev[module],
        expanded: !prev[module]?.expanded,
      },
    }));
  };

  const togglePermission = (permissionId: number) => {
    // Don't allow unchecking minimum required permissions
    if (minimumRequiredIds.has(permissionId)) return;

    setSelectedPermissionIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(permissionId)) {
        newSet.delete(permissionId);
      } else {
        newSet.add(permissionId);
      }
      return newSet;
    });
  };

  const toggleAllInGroup = (module: string) => {
    const groupPermissions = permissionGroups?.[module] || [];
    const allSelected = groupPermissions.every((p) => selectedPermissionIds.has(p.id));

    setSelectedPermissionIds((prev) => {
      const newSet = new Set(prev);
      groupPermissions.forEach((p) => {
        if (allSelected) {
          // Don't uncheck minimum required permissions
          if (!minimumRequiredIds.has(p.id)) {
            newSet.delete(p.id);
          }
        } else {
          newSet.add(p.id);
        }
      });
      return newSet;
    });
  };

  const closeModal = () => {
    setRoleModalOpen(false);
    setEditingRole(null);
    setRoleName("");
    setRoleDescription("");
    setSelectedPermissionIds(new Set());
    if (permissionGroups) {
      setPermissionGroupState(initializePermissionGroupState(permissionGroups));
    }
  };

  const openAddModal = () => {
    setEditingRole(null);
    setRoleName("");
    setRoleDescription("");
    // Pre-select minimum required permissions
    setSelectedPermissionIds(new Set(minimumRequiredIds));
    if (permissionGroups) {
      setPermissionGroupState(initializePermissionGroupState(permissionGroups));
    }
    setRoleModalOpen(true);
  };

  const openEditModal = async (role: RoleListItem) => {
    setEditingRole(role);
    setRoleName(role.name);
    setRoleDescription(role.description || "");

    // Fetch full role details to get assigned permissions
    const result = await rolesApi.getById(role.id);
    if (result.error) {
      toast.error("Failed to load role details");
      return;
    }

    const fullRole = result.data!;
    const permIds = new Set<number>(fullRole.permissions?.map((p) => p.id) || []);
    // Always include minimum required permissions
    minimumRequiredIds.forEach((id) => permIds.add(id));
    setSelectedPermissionIds(permIds);

    if (permissionGroups) {
      setPermissionGroupState(initializePermissionGroupState(permissionGroups));
    }
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

  // Split permission groups into 3 columns
  const groupEntries = Object.entries(permissionGroups || {});
  const colSize = Math.ceil(groupEntries.length / 3);
  const column1 = groupEntries.slice(0, colSize);
  const column2 = groupEntries.slice(colSize, colSize * 2);
  const column3 = groupEntries.slice(colSize * 2);

  const renderPermissionColumn = (entries: [string, Permission[]][]) => (
    <div className="space-y-3">
      {entries.map(([module, permissions]) => {
        const allSelected = permissions.every((p) => selectedPermissionIds.has(p.id));
        const isExpanded = permissionGroupState[module]?.expanded || false;

        return (
          <div key={module} className="space-y-1">
            <div
              className="flex items-center gap-2 cursor-pointer hover:bg-secondary/50 p-1 rounded"
              onClick={() => toggleGroup(module)}
            >
              <span className="text-muted-foreground text-sm w-4">{isExpanded ? "-" : "+"}</span>
              <Checkbox
                checked={allSelected}
                onCheckedChange={() => toggleAllInGroup(module)}
                onClick={(e) => e.stopPropagation()}
              />
              <span className="font-medium text-sm">{module}</span>
            </div>
            {isExpanded && (
              <div className="ml-8 space-y-1">
                {permissions.map((perm) => {
                  const isRequired = minimumRequiredIds.has(perm.id);
                  return (
                    <div key={perm.id} className="flex items-center gap-2">
                      <Checkbox
                        checked={selectedPermissionIds.has(perm.id)}
                        onCheckedChange={() => togglePermission(perm.id)}
                        disabled={isRequired}
                        className={isRequired ? "opacity-70" : ""}
                      />
                      <span
                        className={`text-sm ${isRequired ? "text-muted-foreground" : ""}`}
                        title={isRequired ? "Required - cannot be unchecked" : (perm.description || perm.code)}
                      >
                        {perm.action}
                        {isRequired && <span className="ml-1 text-xs text-primary">(Required)</span>}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

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
          <p className="text-sm text-primary">
            Showing {roles.length > 0 ? ((currentPage - 1) * parseInt(entriesPerPage)) + 1 : 0} to{" "}
            {Math.min(currentPage * parseInt(entriesPerPage), totalCount)} of {totalCount} entries
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
        <DialogContent className="sm:max-w-[900px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRole ? "Edit Role" : "Set New Role"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Form Fields */}
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

            {/* Permissions Grid */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">Page Permissions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Column 1 */}
                {renderPermissionColumn(column1)}

                {/* Column 2 */}
                {renderPermissionColumn(column2)}

                {/* Column 3 */}
                {renderPermissionColumn(column3)}
              </div>
            </div>
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
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete the role "{roleToDelete?.name}"? This action cannot be undone.
            </p>
            {roleToDelete && roleToDelete.userCount > 0 && (
              <p className="text-sm text-destructive mt-2">
                Warning: This role is assigned to {roleToDelete.userCount} user(s).
              </p>
            )}
          </div>
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
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default PermissionRoles;
