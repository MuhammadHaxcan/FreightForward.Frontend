import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Pencil, Trash2 } from "lucide-react";

interface Role {
  id: number;
  name: string;
  menuPermission: string;
  addedDate: string;
}

interface Permission {
  id: string;
  label: string;
  action: string;
  checked: boolean;
}

interface PermissionGroup {
  id: string;
  name: string;
  expanded: boolean;
  permissions: Permission[];
}

const mockRoles: Role[] = [
  { id: 1, name: "Administrator", menuPermission: "All Menu Access", addedDate: "22-Apr-2018" },
  { id: 2, name: "Employee", menuPermission: "Custom Menu Access", addedDate: "22-Apr-2018" },
  { id: 3, name: "Manager", menuPermission: "Custom Menu Access", addedDate: "22-Apr-2018" },
  { id: 4, name: "Junior Employee", menuPermission: "Custom Menu Access", addedDate: "22-Apr-2018" },
  { id: 5, name: "President", menuPermission: "All Menu Access", addedDate: "22-Apr-2018" },
  { id: 6, name: "CEOs", menuPermission: "Custom Menu Access", addedDate: "22-Apr-2018" },
  { id: 7, name: "SALES", menuPermission: "All Menu Access", addedDate: "24-Jun-2018" },
  { id: 8, name: "multi store employee", menuPermission: "Custom Menu Access", addedDate: "01-Oct-2020" },
  { id: 9, name: "Employee qatar", menuPermission: "Custom Menu Access", addedDate: "28-Oct-2020" },
  { id: 10, name: "back office", menuPermission: "All Menu Access", addedDate: "04-Nov-2021" },
];

const initialPermissionGroups: PermissionGroup[] = [
  {
    id: "dashboard",
    name: "Dashboard",
    expanded: true,
    permissions: [
      { id: "dash_all_count", label: "All count", action: "All count", checked: false },
      { id: "dash_branch_total", label: "Branch total count", action: "Branch total count", checked: false },
      { id: "dash_employee_add", label: "Employee Add Count", action: "Employee Add Count", checked: false },
    ],
  },
  {
    id: "shipments",
    name: "Shipments",
    expanded: true,
    permissions: [
      { id: "ship_show_all", label: "Show All", action: "Show All", checked: false },
      { id: "ship_edit", label: "Edit", action: "Edit", checked: false },
      { id: "ship_view", label: "View", action: "View", checked: false },
      { id: "ship_add_new", label: "Add New", action: "Add", checked: false },
      { id: "ship_delete", label: "Delete", action: "Delete", checked: false },
    ],
  },
  {
    id: "customer",
    name: "Customer",
    expanded: true,
    permissions: [
      { id: "cust_add", label: "Add", action: "Add", checked: false },
      { id: "cust_edit", label: "Edit", action: "Edit", checked: false },
      { id: "cust_view", label: "View", action: "View", checked: false },
      { id: "cust_delete", label: "Delete", action: "Delete", checked: false },
    ],
  },
  {
    id: "quotations",
    name: "Quotations",
    expanded: true,
    permissions: [
      { id: "quot_show_all", label: "Show All", action: "Show All", checked: false },
      { id: "quot_add", label: "Add", action: "Add", checked: false },
      { id: "quot_edit", label: "Edit", action: "Edit", checked: false },
      { id: "quot_view", label: "View", action: "View", checked: false },
      { id: "quot_download", label: "Download", action: "View", checked: false },
      { id: "quot_delete", label: "Delete", action: "Delete", checked: false },
    ],
  },
  {
    id: "rate_request",
    name: "Rate Request",
    expanded: true,
    permissions: [
      { id: "rate_add", label: "Add", action: "Add", checked: false },
      { id: "rate_edit", label: "Edit", action: "Edit", checked: false },
      { id: "rate_view", label: "View", action: "View", checked: false },
      { id: "rate_delete", label: "Delete", action: "Delete", checked: false },
    ],
  },
  {
    id: "users",
    name: "Users",
    expanded: true,
    permissions: [
      { id: "user_add", label: "Add", action: "Add", checked: false },
      { id: "user_edit", label: "Edit", action: "Edit", checked: false },
      { id: "user_view", label: "View", action: "View", checked: false },
      { id: "user_delete", label: "Delete", action: "Delete", checked: false },
      { id: "user_roles", label: "Roles", action: "View", checked: false },
      { id: "user_company", label: "Company", action: "View", checked: false },
    ],
  },
  {
    id: "settings",
    name: "Settings",
    expanded: true,
    permissions: [
      { id: "settings_currency", label: "Currency", action: "Add", checked: false },
    ],
  },
];

const PermissionRoles = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState("10");
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [roleName, setRoleName] = useState("");
  const [selectAccess, setSelectAccess] = useState("");
  const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>(initialPermissionGroups);

  const filteredRoles = mockRoles.filter(
    (role) =>
      role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.menuPermission.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleGroup = (groupId: string) => {
    setPermissionGroups(prev =>
      prev.map(group =>
        group.id === groupId ? { ...group, expanded: !group.expanded } : group
      )
    );
  };

  const togglePermission = (groupId: string, permissionId: string) => {
    setPermissionGroups(prev =>
      prev.map(group =>
        group.id === groupId
          ? {
              ...group,
              permissions: group.permissions.map(perm =>
                perm.id === permissionId ? { ...perm, checked: !perm.checked } : perm
              ),
            }
          : group
      )
    );
  };

  const toggleAllInGroup = (groupId: string) => {
    setPermissionGroups(prev =>
      prev.map(group => {
        if (group.id === groupId) {
          const allChecked = group.permissions.every(p => p.checked);
          return {
            ...group,
            permissions: group.permissions.map(p => ({ ...p, checked: !allChecked }))
          };
        }
        return group;
      })
    );
  };

  const handleSaveRole = () => {
    console.log("Saving role:", { roleName, selectAccess, permissionGroups });
    setRoleModalOpen(false);
    setRoleName("");
    setSelectAccess("");
    setPermissionGroups(initialPermissionGroups);
  };

  const resetAndOpenModal = () => {
    setRoleName("");
    setSelectAccess("");
    setPermissionGroups(initialPermissionGroups);
    setRoleModalOpen(true);
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-semibold text-foreground">List All Roles</h1>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Show:</span>
            <Select value={entriesPerPage} onValueChange={setEntriesPerPage}>
              <SelectTrigger className="w-[70px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">entries</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Search:</span>
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-[200px] h-8"
              />
            </div>
            <Button className="btn-success gap-2" onClick={resetAndOpenModal}>
              <Plus size={16} />
              Set New Role
            </Button>
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
                  <th className="px-4 py-3 text-left text-sm font-semibold">Menu Permission</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Added Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredRoles.map((role, index) => (
                  <tr
                    key={role.id}
                    className={`border-b border-border hover:bg-table-row-hover transition-colors ${
                      index % 2 === 0 ? "bg-card" : "bg-secondary/30"
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button className="p-1.5 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors">
                          <Pencil size={14} />
                        </button>
                        <button className="p-1.5 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">{role.id}</td>
                    <td className="px-4 py-3 text-sm text-primary font-medium">{role.name}</td>
                    <td className="px-4 py-3 text-sm text-primary">{role.menuPermission}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{role.addedDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-primary">
            Showing 1 to {filteredRoles.length} of {filteredRoles.length} entries
          </p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" disabled>Previous</Button>
            <Button variant="default" size="sm" className="btn-success">1</Button>
            <Button variant="outline" size="sm">Next</Button>
          </div>
        </div>
      </div>

      {/* Set New Role Modal */}
      <Dialog open={roleModalOpen} onOpenChange={setRoleModalOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Set New Role</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 py-4">
            {/* Left Column - Form Fields */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Role Name</Label>
                <Input
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  placeholder="Role Name"
                />
              </div>
              <div className="space-y-2">
                <Label>Select Access</Label>
                <Select value={selectAccess} onValueChange={setSelectAccess}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Access" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Menu Access</SelectItem>
                    <SelectItem value="custom">Custom Menu Access</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Middle Column - Resources */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">Resources</h3>
              {permissionGroups.slice(0, 4).map((group) => (
                <div key={group.id} className="space-y-1">
                  <div
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() => toggleGroup(group.id)}
                  >
                    <span className="text-muted-foreground text-sm">{group.expanded ? "−" : "+"}</span>
                    <Checkbox
                      checked={group.permissions.every(p => p.checked)}
                      onCheckedChange={() => toggleAllInGroup(group.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className="font-medium text-sm">{group.name}</span>
                  </div>
                  {group.expanded && (
                    <div className="ml-8 space-y-1">
                      {group.permissions.map((perm) => (
                        <div key={perm.id} className="flex items-center gap-2">
                          <Checkbox
                            checked={perm.checked}
                            onCheckedChange={() => togglePermission(group.id, perm.id)}
                          />
                          <span className="text-sm">{perm.label}</span>
                          <span className="text-sm text-primary underline cursor-pointer">{perm.action}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Right Column - More Resources */}
            <div className="space-y-3">
              {permissionGroups.slice(4).map((group) => (
                <div key={group.id} className="space-y-1">
                  <div
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() => toggleGroup(group.id)}
                  >
                    <span className="text-muted-foreground text-sm">{group.expanded ? "−" : "+"}</span>
                    <Checkbox
                      checked={group.permissions.every(p => p.checked)}
                      onCheckedChange={() => toggleAllInGroup(group.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className="font-medium text-sm">{group.name}</span>
                  </div>
                  {group.expanded && (
                    <div className="ml-8 space-y-1">
                      {group.permissions.map((perm) => (
                        <div key={perm.id} className="flex items-center gap-2">
                          <Checkbox
                            checked={perm.checked}
                            onCheckedChange={() => togglePermission(group.id, perm.id)}
                          />
                          <span className="text-sm">{perm.label}</span>
                          <span className="text-sm text-primary underline cursor-pointer">{perm.action}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button variant="outline" onClick={() => setRoleModalOpen(false)}>Cancel</Button>
            <Button className="btn-success" onClick={handleSaveRole}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default PermissionRoles;
