import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Edit, Send, Loader2, Plus, RotateCcw, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { useLeads, usePortalLeads, useAcceptPortalLead, useRevertPortalLead } from "@/hooks/useSales";
import { useAllDebtors } from "@/hooks/useCustomers";
import { SendRateRequestModal } from "@/components/leads/SendRateRequestModal";
import { PermissionGate } from "@/components/auth/PermissionGate";

export default function Leads() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("office");

  // Office Leads state
  const [searchTerm, setSearchTerm] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState("10");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
  const [sendRateRequestModalOpen, setSendRateRequestModalOpen] = useState(false);

  // Portal Leads state
  const [portalSearchTerm, setPortalSearchTerm] = useState("");
  const [portalEntriesPerPage, setPortalEntriesPerPage] = useState("10");
  const [portalCurrentPage, setPortalCurrentPage] = useState(1);

  // Revert dialog state
  const [revertDialogOpen, setRevertDialogOpen] = useState(false);
  const [revertPortalLeadId, setRevertPortalLeadId] = useState<number | null>(null);

  // Accept dialog state
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false);
  const [acceptPortalLeadId, setAcceptPortalLeadId] = useState<number | null>(null);
  const [acceptLeadName, setAcceptLeadName] = useState("");
  const [customerChoice, setCustomerChoice] = useState<"existing" | "new">("new");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  // Office Leads query
  const { data, isLoading, error } = useLeads({
    pageNumber: currentPage,
    pageSize: parseInt(entriesPerPage),
    searchTerm: searchTerm || undefined,
  });

  // Portal Leads query
  const {
    data: portalData,
    isLoading: portalIsLoading,
    error: portalError,
  } = usePortalLeads({
    pageNumber: portalCurrentPage,
    pageSize: parseInt(portalEntriesPerPage),
    searchTerm: portalSearchTerm || undefined,
  });

  const acceptMutation = useAcceptPortalLead();
  const revertMutation = useRevertPortalLead();
  const { data: debtors = [] } = useAllDebtors();

  const leads = data?.items || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = data?.totalPages || 1;

  const portalLeads = portalData?.items || [];
  const portalTotalCount = portalData?.totalCount || 0;
  const portalTotalPages = portalData?.totalPages || 1;

  // Office Leads handlers
  const handleSelectLead = (leadId: number) => {
    setSelectedLeadId(selectedLeadId === leadId ? null : leadId);
  };

  const handleSendRateRequest = () => {
    if (!selectedLeadId) {
      toast({
        title: "No lead selected",
        description: "Please select a lead to send rate request",
        variant: "destructive",
      });
      return;
    }
    setSendRateRequestModalOpen(true);
  };

  const handleRateRequestSuccess = () => {
    setSelectedLeadId(null);
  };

  const handleGenerateLead = () => {
    navigate("/sales/leads/new");
  };

  const handleEditLead = (leadId: number) => {
    navigate(`/sales/leads/${leadId}/edit`);
  };

  // Portal Leads handlers
  const handleAcceptPortalLead = (id: number, name: string) => {
    setAcceptPortalLeadId(id);
    setAcceptLeadName(name);
    setAcceptDialogOpen(true);
  };

  const confirmAcceptPortalLead = () => {
    if (acceptPortalLeadId) {
      const existingCustomerId = customerChoice === "existing" && selectedCustomerId
        ? parseInt(selectedCustomerId)
        : undefined;
      acceptMutation.mutate({ id: acceptPortalLeadId, existingCustomerId });
    }
    setAcceptDialogOpen(false);
    setAcceptPortalLeadId(null);
    setAcceptLeadName("");
    setCustomerChoice("new");
    setSelectedCustomerId(null);
  };

  const handleAcceptDialogClose = (open: boolean) => {
    setAcceptDialogOpen(open);
    if (!open) {
      setAcceptPortalLeadId(null);
      setAcceptLeadName("");
      setCustomerChoice("new");
      setSelectedCustomerId(null);
    }
  };

  const handleRevertPortalLead = (portalLeadId: number) => {
    setRevertPortalLeadId(portalLeadId);
    setRevertDialogOpen(true);
  };

  const confirmRevertPortalLead = () => {
    if (revertPortalLeadId) {
      revertMutation.mutate(revertPortalLeadId);
    }
    setRevertDialogOpen(false);
    setRevertPortalLeadId(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "New":
        return <Badge className="bg-blue-500 text-white">New</Badge>;
      case "Pending":
        return <Badge className="bg-yellow-500 text-white">Pending</Badge>;
      case "Converted":
        return <Badge className="bg-green-500 text-white">Converted</Badge>;
      default:
        return <Badge className="bg-gray-500 text-white">{status}</Badge>;
    }
  };

  const getPortalStatusBadge = (status: string, officeName?: string) => {
    if (status === "Available") {
      return <Badge className="bg-green-500 text-white">Available</Badge>;
    }
    return (
      <Badge className="bg-gray-400 text-white">
        Accepted by {officeName || "Unknown"}
      </Badge>
    );
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-foreground">Leads</h1>
          <div className="flex gap-2">
            {activeTab === "office" && (
              <>
                <PermissionGate permission="leads_add">
                  <Button
                    onClick={handleGenerateLead}
                    className="btn-success"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Generate Lead
                  </Button>
                </PermissionGate>
                <PermissionGate permission="ratereq_add">
                  <Button
                    onClick={handleSendRateRequest}
                    variant="outline"
                    className="border-green-600 text-green-600 hover:bg-green-50"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send Rate Request
                  </Button>
                </PermissionGate>
              </>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="office">Office Leads</TabsTrigger>
            <TabsTrigger value="portal">Portal Leads</TabsTrigger>
          </TabsList>

          {/* Office Leads Tab */}
          <TabsContent value="office">
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
                  Error loading leads. Please try again.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-table-header">
                      <TableHead className="text-table-header-foreground w-12"></TableHead>
                      <TableHead className="text-table-header-foreground">Action</TableHead>
                      <TableHead className="text-table-header-foreground">Lead No.</TableHead>
                      <TableHead className="text-table-header-foreground">Lead Type</TableHead>
                      <TableHead className="text-table-header-foreground">Date</TableHead>
                      <TableHead className="text-table-header-foreground">Customer Name</TableHead>
                      <TableHead className="text-table-header-foreground">Freight Mode</TableHead>
                      <TableHead className="text-table-header-foreground">Inco Terms</TableHead>
                      <TableHead className="text-table-header-foreground">Pickup Country</TableHead>
                      <TableHead className="text-table-header-foreground">Delivery Country</TableHead>
                      <TableHead className="text-table-header-foreground">Items</TableHead>
                      <TableHead className="text-table-header-foreground">Weight</TableHead>
                      <TableHead className="text-table-header-foreground">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leads.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={13} className="text-center py-8 text-muted-foreground">
                          No leads found
                        </TableCell>
                      </TableRow>
                    ) : (
                      leads.map((lead) => (
                        <TableRow key={lead.id} className="hover:bg-table-row-hover">
                          <TableCell>
                            <Checkbox
                              checked={selectedLeadId === lead.id}
                              onCheckedChange={() => handleSelectLead(lead.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <PermissionGate permission="leads_edit">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 btn-success rounded"
                                  onClick={() => handleEditLead(lead.id)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </PermissionGate>
                              {lead.leadType === "PortalLead" && lead.leadStatus === "New" && lead.portalLeadId && (
                                <PermissionGate permission="leads_edit">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded"
                                    onClick={() => handleRevertPortalLead(lead.portalLeadId!)}
                                    title="Revert to portal"
                                  >
                                    <RotateCcw className="h-4 w-4" />
                                  </Button>
                                </PermissionGate>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{lead.leadNo}</TableCell>
                          <TableCell>
                            <Badge className={lead.leadType === "PortalLead" ? "bg-purple-500 text-white" : "bg-sky-500 text-white"}>
                              {lead.leadType === "PortalLead" ? "Portal Lead" : "Manual Lead"}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(lead.leadDate, "dd-MM-yyyy")}</TableCell>
                          <TableCell className="text-green-600">{lead.customerName || lead.fullName}</TableCell>
                          <TableCell>{lead.freightMode || "-"}</TableCell>
                          <TableCell>{lead.incoTermCode || "-"}</TableCell>
                          <TableCell className="text-green-600">{lead.polCountry || lead.pickupCountryName || "-"}</TableCell>
                          <TableCell>{lead.podCountry || lead.deliveryCountryName || "-"}</TableCell>
                          <TableCell>{lead.quantity || "-"}</TableCell>
                          <TableCell>{lead.weight || "-"}</TableCell>
                          <TableCell>{getStatusBadge(lead.leadStatus)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}

              <div className="p-4 flex justify-between items-center border-t border-border">
                <span className="text-sm text-muted-foreground">
                  Showing {leads.length > 0 ? ((currentPage - 1) * parseInt(entriesPerPage)) + 1 : 0} to {Math.min(currentPage * parseInt(entriesPerPage), totalCount)} of {totalCount} entries
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
          </TabsContent>

          {/* Portal Leads Tab */}
          <TabsContent value="portal">
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
                    value={portalEntriesPerPage}
                    onValueChange={(value) => {
                      setPortalEntriesPerPage(value);
                      setPortalCurrentPage(1);
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
                    value={portalSearchTerm}
                    onChange={(e) => {
                      setPortalSearchTerm(e.target.value);
                      setPortalCurrentPage(1);
                    }}
                    className="w-64"
                  />
                </div>
              </div>

              {portalIsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : portalError ? (
                <div className="flex items-center justify-center py-12 text-destructive">
                  Error loading portal leads. Please try again.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-table-header">
                      <TableHead className="text-table-header-foreground">Action</TableHead>
                      <TableHead className="text-table-header-foreground">Lead No.</TableHead>
                      <TableHead className="text-table-header-foreground">Date</TableHead>
                      <TableHead className="text-table-header-foreground">Name</TableHead>
                      <TableHead className="text-table-header-foreground">Email</TableHead>
                      <TableHead className="text-table-header-foreground">Freight Mode</TableHead>
                      <TableHead className="text-table-header-foreground">Shipping Type</TableHead>
                      <TableHead className="text-table-header-foreground">Pickup Country</TableHead>
                      <TableHead className="text-table-header-foreground">Delivery Country</TableHead>
                      <TableHead className="text-table-header-foreground">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {portalLeads.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                          No portal leads found
                        </TableCell>
                      </TableRow>
                    ) : (
                      portalLeads.map((lead) => (
                        <TableRow
                          key={lead.id}
                          className={
                            lead.portalLeadStatus === "Accepted"
                              ? "opacity-50"
                              : "hover:bg-table-row-hover"
                          }
                        >
                          <TableCell>
                            {lead.portalLeadStatus === "Available" && (
                              <PermissionGate permission="leads_add">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 btn-success rounded"
                                  onClick={() => handleAcceptPortalLead(lead.id, lead.fullName)}
                                  title="Accept lead"
                                  disabled={acceptMutation.isPending}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                              </PermissionGate>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{lead.leadNo}</TableCell>
                          <TableCell>{formatDate(lead.leadDate, "dd-MM-yyyy")}</TableCell>
                          <TableCell className="text-green-600">{lead.fullName}</TableCell>
                          <TableCell>{lead.email}</TableCell>
                          <TableCell>{lead.freightMode || "-"}</TableCell>
                          <TableCell>{lead.shippingType || "-"}</TableCell>
                          <TableCell className="text-green-600">{lead.pickupCountryName || "-"}</TableCell>
                          <TableCell>{lead.deliveryCountryName || "-"}</TableCell>
                          <TableCell>
                            {getPortalStatusBadge(lead.portalLeadStatus, lead.acceptedByOfficeName)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}

              <div className="p-4 flex justify-between items-center border-t border-border">
                <span className="text-sm text-muted-foreground">
                  Showing {portalLeads.length > 0 ? ((portalCurrentPage - 1) * parseInt(portalEntriesPerPage)) + 1 : 0} to {Math.min(portalCurrentPage * parseInt(portalEntriesPerPage), portalTotalCount)} of {portalTotalCount} entries
                </span>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={portalCurrentPage === 1}
                    onClick={() => setPortalCurrentPage(p => p - 1)}
                  >
                    Previous
                  </Button>
                  {Array.from({ length: Math.min(portalTotalPages, 5) }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={page === portalCurrentPage ? "default" : "outline"}
                      size="sm"
                      className={page === portalCurrentPage ? "btn-success" : ""}
                      onClick={() => setPortalCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={portalCurrentPage >= portalTotalPages}
                    onClick={() => setPortalCurrentPage(p => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Accept Portal Lead Dialog */}
        <Dialog open={acceptDialogOpen} onOpenChange={handleAcceptDialogClose}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Accept Portal Lead</DialogTitle>
              <DialogDescription>
                Accept the lead from <strong>{acceptLeadName}</strong>. Choose how to assign the customer.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <RadioGroup
                value={customerChoice}
                onValueChange={(value) => {
                  setCustomerChoice(value as "existing" | "new");
                  if (value === "new") setSelectedCustomerId(null);
                }}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="new" id="customer-new" />
                  <Label htmlFor="customer-new">Create new customer</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="existing" id="customer-existing" />
                  <Label htmlFor="customer-existing">Link to existing customer</Label>
                </div>
              </RadioGroup>

              {customerChoice === "existing" && (
                <SearchableSelect
                  options={debtors.map((d) => ({
                    value: d.id.toString(),
                    label: `${d.name} (${d.code})`,
                  }))}
                  value={selectedCustomerId || ""}
                  onValueChange={setSelectedCustomerId}
                  placeholder="Select a customer..."
                  searchPlaceholder="Search customers..."
                  defaultSearch={acceptLeadName}
                  autoOpen
                />
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => handleAcceptDialogClose(false)}>
                Cancel
              </Button>
              <Button
                className="btn-success"
                onClick={confirmAcceptPortalLead}
                disabled={customerChoice === "existing" && !selectedCustomerId}
              >
                Accept
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Revert Confirmation Dialog */}
        <AlertDialog open={revertDialogOpen} onOpenChange={setRevertDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Revert Portal Lead</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to revert this lead? The local lead will be deleted
                and the portal lead will become available for all offices again.
                This is only possible if no rate request has been created from this lead.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmRevertPortalLead}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                Revert
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {selectedLeadId && (
          <SendRateRequestModal
            open={sendRateRequestModalOpen}
            onOpenChange={setSendRateRequestModalOpen}
            leadId={selectedLeadId}
            onSuccess={handleRateRequestSuccess}
          />
        )}
      </div>
    </MainLayout>
  );
}
