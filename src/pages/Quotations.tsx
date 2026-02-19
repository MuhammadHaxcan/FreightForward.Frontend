import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PermissionGate } from "@/components/auth/PermissionGate";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Edit, Plus, Eye, Download, Trash2, Loader2, CheckCircle, Ship } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  useQuotations,
  useDeleteQuotation,
  useApproveQuotation,
} from "@/hooks/useSales";
import { Quotation } from "@/services/api";

export default function Quotations() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState("10");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState("all");
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [quotationToApprove, setQuotationToApprove] = useState<Quotation | null>(null);
  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [quotationToConvert, setQuotationToConvert] = useState<Quotation | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [quotationToDelete, setQuotationToDelete] = useState<Quotation | null>(null);

  // Handle rate request conversion redirect
  useEffect(() => {
    const rateRequestId = (location.state as { rateRequestId?: number })?.rateRequestId;
    if (rateRequestId) {
      // Clear the location state and redirect to new quotation form with state
      window.history.replaceState({}, document.title);
      navigate("/sales/quotations/new", { state: { rateRequestId }, replace: true });
    }
  }, [location.state, navigate]);

  // Queries
  const { data, isLoading, error } = useQuotations({
    pageNumber: currentPage,
    pageSize: parseInt(entriesPerPage),
    searchTerm: searchTerm || undefined,
    status: activeTab === "pending" ? "Pending" : activeTab === "approved" ? "Approved" : undefined,
  });

  // Mutations
  const deleteMutation = useDeleteQuotation();
  const approveMutation = useApproveQuotation();

  const quotations = data?.items || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = data?.totalPages || 1;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Approved":
        return <Badge className="bg-green-500 text-white">Approved</Badge>;
      case "Pending":
        return <Badge className="bg-yellow-500 text-white">Pending</Badge>;
      case "Rejected":
        return <Badge className="bg-red-500 text-white">Rejected</Badge>;
      default:
        return <Badge className="bg-gray-500 text-white">{status}</Badge>;
    }
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-foreground">Quotations</h1>
          <PermissionGate permission="quot_add">
            <Button
              onClick={() => navigate("/sales/quotations/new")}
              className="btn-success"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Quotation
            </Button>
          </PermissionGate>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(value) => {
            setActiveTab(value);
            setCurrentPage(1);
          }}
        >
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved (Booking List)</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            <div className="bg-card rounded-lg border border-border">
              <div className="p-4 flex justify-between items-center border-b border-border">
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
                    placeholder="10"
                    searchPlaceholder="Search..."
                    triggerClassName="w-[90px]"
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
                    className="w-64"
                  />
                </div>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : error ? (
                <div className="flex items-center justify-center py-12 text-destructive">
                  Error loading quotations. Please try again.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-table-header">
                      <TableHead className="text-table-header-foreground">Date</TableHead>
                      <TableHead className="text-table-header-foreground">Quotation No</TableHead>
                      <TableHead className="text-table-header-foreground">Customer Name</TableHead>
                      <TableHead className="text-table-header-foreground">Incoterms</TableHead>
                      <TableHead className="text-table-header-foreground">Mode</TableHead>
                      <TableHead className="text-table-header-foreground">POL</TableHead>
                      <TableHead className="text-table-header-foreground">POD</TableHead>
                      <TableHead className="text-table-header-foreground">Quote Expiry Date</TableHead>
                      <TableHead className="text-table-header-foreground">Status</TableHead>
                      <TableHead className="text-table-header-foreground">Booking No</TableHead>
                      <TableHead className="text-table-header-foreground">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quotations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                          No quotations found
                        </TableCell>
                      </TableRow>
                    ) : (
                      quotations.map((quotation) => (
                        <TableRow key={quotation.id} className="hover:bg-table-row-hover">
                          <TableCell>{formatDate(quotation.quotationDate, "dd-MM-yyyy")}</TableCell>
                          <TableCell className="font-medium">{quotation.quotationNo}</TableCell>
                          <TableCell className="text-green-600">{quotation.customerName}</TableCell>
                          <TableCell className="text-green-600">{quotation.incoTermCode || "-"}</TableCell>
                          <TableCell>{quotation.mode}</TableCell>
                          <TableCell className="text-green-600">{quotation.loadingPortName || quotation.pol}</TableCell>
                          <TableCell className="text-green-600">{quotation.destinationPortName || quotation.pod}</TableCell>
                          <TableCell>{formatDate(quotation.quoteExpiryDate, "dd-MM-yyyy")}</TableCell>
                          <TableCell>{getStatusBadge(quotation.quotationStatus)}</TableCell>
                          <TableCell className="text-purple-600 font-medium">{quotation.quotationBookingNo || "-"}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <PermissionGate permission="quot_edit">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 btn-success rounded"
                                  onClick={() => navigate(`/sales/quotations/${quotation.id}/edit`)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </PermissionGate>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 bg-blue-500 hover:bg-blue-600 text-white rounded"
                                onClick={() => navigate(`/sales/quotations/${quotation.id}/view-details`)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 bg-orange-500 hover:bg-orange-600 text-white rounded"
                                onClick={() => window.open(`/sales/quotations/${quotation.id}/view`, "_blank")}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              {quotation.quotationStatus === "Pending" && (
                                <PermissionGate permission="quot_approve">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 bg-purple-500 hover:bg-purple-600 text-white rounded"
                                    onClick={() => {
                                      setQuotationToApprove(quotation);
                                      setApproveModalOpen(true);
                                    }}
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                </PermissionGate>
                              )}
                              {quotation.quotationStatus === "Approved" && activeTab === "approved" && (
                                <PermissionGate permission="quot_convert">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 bg-teal-500 hover:bg-teal-600 text-white rounded"
                                    onClick={() => {
                                      setQuotationToConvert(quotation);
                                      setConvertModalOpen(true);
                                    }}
                                    title="Convert to Shipment"
                                  >
                                    <Ship className="h-4 w-4" />
                                  </Button>
                                </PermissionGate>
                              )}
                              <PermissionGate permission="quot_delete">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 bg-red-500 hover:bg-red-600 text-white rounded"
                                  onClick={() => {
                                    setQuotationToDelete(quotation);
                                    setDeleteModalOpen(true);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </PermissionGate>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}

              <div className="p-4 flex justify-between items-center border-t border-border">
                <span className="text-sm text-muted-foreground">
                  Showing{" "}
                  {quotations.length > 0 ? (currentPage - 1) * parseInt(entriesPerPage) + 1 : 0} to{" "}
                  {Math.min(currentPage * parseInt(entriesPerPage), totalCount)} of {totalCount} entries
                </span>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                  >
                    Previous
                  </Button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={page === currentPage ? "default" : "outline"}
                      size="sm"
                      className={page === currentPage ? "btn-success" : ""}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Approve Confirmation Modal */}
      <AlertDialog open={approveModalOpen} onOpenChange={setApproveModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Quotation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve this quotation?
              {quotationToApprove && (
                <span className="block mt-2 font-medium text-foreground">
                  Quotation No: {quotationToApprove.quotationNo}
                </span>
              )}
              This will generate a Booking Number and change the status to "Approved".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setApproveModalOpen(false);
                setQuotationToApprove(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-purple-500 hover:bg-purple-600 text-white"
              onClick={async () => {
                if (quotationToApprove) {
                  await approveMutation.mutateAsync(quotationToApprove.id);
                  setApproveModalOpen(false);
                  setQuotationToApprove(null);
                }
              }}
              disabled={approveMutation.isPending}
            >
              {approveMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Yes, Approve
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Convert to Shipment Confirmation Modal */}
      <AlertDialog open={convertModalOpen} onOpenChange={setConvertModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Convert Booking to Shipment</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                Are you sure you want to convert this booking to shipment?
                {quotationToConvert && (
                  <div className="mt-4 space-y-2">
                    <div className="font-medium text-foreground">
                      Quotation No: {quotationToConvert.quotationNo}
                    </div>
                    <div className="font-medium text-foreground">
                      Booking No: {quotationToConvert.quotationBookingNo || "-"}
                    </div>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setConvertModalOpen(false);
                setQuotationToConvert(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-teal-500 hover:bg-teal-600 text-white"
              onClick={() => {
                if (quotationToConvert) {
                  setConvertModalOpen(false);
                  navigate("/shipments/add", { state: { quotationId: quotationToConvert.id } });
                }
              }}
            >
              Yes, Convert
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Quotation Confirmation Modal */}
      <AlertDialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {quotationToDelete?.quotationStatus === "Approved"
                ? "Cannot Delete Quotation"
                : "Delete Quotation"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {quotationToDelete?.quotationStatus === "Approved" ? (
                <>
                  This quotation has been approved and cannot be deleted.
                  {quotationToDelete && (
                    <span className="block mt-2 font-medium text-foreground">
                      Quotation No: {quotationToDelete.quotationNo}
                    </span>
                  )}
                </>
              ) : (
                <>
                  Are you sure you want to delete this quotation? This action cannot be undone.
                  {quotationToDelete && (
                    <span className="block mt-2 font-medium text-foreground">
                      Quotation No: {quotationToDelete.quotationNo}
                    </span>
                  )}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setDeleteModalOpen(false);
                setQuotationToDelete(null);
              }}
            >
              {quotationToDelete?.quotationStatus === "Approved" ? "OK" : "Cancel"}
            </AlertDialogCancel>
            {quotationToDelete?.quotationStatus !== "Approved" && (
              <AlertDialogAction
                className="bg-red-500 hover:bg-red-600 text-white"
                onClick={async () => {
                  if (quotationToDelete) {
                    await deleteMutation.mutateAsync(quotationToDelete.id);
                    setDeleteModalOpen(false);
                    setQuotationToDelete(null);
                  }
                }}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Yes, Delete
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
