import { MainLayout } from "@/components/layout/MainLayout";
import { Check, X, Loader2 } from "lucide-react";
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
import { usePendingApprovalCustomers, useApproveCustomer, useDenyCustomer } from "@/hooks/useCustomers";
import { Customer } from "@/services/api";

const CustomerApproval = () => {
  const [entriesPerPage, setEntriesPerPage] = useState("10");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [customerToDeny, setCustomerToDeny] = useState<Customer | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data, isLoading, error } = usePendingApprovalCustomers({
    pageNumber: currentPage,
    pageSize: parseInt(entriesPerPage),
    searchTerm: debouncedSearchTerm || undefined,
  });

  const approveMutation = useApproveCustomer();
  const denyMutation = useDenyCustomer();

  const customers = data?.items || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = data?.totalPages || 1;

  const confirmDeny = () => {
    if (customerToDeny) {
      denyMutation.mutate(customerToDeny.id);
      setCustomerToDeny(null);
    }
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-foreground">Pending Approval</h1>
        </div>

        {/* Actions Row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
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
              <span className="text-sm text-muted-foreground">Search:</span>
              <div className="relative">
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-[250px] h-8 pr-8"
                  placeholder="Name or code..."
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

        {/* Table */}
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
                    <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Phone</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Country</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Created At</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                        No pending customers found
                      </td>
                    </tr>
                  ) : (
                    customers.map((customer, index) => (
                      <tr
                        key={customer.id}
                        className={`border-b border-border hover:bg-table-row-hover transition-colors ${
                          index % 2 === 0 ? "bg-card" : "bg-secondary/30"
                        }`}
                      >
                        <td className="px-4 py-3 text-sm font-medium text-foreground">{customer.code}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{customer.masterType}</td>
                        <td className="px-4 py-3 text-sm text-foreground">{customer.name}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{customer.phone || "-"}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{customer.country || "-"}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {new Date(customer.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              className="h-8 gap-1 bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => approveMutation.mutate(customer.id)}
                              disabled={approveMutation.isPending}
                            >
                              <Check size={14} />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-8 gap-1"
                              onClick={() => setCustomerToDeny(customer)}
                              disabled={denyMutation.isPending}
                            >
                              <X size={14} />
                              Deny
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Showing {customers.length > 0 ? ((currentPage - 1) * parseInt(entriesPerPage)) + 1 : 0} to {Math.min(currentPage * parseInt(entriesPerPage), totalCount)} of {totalCount} entries
          </p>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((page) => (
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
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Deny Confirmation */}
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

export default CustomerApproval;
