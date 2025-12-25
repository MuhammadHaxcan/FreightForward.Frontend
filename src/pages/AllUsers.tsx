import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, Minus } from "lucide-react";

interface User {
  id: number;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  contactNumber: string;
  companyBranch: string;
  permissions: { role: string; country: string }[];
  status: string;
}

interface PermissionRow {
  id: number;
  role: string;
  country: string;
}

const mockUsers: User[] = [
  { id: 1, firstName: "Transparant", lastName: "Admin", name: "Transparant Admin", email: "admin@tfs-global.com", contactNumber: "", companyBranch: "TRANSPARENT FREIGHT SERVICES", permissions: [{ role: "Administrator", country: "TRANSPARENT FREIGHT SERVICES" }], status: "Active" },
  { id: 2, firstName: "SOULAT", lastName: "TFSU", name: "SOULAT TFSU", email: "soulat@tfs-global.com", contactNumber: "", companyBranch: "TRANSPARENT FREIGHT SERVICES", permissions: [{ role: "Employee", country: "TRANSPARENT FREIGHT SERVICES" }], status: "Active" },
  { id: 3, firstName: "ACCOUNTS", lastName: "TFSU", name: "ACCOUNTS TFSU", email: "accounts@tfs-global.com", contactNumber: "", companyBranch: "TRANSPARENT FREIGHT SERVICES", permissions: [{ role: "Employee", country: "TRANSPARENT FREIGHT SERVICES" }], status: "Active" },
  { id: 4, firstName: "Safuvan", lastName: "cmc", name: "Safuvan cmc", email: "cmcsafuvan46@gmail.com", contactNumber: "", companyBranch: "TRANSPARENT FREIGHT SERVICES", permissions: [{ role: "Employee", country: "TRANSPARENT FREIGHT SERVICES" }], status: "Active" },
  { id: 5, firstName: "admin", lastName: "pakistan s", name: "admin pakistan s", email: "salepakistan@transparant.com", contactNumber: "", companyBranch: "TRANSPARENT FREIGHT SERVICES", permissions: [{ role: "Manager", country: "TRANSPARENT FREIGHT SERVICES WLL" }], status: "Active" },
  { id: 6, firstName: "admin", lastName: "qatar s", name: "admin qatar s", email: "saleqatar@transparant.com", contactNumber: "", companyBranch: "TRANSPARENT FREIGHT SERVICES", permissions: [{ role: "Manager", country: "TRANSPARENT FREIGHT SERVICES WLL" }], status: "Active" },
  { id: 7, firstName: "Shireen", lastName: "TFSU", name: "Shireen TFSU", email: "cus1@tfs-global.com", contactNumber: "", companyBranch: "TRANSPARENT FREIGHT SERVICES", permissions: [{ role: "Employee", country: "TRANSPARENT FREIGHT SERVICES" }], status: "Active" },
  { id: 8, firstName: "Qaseem", lastName: "tfs", name: "Qaseem tfs", email: "qaseem@tfs-global.com", contactNumber: "", companyBranch: "TRANSPARENT FREIGHT SERVICES", permissions: [{ role: "Employee", country: "TRANSPARENT FREIGHT SERVICES" }], status: "In-Active" },
  { id: 9, firstName: "Mazeeda", lastName: "TFSU", name: "Mazeeda TFSU", email: "cs2@tfs-global.com", contactNumber: "", companyBranch: "TRANSPARENT FREIGHT SERVICES", permissions: [{ role: "Employee", country: "TRANSPARENT FREIGHT SERVICES" }], status: "Active" },
  { id: 10, firstName: "sales", lastName: "TFS", name: "sales TFS", email: "sales1@tfs-global.com", contactNumber: "", companyBranch: "TRANSPARENT FREIGHT SERVICES", permissions: [{ role: "SALES", country: "TRANSPARENT FREIGHT SERVICES" }], status: "Active" },
];

const roles = ["Administrator", "Employee", "Manager", "Junior Employee", "President", "CEOs", "SALES"];
const countries = ["TRANSPARENT FREIGHT SERVICES", "TRANSPARENT FREIGHT SERVICES WLL", "TRANSPARENT FREIGHT SERVICES LLC"];
const branches = ["TRANSPARENT FREIGHT SERVICES", "TRANSPARENT FREIGHT SERVICES WLL", "TRANSPARENT FREIGHT SERVICES LLC"];

const AllUsers = () => {
  const [users] = useState<User[]>(mockUsers);
  const [searchTerm, setSearchTerm] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState("10");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [email, setEmail] = useState("");
  const [companyBranch, setCompanyBranch] = useState("");
  const [permissionRows, setPermissionRows] = useState<PermissionRow[]>([
    { id: 1, role: "", country: "" }
  ]);

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setContactNumber("");
    setEmail("");
    setCompanyBranch("");
    setPermissionRows([{ id: 1, role: "", country: "" }]);
  };

  const handleAddNew = () => {
    resetForm();
    setModalMode("add");
    setEditingUser(null);
    setModalOpen(true);
  };

  const handleEdit = (user: User) => {
    setFirstName(user.firstName);
    setLastName(user.lastName);
    setContactNumber(user.contactNumber);
    setEmail(user.email);
    setCompanyBranch(user.companyBranch);
    setPermissionRows(user.permissions.map((p, i) => ({ id: i + 1, role: p.role, country: p.country })));
    setModalMode("edit");
    setEditingUser(user);
    setModalOpen(true);
  };

  const handleAddPermissionRow = () => {
    setPermissionRows([...permissionRows, { id: Date.now(), role: "", country: "" }]);
  };

  const handleRemovePermissionRow = (id: number) => {
    if (permissionRows.length > 1) {
      setPermissionRows(permissionRows.filter(row => row.id !== id));
    }
  };

  const updatePermissionRow = (id: number, field: "role" | "country", value: string) => {
    setPermissionRows(permissionRows.map(row =>
      row.id === id ? { ...row, [field]: value } : row
    ));
  };

  const handleSave = () => {
    console.log("Saving:", {
      firstName,
      lastName,
      contactNumber,
      email,
      companyBranch,
      permissions: permissionRows
    });
    setModalOpen(false);
    resetForm();
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-4">
        {/* List Section */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-foreground">
            List All <span className="font-normal">Employees</span>
          </h1>
          <Button className="btn-success gap-2" onClick={handleAddNew}>
            <Plus size={16} />
            Add New
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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

        <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-table-header text-table-header-foreground">
                  <th className="px-4 py-3 text-left text-sm font-semibold">Action</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
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
                        <button 
                          className="p-1.5 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                          onClick={() => handleEdit(user)}
                        >
                          <Pencil size={14} />
                        </button>
                        <button className="p-1.5 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-primary font-medium">{user.name}</td>
                    <td className="px-4 py-3 text-sm text-primary">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className={`px-3 py-1 rounded text-sm font-medium text-white ${
                        user.status === "Active" 
                          ? "bg-green-500" 
                          : "bg-red-400"
                      }`}>
                        {user.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-primary">
            Showing 1 to {filteredUsers.length} of 13 entries
          </p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" disabled>Previous</Button>
            <Button variant="default" size="sm" className="btn-success">1</Button>
            <Button variant="outline" size="sm">2</Button>
            <Button variant="outline" size="sm">Next</Button>
          </div>
        </div>
      </div>

      {/* Add/Edit Employee Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {modalMode === "add" ? "Add New" : "Edit"} Employee
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">First Name</Label>
                <Input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First Name"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Last Name</Label>
                <Input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last Name"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Contact Number</Label>
                <Input
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  placeholder="Contact Number"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Company Branch</Label>
              <Select value={companyBranch} onValueChange={setCompanyBranch}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch} value={branch}>{branch}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-[1fr_1fr_auto] gap-4 items-end">
                <Label className="text-sm">Permission Role</Label>
                <Label className="text-sm">Permission Country</Label>
                <div></div>
              </div>

              {permissionRows.map((row, index) => (
                <div key={row.id} className="grid grid-cols-[1fr_1fr_auto] gap-4 items-center">
                  <Select value={row.role} onValueChange={(v) => updatePermissionRow(row.id, "role", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role} value={role}>{role}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={row.country} onValueChange={(v) => updatePermissionRow(row.id, "country", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country} value={country}>{country}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {index === 0 ? (
                    <Button className="btn-success gap-1" onClick={handleAddPermissionRow}>
                      <Plus size={16} /> Add Cargo
                    </Button>
                  ) : (
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleRemovePermissionRow(row.id)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button className="btn-success" onClick={handleSave}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default AllUsers;
