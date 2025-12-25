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
import { Checkbox } from "@/components/ui/checkbox";
import { Edit, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

interface Lead {
  id: string;
  leadNo: string;
  date: string;
  customerName: string;
  mode: string;
  incoterms: string;
  polCountry: string;
  podCountry: string;
  quantity: number;
  weight: string;
  status: "New" | "Pending" | "Converted";
}

const mockLeads: Lead[] = [
  { id: "1", leadNo: "LEAD10826", date: "24-12-2025", customerName: "SKY SHIPPING LINE (LLC)", mode: "FCL-Sea Freight", incoterms: "EXW-EX WORKS", polCountry: "Spain", podCountry: "Saudi Arabia", quantity: 5, weight: "500 KG", status: "New" },
  { id: "2", leadNo: "LEAD10825", date: "24-12-2025", customerName: "CAKE DECORATION CENTER FOR TRADING", mode: "LCL-Sea Freight", incoterms: "EXW-EX WORKS", polCountry: "United Arab Emirates", podCountry: "United Kingdom", quantity: 10, weight: "1200 KG", status: "Pending" },
  { id: "3", leadNo: "LEAD10824", date: "18-12-2025", customerName: "EES FREIGHT SERVICES PTE LTD", mode: "FCL-Sea Freight", incoterms: "EXW-EX WORKS", polCountry: "Italy", podCountry: "Saudi Arabia", quantity: 3, weight: "800 KG", status: "New" },
  { id: "4", leadNo: "LEAD10823", date: "17-12-2025", customerName: "TRANSPARENT FREIGHT SERVICES", mode: "Air Freight", incoterms: "CFR-COST AND FREIGHT", polCountry: "United Arab Emirates", podCountry: "Australia", quantity: 2, weight: "150 KG", status: "Converted" },
  { id: "5", leadNo: "LEAD10822", date: "15-12-2025", customerName: "BLISS LOGISTICS & SHIPPING PVT LTD", mode: "Air Freight", incoterms: "FCA-FREE CARRIER", polCountry: "Turkey", podCountry: "United Arab Emirates", quantity: 8, weight: "2000 KG", status: "Pending" },
];

export default function Leads() {
  const navigate = useNavigate();
  const [leads] = useState<Lead[]>(mockLeads);
  const [searchTerm, setSearchTerm] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState("10");
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);

  const filteredLeads = leads.filter(
    (lead) =>
      lead.leadNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectLead = (leadId: string) => {
    setSelectedLeads((prev) =>
      prev.includes(leadId)
        ? prev.filter((id) => id !== leadId)
        : [...prev, leadId]
    );
  };

  const handleSelectAll = () => {
    if (selectedLeads.length === filteredLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(filteredLeads.map((l) => l.id));
    }
  };

  const handleSendRateRequest = () => {
    if (selectedLeads.length === 0) {
      toast({
        title: "No leads selected",
        description: "Please select at least one lead to send rate request",
        variant: "destructive",
      });
      return;
    }
    navigate("/sales/rate-requests/new", { state: { selectedLeads: selectedLeads.map(id => leads.find(l => l.id === id)) } });
  };

  const getStatusBadge = (status: Lead["status"]) => {
    switch (status) {
      case "New":
        return <Badge className="bg-blue-500 text-white">New</Badge>;
      case "Pending":
        return <Badge className="bg-yellow-500 text-white">Pending</Badge>;
      case "Converted":
        return <Badge className="bg-green-500 text-white">Converted</Badge>;
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-foreground">Leads</h1>
          <Button
            onClick={handleSendRateRequest}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Send className="h-4 w-4 mr-2" />
            Send Rate Request
          </Button>
        </div>

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
                <TableHead className="text-white">
                  <Checkbox
                    checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead className="text-white">Action</TableHead>
                <TableHead className="text-white">Lead No.</TableHead>
                <TableHead className="text-white">Date</TableHead>
                <TableHead className="text-white">Customer Name</TableHead>
                <TableHead className="text-white">Mode</TableHead>
                <TableHead className="text-white">Incoterms</TableHead>
                <TableHead className="text-white">POL Country</TableHead>
                <TableHead className="text-white">POD Country</TableHead>
                <TableHead className="text-white">Quantity</TableHead>
                <TableHead className="text-white">Weight</TableHead>
                <TableHead className="text-white">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.map((lead) => (
                <TableRow key={lead.id} className="hover:bg-muted/50">
                  <TableCell>
                    <Checkbox
                      checked={selectedLeads.includes(lead.id)}
                      onCheckedChange={() => handleSelectLead(lead.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 bg-green-500 hover:bg-green-600 text-white rounded"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                  <TableCell className="font-medium">{lead.leadNo}</TableCell>
                  <TableCell>{lead.date}</TableCell>
                  <TableCell className="text-green-600">{lead.customerName}</TableCell>
                  <TableCell>{lead.mode}</TableCell>
                  <TableCell>{lead.incoterms}</TableCell>
                  <TableCell className="text-green-600">{lead.polCountry}</TableCell>
                  <TableCell>{lead.podCountry}</TableCell>
                  <TableCell>{lead.quantity}</TableCell>
                  <TableCell>{lead.weight}</TableCell>
                  <TableCell>{getStatusBadge(lead.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="p-4 flex justify-between items-center border-t border-border">
            <span className="text-sm text-green-600">
              Showing 1 to {filteredLeads.length} of {leads.length} entries
            </span>
            <div className="flex gap-1">
              <Button variant="outline" size="sm">Previous</Button>
              <Button variant="default" size="sm" className="bg-green-600">1</Button>
              <Button variant="outline" size="sm">2</Button>
              <Button variant="outline" size="sm">Next</Button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
