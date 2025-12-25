import { useState } from "react";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Edit, Plus, Eye, Download, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Quotation {
  id: string;
  quotationNo: string;
  date: string;
  customerName: string;
  incoterms: string;
  mode: string;
  pol: string;
  pod: string;
  quoteExpiryDate: string;
  status: "Pending" | "Approved" | "Rejected";
}

const mockQuotations: Quotation[] = [
  { id: "1", quotationNo: "QTAE10992", date: "25-12-2025", customerName: "SKY SHIPPING LINE (LLC)", incoterms: "FOB-FREE ON BOARD", mode: "LCL-Sea Freight", pol: "China", pod: "United Arab Emirates", quoteExpiryDate: "31-12-2025", status: "Approved" },
  { id: "2", quotationNo: "QTAE10991", date: "24-12-2025", customerName: "CAKE DECORATION CENTER FOR TRADING", incoterms: "EXW-EX WORKS", mode: "FCL-Sea Freight", pol: "Spain", pod: "Saudi Arabia", quoteExpiryDate: "15-01-2026", status: "Pending" },
  { id: "3", quotationNo: "QTAE10990", date: "16-12-2025", customerName: "EES FREIGHT SERVICES PTE LTD", incoterms: "EXW-EX WORKS", mode: "FCL-Sea Freight", pol: "Thailand", pod: "United Arab Emirates", quoteExpiryDate: "31-12-2025", status: "Pending" },
  { id: "4", quotationNo: "QTAE10989", date: "13-12-2025", customerName: "CAKE DECORATION CENTER FOR TRADING", incoterms: "EXW-EX WORKS", mode: "FCL-Sea Freight", pol: "Italy", pod: "Saudi Arabia", quoteExpiryDate: "31-12-2025", status: "Pending" },
  { id: "5", quotationNo: "QTAE10988", date: "12-12-2025", customerName: "CAKE DECORATION CENTER FOR TRADING", incoterms: "EXW-EX WORKS", mode: "FCL-Sea Freight", pol: "Italy", pod: "Saudi Arabia", quoteExpiryDate: "31-12-2025", status: "Pending" },
  { id: "6", quotationNo: "QTAE10987", date: "08-12-2025", customerName: "TRANSPARENT FREIGHT SERVICES", incoterms: "DDU-DELIVERED DUTY UNPAID", mode: "Air Freight", pol: "Pakistan", pod: "United Arab Emirates", quoteExpiryDate: "31-12-2025", status: "Pending" },
  { id: "7", quotationNo: "QTAE10983", date: "22-10-2025", customerName: "EL ABRAR", incoterms: "EXW-EX WORKS", mode: "FCL-Sea Freight", pol: "Italy", pod: "Pakistan", quoteExpiryDate: "31-10-2025", status: "Approved" },
];

export default function Quotations() {
  const [quotations] = useState<Quotation[]>(mockQuotations);
  const [searchTerm, setSearchTerm] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState("10");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [chargeRows, setChargeRows] = useState([{ id: 1 }]);

  const filteredQuotations = quotations.filter((quotation) => {
    const matchesSearch =
      quotation.quotationNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quotation.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === "all") return matchesSearch;
    if (activeTab === "pending") return matchesSearch && quotation.status === "Pending";
    if (activeTab === "approved") return matchesSearch && quotation.status === "Approved";
    return matchesSearch;
  });

  const getStatusBadge = (status: Quotation["status"]) => {
    switch (status) {
      case "Approved":
        return <Badge className="bg-green-500 text-white">Approved</Badge>;
      case "Pending":
        return <Badge className="bg-yellow-500 text-white">Pending</Badge>;
      case "Rejected":
        return <Badge className="bg-red-500 text-white">Rejected</Badge>;
    }
  };

  const openAddModal = () => {
    setEditingQuotation(null);
    setIsModalOpen(true);
  };

  const openEditModal = (quotation: Quotation) => {
    setEditingQuotation(quotation);
    setIsModalOpen(true);
  };

  const addChargeRow = () => {
    setChargeRows([...chargeRows, { id: chargeRows.length + 1 }]);
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-foreground">Quotations</h1>
          <Button
            onClick={openAddModal}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Quotation
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
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
                  <Select value={entriesPerPage} onValueChange={setEntriesPerPage}>
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
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                </div>
              </div>

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
                  {filteredQuotations.map((quotation) => (
                    <TableRow key={quotation.id} className="hover:bg-muted/50">
                      <TableCell>{quotation.date}</TableCell>
                      <TableCell className="font-medium">{quotation.quotationNo}</TableCell>
                      <TableCell className="text-green-600">{quotation.customerName}</TableCell>
                      <TableCell className="text-green-600">{quotation.incoterms}</TableCell>
                      <TableCell>{quotation.mode}</TableCell>
                      <TableCell className="text-green-600">{quotation.pol}</TableCell>
                      <TableCell className="text-green-600">{quotation.pod}</TableCell>
                      <TableCell>{quotation.quoteExpiryDate}</TableCell>
                      <TableCell>{getStatusBadge(quotation.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 bg-green-500 hover:bg-green-600 text-white rounded"
                            onClick={() => openEditModal(quotation)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 bg-blue-500 hover:bg-blue-600 text-white rounded"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 bg-orange-500 hover:bg-orange-600 text-white rounded"
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
                  ))}
                </TableBody>
              </Table>

              <div className="p-4 flex justify-between items-center border-t border-border">
                <span className="text-sm text-green-600">
                  Showing 1 to {filteredQuotations.length} of {quotations.length} entries
                </span>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm">Previous</Button>
                  <Button variant="default" size="sm" className="bg-green-600">1</Button>
                  <Button variant="outline" size="sm">2</Button>
                  <Button variant="outline" size="sm">Next</Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add/Edit Quotation Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-green-600 text-xl">
              {editingQuotation ? "Edit Quotation" : "Add New Quotation"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Quotation Details */}
            <div className="border border-border rounded-lg p-4">
              <h3 className="text-green-600 font-semibold mb-4">Quotation</h3>
              <div className="grid grid-cols-6 gap-4 mb-4">
                <div>
                  <Label>Quotation ID</Label>
                  <Input value={editingQuotation?.quotationNo || "QTAE10993"} readOnly className="bg-muted" />
                </div>
                <div>
                  <Label>Company Name</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
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
                  <Select>
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
                  <Input />
                </div>
                <div>
                  <Label>Quotation Booking No</Label>
                  <Input value="BKGAE25113" readOnly className="bg-muted" />
                </div>
                <div>
                  <Label>Mode</Label>
                  <Select>
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
              </div>
              <div className="grid grid-cols-6 gap-4 mb-4">
                <div>
                  <Label>Date Of Issue</Label>
                  <Input type="date" defaultValue="2025-12-25" />
                </div>
                <div>
                  <Label>Validity</Label>
                  <Input type="date" defaultValue="2025-12-25" />
                </div>
                <div>
                  <Label>Incoterm</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
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
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Pending" />
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
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="qingdao">Qingdao</SelectItem>
                      <SelectItem value="shanghai">Shanghai</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Destination/Discharge Port</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
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
                  <Textarea placeholder="Pick-Up Address" />
                </div>
                <div>
                  <Label>Delivery Address</Label>
                  <Textarea placeholder="Delivery Address" />
                </div>
                <div>
                  <Label>Remarks</Label>
                  <Textarea placeholder="Remarks" />
                </div>
                <div>
                  <Label>CFS</Label>
                  <Textarea placeholder="CFS" />
                </div>
              </div>
            </div>

            {/* Cargo Details */}
            <div className="border border-border rounded-lg p-4">
              <h3 className="text-green-600 font-semibold mb-4">Cargo Details</h3>
              <div className="flex gap-2 mb-4">
                <Button className="bg-red-500 hover:bg-red-600 text-white">Calculate by Units</Button>
                <Button variant="link" className="text-green-600">Calculate by Total Shipment</Button>
              </div>
              <div className="grid grid-cols-9 gap-2 mb-4">
                <div>
                  <Label>Qty</Label>
                  <Input placeholder="Quantity" />
                </div>
                <div>
                  <Label>Load Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pallets">Pallets</SelectItem>
                      <SelectItem value="boxes">Boxes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Length</Label>
                  <Input placeholder="L" />
                </div>
                <div>
                  <Label>Width</Label>
                  <Input placeholder="W" />
                </div>
                <div>
                  <Label>Height</Label>
                  <Input placeholder="H" />
                </div>
                <div>
                  <Label>CBM</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cbm">CBM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Weight</Label>
                  <Input placeholder="0" />
                </div>
                <div>
                  <Label>Unit Weight</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="KG" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">KG</SelectItem>
                      <SelectItem value="lbs">LBS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button className="bg-green-600 hover:bg-green-700 text-white">+ Add</Button>
                </div>
              </div>
              <div className="grid grid-cols-5 gap-4">
                <div>
                  <Label>Cargo Description</Label>
                  <Input placeholder="Enter Description Here" />
                </div>
                <div>
                  <Label>Total Volume</Label>
                  <Input value="0.00" readOnly />
                </div>
                <div>
                  <Label>Total CBM</Label>
                  <Input value="0.00" readOnly />
                </div>
                <div>
                  <Label>Total Weight</Label>
                  <Input value="0.00" readOnly />
                </div>
                <div>
                  <Label>Type</Label>
                  <Select>
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
            </div>

            {/* Charges Details */}
            <div className="border border-border rounded-lg p-4">
              <h3 className="text-green-600 font-semibold mb-4">Charges Details</h3>
              {chargeRows.map((row, index) => (
                <div key={row.id} className="grid grid-cols-7 gap-2 mb-2">
                  <div>
                    <Label>Charges Details</Label>
                    <Select>
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
                    <Label>Bases</Label>
                    <Input placeholder="Bases" />
                  </div>
                  <div>
                    <Label>Currency</Label>
                    <Select>
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
                    <Label>Rate</Label>
                    <Input placeholder="1" />
                  </div>
                  <div>
                    <Label>ROE</Label>
                    <Input placeholder="ROE" />
                  </div>
                  <div>
                    <Label>Quantity</Label>
                    <Input placeholder="Quantity" />
                  </div>
                  <div className="flex items-end gap-1">
                    <div className="flex-1">
                      <Label>Amount</Label>
                      <Input placeholder="0" />
                    </div>
                    {index === chargeRows.length - 1 ? (
                      <Button onClick={addChargeRow} className="bg-green-600 hover:bg-green-700 text-white">Add</Button>
                    ) : (
                      <Button variant="destructive" size="icon" className="h-10 w-10">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button className="bg-green-600 hover:bg-green-700 text-white">
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
