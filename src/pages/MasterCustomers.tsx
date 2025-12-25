import { MainLayout } from "@/components/layout/MainLayout";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { CustomerModal, Customer } from "@/components/customers/CustomerModal";

const mockCustomers: Customer[] = [
  { id: 1, code: "DEI0500", name: "KADDAH BLDC CLEANING EQUIP. TR CO.LLC", masterType: "Debtors", category: ["Consignee", "Customer"], phone: "0507466916", country: "United Arab Emirates", email: "kaddah@email.com", city: "Dubai", baseCurrency: "AED", taxNo: "" },
  { id: 2, code: "NEI0500", name: "FISTON INTERNATIONAL PTE LTD", masterType: "Neutral", category: ["Shipper", "Neutral", "Consignee", "Neutral"], phone: "", country: "Singapore", email: "fiston@email.com", city: "Singapore", baseCurrency: "SGD", taxNo: "" },
  { id: 3, code: "DEI0499", name: "REHBAR LOGISTICS PVT LTD", masterType: "Debtors", category: ["Consignee", "Customer"], phone: "", country: "Pakistan", email: "rehbar@email.com", city: "Karachi", baseCurrency: "PKR", taxNo: "" },
  { id: 4, code: "NEI0499", name: "ATEN INTERNATIONAL CO., LTD.", masterType: "Neutral", category: ["Shipper", "Neutral"], phone: "", country: "Taiwan", email: "aten@email.com", city: "Taipei", baseCurrency: "USD", taxNo: "" },
  { id: 5, code: "NEI0498", name: "SHANDONG LANCOR IMPORT&EXPORT CO., LTD.", masterType: "Neutral", category: ["Shipper", "Neutral"], phone: "", country: "China", email: "lancor@email.com", city: "Shandong", baseCurrency: "CNY", taxNo: "" },
  { id: 6, code: "DEI0498", name: "BADRI OASIS TRADING LLC", masterType: "Debtors", category: ["Consignee", "Customer"], phone: "0556192253", country: "United Arab Emirates", email: "badri@email.com", city: "Dubai", baseCurrency: "AED", taxNo: "" },
  { id: 7, code: "DEI0497", name: "HAZRAT USMAN USED AUTO SPARE PARTS TR", masterType: "Debtors", category: ["Consignee", "Customer"], phone: "050-3036517", country: "United Arab Emirates", email: "hazrat@email.com", city: "Sharjah", baseCurrency: "AED", taxNo: "" },
  { id: 8, code: "NEI0497", name: "Ethiopian Electric Utility Off Grid Unit", masterType: "Neutral", category: ["Consignee", "Neutral", "Notify Party", "Neutral"], phone: "", country: "Ethiopia", email: "eeu@email.com", city: "Addis Ababa", baseCurrency: "USD", taxNo: "" },
  { id: 9, code: "NEI0496", name: "RIC Sun Investments SL", masterType: "Debtors", category: ["Shipper"], phone: "", country: "United Arab Emirates", email: "ric@email.com", city: "Dubai", baseCurrency: "USD", taxNo: "" },
  { id: 10, code: "DEI0509", name: "MUFADDAL SHABBIR BUILDING MATERIAL TRADING LLC", masterType: "Debtors", category: ["Consignee", "Customer"], phone: "042721314", country: "United Arab Emirates", email: "mufaddal@email.com", city: "Dubai", baseCurrency: "AED", taxNo: "" },
];

const MasterCustomers = () => {
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
    setEditCustomer(customer);
    setModalMode("edit");
    setModalOpen(true);
  };

  const handleDelete = (id: number) => {
    console.log("Delete customer:", id);
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
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(customer.id)}
                        >
                          <Trash2 size={16} />
                        </Button>
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
