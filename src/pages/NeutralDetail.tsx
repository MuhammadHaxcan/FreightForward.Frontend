import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { ArrowLeft, Plus, ChevronDown, Check, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";

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

const customerTypes = ["Consignee(Neutral)", "Shipper", "Neutral", "Notify Party"];
const countries = ["United Arab Emirates", "Singapore", "Pakistan", "Taiwan", "China", "Ethiopia", "India", "USA", "Qatar"];
const currencies = ["AED", "USD", "SGD", "PKR", "CNY", "EUR"];

const tabs = [
  { id: "profile", label: "Profile" },
  { id: "contacts", label: "Contacts" },
  { id: "account-details", label: "Account Details" },
];

const NeutralDetail = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isViewMode = searchParams.get("mode") === "view";

  const [activeTab, setActiveTab] = useState("profile");
  const [contactModalOpen, setContactModalOpen] = useState(false);

  // Profile form state
  const [profileData, setProfileData] = useState({
    code: "NEI0493",
    masterType: "Neutral",
    category: ["Consignee(Neutral)"],
    name: "NOVATEX LIMITED",
    city: "Karachi",
    country: "Pakistan",
    phone: "",
    fax: "",
    generalEmail: "test.novatex@gmail.com",
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

  const renderActiveTab = () => {
    switch (activeTab) {
      case "profile": return renderProfileTab();
      case "contacts": return renderContactsTab();
      case "account-details": return renderAccountDetailsTab();
      default: return renderProfileTab();
    }
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-foreground">Edit Customers</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate("/master-customers")} className="gap-2">
              <ArrowLeft size={16} /> Back
            </Button>
            {!isViewMode && (
              <Button className="btn-success">Save</Button>
            )}
          </div>
        </div>

        {/* Horizontal Tabs */}
        <div className="bg-card border border-border rounded-lg p-1 flex flex-wrap gap-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-4 py-2.5 rounded-md text-sm transition-colors",
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-foreground hover:bg-muted"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-card border border-border rounded-lg p-6">
          {renderActiveTab()}
        </div>
      </div>

      {/* Contact Modal */}
      <Dialog open={contactModalOpen} onOpenChange={setContactModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add new contact</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={contactForm.name || ""} onChange={e => setContactForm({...contactForm, name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Designation</Label>
              <Input value={contactForm.designation || ""} onChange={e => setContactForm({...contactForm, designation: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={contactForm.email || ""} onChange={e => setContactForm({...contactForm, email: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Input value={contactForm.department || ""} onChange={e => setContactForm({...contactForm, department: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Mobile</Label>
              <Input value={contactForm.mobile || ""} onChange={e => setContactForm({...contactForm, mobile: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Direct Tel</Label>
              <Input value={contactForm.directTel || ""} onChange={e => setContactForm({...contactForm, directTel: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={contactForm.phone || ""} onChange={e => setContactForm({...contactForm, phone: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>WhatsApp</Label>
              <Input value={contactForm.whatsapp || ""} onChange={e => setContactForm({...contactForm, whatsapp: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Position</Label>
              <Input value={contactForm.position || ""} onChange={e => setContactForm({...contactForm, position: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Skype</Label>
              <Input value={contactForm.skype || ""} onChange={e => setContactForm({...contactForm, skype: e.target.value})} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setContactModalOpen(false)}>Cancel</Button>
            <Button className="btn-success" onClick={handleSaveContact}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default NeutralDetail;
