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

interface Bank {
  id: number;
  bankName: string;
  acHolder: string;
  acNumber: string;
  ibanNumber: string;
  swiftCode: string;
  branch: string;
  telNo: string;
  faxNo: string;
}

const mockBanks: Bank[] = [
  { id: 1, bankName: "CASH ON HAND", acHolder: "TFS-DUBAI", acNumber: "", ibanNumber: "", swiftCode: "", branch: "", telNo: "", faxNo: "" },
  { id: 2, bankName: "CBD-CC/BABAR", acHolder: "BABAR IRSHAD", acNumber: "", ibanNumber: "", swiftCode: "", branch: "", telNo: "", faxNo: "" },
  { id: 3, bankName: "CITI-CREDIT CARD", acHolder: "BABAR IRSHAD", acNumber: "", ibanNumber: "", swiftCode: "", branch: "", telNo: "", faxNo: "" },
  { id: 4, bankName: "EIB-CREDIT CARD", acHolder: "BABAR IRSHAD", acNumber: "", ibanNumber: "", swiftCode: "", branch: "", telNo: "", faxNo: "" },
  { id: 5, bankName: "EIB-DEBIT CARD", acHolder: "BABAR IRSHAD", acNumber: "", ibanNumber: "", swiftCode: "", branch: "", telNo: "", faxNo: "" },
  { id: 6, bankName: "EMIRATES ISLAMIC BANK", acHolder: "TRANSPARENT FREIGHT SERVICES LLC", acNumber: "3708430918901 (AED)", ibanNumber: "AE450340003708430918901", swiftCode: "MEBLAEADXXX", branch: "AL TWAR, AL QUSAIS-2, DUBAI, UAE", telNo: "", faxNo: "" },
  { id: 7, bankName: "EMIRATES ISLAMIC BANK", acHolder: "TRANSPARENT FREIGHT SERVICES LLC", acNumber: "3708430918902 (USD)", ibanNumber: "AE180340003708430918902", swiftCode: "MEBLAEADXXX", branch: "AL TWAR, AL QUSAIS-2, DUBAI, UAE", telNo: "", faxNo: "" },
  { id: 8, bankName: "ENBD-CREDIT CARD", acHolder: "SOULAT ALI KHAN", acNumber: "", ibanNumber: "", swiftCode: "", branch: "", telNo: "", faxNo: "" },
  { id: 9, bankName: "FAB-CREDIT CARD", acHolder: "BABAR IRSHAD", acNumber: "", ibanNumber: "", swiftCode: "", branch: "", telNo: "", faxNo: "" },
  { id: 10, bankName: "MASHREQ -CREDIT CARD", acHolder: "SOULAT ALI KHAN", acNumber: "", ibanNumber: "", swiftCode: "", branch: "", telNo: "", faxNo: "" },
];

interface BanksTableProps {
  onAddNew: () => void;
  isFormExpanded: boolean;
}

export function BanksTable({ onAddNew, isFormExpanded }: BanksTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState("10");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredBanks = mockBanks.filter(
    (bank) =>
      bank.bankName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bank.acHolder.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-card rounded-lg shadow-sm border border-border animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-xl font-semibold text-foreground">
          <span className="font-bold">List All</span> Banks
        </h2>
        {!isFormExpanded && (
          <Button className="btn-success gap-2" onClick={onAddNew}>
            <Plus size={16} />
            Add New
          </Button>
        )}
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
          <Input
            placeholder=""
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-9 w-48"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-table-header text-table-header-foreground">
              <th className="px-3 py-3 text-left text-xs font-semibold whitespace-nowrap">Bank Name ↕</th>
              <th className="px-3 py-3 text-left text-xs font-semibold whitespace-nowrap">A/C Holder ↕</th>
              <th className="px-3 py-3 text-left text-xs font-semibold whitespace-nowrap">A/C Number ↕</th>
              <th className="px-3 py-3 text-left text-xs font-semibold whitespace-nowrap">IBAN Number ↕</th>
              <th className="px-3 py-3 text-left text-xs font-semibold whitespace-nowrap">Swift Code ↕</th>
              <th className="px-3 py-3 text-left text-xs font-semibold whitespace-nowrap">Branch ↕</th>
              <th className="px-3 py-3 text-left text-xs font-semibold whitespace-nowrap">Tel.No ↕</th>
              <th className="px-3 py-3 text-left text-xs font-semibold whitespace-nowrap">Fax No ↕</th>
              <th className="px-3 py-3 text-left text-xs font-semibold whitespace-nowrap">Action ↕</th>
            </tr>
          </thead>
          <tbody>
            {filteredBanks.map((bank, index) => (
              <tr
                key={bank.id}
                className={`border-b border-border hover:bg-table-row-hover transition-colors ${
                  index % 2 === 0 ? "bg-card" : "bg-secondary/30"
                }`}
              >
                <td className="px-3 py-2.5 text-sm text-primary font-medium whitespace-nowrap">
                  {bank.bankName}
                </td>
                <td className="px-3 py-2.5 text-sm text-foreground whitespace-nowrap">
                  {bank.acHolder}
                </td>
                <td className="px-3 py-2.5 text-sm text-muted-foreground whitespace-nowrap">
                  {bank.acNumber}
                </td>
                <td className="px-3 py-2.5 text-sm text-muted-foreground whitespace-nowrap">
                  {bank.ibanNumber}
                </td>
                <td className="px-3 py-2.5 text-sm text-muted-foreground whitespace-nowrap">
                  {bank.swiftCode}
                </td>
                <td className="px-3 py-2.5 text-sm text-muted-foreground whitespace-nowrap">
                  {bank.branch}
                </td>
                <td className="px-3 py-2.5 text-sm text-muted-foreground whitespace-nowrap">
                  {bank.telNo}
                </td>
                <td className="px-3 py-2.5 text-sm text-muted-foreground whitespace-nowrap">
                  {bank.faxNo}
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-1">
                    <button className="p-1.5 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors">
                      <Edit size={14} />
                    </button>
                    <button className="p-1.5 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4">
        <p className="text-sm text-muted-foreground">
          Showing 1 to {filteredBanks.length} of {mockBanks.length} entries
        </p>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" className="h-8 px-3" disabled>
            Previous
          </Button>
          <Button size="sm" className="h-8 w-8 bg-primary text-primary-foreground">
            1
          </Button>
          <Button variant="outline" size="sm" className="h-8 w-8">
            2
          </Button>
          <Button variant="outline" size="sm" className="h-8 px-3">
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
