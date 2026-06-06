import { useState, useEffect } from "react";
import { toast } from "sonner";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { SearchableMultiSelect } from "@/components/ui/searchable-multi-select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { EmployeeDropdown } from "../services/api/hr";
import { PermissionGate } from "../components/auth/PermissionGate";
import type { UserListItem, CreateUserRequest, UpdateUserRequest } from "../types/auth";
import {
  useUsers,
  useUserById,
  useAllRolesList,
  useUnlinkedEmployees,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
} from "@/hooks/useUsers";

const AllUsers = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState("10");
  const [currentPage, setCurrentPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserListItem | null>(null);

  // Form state
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);

  // Employee link state
  const [employeeId, setEmployeeId] = useState("");
  const [currentLinkedEmployee, setCurrentLinkedEmployee] = useState<{ id: number; employeeCode: string; fullName: string; } | null>(null);

  // Data hooks
  const { data: usersData, isLoading: usersLoading } = useUsers({
    pageNumber: currentPage,
    pageSize: parseInt(entriesPerPage, 10) || 10,
    searchTerm: searchTerm || undefined,
  });

  const { data: rolesData } = useAllRolesList();
  const { data: unlinkedEmployees } = useUnlinkedEmployees(modalOpen);

  // Fetch user details when editing
  const { data: editUserData } = useUserById(modalMode === "edit" ? editingUserId : null);

  // Populate form when edit user data arrives
  useEffect(() => {
    if (editUserData && modalMode === "edit") {
      setUsername(editUserData.username);
      setFirstName(editUserData.firstName);
      setLastName(editUserData.lastName);
      setContactNumber(editUserData.contactNumber || "");
      setEmail(editUserData.email);
      setPassword("");
      setIsActive(editUserData.isActive);
      setSelectedRoleIds(editUserData.roles.map((r: { id: number }) => r.id.toString()));
      if (editUserData.linkedEmployee) {
        setCurrentLinkedEmployee(editUserData.linkedEmployee);
        setEmployeeId(editUserData.linkedEmployee.id.toString());
      } else {
        setCurrentLinkedEmployee(null);
        setEmployeeId("");
      }
    }
  }, [editUserData, modalMode]);

  // Mutation hooks
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();

  const users = usersData?.items || [];
  const totalCount = usersData?.totalCount || 0;
  const totalPages = usersData?.totalPages || 1;
  const roles = rolesData || [];

  const resetForm = () => {
    setUsername("");
    setFirstName("");
    setLastName("");
    setContactNumber("");
    setEmail("");
    setPassword("");
    setIsActive(true);
    setSelectedRoleIds([]);
    setEditingUserId(null);
    setEmployeeId("");
    setCurrentLinkedEmployee(null);
  };

  // Convert string[] to number[] for API calls
  const getSelectedRoleIdsAsNumbers = () => selectedRoleIds.map(id => parseInt(id));

  const handleAddNew = () => {
    resetForm();
    setModalMode("add");
    setModalOpen(true);
  };

  const handleEdit = (user: UserListItem) => {
    resetForm();
    setModalMode("edit");
    setEditingUserId(user.id);
    setModalOpen(true);
  };

  const handleDelete = (user: UserListItem) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (userToDelete) {
      deleteUserMutation.mutate(userToDelete.id, {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setUserToDelete(null);
        },
      });
    }
  };

  const handleSave = () => {
    if (modalMode === "add") {
      if (!username.trim()) {
        toast.error("Username is required");
        return;
      }
      if (!employeeId) {
        toast.error("Please select an employee to link");
        return;
      }
      if (!password) {
        toast.error("Password is required for new users");
        return;
      }
      const createData: CreateUserRequest = {
        username,
        firstName,
        lastName,
        email,
        password,
        contactNumber: contactNumber || undefined,
        isActive,
        roleIds: getSelectedRoleIdsAsNumbers(),
        employeeId: employeeId ? parseInt(employeeId) : undefined,
      };
      createUserMutation.mutate(createData, {
        onSuccess: () => {
          setModalOpen(false);
          resetForm();
        },
      });
    } else if (editingUserId) {
      const updateData: UpdateUserRequest = {
        username,
        firstName,
        lastName,
        email,
        password: password || undefined,
        contactNumber: contactNumber || undefined,
        isActive,
        roleIds: getSelectedRoleIdsAsNumbers(),
        employeeId: employeeId ? parseInt(employeeId) : undefined,
      };
      updateUserMutation.mutate({ id: editingUserId, data: updateData }, {
        onSuccess: () => {
          setModalOpen(false);
          resetForm();
        },
      });
    }
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-4">
        {/* List Section */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-foreground">
            List All <span className="font-normal">Employees</span>
          </h1>
          <PermissionGate permission="user_add">
            <Button className="btn-success gap-2" onClick={handleAddNew}>
              <Plus size={16} />
              Add New
            </Button>
          </PermissionGate>
        </div>

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
              onValueChange={(value) => { setEntriesPerPage(value); setCurrentPage(1); }}
              triggerClassName="w-[90px] h-8"
            />
            <span className="text-sm text-muted-foreground">entries</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Search:</span>
            <Input
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-[200px] h-8"
            />
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-table-header text-table-header-foreground">
                  <th className="px-4 py-3 text-left text-sm font-semibold">Action</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Username</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Roles</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {usersLoading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      Loading...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((user, index) => (
                    <tr
                      key={user.id}
                      className={`border-b border-border hover:bg-table-row-hover transition-colors ${
                        index % 2 === 0 ? "bg-card" : "bg-secondary/30"
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <PermissionGate permission="user_edit">
                            <button
                              className="p-1.5 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                              onClick={() => handleEdit(user)}
                            >
                              <Pencil size={14} />
                            </button>
                          </PermissionGate>
                          <PermissionGate permission="user_delete">
                            <button
                              className="p-1.5 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 transition-colors"
                              onClick={() => handleDelete(user)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </PermissionGate>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{user.username}</td>
                      <td className="px-4 py-3 text-sm text-primary font-medium">{user.fullName}</td>
                      <td className="px-4 py-3 text-sm text-primary">{user.email}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {user.roleNames?.join(", ") || "-"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-3 py-1 rounded text-sm font-medium text-white ${
                            user.isActive ? "bg-green-500" : "bg-red-400"
                          }`}
                        >
                          {user.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Showing {users.length > 0 ? (currentPage - 1) * (parseInt(entriesPerPage, 10) || 10) + 1 : 0} to{" "}
            {Math.min(currentPage * (parseInt(entriesPerPage, 10) || 10), totalCount)} of {totalCount} entries
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
            >
              Previous
            </Button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const page = i + 1;
              return (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  className={currentPage === page ? "btn-success" : ""}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Add/Edit User Modal */}
      <Dialog open={modalOpen} onOpenChange={(open) => { setModalOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="sm:max-w-modal-xl max-h-[85vh] overflow-y-auto p-0 bg-card">
          <DialogHeader className="bg-modal-header text-white p-4 rounded-t-lg">
            <DialogTitle className="text-white">
              {modalMode === "add" ? "Add New" : "Edit"} User
            </DialogTitle>
          </DialogHeader>

          <div className="p-6 space-y-6">
            {/* Employee link dropdown */}
            <div className="space-y-2">
              <Label className="text-sm">
                Employee {modalMode === "add" && <span className="text-destructive">*</span>}
              </Label>
              <SearchableSelect
                options={[
                  // In edit mode, include the currently linked employee at the top if not already in unlinked list
                  ...(modalMode === "edit" && currentLinkedEmployee
                    ? [{ value: currentLinkedEmployee.id.toString(), label: `${currentLinkedEmployee.fullName} (${currentLinkedEmployee.employeeCode})` }]
                    : []),
                  ...(unlinkedEmployees || [])
                    .filter((e: EmployeeDropdown) => !currentLinkedEmployee || e.id !== currentLinkedEmployee.id)
                    .map((e: EmployeeDropdown) => ({
                      value: e.id.toString(),
                      label: `${e.firstName} ${e.lastName} (${e.employeeCode})`,
                    })),
                ]}
                value={employeeId}
                onValueChange={(val) => {
                  setEmployeeId(val);
                  if (val && modalMode === "add") {
                    const emp = (unlinkedEmployees || []).find((e: EmployeeDropdown) => e.id.toString() === val);
                    if (emp) {
                      setFirstName(emp.firstName);
                      setLastName(emp.lastName);
                      setEmail(emp.email || "");
                      setContactNumber(emp.contactNumber || "");
                    }
                  } else if (!val && modalMode === "add") {
                    setFirstName("");
                    setLastName("");
                    setEmail("");
                    setContactNumber("");
                  }
                }}
                placeholder="Select employee to link..."
                searchPlaceholder="Search employees..."
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Username <span className="text-destructive">*</span></Label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                disabled={modalMode === "edit"}
                className={modalMode === "edit" ? "bg-muted cursor-not-allowed" : ""}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">First Name <span className="text-destructive">*</span></Label>
                <Input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First Name"
                  readOnly={!!employeeId}
                  className={employeeId ? "bg-muted cursor-not-allowed" : ""}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Last Name <span className="text-destructive">*</span></Label>
                <Input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last Name"
                  readOnly={!!employeeId}
                  className={employeeId ? "bg-muted cursor-not-allowed" : ""}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  readOnly={!!employeeId}
                  className={employeeId ? "bg-muted cursor-not-allowed" : ""}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Contact Number</Label>
                <Input
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  placeholder="Contact Number"
                  readOnly={!!employeeId}
                  className={employeeId ? "bg-muted cursor-not-allowed" : ""}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">
                  Password {modalMode === "add" && <span className="text-destructive">*</span>}
                  {modalMode === "edit" && <span className="text-muted-foreground text-xs">(leave blank to keep current)</span>}
                </Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={modalMode === "add" ? "Password" : "New Password (optional)"}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Status</Label>
                <div className="flex items-center gap-2 h-10">
                  <Checkbox
                    id="isActive"
                    checked={isActive}
                    onCheckedChange={(checked) => setIsActive(checked === true)}
                  />
                  <Label htmlFor="isActive" className="text-sm font-normal cursor-pointer">
                    Active
                  </Label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Roles</Label>
              <SearchableMultiSelect
                options={roles.map(role => ({ value: role.id.toString(), label: role.name }))}
                values={selectedRoleIds}
                onValuesChange={setSelectedRoleIds}
                placeholder="Select roles..."
                searchPlaceholder="Search roles..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-border">
              <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button
                className="btn-success"
                onClick={handleSave}
                disabled={createUserMutation.isPending || updateUserMutation.isPending}
              >
                {(createUserMutation.isPending || updateUserMutation.isPending) ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-modal-md p-0 bg-card">
          <DialogHeader className="bg-modal-header text-white p-4 rounded-t-lg">
            <DialogTitle className="text-white">Confirm Delete</DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete user{" "}
              <span className="font-medium text-foreground">{userToDelete?.fullName}</span>?
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 pt-4 border-t border-border">
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                disabled={deleteUserMutation.isPending}
              >
                {deleteUserMutation.isPending ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default AllUsers;
