import { useState } from "react";
import { Edit, Trash2, Plus, Loader2 } from "lucide-react";
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
import { CompanyModal } from "./CompanyModal";
import { useCompanies, useDeleteCompany } from "@/hooks/useCompanies";
import { Company } from "@/services/api";
import { PermissionGate } from "@/components/auth/PermissionGate";

export function CompaniesTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState("10");
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);

  const { data, isLoading, error } = useCompanies({
    pageNumber: currentPage,
    pageSize: parseInt(entriesPerPage),
    searchTerm: searchTerm || undefined,
  });

  const deleteMutation = useDeleteCompany();

  const handleEdit = (company: Company) => {
    setSelectedCompany(company);
    setIsEditModalOpen(true);
  };

  const handleDelete = (company: Company) => {
    setCompanyToDelete(company);
  };

  const confirmDelete = () => {
    if (companyToDelete) {
      deleteMutation.mutate(companyToDelete.id);
      setCompanyToDelete(null);
    }
  };

  const companies = data?.items || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = data?.totalPages || 1;

  return (
    <>
      <div className="bg-card rounded-lg shadow-sm border border-border animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">
            <span className="font-bold">List All</span> Companies
          </h2>
          <PermissionGate permission="company_add">
            <Button className="btn-success gap-2" onClick={() => setIsAddModalOpen(true)}>
              <Plus size={16} />
              Add New
            </Button>
          </PermissionGate>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Show</span>
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
              triggerClassName="w-[90px] h-9"
            />
            <span className="text-sm text-muted-foreground">entries</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Search:</span>
            <Input
              placeholder=""
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="h-9 w-48"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12 text-destructive">
              Error loading companies. Please try again.
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-table-header text-table-header-foreground">
                  <th className="px-4 py-3 text-left text-sm font-semibold">Company</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Website</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Contact</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">City</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {companies.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      No companies found
                    </td>
                  </tr>
                ) : (
                  companies.map((company, index) => (
                    <tr
                      key={company.id}
                      className={`border-b border-border hover:bg-table-row-hover transition-colors ${
                        index % 2 === 0 ? "bg-card" : "bg-secondary/30"
                      }`}
                    >
                      <td className="px-4 py-3 text-sm text-foreground font-medium">
                        {company.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {company.email || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-primary hover:underline cursor-pointer">
                        {company.website || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {company.contactNumber || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {company.city || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <PermissionGate permission="company_edit">
                            <button
                              onClick={() => handleEdit(company)}
                              className="p-1.5 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                            >
                              <Edit size={14} />
                            </button>
                          </PermissionGate>
                          <PermissionGate permission="company_delete">
                            <button
                              onClick={() => handleDelete(company)}
                              className="p-1.5 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </PermissionGate>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4">
          <p className="text-sm text-muted-foreground">
            Showing {companies.length > 0 ? ((currentPage - 1) * parseInt(entriesPerPage)) + 1 : 0} to {Math.min(currentPage * parseInt(entriesPerPage), totalCount)} of {totalCount} entries
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
            >
              Previous
            </Button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                size="sm"
                variant={page === currentPage ? "default" : "outline"}
                className={`h-8 w-8 ${page === currentPage ? "bg-primary text-primary-foreground" : ""}`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Add Modal */}
      <CompanyModal
        open={isAddModalOpen}
        onOpenChange={(open) => setIsAddModalOpen(open)}
        mode="add"
      />

      {/* Edit Modal */}
      <CompanyModal
        open={isEditModalOpen}
        onOpenChange={(open) => {
          setIsEditModalOpen(open);
          if (!open) setSelectedCompany(null);
        }}
        company={selectedCompany}
        mode="edit"
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!companyToDelete} onOpenChange={() => setCompanyToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Company</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{companyToDelete?.name}"? This action cannot be undone.
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
    </>
  );
}
