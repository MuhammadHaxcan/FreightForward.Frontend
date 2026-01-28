import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Pencil, Trash2, ChevronDown, X } from "lucide-react";
import { usersApi, rolesApi } from "../services/api/auth";
import { PermissionGate } from "../components/auth/PermissionGate";
import type { UserListItem, CreateUserRequest, UpdateUserRequest } from "../types/auth";

const AllUsers = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState("10");
  const [currentPage, setCurrentPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserListItem | null>(null);

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
  const [rolesPopoverOpen, setRolesPopoverOpen] = useState(false);

  // Fetch users
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["users", currentPage, parseInt(entriesPerPage), searchTerm],
    queryFn: async () => {
      const result = await usersApi.getAll({
        pageNumber: currentPage,
        pageSize: parseInt(entriesPerPage),
        searchTerm: searchTerm || undefined,
      });
      if (result.error) throw new Error(result.error);
      return result.data;
    },
  });

  // Fetch all roles for dropdown
  const { data: rolesData } = useQuery({
    queryKey: ["roles-list"],
    queryFn: async () => {
      const result = await rolesApi.getAllList();
      if (result.error) throw new Error(result.error);
      return result.data;
    },
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (data: CreateUserRequest) => {
      const result = await usersApi.create(data);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      toast.success("User created successfully");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setModalOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create user");
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateUserRequest }) => {
      const result = await usersApi.update(id, data);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      toast.success("User updated successfully");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setModalOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update user");
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      const result = await usersApi.delete(id);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      toast.success("User deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete user");
    },
  });

  const users = usersData?.items || [];
  const totalCount = usersData?.totalCount || 0;
  const totalPages = usersData?.totalPages || 1;
  const roles = rolesData || [];

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setContactNumber("");
    setEmail("");
    setPassword("");
    setIsActive(true);
    setSelectedRoleIds([]);
    setEditingUserId(null);
  };

  const handleAddNew = () => {
    resetForm();
    setModalMode("add");
    setModalOpen(true);
  };

  const handleEdit = async (user: UserListItem) => {
    // Fetch full user details to get role IDs
    const result = await usersApi.getById(user.id);
    if (result.error) {
      toast.error("Failed to load user details");
      return;
    }
    const fullUser = result.data!;

    setFirstName(fullUser.firstName);
    setLastName(fullUser.lastName);
    setContactNumber(fullUser.contactNumber || "");
    setEmail(fullUser.email);
    setPassword("");
    setIsActive(fullUser.isActive);
    setSelectedRoleIds(fullUser.roles.map(r => r.id));
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
      deleteUserMutation.mutate(userToDelete.id);
    }
  };

  const handleSave = () => {
    if (modalMode === "add") {
      if (!password) {
        toast.error("Password is required for new users");
        return;
      }
      const createData: CreateUserRequest = {
        firstName,
        lastName,
        email,
        password,
        contactNumber: contactNumber || undefined,
        isActive,
        roleIds: selectedRoleIds,
      };
      createUserMutation.mutate(createData);
    } else if (editingUserId) {
      const updateData: UpdateUserRequest = {
        firstName,
        lastName,
        email,
        password: password || undefined,
        contactNumber: contactNumber || undefined,
        isActive,
        roleIds: selectedRoleIds,
      };
      updateUserMutation.mutate({ id: editingUserId, data: updateData });
    }
  };

  const toggleRole = (roleId: number) => {
    setSelectedRoleIds(prev =>
      prev.includes(roleId)
        ? prev.filter(id => id !== roleId)
        : [...prev, roleId]
    );
  };

  const removeRole = (roleId: number) => {
    setSelectedRoleIds(prev => prev.filter(id => id !== roleId));
  };

  const getSelectedRoleNames = () => {
    return roles
      .filter(r => selectedRoleIds.includes(r.id))
      .map(r => r.name);
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
            <Select value={entriesPerPage} onValueChange={(value) => { setEntriesPerPage(value); setCurrentPage(1); }}>
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
                  <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Roles</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {usersLoading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      Loading...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
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
          <p className="text-sm text-primary">
            Showing {users.length > 0 ? (currentPage - 1) * parseInt(entriesPerPage) + 1 : 0} to{" "}
            {Math.min(currentPage * parseInt(entriesPerPage), totalCount)} of {totalCount} entries
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

      {/* Add/Edit Employee Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {modalMode === "add" ? "Add New" : "Edit"} Employee
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">First Name <span className="text-destructive">*</span></Label>
                <Input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First Name"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Last Name <span className="text-destructive">*</span></Label>
                <Input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last Name"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Email <span className="text-destructive">*</span></Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Contact Number</Label>
                <Input
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  placeholder="Contact Number"
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
              <Popover open={rolesPopoverOpen} onOpenChange={setRolesPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={rolesPopoverOpen}
                    className="w-full justify-between h-auto min-h-10 py-2"
                  >
                    <div className="flex flex-wrap gap-1">
                      {selectedRoleIds.length === 0 ? (
                        <span className="text-muted-foreground">Select roles...</span>
                      ) : (
                        getSelectedRoleNames().map((name) => {
                          const role = roles.find(r => r.name === name);
                          return (
                            <span
                              key={name}
                              className="bg-primary/10 text-primary px-2 py-0.5 rounded text-sm flex items-center gap-1"
                            >
                              {name}
                              <X
                                size={12}
                                className="cursor-pointer hover:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (role) removeRole(role.id);
                                }}
                              />
                            </span>
                          );
                        })
                      )}
                    </div>
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[280px] p-0"
                  align="start"
                  onWheel={(e) => e.stopPropagation()}
                >
                  <div
                    className="max-h-[180px] overflow-y-auto p-1 overscroll-contain [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                    onWheel={(e) => {
                      e.stopPropagation();
                      const target = e.currentTarget;
                      target.scrollTop += e.deltaY;
                    }}
                  >
                    {roles.map((role) => (
                      <div
                        key={role.id}
                        className="flex items-center gap-2 px-2 py-1.5 hover:bg-accent rounded cursor-pointer"
                        onClick={() => toggleRole(role.id)}
                      >
                        <Checkbox
                          checked={selectedRoleIds.includes(role.id)}
                          onCheckedChange={() => toggleRole(role.id)}
                        />
                        <span className="text-sm">{role.name}</span>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
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
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete user{" "}
              <span className="font-medium text-foreground">{userToDelete?.fullName}</span>?
              This action cannot be undone.
            </p>
          </div>
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
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default AllUsers;
