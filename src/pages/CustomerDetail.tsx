import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Calendar } from "@/components/ui/calendar";
import { ArrowLeft, Plus, ChevronDown, Check, CalendarIcon, Pencil, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface Contact {
  id: number;
  name: string;
  email: string;
  mobile: string;
  position: string;
  phone: string;
  designation: string;
  department: string;
  directTel: string;
  whatsapp: string;
  skype: string;
  enableRateRequest: boolean;
}

interface Receipt {
  id: number;
  date: string;
  receiptNo: string;
  type: string;
  amount: string;
  narration: string;
}

interface Invoice {
  id: number;
  invoiceDate: string;
  invoiceNo: string;
  jobNo: string;
  hblNo: string;
  amount: string;
  paymentStatus: string;
  status: string;
}

interface AccountReceivable {
  id: number;
  invoiceDate: string;
  invoiceNo: string;
  customerRef: string;
  jobHblNo: string;
  debit: string;
  balance: string;
  paymentStatus: string;
  status: string;
  aging: string;
}

interface CreditNote {
  id: number;
  customer: string;
  date: string;
  referenceNo: string;
  addedBy: string;
  status: string;
}

interface StatementEntry {
  date: string;
  invoiceNo: string;
  description: string;
  jobNo: string;
  blAwbNo: string;
  debit: string;
  credit: string;
  balance: string;
  remarks: string;
}

const customerTypes = ["Consignee", "Customer", "Shipper", "Notify Party", "Neutral"];
const countries = ["United Arab Emirates", "Singapore", "Pakistan", "Taiwan", "China", "Ethiopia", "India", "USA"];
const currencies = ["AED", "USD", "SGD", "PKR", "CNY", "EUR"];

const tabs = [
  { id: "profile", label: "Profile" },
  { id: "contacts", label: "Contacts" },
  { id: "account-details", label: "Account Details" },
  { id: "receipt", label: "Receipt" },
  { id: "invoices", label: "Invoices" },
  { id: "account-receivable", label: "Account Receivable" },
  { id: "credit-notes", label: "Credit Notes" },
  { id: "statement-account", label: "Statement Account" },
];

const CustomerDetail = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isViewMode = searchParams.get("mode") === "view";

  const [activeTab, setActiveTab] = useState("profile");
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [openingBalanceModalOpen, setOpeningBalanceModalOpen] = useState(false);
  const [creditNoteModalOpen, setCreditNoteModalOpen] = useState(false);

  // Profile form state
  const [profileData, setProfileData] = useState({
    code: "DEI0503",
    masterType: "Debtors",
    category: ["Customer", "Consignee"],
    name: "MADOSCA LOGISTICS FZCO",
    city: "",
    country: "United Arab Emirates",
    phone: "",
    fax: "",
    generalEmail: "XXXXX@GMAIL.COM",
    ntnVatTaxNo: "",
    taxPercentage: "",
    address: "",
    status: "Active",
    carrierCode: "0",
  });

  // Account Details state
  const [accountDetails, setAccountDetails] = useState({
    acName: "",
    bankAcNo: "",
    currency: "AED",
    type: "Credit",
    notes: "",
    swiftCode: "",
    acType: "",
    approvedCreditDays: "0",
    alertCreditDays: "0",
    cc: "",
    approvedCreditAmount: "0.00",
    alertCreditAmount: "0.00",
    bcc: "",
  });

  // Contacts list
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactForm, setContactForm] = useState<Partial<Contact>>({});

  // Receipts
  const [receipts] = useState<Receipt[]>([
    { id: 1, date: "27-11-2025", receiptNo: "RVAE25114", type: "Bank", amount: "AED 2,313.60", narration: "AMOUNT ONLINE RECEIVED FOR AED 2,320/- IN EIB FROM AL ALAMAA FOR INV# INV251762." }
  ]);

  // Invoices
  const [invoices] = useState<Invoice[]>([
    { id: 1, invoiceDate: "19-11-2025", invoiceNo: "INVAE251762", jobNo: "25UAE1582", hblNo: "LLL1BL25A1361SDXB", amount: "AED 2,313.60", paymentStatus: "Paid", status: "Active" }
  ]);

  // Account Receivable
  const [accountReceivables] = useState<AccountReceivable[]>([
    { id: 1, invoiceDate: "19-11-2025", invoiceNo: "INVAE251762", customerRef: "", jobHblNo: "25UAE1582/LLL1BL25A1361EDXB", debit: "AED 2,313.60", balance: "AED 0.00", paymentStatus: "Closed", status: "Active", aging: "8 Days" }
  ]);

  // Credit Notes
  const [creditNotes] = useState<CreditNote[]>([]);

  // Statement of Account
  const [statementEntries] = useState<StatementEntry[]>([
    { date: "19-11-2025", invoiceNo: "INVAE251762", description: "", jobNo: "25UAE1582", blAwbNo: "LLL1BL25A1361SDXB", debit: "2,313.60", credit: "0.00", balance: "0.00", remarks: "" },
    { date: "27-11-2025", invoiceNo: "", description: "AMOUNT ONLINE RECEIVED FOR AED 2,320/- IN EIB FROM AL ALAMAA FOR INV# INV251762.", jobNo: "", blAwbNo: "", debit: "0.00", credit: "2,313.60", balance: "0.00", remarks: "AMOUNT ONLINE RECEIVED FOR AED 2,320/- IN EIB FROM AL ALAMAA FOR INV# INV251762." }
  ]);

  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(2020, 9, 2),
    to: new Date(2025, 11, 25)
  });

  // Opening Balance form
  const [openingBalanceForm, setOpeningBalanceForm] = useState({
    invoiceId: "INVAE251869",
    invoiceDate: null as Date | null,
    amount: "",
    narration: "",
    currency: "AED"
  });

  const toggleCategory = (type: string) => {
    setProfileData(prev => ({
      ...prev,
      category: prev.category.includes(type)
        ? prev.category.filter(c => c !== type)
        : [...prev.category, type]
    }));
  };

  const handleSaveContact = () => {
    if (contactForm.name) {
      setContacts([...contacts, { ...contactForm, id: Date.now() } as Contact]);
      setContactForm({});
      setContactModalOpen(false);
    }
  };

  const renderProfileTab = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-primary">Profile</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="space-y-2">
          <Label className="text-sm">Code</Label>
          <Input value={profileData.code} onChange={e => setProfileData({...profileData, code: e.target.value})} disabled={isViewMode} className="bg-muted/50" />
        </div>
        <div className="space-y-2">
          <Label className="text-sm">Master Type</Label>
          <Select value={profileData.masterType} onValueChange={v => setProfileData({...profileData, masterType: v})} disabled={isViewMode}>
            <SelectTrigger className="bg-muted/50"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Debtors">Debtors</SelectItem>
              <SelectItem value="Neutral">Neutral</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-sm">Category</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-between bg-muted/50 font-normal h-10" disabled={isViewMode}>
                <div className="flex flex-wrap gap-1 flex-1">
                  {profileData.category.map(type => (
                    <span key={type} className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-primary text-primary-foreground rounded-md">× {type}</span>
                  ))}
                </div>
                <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0" align="start">
              <Command>
                <CommandList>
                  <CommandGroup>
                    {customerTypes.map(type => (
                      <CommandItem key={type} onSelect={() => toggleCategory(type)} className="cursor-pointer">
                        <div className={cn("mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary", profileData.category.includes(type) ? "bg-primary text-primary-foreground" : "opacity-50")}>
                          {profileData.category.includes(type) && <Check className="h-3 w-3" />}
                        </div>
                        {type}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-2">
          <Label className="text-sm">Name</Label>
          <Input value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value})} disabled={isViewMode} />
        </div>
        <div className="space-y-2">
          <Label className="text-sm">City</Label>
          <Input value={profileData.city} onChange={e => setProfileData({...profileData, city: e.target.value})} disabled={isViewMode} placeholder="City" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="space-y-2">
          <Label className="text-sm">Country</Label>
          <Select value={profileData.country} onValueChange={v => setProfileData({...profileData, country: v})} disabled={isViewMode}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {countries.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-sm">Phone</Label>
          <Input value={profileData.phone} onChange={e => setProfileData({...profileData, phone: e.target.value})} disabled={isViewMode} placeholder="Phone" />
        </div>
        <div className="space-y-2">
          <Label className="text-sm">Fax</Label>
          <Input value={profileData.fax} onChange={e => setProfileData({...profileData, fax: e.target.value})} disabled={isViewMode} placeholder="Fax" />
        </div>
        <div className="space-y-2">
          <Label className="text-sm">General Email</Label>
          <Input value={profileData.generalEmail} onChange={e => setProfileData({...profileData, generalEmail: e.target.value})} disabled={isViewMode} />
        </div>
        <div className="space-y-2">
          <Label className="text-sm">NTN/VAT/TAX NO</Label>
          <Input value={profileData.ntnVatTaxNo} onChange={e => setProfileData({...profileData, ntnVatTaxNo: e.target.value})} disabled={isViewMode} placeholder="RefNo" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label className="text-sm">Tax Percentage</Label>
          <Input value={profileData.taxPercentage} onChange={e => setProfileData({...profileData, taxPercentage: e.target.value})} disabled={isViewMode} />
        </div>
        <div className="space-y-2">
          <Label className="text-sm">Address</Label>
          <Textarea value={profileData.address} onChange={e => setProfileData({...profileData, address: e.target.value})} disabled={isViewMode} />
        </div>
        <div className="space-y-2">
          <Label className="text-sm">Status</Label>
          <Select value={profileData.status} onValueChange={v => setProfileData({...profileData, status: v})} disabled={isViewMode}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-sm">Carrier Code</Label>
          <Input value={profileData.carrierCode} onChange={e => setProfileData({...profileData, carrierCode: e.target.value})} disabled={isViewMode} />
        </div>
      </div>
    </div>
  );

  const renderContactsTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-primary">Contacts</h2>
        {!isViewMode && (
          <Button className="btn-success gap-2" onClick={() => setContactModalOpen(true)}>
            <Plus size={16} /> New Contact
          </Button>
        )}
      </div>

      <div className="space-y-4">
        <p className="text-sm font-medium text-muted-foreground">List All Contact</p>
        
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Show:</span>
            <Select defaultValue="10">
              <SelectTrigger className="w-[70px] h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">entries</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Search:</span>
            <Input className="w-[200px] h-8" />
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-table-header text-table-header-foreground">
                <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Email</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Mobile</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Position</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Phone</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {contacts.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No data available in table</td></tr>
              ) : (
                contacts.map(contact => (
                  <tr key={contact.id} className="border-b border-border">
                    <td className="px-4 py-3 text-sm">{contact.name}</td>
                    <td className="px-4 py-3 text-sm">{contact.email}</td>
                    <td className="px-4 py-3 text-sm">{contact.mobile}</td>
                    <td className="px-4 py-3 text-sm">{contact.position}</td>
                    <td className="px-4 py-3 text-sm">{contact.phone}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8"><Pencil size={16} /></Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive"><Trash2 size={16} /></Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Showing 0 to 0 of 0 entries</p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm">Previous</Button>
            <Button variant="outline" size="sm">Next</Button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAccountDetailsTab = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-primary">Account Details</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label className="text-sm">A/C Name</Label>
          <Input value={accountDetails.acName} onChange={e => setAccountDetails({...accountDetails, acName: e.target.value})} disabled={isViewMode} placeholder="A/C Name" />
        </div>
        <div className="space-y-2">
          <Label className="text-sm">Bank A/C No</Label>
          <Input value={accountDetails.bankAcNo} onChange={e => setAccountDetails({...accountDetails, bankAcNo: e.target.value})} disabled={isViewMode} placeholder="Bank A/C No" />
        </div>
        <div className="space-y-2">
          <Label className="text-sm">Currency</Label>
          <Select value={accountDetails.currency} onValueChange={v => setAccountDetails({...accountDetails, currency: v})} disabled={isViewMode}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {currencies.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-sm">Type</Label>
          <Select value={accountDetails.type} onValueChange={v => setAccountDetails({...accountDetails, type: v})} disabled={isViewMode}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Credit">Credit</SelectItem>
              <SelectItem value="Debit">Debit</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label className="text-sm">Notes</Label>
          <Textarea value={accountDetails.notes} onChange={e => setAccountDetails({...accountDetails, notes: e.target.value})} disabled={isViewMode} />
        </div>
        <div className="space-y-2">
          <Label className="text-sm">Swift Code</Label>
          <Input value={accountDetails.swiftCode} onChange={e => setAccountDetails({...accountDetails, swiftCode: e.target.value})} disabled={isViewMode} placeholder="Swift Code" />
        </div>
        <div className="space-y-2">
          <Label className="text-sm">A/C Type</Label>
          <Input value={accountDetails.acType} onChange={e => setAccountDetails({...accountDetails, acType: e.target.value})} disabled={isViewMode} placeholder="A/C Type" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div className="space-y-2">
          <Label className="text-sm">Approved Credit Days</Label>
          <Input value={accountDetails.approvedCreditDays} onChange={e => setAccountDetails({...accountDetails, approvedCreditDays: e.target.value})} disabled={isViewMode} />
        </div>
        <div className="space-y-2">
          <Label className="text-sm">Alert Credit Days</Label>
          <Input value={accountDetails.alertCreditDays} onChange={e => setAccountDetails({...accountDetails, alertCreditDays: e.target.value})} disabled={isViewMode} />
        </div>
        <div className="space-y-2">
          <Label className="text-sm">CC</Label>
          <Input value={accountDetails.cc} onChange={e => setAccountDetails({...accountDetails, cc: e.target.value})} disabled={isViewMode} placeholder="CC" />
        </div>
        <div className="space-y-2">
          <Label className="text-sm">Approved Credit Amount</Label>
          <Input value={accountDetails.approvedCreditAmount} onChange={e => setAccountDetails({...accountDetails, approvedCreditAmount: e.target.value})} disabled={isViewMode} />
        </div>
        <div className="space-y-2">
          <Label className="text-sm">Alert Credit Amount</Label>
          <Input value={accountDetails.alertCreditAmount} onChange={e => setAccountDetails({...accountDetails, alertCreditAmount: e.target.value})} disabled={isViewMode} />
        </div>
        <div className="space-y-2">
          <Label className="text-sm">BCC</Label>
          <Input value={accountDetails.bcc} onChange={e => setAccountDetails({...accountDetails, bcc: e.target.value})} disabled={isViewMode} placeholder="BCC" />
        </div>
      </div>
    </div>
  );

  const renderReceiptTab = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-primary">Receipt Voucher</h2>
      
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Show:</span>
          <Select defaultValue="10">
            <SelectTrigger className="w-[70px] h-8"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="10">10</SelectItem></SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">entries</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Search:</span>
          <Input className="w-[200px] h-8" />
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-table-header text-table-header-foreground">
              <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Receipt No</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Type</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Amount</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Narration</th>
            </tr>
          </thead>
          <tbody>
            {receipts.map((r, i) => (
              <tr key={r.id} className={`border-b border-border ${i % 2 === 0 ? "bg-card" : "bg-secondary/30"}`}>
                <td className="px-4 py-3 text-sm">{r.date}</td>
                <td className="px-4 py-3 text-sm text-primary">{r.receiptNo}</td>
                <td className="px-4 py-3 text-sm">{r.type}</td>
                <td className="px-4 py-3 text-sm">{r.amount}</td>
                <td className="px-4 py-3 text-sm">{r.narration}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Showing 1 to 1 of 1 entries</p>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm">Previous</Button>
          <Button className="btn-success" size="sm">1</Button>
          <Button variant="outline" size="sm">Next</Button>
        </div>
      </div>
    </div>
  );

  const renderInvoicesTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-primary">Invoices</h2>
        {!isViewMode && (
          <Button className="btn-success gap-2" onClick={() => setOpeningBalanceModalOpen(true)}>
            <Plus size={16} /> Add opening Balance
          </Button>
        )}
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Show:</span>
          <Select defaultValue="10">
            <SelectTrigger className="w-[70px] h-8"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="10">10</SelectItem></SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">entries</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Search:</span>
          <Input className="w-[200px] h-8" />
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-table-header text-table-header-foreground">
              <th className="px-4 py-3 text-left text-sm font-semibold">Invoice Date</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Invoice No.</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Job No.</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">HBL No.</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Amount</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Payment Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv, i) => (
              <tr key={inv.id} className={`border-b border-border ${i % 2 === 0 ? "bg-card" : "bg-secondary/30"}`}>
                <td className="px-4 py-3 text-sm">{inv.invoiceDate}</td>
                <td className="px-4 py-3 text-sm text-primary">{inv.invoiceNo}</td>
                <td className="px-4 py-3 text-sm">{inv.jobNo}</td>
                <td className="px-4 py-3 text-sm">{inv.hblNo}</td>
                <td className="px-4 py-3 text-sm">{inv.amount}</td>
                <td className="px-4 py-3 text-sm">{inv.paymentStatus}</td>
                <td className="px-4 py-3 text-sm">{inv.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Showing 1 to 1 of 1 entries</p>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm">Previous</Button>
          <Button className="btn-success" size="sm">1</Button>
          <Button variant="outline" size="sm">Next</Button>
        </div>
      </div>
    </div>
  );

  const renderAccountReceivableTab = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-primary">Account Receivable</h2>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Show:</span>
          <Select defaultValue="10">
            <SelectTrigger className="w-[70px] h-8"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="10">10</SelectItem></SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">entries</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Search:</span>
          <Input className="w-[200px] h-8" />
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-table-header text-table-header-foreground">
              <th className="px-4 py-3 text-left text-sm font-semibold">Invoice Date</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Invoice No.</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Customer Reference</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Job/HBL No.</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Debit</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Balance</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Payment Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Aging</th>
            </tr>
          </thead>
          <tbody>
            {accountReceivables.map((ar, i) => (
              <tr key={ar.id} className={`border-b border-border ${i % 2 === 0 ? "bg-card" : "bg-secondary/30"}`}>
                <td className="px-4 py-3 text-sm">{ar.invoiceDate}</td>
                <td className="px-4 py-3 text-sm text-primary">{ar.invoiceNo}</td>
                <td className="px-4 py-3 text-sm">{ar.customerRef}</td>
                <td className="px-4 py-3 text-sm">{ar.jobHblNo}</td>
                <td className="px-4 py-3 text-sm">{ar.debit}</td>
                <td className="px-4 py-3 text-sm">{ar.balance}</td>
                <td className="px-4 py-3 text-sm">{ar.paymentStatus}</td>
                <td className="px-4 py-3 text-sm">{ar.status}</td>
                <td className="px-4 py-3 text-sm"><span className="bg-primary text-primary-foreground px-2 py-1 rounded text-xs">{ar.aging}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Showing 1 to 1 of 1 entries</p>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm">Previous</Button>
          <Button className="btn-success" size="sm">1</Button>
          <Button variant="outline" size="sm">Next</Button>
        </div>
      </div>
    </div>
  );

  const renderCreditNotesTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-primary">Credit Notes</h2>
        {!isViewMode && (
          <Button className="btn-success gap-2" onClick={() => setCreditNoteModalOpen(true)}>
            <Plus size={16} /> Credit Notes
          </Button>
        )}
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Show:</span>
          <Select defaultValue="10">
            <SelectTrigger className="w-[70px] h-8"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="10">10</SelectItem></SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">entries</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Search:</span>
          <Input className="w-[200px] h-8" />
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-table-header text-table-header-foreground">
              <th className="px-4 py-3 text-left text-sm font-semibold">#</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Customer</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Reference #</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Added By</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {creditNotes.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No data available in table</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Showing 0 to 0 of 0 entries</p>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm">Previous</Button>
          <Button variant="outline" size="sm">Next</Button>
        </div>
      </div>
    </div>
  );

  const renderStatementAccountTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-primary">Statement of Account</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{format(dateRange.from, "MMMM d, yyyy")} - {format(dateRange.to, "MMMM d, yyyy")}</span>
          </div>
          <Button className="btn-success">PRINT</Button>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-table-header text-table-header-foreground">
              <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Invoice No.</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Description</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Job No.</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">BL/AWB No.</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Debit</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Credit</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Balance</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Remarks</th>
            </tr>
          </thead>
          <tbody>
            {statementEntries.map((entry, i) => (
              <tr key={i} className={`border-b border-border ${i % 2 === 0 ? "bg-card" : "bg-secondary/30"}`}>
                <td className="px-4 py-3 text-sm">{entry.date}</td>
                <td className="px-4 py-3 text-sm text-primary">{entry.invoiceNo}</td>
                <td className="px-4 py-3 text-sm text-amber-600">{entry.description}</td>
                <td className="px-4 py-3 text-sm">{entry.jobNo}</td>
                <td className="px-4 py-3 text-sm">{entry.blAwbNo}</td>
                <td className="px-4 py-3 text-sm">{entry.debit}</td>
                <td className="px-4 py-3 text-sm">{entry.credit}</td>
                <td className="px-4 py-3 text-sm">{entry.balance}</td>
                <td className="px-4 py-3 text-sm">{entry.remarks}</td>
              </tr>
            ))}
            <tr className="bg-muted/50 font-medium">
              <td colSpan={3} className="px-4 py-3 text-sm">Net Outstanding Receivable</td>
              <td colSpan={2} className="px-4 py-3 text-sm text-primary">AED 0.00</td>
              <td className="px-4 py-3 text-sm">AED 2,313.60</td>
              <td className="px-4 py-3 text-sm">AED 2,313.60</td>
              <td className="px-4 py-3 text-sm">AED 0.00</td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "profile": return renderProfileTab();
      case "contacts": return renderContactsTab();
      case "account-details": return renderAccountDetailsTab();
      case "receipt": return renderReceiptTab();
      case "invoices": return renderInvoicesTab();
      case "account-receivable": return renderAccountReceivableTab();
      case "credit-notes": return renderCreditNotesTab();
      case "statement-account": return renderStatementAccountTab();
      default: return renderProfileTab();
    }
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-foreground">{isViewMode ? "View" : "Edit"} Customers</h1>
          <Button variant="outline" className="gap-2" onClick={() => navigate("/master-customers")}>
            <ArrowLeft size={16} /> Back
          </Button>
        </div>

        {/* Main Content */}
        <div className="flex gap-6">
          {/* Side Tabs */}
          <div className="w-48 flex-shrink-0">
            <div className="space-y-1">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "w-full text-left px-4 py-2.5 rounded-md text-sm transition-colors",
                    activeTab === tab.id
                      ? "bg-primary text-primary-foreground font-medium"
                      : "text-primary hover:bg-muted"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 bg-card border border-border rounded-lg p-6">
            <div className="flex justify-end mb-4">
              {!isViewMode && <Button className="btn-success">Save</Button>}
            </div>
            {renderTabContent()}
          </div>
        </div>
      </div>

      {/* Contact Modal */}
      <Dialog open={contactModalOpen} onOpenChange={setContactModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add new contact</DialogTitle>
            <p className="text-xs text-primary">{profileData.name}</p>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label className="text-sm">Name</Label>
              <Input value={contactForm.name || ""} onChange={e => setContactForm({...contactForm, name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Mobile</Label>
              <Input value={contactForm.mobile || ""} onChange={e => setContactForm({...contactForm, mobile: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Designation</Label>
              <Input value={contactForm.designation || ""} onChange={e => setContactForm({...contactForm, designation: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Direct Tel</Label>
              <Input value={contactForm.directTel || ""} onChange={e => setContactForm({...contactForm, directTel: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Department</Label>
              <Input value={contactForm.department || ""} onChange={e => setContactForm({...contactForm, department: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">WhatsApp No</Label>
              <Input value={contactForm.whatsapp || ""} onChange={e => setContactForm({...contactForm, whatsapp: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Email</Label>
              <Input value={contactForm.email || ""} onChange={e => setContactForm({...contactForm, email: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Skype</Label>
              <Input value={contactForm.skype || ""} onChange={e => setContactForm({...contactForm, skype: e.target.value})} />
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <input type="checkbox" id="enableRate" checked={contactForm.enableRateRequest || false} onChange={e => setContactForm({...contactForm, enableRateRequest: e.target.checked})} />
              <Label htmlFor="enableRate" className="text-sm">Enable Rate Request</Label>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setContactModalOpen(false)}>Cancel</Button>
            <Button className="btn-success" onClick={handleSaveContact}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Opening Balance Modal */}
      <Dialog open={openingBalanceModalOpen} onOpenChange={setOpeningBalanceModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Opening Balance</DialogTitle>
            <p className="text-xs text-primary">{profileData.name}</p>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Invoice ID</Label>
                <Input value={openingBalanceForm.invoiceId} className="text-primary" disabled />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Amount</Label>
                <Input value={openingBalanceForm.amount} onChange={e => setOpeningBalanceForm({...openingBalanceForm, amount: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">*Invoice Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {openingBalanceForm.invoiceDate ? format(openingBalanceForm.invoiceDate, "MM/dd/yyyy") : "mm/dd/yyyy"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={openingBalanceForm.invoiceDate || undefined} onSelect={(d) => setOpeningBalanceForm({...openingBalanceForm, invoiceDate: d || null})} />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Narration</Label>
                <Input value={openingBalanceForm.narration} onChange={e => setOpeningBalanceForm({...openingBalanceForm, narration: e.target.value})} />
              </div>
            </div>
            <div className="space-y-2">
              <Select value={openingBalanceForm.currency} onValueChange={v => setOpeningBalanceForm({...openingBalanceForm, currency: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {currencies.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpeningBalanceModalOpen(false)}>Cancel</Button>
            <Button className="btn-success" onClick={() => setOpeningBalanceModalOpen(false)}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default CustomerDetail;
