import { useState } from "react";
import { Trash2, Plus, Loader2, Download } from "lucide-react";
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
import { GeneralDocumentModal } from "./GeneralDocumentModal";
import { useGeneralDocuments, useDeleteGeneralDocument } from "@/hooks/useGeneralDocuments";
import { GeneralDocument, fileApi } from "@/services/api";
import { getAccessToken, isDevAuthDisabled, attemptTokenRefresh } from "@/services/api/base";
import { toast } from "sonner";

export function GeneralDocumentsTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState("10");
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState<GeneralDocument | null>(null);

  const { data, isLoading, error } = useGeneralDocuments({
    pageNumber: currentPage,
    pageSize: parseInt(entriesPerPage),
    searchTerm: searchTerm || undefined,
  });

  const deleteMutation = useDeleteGeneralDocument();

  const handleDelete = (doc: GeneralDocument) => {
    setDocToDelete(doc);
  };

  const confirmDelete = () => {
    if (docToDelete) {
      deleteMutation.mutate(docToDelete.id);
      setDocToDelete(null);
    }
  };

  const documents = data?.items || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = data?.totalPages || 1;

  const handleDownload = async (filePath: string, originalFileName?: string) => {
    try {
      const makeRequest = async (token: string | null) => {
        const headers: HeadersInit = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
        return fetch(fileApi.getDownloadUrl(filePath), { headers });
      };

      let response = await makeRequest(isDevAuthDisabled() ? null : getAccessToken());

      if (response.status === 401 && !isDevAuthDisabled()) {
        const refreshed = await attemptTokenRefresh();
        if (refreshed) {
          response = await makeRequest(getAccessToken());
        }
      }

      if (!response.ok) throw new Error("Download failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = originalFileName || filePath;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download file");
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };

  return (
    <>
      <div className="bg-card rounded-lg shadow-sm border border-border animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">
            <span className="font-bold">List All</span> General Documents
          </h2>
          <Button className="btn-success gap-2" onClick={() => setIsAddModalOpen(true)}>
            <Plus size={16} />
            Add New
          </Button>
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
              Error loading documents. Please try again.
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-table-header text-table-header-foreground">
                  <th className="px-3 py-3 text-left text-xs font-semibold whitespace-nowrap">Document Name</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold whitespace-nowrap">Document</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold whitespace-nowrap">Remarks</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold whitespace-nowrap">Date</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody>
                {documents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">
                      No documents found
                    </td>
                  </tr>
                ) : (
                  documents.map((doc, index) => (
                    <tr
                      key={doc.id}
                      className={`border-b border-border hover:bg-table-row-hover transition-colors ${
                        index % 2 === 0 ? "bg-card" : "bg-secondary/30"
                      }`}
                    >
                      <td className="px-3 py-2.5 text-sm text-primary font-medium whitespace-nowrap">
                        {doc.documentName}
                      </td>
                      <td className="px-3 py-2.5 text-sm whitespace-nowrap">
                        {doc.filePath ? (
                          <button
                            onClick={() => handleDownload(doc.filePath!, doc.originalFileName)}
                            className="text-primary hover:text-primary/80 transition-colors"
                            title={doc.originalFileName || "Download"}
                          >
                            <Download size={16} />
                          </button>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-sm text-muted-foreground whitespace-nowrap">
                        {doc.remarks || "-"}
                      </td>
                      <td className="px-3 py-2.5 text-sm text-muted-foreground whitespace-nowrap">
                        {formatDate(doc.createdAt)}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(doc)}
                            className="p-1.5 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
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
            Showing {documents.length > 0 ? ((currentPage - 1) * parseInt(entriesPerPage)) + 1 : 0} to {Math.min(currentPage * parseInt(entriesPerPage), totalCount)} of {totalCount} entries
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
      <GeneralDocumentModal
        open={isAddModalOpen}
        onOpenChange={(open) => setIsAddModalOpen(open)}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!docToDelete} onOpenChange={() => setDocToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{docToDelete?.documentName}"? This action cannot be undone.
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
