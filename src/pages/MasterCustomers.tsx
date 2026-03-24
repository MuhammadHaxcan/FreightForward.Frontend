import { MainLayout } from "@/components/layout/MainLayout";
import { Plus, Pencil, Eye, Trash2, Loader2, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
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
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CustomerModal } from "@/components/customers/CustomerModal";
import { useApproveCustomer, useCustomers, useDeleteCustomer, useDenyCustomer } from "@/hooks/useCustomers";
import { Customer, CustomerApprovalStatus, MasterType } from "@/services/api";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { useAuth } from "@/contexts/AuthContext";

const approvalFilterOptions = [
  { value: "approved", label: "Approved" },
  { value: "pending", label: "Pending" },
  { value: "all", label: "All" },
] as const;

const MasterCustomers = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const canApproveCustomers = hasPermission("cust_approve");

  const [modalOpen, setModalOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [entriesPerPage, setEntriesPerPage] = useState("10");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [masterTypeFilter, setMasterTypeFilter] = useState("");
  const [approvalStatusFilter, setApprovalStatusFilter] = useState<CustomerApprovalStatus>("approved");
  const [currentPage, setCurrentPage] = useState(1);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [customerToDeny, setCustomerToDeny] = useState<Customer | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data, isLoading, error } = useCustomers({
    pageNumber: currentPage,
    pageSize: parseInt(entriesPerPage, 10),
    searchTerm: debouncedSearchTerm || undefined,
    masterType: (masterTypeFilter || undefined) as MasterType | undefined,
    approvalStatus: canApproveCustomers ? approvalStatusFilter : "approved",
  });

  const deleteMutation = useDeleteCustomer();
  const approveMutation = useApproveCustomer();
  const denyMutation = useDenyCustomer();

  const customers = data?.items || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = data?.totalPages || 1;
  const columnCount = canApproveCustomers ? 8 : 7;

  const handleAddNew = () => {
    setEditCustomer(null);
    setModalMode("add");
    setModalOpen(true);
  };

  const handleEdit = (customer: Customer) => {
    if (customer.masterType === "Debtors" || customer.masterType === "Creditors") {
      navigate(`/master-customers/${customer.id}/edit`);
      return;
    }

    if (customer.masterType === "Neutral") {
      navigate(`/master-customers/${customer.id}/neutral/edit`);
      return;
    }

    setEditCustomer(customer);
    setModalMode("edit");
    setModalOpen(true);
  };

  const handleView = (customer: Customer) => {
    if (customer.masterType === "Debtors" || customer.masterType === "Creditors") {
      navigate(`/master-customers/${customer.id}/edit?mode=view`);
      return;
    }

    if (customer.masterType === "Neutral") {
      navigate(`/master-customers/${customer.id}/neutral/edit?mode=view`);
    }
  };

  const handleDelete = (customer: Customer) => {
    setCustomerToDelete(customer);
  };

  const confirmDelete = () => {
    if (!customerToDelete) {
      return;
    }

    deleteMutation.mutate(customerToDelete.id);
    setCustomerToDelete(null);
  };

  const confirmDeny = () => {
    if (!customerToDeny) {
      return;
    }

    denyMutation.mutate(customerToDeny.id);
    setCustomerToDeny(null);
  };

  const renderApprovalBadge = (customer: Customer) => {
    const isApproved = customer.isApproved ?? true;
    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
          isApproved
            ? "bg-green-100 text-green-800"
            : "bg-yellow-100 text-yellow-800"
        }`}
      >
        {isApproved ? "Approved" : "Pending"}
      </span>
    );
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-foreground">Master Customers</h1>
          <PermissionGate permission="cust_add">
            <Button className="btn-success gap-2" onClick={handleAddNew}>
              <Plus size={16} />
              Add New Customer
            </Button>
          </PermissionGate>
        </div>

        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-4">
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
                onValueChange={(value) => {
                  setEntriesPerPage(value);
                  setCurrentPage(1);
                }}
                triggerClassName="w-[90px] h-8"
              />
              <span className="text-sm text-muted-foreground">entries</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Master Type:</span>
              <SearchableSelect
                options={[
                  { value: "all", label: "All" },
                  { value: "Debtors", label: "Debtors" },
                  { value: "Creditors", label: "Creditors" },
                  { value: "Neutral", label: "Neutral" },
                ]}
                value={masterTypeFilter || "all"}
                onValueChange={(value) => {
                  setMasterTypeFilter(value === "all" ? "" : value);
                  setCurrentPage(1);
                }}
                triggerClassName="w-[120px] h-8"
              />
            </div>

            {canApproveCustomers && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Approval:</span>
                <SearchableSelect
                  options={approvalFilterOptions.map((option) => ({
                    value: option.value,
                    label: option.label,
                  }))}
                  value={approvalStatusFilter}
                  onValueChange={(value) => {
                    setApprovalStatusFilter(value as CustomerApprovalStatus);
                    setCurrentPage(1);
                  }}
                  triggerClassName="w-[130px] h-8"
                />
              </div>
            )}

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Search:</span>
              <div className="relative">
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-[250px] h-8 pr-8"
                  placeholder="Name, code or email..."
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-12 text-destructive">
                Error loading customers. Please try again.
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-table-header text-table-header-foreground">
                    <th className="px-4 py-3 text-left text-sm font-semibold">Code</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Master Type</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Category</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Phone</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Country</th>
                    {canApproveCustomers && (
                      <th className="px-4 py-3 text-left text-sm font-semibold">Approval</th>
                    )}
                    <th className="px-4 py-3 text-left text-sm font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.length === 0 ? (
                    <tr>
                      <td colSpan={columnCount} className="px-4 py-8 text-center text-muted-foreground">
                        No customers found
                      </td>
                    </tr>
                  ) : (
                    customers.map((customer, index) => {
                      const isApproved = customer.isApproved ?? true;

                      return (
                        <tr
                          key={customer.id}
                          className={`border-b border-border hover:bg-table-row-hover transition-colors ${
                            index % 2 === 0 ? "bg-card" : "bg-secondary/30"
                          }`}
                        >
                          <td className="px-4 py-3 text-sm font-medium text-foreground">{customer.code}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{customer.masterType}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {customer.categories?.map((category) => category.name).join(", ") || "-"}
                          </td>
                          <td className="px-4 py-3 text-sm text-foreground">{customer.name}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{customer.phone || "-"}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{customer.country || "-"}</td>
                          {canApproveCustomers && (
                            <td className="px-4 py-3 text-sm text-muted-foreground">
                              {renderApprovalBadge(customer)}
                            </td>
                          )}
                          <td className="px-4 py-3">
                            {canApproveCustomers && !isApproved ? (
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  className="h-8 gap-1 bg-green-600 hover:bg-green-700 text-white"
                                  onClick={() => approveMutation.mutate(customer.id)}
                                  disabled={approveMutation.isPending || denyMutation.isPending}
                                >
                                  <Check size={14} />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="h-8 gap-1"
                                  onClick={() => setCustomerToDeny(customer)}
                                  disabled={approveMutation.isPending || denyMutation.isPending}
                                >
                                  <X size={14} />
                                  Deny
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <PermissionGate permission="cust_edit">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                                    onClick={() => handleEdit(customer)}
                                  >
                                    <Pencil size={16} />
                                  </Button>
                                </PermissionGate>
                                {(customer.masterType === "Debtors" ||
                                  customer.masterType === "Creditors" ||
                                  customer.masterType === "Neutral") && (
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                                    onClick={() => handleView(customer)}
                                  >
                                    <Eye size={16} />
                                  </Button>
                                )}
                                <PermissionGate permission="cust_delete">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => handleDelete(customer)}
                                  >
                                    <Trash2 size={16} />
                                  </Button>
                                </PermissionGate>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Showing {customers.length > 0 ? (currentPage - 1) * parseInt(entriesPerPage, 10) + 1 : 0} to{" "}
            {Math.min(currentPage * parseInt(entriesPerPage, 10), totalCount)} of {totalCount} entries
          </p>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, index) => index + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                className={currentPage === page ? "btn-success" : ""}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            ))}
            {totalPages > 5 && <span className="px-2 text-muted-foreground">...</span>}
            {totalPages > 5 && (
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(totalPages)}>
                {totalPages}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={currentPage >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      <CustomerModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        customer={editCustomer}
        mode={modalMode}
      />

      <AlertDialog open={!!customerToDelete} onOpenChange={() => setCustomerToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{customerToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!customerToDeny} onOpenChange={() => setCustomerToDeny(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deny Customer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deny "{customerToDeny?.name}"? This customer will be removed from the pending list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeny}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Deny
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
};

export default MasterCustomers;
