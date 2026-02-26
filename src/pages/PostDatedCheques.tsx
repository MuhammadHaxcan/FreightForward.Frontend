import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { getPostDatedCheques, type PostDatedCheque } from "@/services/api/postDatedCheque";
import { formatDate } from "@/lib/utils";

interface TabPanelProps {
  source: string;
  filterOptions: { value: string; label: string }[];
  showTypeColumn?: boolean;
  partyColumnLabel?: string;
}

function PDCTable({ source, filterOptions, showTypeColumn = false, partyColumnLabel = "Party Name" }: TabPanelProps) {
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["post-dated-cheques", source, pageNumber, pageSize, searchTerm, typeFilter],
    queryFn: async () => {
      const res = await getPostDatedCheques({
        pageNumber,
        pageSize,
        searchTerm: searchTerm || undefined,
        type: typeFilter !== "all" ? typeFilter : undefined,
        source,
      });
      return res.data;
    },
  });

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setPageNumber(1);
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Show</span>
          <SearchableSelect
            options={[
              { value: "10", label: "10" },
              { value: "25", label: "25" },
              { value: "50", label: "50" },
              { value: "100", label: "100" },
            ]}
            value={pageSize.toString()}
            onValueChange={(v) => {
              setPageSize(parseInt(v));
              setPageNumber(1);
            }}
            placeholder="10"
            searchPlaceholder="Search..."
            triggerClassName="w-[90px]"
          />
          <span className="text-sm text-muted-foreground">entries</span>

          <span className="text-sm text-muted-foreground ml-4">Filter:</span>
          <SearchableSelect
            options={filterOptions}
            value={typeFilter}
            onValueChange={(v) => {
              setTypeFilter(v);
              setPageNumber(1);
            }}
            placeholder="All"
            searchPlaceholder="Search..."
            triggerClassName="w-[180px]"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Search:</span>
          <Input
            className="w-64"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-table-header">
              {showTypeColumn && (
                <TableHead className="text-table-header-foreground font-semibold">Type</TableHead>
              )}
              <TableHead className="text-table-header-foreground font-semibold">Voucher No</TableHead>
              <TableHead className="text-table-header-foreground font-semibold">Voucher Date</TableHead>
              <TableHead className="text-table-header-foreground font-semibold">{partyColumnLabel}</TableHead>
              <TableHead className="text-table-header-foreground font-semibold">Cheque No</TableHead>
              <TableHead className="text-table-header-foreground font-semibold">Cheque Date</TableHead>
              <TableHead className="text-table-header-foreground font-semibold">Bank</TableHead>
              <TableHead className="text-table-header-foreground font-semibold">Valid Date</TableHead>
              <TableHead className="text-table-header-foreground font-semibold">Currency</TableHead>
              <TableHead className="text-table-header-foreground font-semibold text-right">Amount</TableHead>
              <TableHead className="text-table-header-foreground font-semibold">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={showTypeColumn ? 11 : 10} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : data?.items && data.items.length > 0 ? (
              data.items.map((pdc) => (
                <TableRow key={`${pdc.voucherNo}-${pdc.id}`}>
                  {showTypeColumn && (
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          pdc.type === "Incoming"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-orange-100 text-orange-800"
                        }`}
                      >
                        {pdc.type}
                      </span>
                    </TableCell>
                  )}
                  <TableCell className="text-green-600 font-medium">
                    {pdc.voucherNo}
                  </TableCell>
                  <TableCell>
                    {formatDate(pdc.voucherDate, "dd MMM yyyy")}
                  </TableCell>
                  <TableCell>{pdc.partyName || "-"}</TableCell>
                  <TableCell>{pdc.chequeNo || "-"}</TableCell>
                  <TableCell>
                    {pdc.chequeDate ? formatDate(pdc.chequeDate, "dd MMM yyyy") : "-"}
                  </TableCell>
                  <TableCell>{pdc.chequeBank || "-"}</TableCell>
                  <TableCell>
                    {pdc.postDatedValidDate
                      ? formatDate(pdc.postDatedValidDate, "dd MMM yyyy")
                      : "-"}
                  </TableCell>
                  <TableCell>{pdc.currencyCode || "-"}</TableCell>
                  <TableCell className="text-right font-medium">
                    {pdc.amount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        pdc.status === "Matured"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {pdc.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={showTypeColumn ? 11 : 10} className="text-center py-8 text-muted-foreground">
                  No post dated cheques found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {data && (
        <div className="mt-4 flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            Showing{" "}
            {data.totalCount > 0 ? (pageNumber - 1) * pageSize + 1 : 0} to{" "}
            {Math.min(pageNumber * pageSize, data.totalCount)} of{" "}
            {data.totalCount} entries
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
              disabled={pageNumber === 1}
            >
              Previous
            </Button>
            {data.totalPages > 0 &&
              Array.from(
                { length: Math.min(7, data.totalPages) },
                (_, i) => {
                  let pageNum: number;
                  if (data.totalPages <= 7) {
                    pageNum = i + 1;
                  } else if (pageNumber <= 4) {
                    pageNum = i + 1;
                  } else if (pageNumber >= data.totalPages - 3) {
                    pageNum = data.totalPages - 6 + i;
                  } else {
                    pageNum = pageNumber - 3 + i;
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={pageNumber === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPageNumber(pageNum)}
                      className="w-8"
                    >
                      {pageNum}
                    </Button>
                  );
                }
              )}
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setPageNumber((p) => Math.min(data.totalPages, p + 1))
              }
              disabled={
                pageNumber === data.totalPages || data.totalPages === 0
              }
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

export default function PostDatedCheques() {
  return (
    <MainLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Post Dated Cheques</h1>

        <Tabs defaultValue="expenses" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="vouchers">Receipt / Payment Vouchers</TabsTrigger>
          </TabsList>

          <TabsContent value="expenses">
            <PDCTable
              source="expenses"
              showTypeColumn
              partyColumnLabel="Expense Type"
              filterOptions={[
                { value: "all", label: "All" },
                { value: "incoming", label: "Inwards" },
                { value: "outgoing", label: "Outwards" },
              ]}
            />
          </TabsContent>

          <TabsContent value="vouchers">
            <PDCTable
              source="vouchers"
              showTypeColumn
              filterOptions={[
                { value: "all", label: "All" },
                { value: "receipts", label: "Receipt Vouchers" },
                { value: "payments", label: "Payment Vouchers" },
              ]}
            />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
