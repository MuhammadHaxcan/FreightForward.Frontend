import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { formatDate } from "@/lib/utils";
import { Search, Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MainLayout } from "@/components/layout/MainLayout";
import { creditNoteApi, customerApi, AccountCreditNote, Customer } from "@/services/api";
import { useDeleteCreditNote } from "@/hooks/useCreditNotes";
import { useAuth } from "@/contexts/AuthContext";
import { DeleteConfirmationModal } from "@/components/ui/delete-confirmation-modal";

export default function CreditNotes() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [creditNotes, setCreditNotes] = useState<AccountCreditNote[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<string>("all");
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const deleteMutation = useDeleteCreditNote();

  // Fetch customers for filter (only Debtors)
  useEffect(() => {
    const fetchCustomers = async () => {
      const response = await customerApi.getAll({ pageSize: 1000, masterType: 'Debtors' });
      if (response.data) {
        setCustomers(response.data.items);
      }
    };
    fetchCustomers();
  }, []);

  const fetchCreditNotes = useCallback(async () => {
    setLoading(true);
    try {
      const response = await creditNoteApi.getAll({
        pageNumber,
        pageSize,
        searchTerm: searchTerm || undefined,
        customerId: selectedCustomer !== "all" ? parseInt(selectedCustomer) : undefined,
      });
      if (response.data) {
        setCreditNotes(response.data.items);
        setTotalCount(response.data.totalCount);
        setTotalPages(response.data.totalPages);
      }
    } catch {
      toast.error("Failed to load credit notes");
    } finally {
      setLoading(false);
    }
  }, [pageNumber, pageSize, searchTerm, selectedCustomer]);

  useEffect(() => {
    fetchCreditNotes();
  }, [fetchCreditNotes]);

  const handleSearch = () => {
    setPageNumber(1);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteMutation.mutateAsync(deleteId);
    setDeleteId(null);
    fetchCreditNotes();
  };

  const startEntry = (pageNumber - 1) * pageSize + 1;
  const endEntry = Math.min(pageNumber * pageSize, totalCount);

  return (
    <MainLayout>
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Credit Notes</h1>

      {/* Filters */}
      <div className="bg-muted/30 border rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-green-600">Customers</label>
            <SearchableSelect
              options={[
                { value: "all", label: "Select All" },
                ...customers.map((customer) => ({
                  value: customer.id.toString(),
                  label: customer.name,
                })),
              ]}
              value={selectedCustomer}
              onValueChange={setSelectedCustomer}
              placeholder="Select All"
              searchPlaceholder="Search customers..."
            />
          </div>

          <div className="flex items-end">
            <Button onClick={handleSearch} className="bg-primary text-primary-foreground">
              Search
            </Button>
          </div>
        </div>
      </div>

      {/* Table Controls */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm">Show</span>
          <SearchableSelect
            options={[
              { value: "10", label: "10" },
              { value: "25", label: "25" },
              { value: "50", label: "50" },
              { value: "100", label: "100" },
            ]}
            value={pageSize.toString()}
            onValueChange={(v) => setPageSize(parseInt(v))}
            triggerClassName="w-[90px]"
          />
          <span className="text-sm">entries</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm">Search:</span>
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="w-48"
            placeholder="Search..."
          />
        </div>
      </div>

      {/* Credit Notes Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-table-header">
              <TableHead className="text-table-header-foreground font-semibold">Credit Note #</TableHead>
              <TableHead className="text-table-header-foreground font-semibold">Date</TableHead>
              <TableHead className="text-table-header-foreground font-semibold">Customer</TableHead>
              <TableHead className="text-table-header-foreground font-semibold">Job #</TableHead>
              <TableHead className="text-table-header-foreground font-semibold">Reference #</TableHead>
              <TableHead className="text-table-header-foreground font-semibold">Added By</TableHead>
              <TableHead className="text-table-header-foreground font-semibold">Status</TableHead>
              <TableHead className="text-table-header-foreground font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : creditNotes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  No credit notes found
                </TableCell>
              </TableRow>
            ) : (
              creditNotes.map((cn) => (
                <TableRow key={cn.id} className="hover:bg-table-row-hover">
                  <TableCell className="text-primary font-medium">{cn.creditNoteNo}</TableCell>
                  <TableCell>{formatDate(cn.creditNoteDate)}</TableCell>
                  <TableCell className="text-blue-600">{cn.customerName}</TableCell>
                  <TableCell>{cn.jobNumber || "-"}</TableCell>
                  <TableCell>{cn.referenceNo || "-"}</TableCell>
                  <TableCell className="text-blue-600">{cn.addedBy || "-"}</TableCell>
                  <TableCell>
                    <span className="text-sm">{cn.status || "-"}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        className="btn-success"
                        onClick={() => navigate(`/accounts/credit-notes/${cn.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      {hasPermission("creditnote_delete") && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => setDeleteId(cn.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          Showing {totalCount > 0 ? startEntry : 0} to {endEntry} of {totalCount} entries
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
            disabled={pageNumber === 1}
          >
            Previous
          </Button>
          {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
            let pageNum: number;
            if (totalPages <= 7) {
              pageNum = i + 1;
            } else if (pageNumber <= 4) {
              pageNum = i + 1;
            } else if (pageNumber >= totalPages - 3) {
              pageNum = totalPages - 6 + i;
            } else {
              pageNum = pageNumber - 3 + i;
            }
            return (
              <Button
                key={pageNum}
                variant={pageNumber === pageNum ? "default" : "outline"}
                size="sm"
                onClick={() => setPageNumber(pageNum)}
                className="w-8"
              >
                {pageNum}
              </Button>
            );
          })}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPageNumber((p) => Math.min(totalPages, p + 1))}
            disabled={pageNumber === totalPages || totalPages === 0}
          >
            Next
          </Button>
        </div>
      </div>
    </div>

    <DeleteConfirmationModal
      open={deleteId !== null}
      onOpenChange={(open) => !open && setDeleteId(null)}
      onConfirm={handleDelete}
      title="Delete Credit Note"
      description="Are you sure you want to delete this credit note? This action cannot be undone."
    />
    </MainLayout>
  );
}
