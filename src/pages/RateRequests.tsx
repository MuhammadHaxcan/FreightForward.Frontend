import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useRateRequests, useCreateRateRequest, useUpdateRateRequest } from "@/hooks/useSales";
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
            <Button
              onClick={() => openModal("add")}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Send Rate Request
            </Button>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border">
          <div className="p-4 flex justify-between items-center border-b border-border">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Show</span>
              <Select value={entriesPerPage} onValueChange={(value) => {
                setEntriesPerPage(value);
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-20">
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
                <TableRow className="bg-[#2c3e50]">
                  <TableHead className="text-white w-12">Select</TableHead>
                  <TableHead className="text-white">Action</TableHead>
                  <TableHead className="text-white">Rate request No.</TableHead>
                  <TableHead className="text-white">Date</TableHead>
                  <TableHead className="text-white">Customer Name</TableHead>
                  <TableHead className="text-white">Freight Mode</TableHead>
                  <TableHead className="text-white">Vendor Type</TableHead>
                  <TableHead className="text-white">Vendor Name</TableHead>
                  <TableHead className="text-white">Vendor Email</TableHead>
                  <TableHead className="text-white">Pickup Country</TableHead>
                  <TableHead className="text-white">Delivery Country</TableHead>
                  <TableHead className="text-white">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rateRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center py-8 text-muted-foreground">
                      No rate requests found
                    </TableCell>
                  </TableRow>
                ) : (
                  rateRequests.map((request) => (
                    <TableRow
                      key={request.id}
                      className={`hover:bg-muted/50 ${selectedRateRequestId === request.id ? 'bg-green-50' : ''}`}
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
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 bg-green-500 hover:bg-green-600 text-white rounded"
                            onClick={() => openModal("edit", request)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {request.requestStatus !== "Received" && (
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
            <span className="text-sm text-green-600">
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
                  className={page === currentPage ? "bg-green-600" : ""}
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
            <DialogTitle className="text-green-600 text-xl">{getModalTitle()}</DialogTitle>
            <DialogDescription>
              {modalMode === "edit" ? "Edit rate request details" : "Fill in the rate request details"}
            </DialogDescription>
          </DialogHeader>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 mb-4">
            <Button
              variant="outline"
              className="bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500"
              onClick={() => setIsModalOpen(false)}
            >
              Back
            </Button>
            {modalMode === "edit" && (
              <Button className="bg-blue-500 hover:bg-blue-600 text-white">
                Update
              </Button>
            )}
            {modalMode === "edit" && selectedRequest?.status === "Received" && (
              <Button
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => {
                  setIsModalOpen(false);
                  if (selectedRequest) handleConvertToQuotation(selectedRequest);
                }}
              >
                <FileText className="h-4 w-4 mr-2" />
                Convert to Quotation
              </Button>
            )}
            <Button className="bg-[#2c3e50] hover:bg-[#34495e] text-white">
              Send Rate Request
            </Button>
          </div>

          <div className="space-y-6">
            {/* General Details */}
            <div className="border border-border rounded-lg p-4">
              <h3 className="text-green-600 font-semibold mb-4">General Details</h3>
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
                  <Select defaultValue={selectedRequest?.mode === "FCLSeaFreight" ? "fcl" : selectedRequest?.mode === "LCLSeaFreight" ? "lcl" : "air"}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="air">Air Freight</SelectItem>
                      <SelectItem value="fcl">FCL-Sea Freight</SelectItem>
                      <SelectItem value="lcl">LCL-Sea Freight</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Incoterm</Label>
                  <Select defaultValue={selectedRequest?.incoterms === "EXW" ? "exw" : "fob"}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="exw">EXW-EX WORKS</SelectItem>
                      <SelectItem value="fob">FOB-FREE ON BOARD</SelectItem>
                      <SelectItem value="cfr">CFR-COST AND FREIGHT</SelectItem>
                      <SelectItem value="fca">FCA-FREE CARRIER</SelectItem>
                      <SelectItem value="ddu">DDU-DELIVERED DUTY UNPAID</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Package Details */}
            <div className="border border-border rounded-lg p-4">
              <h3 className="text-green-600 font-semibold mb-4">Package Details</h3>
              <div className="grid grid-cols-5 gap-4">
                <div>
                  <Label className="text-red-500">* Quantity</Label>
                  <Input type="number" placeholder="1" defaultValue="1" />
                </div>
                <div>
                  <Label>Package Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="roll">ROLL</SelectItem>
                      <SelectItem value="sacks">SACKS</SelectItem>
                      <SelectItem value="set">SET</SelectItem>
                      <SelectItem value="skids">SKIDS</SelectItem>
                      <SelectItem value="units">UNITS</SelectItem>
                      <SelectItem value="wooden-box">WOODEN BOX</SelectItem>
                      <SelectItem value="bales">BALES</SelectItem>
                      <SelectItem value="pallets">PALLETS</SelectItem>
                      <SelectItem value="cartons">CARTONS</SelectItem>
                      <SelectItem value="boxes">BOXES</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-red-500">* Weight</Label>
                  <Input type="number" placeholder="10000.00" />
                </div>
                <div>
                  <Label className="text-red-500">* Volume</Label>
                  <Input type="number" placeholder="25" />
                </div>
                <div>
                  <Label>Commodity</Label>
                  <Textarea placeholder="sugar paste" className="min-h-[40px]" />
                </div>
              </div>
            </div>

            {/* Vendor Details */}
            <div className="border border-border rounded-lg p-4">
              <h3 className="text-green-600 font-semibold mb-4">Vendor Details</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Vendors</Label>
                  <Select defaultValue={selectedRequest ? "vendor1" : undefined}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vendor1">CARGO SERVICES BARCELONA S.A.U.</SelectItem>
                      <SelectItem value="vendor2">MACNELS SHIPPING LLC</SelectItem>
                      <SelectItem value="vendor3">DNATA CARGO</SelectItem>
                      <SelectItem value="vendor4">RONSPED WORLDWIDE SRL</SelectItem>
                      <SelectItem value="vendor5">KESIF NAK. VE GUMR.TIC.LTD.STI.</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Vendor Type</Label>
                  <Select defaultValue="overseas">
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="overseas">Overseas Agents</SelectItem>
                      <SelectItem value="local">Local Agents</SelectItem>
                      <SelectItem value="carrier">Carrier</SelectItem>
                      <SelectItem value="freight-forwarder">Freight Forwarder</SelectItem>
                    </SelectContent>
                  </Select>
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
                  <Input placeholder="vendor@email.com" />
                </div>
              </div>
            </div>

            {/* Port Details */}
            <div className="border border-border rounded-lg p-4">
              <h3 className="text-green-600 font-semibold mb-4">Port Details</h3>
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div>
                  <Label className="text-red-500">* Arriving Country</Label>
                  <Select defaultValue={selectedRequest?.podCountry === "Saudi Arabia" ? "sa" : "uae"}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="uae">United Arab Emirates</SelectItem>
                      <SelectItem value="sa">Saudi Arabia</SelectItem>
                      <SelectItem value="uk">United Kingdom</SelectItem>
                      <SelectItem value="au">Australia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-red-500">* Arrival Port</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="jeddah">Jeddah</SelectItem>
                      <SelectItem value="jebel-ali">Jebel Ali</SelectItem>
                      <SelectItem value="dubai">Dubai</SelectItem>
                      <SelectItem value="dammam">Dammam</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-red-500">* Departure Country</Label>
                  <Select defaultValue={selectedRequest?.polCountry === "Spain" ? "spain" : "italy"}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="spain">Spain</SelectItem>
                      <SelectItem value="italy">Italy</SelectItem>
                      <SelectItem value="germany">Germany</SelectItem>
                      <SelectItem value="turkey">Turkey</SelectItem>
                      <SelectItem value="uae">United Arab Emirates</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Departure Port</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="barcelona">Barcelona</SelectItem>
                      <SelectItem value="valencia">Valencia</SelectItem>
                      <SelectItem value="genoa">Genoa</SelectItem>
                      <SelectItem value="istanbul">Istanbul</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-red-500">* Pickup Address</Label>
                  <Textarea placeholder="KELLMY" />
                </div>
                <div>
                  <Label className="text-red-500">* Delivery Address</Label>
                  <Textarea placeholder="JEDDAH" />
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
                <Button className="bg-green-600 hover:bg-green-700 text-white">
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
              className="bg-green-600 hover:bg-green-700"
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
