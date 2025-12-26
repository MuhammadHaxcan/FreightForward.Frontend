import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Edit, Plus, Eye, Download, Trash2, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuotations, useCreateQuotation } from "@/hooks/useSales";
import { Quotation } from "@/services/api";

interface ChargeRow {
  id: number;
  chargeType: string;
  bases: string;
  currency: string;
  rate: string;
  roe: string;
  quantity: string;
  amount: string;
}

type ModalMode = "add" | "edit" | "view";

export default function Quotations() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState("10");
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("add");
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [cargoCalculationMode, setCargoCalculationMode] = useState<"units" | "shipment">("units");
  const [chargeRows, setChargeRows] = useState<ChargeRow[]>([
    { id: 1, chargeType: "", bases: "", currency: "", rate: "", roe: "", quantity: "", amount: "" }
  ]);

  const { data, isLoading, error } = useQuotations({
    pageNumber: currentPage,
    pageSize: parseInt(entriesPerPage),
    searchTerm: searchTerm || undefined,
    status: activeTab === "pending" ? "Pending" : activeTab === "approved" ? "Approved" : undefined,
  });

  const createMutation = useCreateQuotation();

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

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).replace(/\//g, "-");
  };

  const openModal = (mode: ModalMode, quotation?: Quotation) => {
    setModalMode(mode);
    setSelectedQuotation(quotation || null);
    setChargeRows([
      { id: 1, chargeType: "", bases: "", currency: "", rate: "", roe: "", quantity: "", amount: "" }
    ]);
    setCargoCalculationMode("units");
    setIsModalOpen(true);
  };

  const addChargeRow = () => {
    setChargeRows([
      ...chargeRows,
      { id: Date.now(), chargeType: "", bases: "", currency: "", rate: "", roe: "", quantity: "", amount: "" }
    ]);
  };

  const deleteChargeRow = (id: number) => {
    if (chargeRows.length > 1) {
      setChargeRows(chargeRows.filter(row => row.id !== id));
    }
  };

  const isReadOnly = modalMode === "view";

  const getModalTitle = () => {
    switch (modalMode) {
      case "add": return "Add New Quotation";
      case "edit": return "Edit Quotation";
      case "view": return "View Quotation";
    }
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-foreground">Quotations</h1>
          <Button
            onClick={() => openModal("add")}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Quotation
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => {
          setActiveTab(value);
          setCurrentPage(1);
        }}>
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
                  Error loading quotations. Please try again.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#2c3e50]">
                      <TableHead className="text-white">Date</TableHead>
                      <TableHead className="text-white">Quotation No</TableHead>
                      <TableHead className="text-white">Customer Name</TableHead>
                      <TableHead className="text-white">Incoterms</TableHead>
                      <TableHead className="text-white">Mode</TableHead>
                      <TableHead className="text-white">POL</TableHead>
                      <TableHead className="text-white">POD</TableHead>
                      <TableHead className="text-white">Quote Expiry Date</TableHead>
                      <TableHead className="text-white">Status</TableHead>
                      <TableHead className="text-white">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quotations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                          No quotations found
                        </TableCell>
                      </TableRow>
                    ) : (
                      quotations.map((quotation) => (
                        <TableRow key={quotation.id} className="hover:bg-muted/50">
                          <TableCell>{formatDate(quotation.quotationDate)}</TableCell>
                          <TableCell className="font-medium">{quotation.quotationNo}</TableCell>
                          <TableCell className="text-green-600">{quotation.customerName}</TableCell>
                          <TableCell className="text-green-600">{quotation.incoterms}</TableCell>
                          <TableCell>{quotation.mode}</TableCell>
                          <TableCell className="text-green-600">{quotation.pol}</TableCell>
                          <TableCell className="text-green-600">{quotation.pod}</TableCell>
                          <TableCell>{formatDate(quotation.quoteExpiryDate)}</TableCell>
                          <TableCell>{getStatusBadge(quotation.quotationStatus)}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 bg-green-500 hover:bg-green-600 text-white rounded"
                                onClick={() => openModal("edit", quotation)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 bg-blue-500 hover:bg-blue-600 text-white rounded"
                                onClick={() => openModal("view", quotation)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 bg-orange-500 hover:bg-orange-600 text-white rounded"
                                onClick={() => window.open(`/sales/quotations/${quotation.id}/view`, '_blank')}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 bg-red-500 hover:bg-red-600 text-white rounded"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}

              <div className="p-4 flex justify-between items-center border-t border-border">
                <span className="text-sm text-green-600">
                  Showing {quotations.length > 0 ? ((currentPage - 1) * parseInt(entriesPerPage)) + 1 : 0} to {Math.min(currentPage * parseInt(entriesPerPage), totalCount)} of {totalCount} entries
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
          </TabsContent>
        </Tabs>
      </div>

      {/* Add/Edit/View Quotation Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-green-600 text-xl">
              {getModalTitle()}
            </DialogTitle>
            <DialogDescription>
              {modalMode === "view" ? "View quotation details" : "Fill in the quotation details below"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Header with Back and Update buttons for edit/view mode */}
            {(modalMode === "edit" || modalMode === "view") && (
              <div className="flex justify-end gap-2">
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
              </div>
            )}

            {/* Quotation Details */}
            <div className="border border-border rounded-lg p-4">
              <h3 className="text-green-600 font-semibold mb-4">Quotation</h3>
              <div className="grid grid-cols-6 gap-4 mb-4">
                <div>
                  <Label>Quotation ID</Label>
                  <Input
                    value={selectedQuotation?.quotationNo || "QTAE10993"}
                    readOnly
                    className="bg-muted"
                    disabled={isReadOnly}
                  />
                </div>
                <div>
                  <Label>Company Name</Label>
                  <Select disabled={isReadOnly}>
                    <SelectTrigger>
                      <SelectValue placeholder={selectedQuotation?.customerName || "Select"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sky">SKY SHIPPING LINE (LLC)</SelectItem>
                      <SelectItem value="cake">CAKE DECORATION CENTER FOR TRADING</SelectItem>
                      <SelectItem value="ees">EES FREIGHT SERVICES PTE LTD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Contact Person</Label>
                  <Select disabled={isReadOnly}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="john">John Doe</SelectItem>
                      <SelectItem value="jane">Jane Smith</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Customer Reference Code</Label>
                  <Input disabled={isReadOnly} />
                </div>
                <div>
                  <Label>Quotation Booking No</Label>
                  <Input value="BKGAE25113" readOnly className="bg-muted" disabled={isReadOnly} />
                </div>
                <div>
                  <Label>Mode</Label>
                  <Select disabled={isReadOnly}>
                    <SelectTrigger>
                      <SelectValue placeholder={selectedQuotation?.mode || "Select"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="air">Air Freight</SelectItem>
                      <SelectItem value="fcl">FCL-Sea Freight</SelectItem>
                      <SelectItem value="lcl">LCL-Sea Freight</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-6 gap-4 mb-4">
                <div>
                  <Label>Date Of Issue</Label>
                  <Input type="date" defaultValue="2025-12-25" disabled={isReadOnly} />
                </div>
                <div>
                  <Label>Validity</Label>
                  <Input type="date" defaultValue="2025-12-31" disabled={isReadOnly} />
                </div>
                <div>
                  <Label>Incoterm</Label>
                  <Select disabled={isReadOnly}>
                    <SelectTrigger>
                      <SelectValue placeholder={selectedQuotation?.incoterms || "Select"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="exw">EXW-EX WORKS</SelectItem>
                      <SelectItem value="fob">FOB-FREE ON BOARD</SelectItem>
                      <SelectItem value="cfr">CFR-COST AND FREIGHT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select disabled={isReadOnly}>
                    <SelectTrigger>
                      <SelectValue placeholder={selectedQuotation?.status || "Pending"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Origin/Loading Port</Label>
                  <Select disabled={isReadOnly}>
                    <SelectTrigger>
                      <SelectValue placeholder={selectedQuotation?.pol || "Select"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="qingdao">Qingdao</SelectItem>
                      <SelectItem value="shanghai">Shanghai</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Destination/Discharge Port</Label>
                  <Select disabled={isReadOnly}>
                    <SelectTrigger>
                      <SelectValue placeholder={selectedQuotation?.pod || "Select"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="jebel-ali">Jebel Ali</SelectItem>
                      <SelectItem value="dubai">Dubai</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label>Pick-Up Address</Label>
                  <Textarea placeholder="Pick-Up Address" disabled={isReadOnly} />
                </div>
                <div>
                  <Label>Delivery Address</Label>
                  <Textarea placeholder="Delivery Address" disabled={isReadOnly} />
                </div>
                <div>
                  <Label>Document Required</Label>
                  <Textarea placeholder="Document Required" disabled={isReadOnly} />
                </div>
                <div>
                  <Label>Notes</Label>
                  <Textarea placeholder="Notes" disabled={isReadOnly} />
                </div>
              </div>
            </div>

            {/* Cargo Details */}
            <div className="border border-border rounded-lg p-4">
              <h3 className="text-green-600 font-semibold mb-4">Cargo Details</h3>

              {/* Cargo Calculation Mode Tabs */}
              <div className="flex gap-2 mb-4">
                <Button
                  className={cargoCalculationMode === "units"
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-transparent text-green-600 hover:bg-green-50"}
                  variant={cargoCalculationMode === "units" ? "default" : "ghost"}
                  onClick={() => !isReadOnly && setCargoCalculationMode("units")}
                  disabled={isReadOnly}
                >
                  Calculate by Units
                </Button>
                <Button
                  className={cargoCalculationMode === "shipment"
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-transparent text-green-600 hover:bg-green-50"}
                  variant={cargoCalculationMode === "shipment" ? "default" : "ghost"}
                  onClick={() => !isReadOnly && setCargoCalculationMode("shipment")}
                  disabled={isReadOnly}
                >
                  Calculate by Total Shipment
                </Button>
              </div>

              {/* Calculate by Units View */}
              {cargoCalculationMode === "units" && (
                <>
                  <div className="grid grid-cols-10 gap-2 mb-4 text-sm">
                    <div>
                      <Label className="text-xs">Qty</Label>
                    </div>
                    <div>
                      <Label className="text-xs">Load Type</Label>
                    </div>
                    <div className="col-span-3">
                      <Label className="text-xs">Unit Dimensions | Total Volume</Label>
                      <div className="grid grid-cols-3 gap-1 text-xs text-muted-foreground">
                        <span>Length</span>
                        <span>Width</span>
                        <span>Height</span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">CBM</Label>
                    </div>
                    <div>
                      <Label className="text-xs">Weight</Label>
                    </div>
                    <div>
                      <Label className="text-xs">Unit Weight</Label>
                    </div>
                    <div></div>
                  </div>
                  <div className="grid grid-cols-10 gap-2 mb-4">
                    <div>
                      <Input placeholder="Quantity" disabled={isReadOnly} />
                    </div>
                    <div>
                      <Select disabled={isReadOnly}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pallets">PALLETS</SelectItem>
                          <SelectItem value="boxes">BOXES</SelectItem>
                          <SelectItem value="cartons">CARTONS</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Input placeholder="L" disabled={isReadOnly} />
                    </div>
                    <div>
                      <Input placeholder="W" disabled={isReadOnly} />
                    </div>
                    <div>
                      <Input placeholder="H" disabled={isReadOnly} />
                    </div>
                    <div>
                      <Select disabled={isReadOnly}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cbm">CBM</SelectItem>
                          <SelectItem value="cft">CFT</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Input placeholder="0.00" disabled={isReadOnly} />
                    </div>
                    <div>
                      <Select disabled={isReadOnly}>
                        <SelectTrigger>
                          <SelectValue placeholder="KG" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="kg">KG</SelectItem>
                          <SelectItem value="lbs">LBS</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      {!isReadOnly && (
                        <Button className="bg-green-600 hover:bg-green-700 text-white w-full">
                          + Add
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-6 gap-4">
                    <div>
                      <Label>Cargo Description</Label>
                      <Input placeholder="GENERAL CARGO" disabled={isReadOnly} />
                    </div>
                    <div>
                      <Label>Total Volume</Label>
                      <Input value="0.00" readOnly className="bg-muted" />
                    </div>
                    <div>
                      <Label>Total CBM</Label>
                      <Input value="0.00" readOnly className="bg-muted" />
                    </div>
                    <div>
                      <Label>Total Weight</Label>
                      <Input value="0.00" readOnly className="bg-muted" />
                    </div>
                    <div>
                      <Label>Type</Label>
                      <Select disabled={isReadOnly}>
                        <SelectTrigger>
                          <SelectValue placeholder="KG" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="kg">KG</SelectItem>
                          <SelectItem value="lbs">LBS</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              )}

              {/* Calculate by Total Shipment View */}
              {cargoCalculationMode === "shipment" && (
                <>
                  <div className="grid grid-cols-5 gap-4 mb-4">
                    <div>
                      <Label>Qty</Label>
                      <Input placeholder="4" disabled={isReadOnly} />
                    </div>
                    <div>
                      <Label>Load Type</Label>
                      <Select disabled={isReadOnly}>
                        <SelectTrigger>
                          <SelectValue placeholder="PALLETS" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pallets">PALLETS</SelectItem>
                          <SelectItem value="boxes">BOXES</SelectItem>
                          <SelectItem value="cartons">CARTONS</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Total CBM</Label>
                      <Input placeholder="2.50" disabled={isReadOnly} />
                    </div>
                    <div>
                      <Label>Total Weight</Label>
                      <Input placeholder="2455" disabled={isReadOnly} />
                    </div>
                    <div>
                      <Label>Weight Type</Label>
                      <Select disabled={isReadOnly}>
                        <SelectTrigger>
                          <SelectValue placeholder="KG" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="kg">KG</SelectItem>
                          <SelectItem value="lbs">LBS</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Cargo Description</Label>
                    <Input placeholder="GENERAL CARGO" disabled={isReadOnly} />
                  </div>
                </>
              )}
            </div>

            {/* Charges Details */}
            <div className="border border-border rounded-lg p-4">
              <h3 className="text-green-600 font-semibold mb-4">Charges Details</h3>
              <div className="grid grid-cols-8 gap-2 mb-2 text-sm font-medium">
                <div>Charges Details</div>
                <div>Bases</div>
                <div>Currency</div>
                <div>Rate</div>
                <div>ROE</div>
                <div>Quantity</div>
                <div>Amount</div>
                <div></div>
              </div>
              {chargeRows.map((row, index) => (
                <div key={row.id} className="grid grid-cols-8 gap-2 mb-2">
                  <div>
                    <Select disabled={isReadOnly}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ocean">Ocean Freight Charges</SelectItem>
                        <SelectItem value="delivery">Delivery Order Charges</SelectItem>
                        <SelectItem value="customs">Customs Clearance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Input placeholder="Bases" disabled={isReadOnly} />
                  </div>
                  <div>
                    <Select disabled={isReadOnly}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="usd">USD</SelectItem>
                        <SelectItem value="aed">AED</SelectItem>
                        <SelectItem value="eur">EUR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Input placeholder="Rates" disabled={isReadOnly} />
                  </div>
                  <div>
                    <Input placeholder="ROE" disabled={isReadOnly} />
                  </div>
                  <div>
                    <Input placeholder="Quantity" disabled={isReadOnly} />
                  </div>
                  <div>
                    <Input placeholder="0.00" disabled={isReadOnly} />
                  </div>
                  <div>
                    {!isReadOnly && (
                      index === chargeRows.length - 1 ? (
                        <Button
                          onClick={addChargeRow}
                          className="bg-green-600 hover:bg-green-700 text-white w-full"
                        >
                          + Add
                        </Button>
                      ) : (
                        <Button
                          variant="destructive"
                          size="icon"
                          className="h-10 w-full bg-red-500 hover:bg-red-600"
                          onClick={() => deleteChargeRow(row.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                {isReadOnly ? "Close" : "Cancel"}
              </Button>
              {modalMode === "add" && (
                <Button className="bg-green-600 hover:bg-green-700 text-white">
                  Save
                </Button>
              )}
              {modalMode === "edit" && (
                <Button className="bg-blue-500 hover:bg-blue-600 text-white">
                  Update
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
