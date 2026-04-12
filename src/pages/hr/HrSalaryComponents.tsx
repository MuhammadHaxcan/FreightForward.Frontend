import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { formatDate } from "@/lib/utils";
import {
  hrSalaryApi,
  SalaryComponent,
  CreateSalaryComponentRequest,
} from "@/services/api/hr";

const HrSalaryComponents = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<SalaryComponent | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [componentType, setComponentType] = useState("Earning");
  const [isActive, setIsActive] = useState(true);

  // Fetch salary components
  const { data: compData, isLoading } = useQuery({
    queryKey: ["hr-salary-components", pageNumber, pageSize, searchTerm],
    queryFn: async () => {
      const result = await hrSalaryApi.getComponents({
        pageNumber,
        pageSize,
        searchTerm: searchTerm || undefined,
      });
      if (result.error) throw new Error(result.error);
      return result.data;
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: CreateSalaryComponentRequest) => {
      const result = await hrSalaryApi.createComponent(data);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      toast.success("Salary component created successfully");
      queryClient.invalidateQueries({ queryKey: ["hr-salary-components"] });
      queryClient.invalidateQueries({ queryKey: ["hr-salary-components-active"] });
      setModalOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create salary component");
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: CreateSalaryComponentRequest }) => {
      const result = await hrSalaryApi.updateComponent(id, data);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      toast.success("Salary component updated successfully");
      queryClient.invalidateQueries({ queryKey: ["hr-salary-components"] });
      queryClient.invalidateQueries({ queryKey: ["hr-salary-components-active"] });
      setModalOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update salary component");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const result = await hrSalaryApi.deleteComponent(id);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      toast.success("Salary component deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["hr-salary-components"] });
      queryClient.invalidateQueries({ queryKey: ["hr-salary-components-active"] });
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete salary component");
    },
  });

  const items = compData?.items || [];
  const totalCount = compData?.totalCount || 0;
  const totalPages = compData?.totalPages || 1;

  const resetForm = () => {
    setName("");
    setCode("");
    setComponentType("Earning");
    setIsActive(true);
    setEditingId(null);
  };

  const handleAddNew = () => {
    resetForm();
    setModalMode("add");
    setModalOpen(true);
  };

  const handleEdit = (comp: SalaryComponent) => {
    setName(comp.name);
    setCode(comp.code || "");
    setComponentType(comp.componentType);
    setIsActive(comp.isActive);
    setEditingId(comp.id);
    setModalMode("edit");
    setModalOpen(true);
  };

  const handleDelete = (comp: SalaryComponent) => {
    setItemToDelete(comp);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      deleteMutation.mutate(itemToDelete.id);
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    const data: CreateSalaryComponentRequest = {
      name,
      code: code || undefined,
      componentType,
      isActive,
    };
    if (modalMode === "add") {
      createMutation.mutate(data);
    } else if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    }
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-foreground">Salary Components</h1>
          <PermissionGate permission="hr_salary_add">
            <Button className="btn-success gap-2" onClick={handleAddNew}>
              <Plus size={16} />
              Add New
            </Button>
          </PermissionGate>
        </div>

        {/* Search / Entries */}
        <div className="bg-muted/30 border rounded-lg p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">Show:</Label>
              <SearchableSelect
                options={[
                  { value: "10", label: "10" },
                  { value: "25", label: "25" },
                  { value: "50", label: "50" },
                  { value: "100", label: "100" },
                ]}
                value={pageSize.toString()}
                onValueChange={(v) => { setPageSize(parseInt(v)); setPageNumber(1); }}
                triggerClassName="w-[90px] h-8"
              />
              <span className="text-sm text-muted-foreground">entries</span>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">Search:</Label>
              <Input
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPageNumber(1); }}
                className="w-[200px] h-8"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-table-header text-table-header-foreground">
                  <th className="px-4 py-3 text-left text-sm font-semibold">Action</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Code</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Created</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      Loading...
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      No records found
                    </td>
                  </tr>
                ) : (
                  items.map((comp, index) => (
                    <tr
                      key={comp.id}
                      className={`border-b border-border hover:bg-table-row-hover transition-colors ${
                        index % 2 === 0 ? "bg-card" : "bg-secondary/30"
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <PermissionGate permission="hr_salary_edit">
                            <button
                              className="p-1.5 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                              onClick={() => handleEdit(comp)}
                            >
                              <Pencil size={14} />
                            </button>
                          </PermissionGate>
                          <PermissionGate permission="hr_salary_delete">
                            <button
                              className="p-1.5 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 transition-colors"
                              onClick={() => handleDelete(comp)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </PermissionGate>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">{comp.name}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{comp.code || "-"}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-3 py-1 rounded text-sm font-medium text-white ${
                            comp.componentType === "Earning" ? "bg-green-500" : "bg-red-400"
                          }`}
                        >
                          {comp.componentType}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-3 py-1 rounded text-sm font-medium text-white ${
                            comp.isActive ? "bg-green-500" : "bg-red-400"
                          }`}
                        >
                          {comp.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(comp.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Showing {items.length > 0 ? (pageNumber - 1) * pageSize + 1 : 0} to{" "}
            {Math.min(pageNumber * pageSize, totalCount)} of {totalCount} entries
          </p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" disabled={pageNumber === 1} onClick={() => setPageNumber((p) => p - 1)}>
              Previous
            </Button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (pageNumber <= 3) {
                pageNum = i + 1;
              } else if (pageNumber >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = pageNumber - 2 + i;
              }
              return (
                <Button
                  key={pageNum}
                  variant={pageNumber === pageNum ? "default" : "outline"}
                  size="sm"
                  className={pageNumber === pageNum ? "btn-success" : ""}
                  onClick={() => setPageNumber(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
            <Button variant="outline" size="sm" disabled={pageNumber === totalPages || totalPages === 0} onClick={() => setPageNumber((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto p-0 bg-card">
          <DialogHeader className="bg-modal-header text-white p-4 rounded-t-lg">
            <DialogTitle className="text-white">
              {modalMode === "add" ? "Add New" : "Edit"} Salary Component
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <Label className="text-sm">Name <span className="text-destructive">*</span></Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Basic Salary" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Code</Label>
              <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. BASIC" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Type <span className="text-destructive">*</span></Label>
              <SearchableSelect
                options={[
                  { value: "Earning", label: "Earning" },
                  { value: "Deduction", label: "Deduction" },
                ]}
                value={componentType}
                onValueChange={setComponentType}
                placeholder="Select type..."
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="isActive" checked={isActive} onCheckedChange={(checked) => setIsActive(checked === true)} />
              <Label htmlFor="isActive" className="text-sm font-normal cursor-pointer">Active</Label>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-border">
              <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button
                className="btn-success"
                onClick={handleSave}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {(createMutation.isPending || updateMutation.isPending) ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Salary Component</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete salary component{" "}
              <span className="font-medium text-foreground">{itemToDelete?.name}</span>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
};

export default HrSalaryComponents;
