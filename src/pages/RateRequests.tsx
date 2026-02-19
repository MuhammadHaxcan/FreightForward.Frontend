import { useState, useMemo } from "react";
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
import { Edit, Plus, FileText, Loader2, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useRateRequests, useUpdateRateRequest } from "@/hooks/useSales";
import { RateRequest } from "@/services/api";

export default function RateRequests() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState("10");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRateRequestId, setSelectedRateRequestId] = useState<number | null>(null);
  const [showReceivedConfirm, setShowReceivedConfirm] = useState(false);
  const [rateRequestToMarkReceived, setRateRequestToMarkReceived] = useState<RateRequest | null>(null);

  const { data, isLoading, error } = useRateRequests({
    pageNumber: currentPage,
    pageSize: parseInt(entriesPerPage),
    searchTerm: searchTerm || undefined,
  });

  const updateMutation = useUpdateRateRequest();

  const rateRequests = data?.items || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = data?.totalPages || 1;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pending":
        return <Badge className="bg-yellow-500 text-white">Pending</Badge>;
      case "Sent":
        return <Badge className="bg-blue-500 text-white">Sent</Badge>;
      case "Received":
        return <Badge className="bg-green-500 text-white">Received</Badge>;
      default:
        return <Badge className="bg-gray-500 text-white">{status}</Badge>;
    }
  };

  const handleConvertToQuotation = (request: RateRequest) => {
    navigate("/sales/quotations/new", { state: { rateRequestId: request.id } });
  };

  const handleConvertSelectedToQuotation = () => {
    if (selectedRateRequestId) {
      navigate("/sales/quotations/new", { state: { rateRequestId: selectedRateRequestId } });
    }
  };

  const selectedRateRequest = selectedRateRequestId
    ? rateRequests.find(r => r.id === selectedRateRequestId)
    : null;

  const handleMarkAsReceived = async () => {
    if (!rateRequestToMarkReceived) return;
    try {
      await updateMutation.mutateAsync({
        id: rateRequestToMarkReceived.id,
        data: { status: 'Received' }
      });
      setSelectedRateRequestId(rateRequestToMarkReceived.id);
      setShowReceivedConfirm(false);
      setRateRequestToMarkReceived(null);
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-foreground">Rate Request</h1>
          <div className="flex gap-2">
            <Button
              onClick={handleConvertSelectedToQuotation}
              disabled={!selectedRateRequestId || selectedRateRequest?.requestStatus !== "Received"}
              className="bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50"
            >
              <FileText className="h-4 w-4 mr-2" />
              Convert to Quotation
            </Button>
            <PermissionGate permission="ratereq_add">
              <Button
                onClick={() => navigate("/sales/rate-requests/new")}
                className="btn-success"
              >
                <Plus className="h-4 w-4 mr-2" />
                Send Rate Request
              </Button>
            </PermissionGate>
          </div>
        </div>

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
              Error loading rate requests. Please try again.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-table-header">
                  <TableHead className="text-table-header-foreground w-12">Select</TableHead>
                  <TableHead className="text-table-header-foreground">Action</TableHead>
                  <TableHead className="text-table-header-foreground">Rate request No.</TableHead>
                  <TableHead className="text-table-header-foreground">Lead No.</TableHead>
                  <TableHead className="text-table-header-foreground">Date</TableHead>
                  <TableHead className="text-table-header-foreground">Customer Name</TableHead>
                  <TableHead className="text-table-header-foreground">Freight Mode</TableHead>
                  <TableHead className="text-table-header-foreground">Vendor Type</TableHead>
                  <TableHead className="text-table-header-foreground">Vendor Name</TableHead>
                  <TableHead className="text-table-header-foreground">Vendor Email</TableHead>
                  <TableHead className="text-table-header-foreground">Pickup Country</TableHead>
                  <TableHead className="text-table-header-foreground">Delivery Country</TableHead>
                  <TableHead className="text-table-header-foreground">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rateRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={13} className="text-center py-8 text-muted-foreground">
                      No rate requests found
                    </TableCell>
                  </TableRow>
                ) : (
                  rateRequests.map((request) => (
                    <TableRow
                      key={request.id}
                      className={`hover:bg-table-row-hover ${selectedRateRequestId === request.id ? 'bg-primary/10' : ''}`}
                    >
                      <TableCell>
                        <input
                          type="radio"
                          name="rateRequestSelection"
                          checked={selectedRateRequestId === request.id}
                          onChange={() => setSelectedRateRequestId(request.id)}
                          className="h-4 w-4 text-green-600 cursor-pointer"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <PermissionGate permission="ratereq_edit">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 btn-success rounded"
                              onClick={() => navigate(`/sales/rate-requests/${request.id}/edit`)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </PermissionGate>
                          {request.requestStatus !== "Received" && (
                            <PermissionGate permission="ratereq_edit">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 bg-blue-500 hover:bg-blue-600 text-white rounded"
                                onClick={() => {
                                  setRateRequestToMarkReceived(request);
                                  setShowReceivedConfirm(true);
                                }}
                                title="Mark as Received"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            </PermissionGate>
                          )}
                          {request.requestStatus === "Received" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 bg-orange-500 hover:bg-orange-600 text-white rounded"
                              onClick={() => handleConvertToQuotation(request)}
                              title="Convert to Quotation"
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{request.rateRequestNo}</TableCell>
                      <TableCell className="text-green-600">{request.leadNo || "-"}</TableCell>
                      <TableCell>{formatDate(request.requestDate, "dd-MM-yyyy")}</TableCell>
                      <TableCell className="text-green-600">{request.fullName || "-"}</TableCell>
                      <TableCell>{request.freightMode || "-"}</TableCell>
                      <TableCell>{request.vendorType || "-"}</TableCell>
                      <TableCell className="text-green-600">{request.vendorName}</TableCell>
                      <TableCell>{request.vendorEmail || "-"}</TableCell>
                      <TableCell className="text-green-600">{request.pickupCountryName || request.polCountry || "-"}</TableCell>
                      <TableCell>{request.deliveryCountryName || request.podCountry || "-"}</TableCell>
                      <TableCell>{getStatusBadge(request.requestStatus)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}

          <div className="p-4 flex justify-between items-center border-t border-border">
            <span className="text-sm text-muted-foreground">
              Showing {rateRequests.length > 0 ? ((currentPage - 1) * parseInt(entriesPerPage)) + 1 : 0} to {Math.min(currentPage * parseInt(entriesPerPage), totalCount)} of {totalCount} entries
            </span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
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
                onClick={() => setCurrentPage(p => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mark as Received Confirmation Modal */}
      <AlertDialog open={showReceivedConfirm} onOpenChange={setShowReceivedConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark Rate Request as Received?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark rate request "{rateRequestToMarkReceived?.rateRequestNo}" as received?
              This will enable the option to convert it to a quotation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updateMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleMarkAsReceived}
              disabled={updateMutation.isPending}
              className="btn-success"
            >
              {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Yes, Mark as Received
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
