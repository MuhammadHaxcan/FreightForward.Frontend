import { useState } from "react";
import { Edit, Trash2, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CompanyModal, Company } from "./CompanyModal";

const mockCompanies: Company[] = [
  {
    id: 1,
    name: "TRANSPARENT FREIGHT SERVICES LLC",
    email: "info@tfs-global.com",
    website: "www.tfs-global.com",
    addedBy: "04-2396853",
  },
  {
    id: 2,
    name: "TRANSPARENT FREIGHT SERVICES WLL",
    email: "SULTAN@TFS-GLOBAL.COM",
    website: "https://www.tfs-global.com/",
    addedBy: "+974-70606059",
  },
  {
    id: 3,
    name: "TRANSPARENT FREIGHT SERVICES",
    email: "info2@transparent.com",
    website: "",
    addedBy: "42334",
  },
];

export function CompaniesTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState("10");
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  const filteredCompanies = mockCompanies.filter(
    (company) =>
      company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (company: Company) => {
    setSelectedCompany(company);
    setIsEditModalOpen(true);
  };

  return (
    <>
      <div className="bg-card rounded-lg shadow-sm border border-border animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">
            <span className="font-bold">List All</span> Companies
          </h2>
          <Button className="btn-success gap-2" onClick={() => setIsAddModalOpen(true)}>
            <Plus size={16} />
            Add New
          </Button>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Show</span>
            <Select value={entriesPerPage} onValueChange={setEntriesPerPage}>
              <SelectTrigger className="w-20 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border border-border">
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
            <div className="relative">
              <Input
                placeholder=""
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9 w-48 pr-8"
              />
              <Search
                size={16}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-table-header text-table-header-foreground">
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Action
                  <span className="ml-1 text-xs opacity-70">↕</span>
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Company
                  <span className="ml-1 text-xs opacity-70">↕</span>
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Email
                  <span className="ml-1 text-xs opacity-70">↕</span>
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Website
                  <span className="ml-1 text-xs opacity-70">↕</span>
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Added By
                  <span className="ml-1 text-xs opacity-70">↕</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredCompanies.map((company, index) => (
                <tr
                  key={company.id}
                  className={`border-b border-border hover:bg-table-row-hover transition-colors ${
                    index % 2 === 0 ? "bg-card" : "bg-secondary/30"
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleEdit(company)}
                        className="p-1.5 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                      >
                        <Edit size={14} />
                      </button>
                      <button className="p-1.5 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground font-medium">
                    {company.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {company.email}
                  </td>
                  <td className="px-4 py-3 text-sm text-primary hover:underline cursor-pointer">
                    {company.website}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {company.addedBy}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4">
          <p className="text-sm text-muted-foreground">
            Showing 1 to {filteredCompanies.length} of {filteredCompanies.length} entries
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              size="sm"
              className="h-8 w-8 bg-primary text-primary-foreground"
            >
              1
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3"
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Add Modal */}
      <CompanyModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        mode="add"
      />

      {/* Edit Modal */}
      <CompanyModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedCompany(null);
        }}
        company={selectedCompany}
        mode="edit"
      />
    </>
  );
}
