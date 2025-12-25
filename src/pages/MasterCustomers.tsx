import { MainLayout } from "@/components/layout/MainLayout";
import { Plus, Pencil, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CustomerModal, Customer } from "@/components/customers/CustomerModal";

const mockCustomers: Customer[] = [
  { id: 1, code: "DEI0504", name: "AL ALAMAA AL MUHAYYAH ISION", masterType: "Debtors", category: ["Consignee", "Customer"], phone: "971 55 507 1142", country: "United Arab Emirates", email: "alamaa@email.com", city: "Dubai", baseCurrency: "AED", taxNo: "" },
  { id: 2, code: "DEI0503", name: "KAAM INTERNATIONAL GENERAL TRADING FZ-LLC", masterType: "Debtors", category: ["Notify Party"], phone: "", country: "United Arab Emirates", email: "kaam@email.com", city: "Dubai", baseCurrency: "AED", taxNo: "" },
  { id: 3, code: "DEI0505", name: "MADOSCA LOGISTICS FZCO", masterType: "Debtors", category: ["Consignee", "Customer"], phone: "", country: "United Arab Emirates", email: "madosca@email.com", city: "Dubai", baseCurrency: "AED", taxNo: "" },
  { id: 4, code: "CDI0466", name: "NEUTRAL CONSOLIDATORS FREIGHT LLC.", masterType: "Creditors", category: ["Co-loader"], phone: "00971 4 393 5702", country: "United Arab Emirates", email: "neutral@email.com", city: "Dubai", baseCurrency: "AED", taxNo: "" },
  { id: 5, code: "CDI0465", name: "AL MISOAQUE SHIPPING SERVICES, LLC.", masterType: "Creditors", category: ["Shipping Line"], phone: "", country: "United Arab Emirates", email: "almisoaque@email.com", city: "Dubai", baseCurrency: "AED", taxNo: "" },
  { id: 6, code: "DEI0502", name: "ORIENT ENERGY SYSTEMS FZCO.", masterType: "Debtors", category: ["Shipper"], phone: "", country: "United Arab Emirates", email: "orient@email.com", city: "Dubai", baseCurrency: "AED", taxNo: "" },
  { id: 7, code: "NEI0448", name: "NOVATEX LIMITED", masterType: "Neutral", category: ["Consignee(Neutral)"], phone: "", country: "Pakistan", email: "novatex@email.com", city: "Karachi", baseCurrency: "PKR", taxNo: "" },
  { id: 8, code: "NEI0492", name: "GLOBAL PHARMACEUTICALSPRIVATELTD", masterType: "Neutral", category: ["Consignee(Neutral)"], phone: "", country: "Pakistan", email: "global@email.com", city: "Lahore", baseCurrency: "PKR", taxNo: "" },
  { id: 9, code: "DEI0501", name: "ALSON TRADING FZE", masterType: "Debtors", category: ["Shipper"], phone: "", country: "United Arab Emirates", email: "alson@email.com", city: "Dubai", baseCurrency: "AED", taxNo: "" },
  { id: 10, code: "DEI0500", name: "QATAR MEAT PRODUCTION CO W.L.L", masterType: "Debtors", category: ["Consignee", "Customer"], phone: "", country: "Qatar", email: "qatar@email.com", city: "Doha", baseCurrency: "USD", taxNo: "" },
];

const MasterCustomers = () => {
  const navigate = useNavigate();
  const [customers] = useState<Customer[]>(mockCustomers);
  const [modalOpen, setModalOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [entriesPerPage, setEntriesPerPage] = useState("10");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.country.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalEntries = filteredCustomers.length;
  const totalPages = Math.ceil(totalEntries / parseInt(entriesPerPage));
  const startIndex = (currentPage - 1) * parseInt(entriesPerPage);
  const displayedCustomers = filteredCustomers.slice(startIndex, startIndex + parseInt(entriesPerPage));

  const handleAddNew = () => {
    setEditCustomer(null);
    setModalMode("add");
    setModalOpen(true);
  };

  const handleEdit = (customer: Customer) => {
    if (customer.masterType === "Debtors") {
      navigate(`/master-customers/${customer.id}/edit`);
    } else if (customer.masterType === "Creditors") {
      navigate(`/master-customers/${customer.id}/creditor/edit`);
    } else if (customer.masterType === "Neutral") {
      navigate(`/master-customers/${customer.id}/neutral/edit`);
    } else {
      setEditCustomer(customer);
      setModalMode("edit");
      setModalOpen(true);
    }
  };

  const handleView = (customer: Customer) => {
    if (customer.masterType === "Debtors") {
      navigate(`/master-customers/${customer.id}/edit?mode=view`);
    } else if (customer.masterType === "Creditors") {
      navigate(`/master-customers/${customer.id}/creditor/edit?mode=view`);
    } else if (customer.masterType === "Neutral") {
      navigate(`/master-customers/${customer.id}/neutral/edit?mode=view`);
    }
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-4">
        {/* Header */}
        <h1 className="text-2xl font-semibold text-foreground">Customers</h1>

        {/* Actions Row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Button className="btn-success gap-2" onClick={handleAddNew}>
            <Plus size={16} />
            Add New Customer
          </Button>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Show:</span>
              <Select value={entriesPerPage} onValueChange={setEntriesPerPage}>
                <SelectTrigger className="w-[70px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">entries</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Search:</span>
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-[200px] h-8"
                placeholder=""
              />
            </div>
          </div>
        </div>

        {/* Customers Table */}
        <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-table-header text-table-header-foreground">
                  <th className="px-4 py-3 text-left text-sm font-semibold">Code</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Master Type</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Category</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Phone</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Country</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {displayedCustomers.map((customer, index) => (
                  <tr
                    key={customer.id}
                    className={`border-b border-border hover:bg-table-row-hover transition-colors ${
                      index % 2 === 0 ? "bg-card" : "bg-secondary/30"
                    }`}
                  >
                    <td className="px-4 py-3 text-sm font-medium text-foreground">{customer.code}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{customer.masterType}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {customer.category.join(", ")}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">{customer.name}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{customer.phone || "-"}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{customer.country}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                          onClick={() => handleEdit(customer)}
                        >
                          <Pencil size={16} />
                        </Button>
                        {(customer.masterType === "Debtors" || customer.masterType === "Creditors" || customer.masterType === "Neutral") && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                            onClick={() => handleView(customer)}
                          >
                            <Eye size={16} />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to {Math.min(startIndex + parseInt(entriesPerPage), totalEntries)} of {totalEntries} entries
          </p>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                className={currentPage === page ? "btn-success" : ""}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            ))}
            {totalPages > 5 && <span className="px-2 text-muted-foreground">...</span>}
            {totalPages > 5 && (
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(totalPages)}>
                {totalPages}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      <CustomerModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        customer={editCustomer}
        mode={modalMode}
      />
    </MainLayout>
  );
};

export default MasterCustomers;
