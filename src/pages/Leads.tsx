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
import { Edit, Send, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { useLeads } from "@/hooks/useSales";
import { Lead } from "@/services/api";

export default function Leads() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState("10");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLeads, setSelectedLeads] = useState<number[]>([]);

  const { data, isLoading, error } = useLeads({
    pageNumber: currentPage,
    pageSize: parseInt(entriesPerPage),
    searchTerm: searchTerm || undefined,
  });

  const leads = data?.items || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = data?.totalPages || 1;

  const handleSelectLead = (leadId: number) => {
    setSelectedLeads((prev) =>
      prev.includes(leadId)
        ? prev.filter((id) => id !== leadId)
        : [...prev, leadId]
    );
  };

  const handleSelectAll = () => {
    if (selectedLeads.length === leads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(leads.map((l) => l.id));
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

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).replace(/\//g, "-");
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
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
              Error loading leads. Please try again.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-[#2c3e50]">
                  <TableHead className="text-white">
                    <Checkbox
                      checked={selectedLeads.length === leads.length && leads.length > 0}
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
                {leads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center py-8 text-muted-foreground">
                      No leads found
                    </TableCell>
                  </TableRow>
                ) : (
                  leads.map((lead) => (
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
                      <TableCell>{formatDate(lead.date)}</TableCell>
                      <TableCell className="text-green-600">{lead.customerName}</TableCell>
                      <TableCell>{lead.mode}</TableCell>
                      <TableCell>{lead.incoterms}</TableCell>
                      <TableCell className="text-green-600">{lead.polCountry}</TableCell>
                      <TableCell>{lead.podCountry}</TableCell>
                      <TableCell>{lead.quantity}</TableCell>
                      <TableCell>{lead.weight}</TableCell>
                      <TableCell>{getStatusBadge(lead.status)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}

          <div className="p-4 flex justify-between items-center border-t border-border">
            <span className="text-sm text-green-600">
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
    </MainLayout>
  );
}
