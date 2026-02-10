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
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Edit, Plus, FileText, Loader2, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useRateRequests, useCreateRateRequest, useUpdateRateRequest, useLead } from "@/hooks/useSales";
import { EquipmentGridReadOnly } from "@/components/leads/EquipmentGridReadOnly";
import { BoxPalletsGridReadOnly } from "@/components/leads/BoxPalletsGridReadOnly";
import { useAllCountries, useAllPorts, useAllIncoTerms, useAllCustomerCategoryTypes } from "@/hooks/useSettings";
import { useAllCreditors } from "@/hooks/useCustomers";
import { RateRequest } from "@/services/api";

type ModalMode = "add" | "edit";

export default function RateRequests() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState("10");
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("add");
  const [selectedRequest, setSelectedRequest] = useState<RateRequest | null>(null);
  const [selectAllVendorEmail, setSelectAllVendorEmail] = useState(false);
  const [selectedRateRequestId, setSelectedRateRequestId] = useState<number | null>(null);
  const [showReceivedConfirm, setShowReceivedConfirm] = useState(false);
  const [rateRequestToMarkReceived, setRateRequestToMarkReceived] = useState<RateRequest | null>(null);

  const { data, isLoading, error } = useRateRequests({
    pageNumber: currentPage,
    pageSize: parseInt(entriesPerPage),
    searchTerm: searchTerm || undefined,
  });

  const createMutation = useCreateRateRequest();
  const updateMutation = useUpdateRateRequest();

  // Load reference data for dropdowns
  const { data: countriesData } = useAllCountries();
  const { data: portsData } = useAllPorts();
  const { data: incoTermsData } = useAllIncoTerms();
  const { data: categoryTypesData } = useAllCustomerCategoryTypes();
  const { data: vendorsData } = useAllCreditors();

  // Ensure arrays are always defined to prevent .map() errors on first load
  const countries = useMemo(() => Array.isArray(countriesData) ? countriesData : [], [countriesData]);
  const ports = useMemo(() => Array.isArray(portsData) ? portsData : [], [portsData]);
  const incoTerms = useMemo(() => Array.isArray(incoTermsData) ? incoTermsData : [], [incoTermsData]);
  const categoryTypes = useMemo(() => Array.isArray(categoryTypesData) ? categoryTypesData : [], [categoryTypesData]);
  const vendors = useMemo(() => Array.isArray(vendorsData) ? vendorsData : [], [vendorsData]);

  // Fetch lead data when editing (includes lead details)
  const { data: leadData, isLoading: isLeadLoading } = useLead(selectedRequest?.leadId || 0);

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

  // formatDate imported from utils

  const handleConvertToQuotation = (request: RateRequest) => {
    navigate("/sales/quotations", { state: { rateRequestId: request.id } });
  };

  const handleConvertSelectedToQuotation = () => {
    if (selectedRateRequestId) {
      navigate("/sales/quotations", { state: { rateRequestId: selectedRateRequestId } });
    }
  };

  const selectedRateRequest = selectedRateRequestId
    ? rateRequests.find(r => r.id === selectedRateRequestId)
    : null;

  const openModal = (mode: ModalMode, request?: RateRequest) => {
    setModalMode(mode);
    setSelectedRequest(request || null);
    setIsModalOpen(true);
  };

  const handleMarkAsReceived = async () => {
    if (!rateRequestToMarkReceived) return;
    try {
      await updateMutation.mutateAsync({
        id: rateRequestToMarkReceived.id,
        data: { status: 'Received' }
      });
      setSelectedRateRequestId(rateRequestToMarkReceived.id); // Auto-select the row
      setShowReceivedConfirm(false);
      setRateRequestToMarkReceived(null);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const getModalTitle = () => {
    return modalMode === "edit" ? "Edit Rate Request" : "Add Rate Request";
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
                onClick={() => openModal("add")}
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
                triggerClassName="w-20"
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
                              onClick={() => openModal("edit", request)}
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

      {/* Add/Edit Rate Request Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-primary text-xl">{getModalTitle()}</DialogTitle>
            <DialogDescription>
              {modalMode === "edit" ? "Edit rate request details" : "Fill in the rate request details"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* General Details */}
            <div className="border border-border rounded-lg p-4">
              <h3 className="text-primary font-semibold mb-4">General Details</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-red-500">* Rate code</Label>
                  <Input
                    value={selectedRequest?.rateRequestNo || "RFQAE10827"}
                    readOnly
                    className="bg-muted"
                  />
                </div>
                <div>
                  <Label className="text-red-500">* Shipment Mode</Label>
                  <SearchableSelect
                    options={[
                      { value: "air", label: "Air Freight" },
                      { value: "fcl", label: "FCL-Sea Freight" },
                      { value: "lcl", label: "LCL-Sea Freight" },
                    ]}
                    value={selectedRequest?.mode === "SeaFreightFCL" ? "fcl" : selectedRequest?.mode === "SeaFreightLCL" ? "lcl" : "air"}
                    onValueChange={() => {}}
                    placeholder="Select"
                    searchPlaceholder="Search..."
                  />
                </div>
                <div>
                  <Label>Incoterm</Label>
                  <SearchableSelect
                    options={incoTerms?.map((term) => ({
                      value: term.id.toString(),
                      label: `${term.code}-${term.name}`,
                    })) || []}
                    value={selectedRequest?.incoTermId?.toString() || ""}
                    onValueChange={() => {}}
                    placeholder="Select"
                    searchPlaceholder="Search..."
                  />
                </div>
              </div>
            </div>

            {/* Package Details */}
            <div className="border border-border rounded-lg p-4">
              <h3 className="text-primary font-semibold mb-4">Package Details</h3>

              {isLeadLoading && selectedRequest?.leadId ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-green-600" />
                  <span className="ml-2 text-muted-foreground">Loading package details...</span>
                </div>
              ) : leadData?.details && leadData.details.length > 0 ? (
                <div className="space-y-4">
                  {/* Show Equipment grid if there are equipment items */}
                  {leadData.details.some(d => d.detailType === "Equipment") && (
                    <EquipmentGridReadOnly
                      equipments={leadData.details.filter(d => d.detailType === "Equipment")}
                    />
                  )}

                  {/* Show BoxPallets grid if there are box/pallet items */}
                  {leadData.details.some(d => d.detailType === "BoxPallet") && (
                    <BoxPalletsGridReadOnly
                      boxPallets={leadData.details.filter(d => d.detailType === "BoxPallet")}
                    />
                  )}

                  {/* Commodity field */}
                  <div className="mt-4">
                    <Label>Commodity</Label>
                    <Textarea
                      defaultValue={selectedRequest?.productDescription || ""}
                      placeholder="Enter commodity description"
                      className="min-h-[40px]"
                      readOnly
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No package details available for this rate request.
                </div>
              )}
            </div>

            {/* Vendor Details */}
            <div className="border border-border rounded-lg p-4">
              <h3 className="text-primary font-semibold mb-4">Vendor Details</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Vendors</Label>
                  <SearchableSelect
                    options={vendors?.map((vendor) => ({
                      value: vendor.id.toString(),
                      label: vendor.name,
                    })) || []}
                    value={selectedRequest?.vendorId?.toString() || ""}
                    onValueChange={() => {}}
                    placeholder="Select"
                    searchPlaceholder="Search..."
                  />
                </div>
                <div>
                  <Label>Vendor Type</Label>
                  <SearchableSelect
                    options={categoryTypes?.map((type) => ({
                      value: type.name,
                      label: type.name,
                    })) || []}
                    value={selectedRequest?.vendorType || ""}
                    onValueChange={() => {}}
                    placeholder="Select"
                    searchPlaceholder="Search..."
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label>Vendor Email to</Label>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="selectAll"
                        checked={selectAllVendorEmail}
                        onCheckedChange={(checked) => setSelectAllVendorEmail(checked as boolean)}
                      />
                      <label htmlFor="selectAll" className="text-sm text-muted-foreground cursor-pointer">
                        Select All
                      </label>
                    </div>
                  </div>
                  <Input defaultValue={selectedRequest?.vendorEmail || ""} placeholder="vendor@email.com" />
                </div>
              </div>
            </div>

            {/* Port Details */}
            <div className="border border-border rounded-lg p-4">
              <h3 className="text-primary font-semibold mb-4">Port Details</h3>
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div>
                  <Label className="text-red-500">* Arriving Country</Label>
                  <SearchableSelect
                    options={countries?.map((country) => ({
                      value: country.id.toString(),
                      label: country.name,
                    })) || []}
                    value={selectedRequest?.deliveryCountryId?.toString() || ""}
                    onValueChange={() => {}}
                    placeholder="Select"
                    searchPlaceholder="Search..."
                  />
                </div>
                <div>
                  <Label className="text-red-500">* Arrival Port</Label>
                  <SearchableSelect
                    options={ports?.map((port) => ({
                      value: port.id.toString(),
                      label: `${port.seaPortName}${port.seaPortCode ? ` (${port.seaPortCode})` : ''} / ${port.airPortName}${port.airPortCode ? ` (${port.airPortCode})` : ''} - ${port.city}, ${port.country}`,
                    })) || []}
                    value={selectedRequest?.destinationPortId?.toString() || ""}
                    onValueChange={() => {}}
                    placeholder="Select"
                    searchPlaceholder="Search..."
                  />
                </div>
                <div>
                  <Label className="text-red-500">* Departure Country</Label>
                  <SearchableSelect
                    options={countries?.map((country) => ({
                      value: country.id.toString(),
                      label: country.name,
                    })) || []}
                    value={selectedRequest?.pickupCountryId?.toString() || ""}
                    onValueChange={() => {}}
                    placeholder="Select"
                    searchPlaceholder="Search..."
                  />
                </div>
                <div>
                  <Label>Departure Port</Label>
                  <SearchableSelect
                    options={ports?.map((port) => ({
                      value: port.id.toString(),
                      label: `${port.seaPortName}${port.seaPortCode ? ` (${port.seaPortCode})` : ''} / ${port.airPortName}${port.airPortCode ? ` (${port.airPortCode})` : ''} - ${port.city}, ${port.country}`,
                    })) || []}
                    value={selectedRequest?.loadingPortId?.toString() || ""}
                    onValueChange={() => {}}
                    placeholder="Select"
                    searchPlaceholder="Search..."
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-red-500">* Pickup Address</Label>
                  <Textarea defaultValue={selectedRequest?.pickupAddress || ""} placeholder="Enter pickup address" />
                </div>
                <div>
                  <Label className="text-red-500">* Delivery Address</Label>
                  <Textarea defaultValue={selectedRequest?.deliveryAddress || ""} placeholder="Enter delivery address" />
                </div>
                <div>
                  <Label>Remarks Notes</Label>
                  <Textarea placeholder="Additional notes..." />
                </div>
              </div>
            </div>

            {/* Footer Buttons for Add mode */}
            {modalMode === "add" && (
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button className="btn-success">
                  Send Rate Request
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

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
