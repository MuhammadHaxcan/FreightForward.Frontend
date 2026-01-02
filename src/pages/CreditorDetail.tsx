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
import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { customerApi, settingsApi, CustomerCategoryType, CustomerDetail, Currency } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

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

interface PaymentVoucher {
  id: number;
  date: string;
  receiptNo: string;
  type: string;
  amount: string;
  narration: string;
}

interface PurchaseInvoice {
  id: number;
  vendorInvoiceDate: string;
  vendorInvoiceNo: string;
  jobNo: string;
  purchaseInvoiceNumber: string;
  amount: string;
  paymentStatus: string;
  status: string;
  aging: string;
}

interface AccountPayable {
  id: number;
  purchaseInvoiceDate: string;
  purchaseInvoiceNo: string;
  vendorInvoice: string;
  credit: string;
  balance: string;
  paymentStatus: string;
  status: string;
  aging: string;
}

const countries = ["United Arab Emirates", "Singapore", "Pakistan", "Taiwan", "China", "Ethiopia", "India", "USA"];
const currencies: Currency[] = ["AED", "USD", "SGD", "PKR", "CNY", "EUR"];

const tabs = [
  { id: "profile", label: "Profile" },
  { id: "contacts", label: "Contacts" },
  { id: "account-details", label: "Account Details" },
  { id: "payment-voucher", label: "Payment Voucher" },
  { id: "purchase-invoices", label: "Purchase Invoices" },
  { id: "account-payable", label: "Account Payable" },
];

const CreditorDetail = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isViewMode = searchParams.get("mode") === "view";
  const isEditMode = !!id;

  const [activeTab, setActiveTab] = useState("profile");
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [purchaseInvoiceModalOpen, setPurchaseInvoiceModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categoryTypes, setCategoryTypes] = useState<CustomerCategoryType[]>([]);

  // Profile form state
  const [profileData, setProfileData] = useState({
    code: "",
    masterType: "Creditors" as const,
    categoryIds: [] as number[],
    name: "",
    city: "",
    country: "United Arab Emirates",
    phone: "",
    fax: "",
    generalEmail: "",
    ntnVatTaxNo: "",
    taxPercentage: "",
    address: "",
    status: "Active",
    carrierCode: "",
    baseCurrency: "AED" as Currency,
  });

  // Load category types and customer data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Load category types
        const categoryResponse = await settingsApi.getAllCustomerCategoryTypes();
        if (categoryResponse.data) {
          setCategoryTypes(categoryResponse.data);
        }

        // Load customer data if editing
        if (id) {
          const customerResponse = await customerApi.getById(parseInt(id));
          if (customerResponse.data) {
            const customer = customerResponse.data;
            setProfileData({
              code: customer.code,
              masterType: "Creditors",
              categoryIds: customer.categories?.map(c => c.id) || [],
              name: customer.name,
              city: customer.city || "",
              country: customer.country || "United Arab Emirates",
              phone: customer.phone || "",
              fax: customer.fax || "",
              generalEmail: customer.email || "",
              ntnVatTaxNo: customer.taxNo || "",
              taxPercentage: customer.taxPercentage?.toString() || "",
              address: customer.address || "",
              status: customer.status || "Active",
              carrierCode: customer.carrierCode || "",
              baseCurrency: customer.baseCurrency || "AED",
            });
            // Load contacts
            if (customer.contacts) {
              setContacts(customer.contacts.map(c => ({
                id: c.id,
                name: c.name,
                email: c.email || "",
                mobile: c.mobile || "",
                position: c.position || "",
                phone: c.phone || "",
                designation: c.designation || "",
                department: c.department || "",
                directTel: c.directTel || "",
                whatsapp: c.whatsapp || "",
                skype: c.skype || "",
                enableRateRequest: c.enableRateRequest,
              })));
            }
          }
        }
      } catch (error) {
        console.error("Error loading data:", error);
        toast({
          title: "Error",
          description: "Failed to load data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, toast]);

  // Save handler
  const handleSave = async () => {
    if (!profileData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Customer name is required",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      if (isEditMode && id) {
        // Update existing customer
        const updateData = {
          id: parseInt(id),
          name: profileData.name,
          masterType: profileData.masterType,
          categoryIds: profileData.categoryIds,
          phone: profileData.phone || undefined,
          fax: profileData.fax || undefined,
          email: profileData.generalEmail || undefined,
          country: profileData.country || undefined,
          city: profileData.city || undefined,
          address: profileData.address || undefined,
          baseCurrency: profileData.baseCurrency,
          taxNo: profileData.ntnVatTaxNo || undefined,
          taxPercentage: profileData.taxPercentage ? parseFloat(profileData.taxPercentage) : undefined,
          carrierCode: profileData.carrierCode || undefined,
          status: profileData.status,
        };

        const response = await customerApi.update(parseInt(id), updateData);
        if (response.error) {
          throw new Error(response.error);
        }

        toast({
          title: "Success",
          description: "Customer updated successfully",
        });
      } else {
        // Create new customer
        const createData = {
          name: profileData.name,
          masterType: profileData.masterType,
          categoryIds: profileData.categoryIds,
          phone: profileData.phone || undefined,
          fax: profileData.fax || undefined,
          email: profileData.generalEmail || undefined,
          country: profileData.country || undefined,
          city: profileData.city || undefined,
          address: profileData.address || undefined,
          baseCurrency: profileData.baseCurrency,
          taxNo: profileData.ntnVatTaxNo || undefined,
          taxPercentage: profileData.taxPercentage ? parseFloat(profileData.taxPercentage) : undefined,
          carrierCode: profileData.carrierCode || undefined,
        };

        const response = await customerApi.create(createData);
        if (response.error) {
          throw new Error(response.error);
        }

        toast({
          title: "Success",
          description: "Customer created successfully",
        });
        navigate("/master-customers");
      }
    } catch (error) {
      console.error("Error saving customer:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save customer",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

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

  // Payment Vouchers
  const [paymentVouchers] = useState<PaymentVoucher[]>([
    { id: 1, date: "24 Nov 2025", receiptNo: "PVAE251077", type: "BANK WIRE", amount: "AED 4,385.15", narration: "AMOUNT PAID BY ONLINE TUB DIB TO NEUTRAL FOR INV # 0525181M00073 FOR JOB # 25AE1560." }
  ]);

  // Purchase Invoices
  const [purchaseInvoices] = useState<PurchaseInvoice[]>([
    { id: 1, vendorInvoiceDate: "17-11-2025", vendorInvoiceNo: "0525181M00058", jobNo: "25AE1582", purchaseInvoiceNumber: "PIAE25993", amount: "AED 1,135.00", paymentStatus: "Unpaid", status: "Active", aging: "" },
    { id: 2, vendorInvoiceDate: "10-11-2025", vendorInvoiceNo: "0525181M00073", jobNo: "25AE1560", purchaseInvoiceNumber: "PIAE25931", amount: "AED 4,385.15", paymentStatus: "Paid", status: "Active", aging: "Paid 0 Days" }
  ]);

  // Account Payable
  const [accountPayables] = useState<AccountPayable[]>([
    { id: 1, purchaseInvoiceDate: "17-11-2025", purchaseInvoiceNo: "PIAE25993", vendorInvoice: "0525181M00058", credit: "AED 1,135.00", balance: "AED 1,135.00", paymentStatus: "Pending", status: "Active", aging: "39 Days" },
    { id: 2, purchaseInvoiceDate: "10-11-2025", purchaseInvoiceNo: "PIAE25931", vendorInvoice: "0525181M00073", credit: "AED 4,385.15", balance: "AED 0.00", paymentStatus: "Closed", status: "Active", aging: "14 Days" }
  ]);

  const toggleCategory = (categoryId: number) => {
    setProfileData(prev => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(categoryId)
        ? prev.categoryIds.filter(id => id !== categoryId)
        : [...prev.categoryIds, categoryId]
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
          <Select value={profileData.masterType} onValueChange={v => setProfileData({...profileData, masterType: v as 'Creditors'})} disabled={isViewMode}>
            <SelectTrigger className="bg-muted/50"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Creditors">Creditors</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-sm">Category</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-between bg-muted/50 font-normal h-10" disabled={isViewMode}>
                <div className="flex flex-wrap gap-1 flex-1">
                  {profileData.categoryIds.map(catId => {
                    const cat = categoryTypes.find(c => c.id === catId);
                    return cat ? (
                      <span key={catId} className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-primary text-primary-foreground rounded-md">× {cat.name}</span>
                    ) : null;
                  })}
                </div>
                <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0" align="start">
              <Command>
                <CommandList>
                  <CommandGroup>
                    {categoryTypes.map(cat => (
                      <CommandItem key={cat.id} onSelect={() => toggleCategory(cat.id)} className="cursor-pointer">
                        <div className={cn("mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary", profileData.categoryIds.includes(cat.id) ? "bg-primary text-primary-foreground" : "opacity-50")}>
                          {profileData.categoryIds.includes(cat.id) && <Check className="h-3 w-3" />}
                        </div>
                        {cat.name}
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

  const renderPaymentVoucherTab = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-primary">Payment Voucher</h2>

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
              <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Receipt No</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Type</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Amount</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Narration</th>
            </tr>
          </thead>
          <tbody>
            {paymentVouchers.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No data available in table</td></tr>
            ) : (
              paymentVouchers.map(voucher => (
                <tr key={voucher.id} className="border-b border-border">
                  <td className="px-4 py-3 text-sm">{voucher.date}</td>
                  <td className="px-4 py-3 text-sm">{voucher.receiptNo}</td>
                  <td className="px-4 py-3 text-sm">{voucher.type}</td>
                  <td className="px-4 py-3 text-sm">{voucher.amount}</td>
                  <td className="px-4 py-3 text-sm max-w-xs truncate">{voucher.narration}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Showing 1 to 1 of 1 entries</p>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm">Previous</Button>
          <Button variant="default" size="sm" className="btn-success">1</Button>
          <Button variant="outline" size="sm">Next</Button>
        </div>
      </div>
    </div>
  );

  const renderPurchaseInvoicesTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-primary">Purchase Invoice</h2>
        {!isViewMode && (
          <Button className="btn-success gap-2" onClick={() => setPurchaseInvoiceModalOpen(true)}>
            <Plus size={16} /> Add Purchase Invoice
          </Button>
        )}
      </div>

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
              <th className="px-4 py-3 text-left text-sm font-semibold">Vendor Invoice Date</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Vendor Invoice No.</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Job No.</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Purchase Invoice Number</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Amount</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Payment Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Aging</th>
            </tr>
          </thead>
          <tbody>
            {purchaseInvoices.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">No data available in table</td></tr>
            ) : (
              purchaseInvoices.map(invoice => (
                <tr key={invoice.id} className="border-b border-border">
                  <td className="px-4 py-3 text-sm">{invoice.vendorInvoiceDate}</td>
                  <td className="px-4 py-3 text-sm">{invoice.vendorInvoiceNo}</td>
                  <td className="px-4 py-3 text-sm">{invoice.jobNo}</td>
                  <td className="px-4 py-3 text-sm text-primary">{invoice.purchaseInvoiceNumber}</td>
                  <td className="px-4 py-3 text-sm">{invoice.amount}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={invoice.paymentStatus === "Unpaid" ? "text-yellow-500 font-medium" : "text-muted-foreground"}>
                      {invoice.paymentStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">{invoice.status}</td>
                  <td className="px-4 py-3 text-sm font-medium">{invoice.aging}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Showing 1 to 2 of 2 entries</p>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm">Previous</Button>
          <Button variant="default" size="sm" className="btn-success">1</Button>
          <Button variant="outline" size="sm">Next</Button>
        </div>
      </div>
    </div>
  );

  const renderAccountPayableTab = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-primary">Accounts Payable</h2>

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
              <th className="px-4 py-3 text-left text-sm font-semibold">Purchase Invoice Date</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Purchase Invoice No.</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Vendor Invoice</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Credit</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Balance</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Payment Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Aging</th>
            </tr>
          </thead>
          <tbody>
            {accountPayables.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">No data available in table</td></tr>
            ) : (
              accountPayables.map((payable, index) => (
                <tr key={payable.id} className={`border-b border-border ${index === 0 ? "bg-yellow-50" : ""}`}>
                  <td className="px-4 py-3 text-sm text-primary">{payable.purchaseInvoiceDate}</td>
                  <td className="px-4 py-3 text-sm text-primary">{payable.purchaseInvoiceNo}</td>
                  <td className="px-4 py-3 text-sm text-primary">{payable.vendorInvoice}</td>
                  <td className="px-4 py-3 text-sm">{payable.credit}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={payable.balance !== "AED 0.00" ? "text-red-500 font-medium" : ""}>
                      {payable.balance}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">{payable.paymentStatus}</td>
                  <td className="px-4 py-3 text-sm">{payable.status}</td>
                  <td className="px-4 py-3 text-sm font-bold">{payable.aging}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Showing 1 to 2 of 2 entries</p>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm">Previous</Button>
          <Button variant="default" size="sm" className="btn-success">1</Button>
          <Button variant="outline" size="sm">Next</Button>
        </div>
      </div>
    </div>
  );

  const renderActiveTab = () => {
    switch (activeTab) {
      case "profile": return renderProfileTab();
      case "contacts": return renderContactsTab();
      case "account-details": return renderAccountDetailsTab();
      case "payment-voucher": return renderPaymentVoucherTab();
      case "purchase-invoices": return renderPurchaseInvoicesTab();
      case "account-payable": return renderAccountPayableTab();
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
              <Button className="btn-success" onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
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

export default CreditorDetail;
