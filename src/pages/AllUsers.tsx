import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2 } from "lucide-react";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  addedDate: string;
}

const mockUsers: User[] = [
  { id: 1, name: "John Doe", email: "john@example.com", role: "Administrator", status: "Active", addedDate: "22-Apr-2018" },
  { id: 2, name: "Jane Smith", email: "jane@example.com", role: "Manager", status: "Active", addedDate: "15-Jun-2019" },
  { id: 3, name: "Bob Johnson", email: "bob@example.com", role: "Employee", status: "Active", addedDate: "10-Jan-2020" },
  { id: 4, name: "Alice Brown", email: "alice@example.com", role: "Junior Employee", status: "Inactive", addedDate: "05-Mar-2021" },
  { id: 5, name: "Charlie Wilson", email: "charlie@example.com", role: "CEOs", status: "Active", addedDate: "20-Sep-2022" },
];

const AllUsers = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState("10");

  const filteredUsers = mockUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-semibold text-foreground">All Users</h1>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Button className="btn-success gap-2">
            <Plus size={16} />
            Add New User
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
              />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-table-header text-table-header-foreground">
                  <th className="px-4 py-3 text-left text-sm font-semibold">Action</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">User ID</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Role</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Added Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, index) => (
                  <tr
                    key={user.id}
                    className={`border-b border-border hover:bg-table-row-hover transition-colors ${
                      index % 2 === 0 ? "bg-card" : "bg-secondary/30"
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button className="p-1.5 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors">
                          <Pencil size={14} />
                        </button>
                        <button className="p-1.5 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">{user.id}</td>
                    <td className="px-4 py-3 text-sm text-primary font-medium">{user.name}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{user.email}</td>
                    <td className="px-4 py-3 text-sm text-primary">{user.role}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        user.status === "Active" 
                          ? "bg-green-100 text-green-700" 
                          : "bg-red-100 text-red-700"
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{user.addedDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Showing 1 to {filteredUsers.length} of {filteredUsers.length} entries
          </p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" disabled>Previous</Button>
            <Button variant="default" size="sm" className="btn-success">1</Button>
            <Button variant="outline" size="sm">Next</Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default AllUsers;
