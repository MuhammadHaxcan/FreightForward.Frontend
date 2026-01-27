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
import { cn, formatDate } from "@/lib/utils";
import { customerApi, settingsApi, CustomerCategoryType, CurrencyType, Invoice as ApiInvoice, AccountReceivable as ApiAccountReceivable, AccountPayable as ApiAccountPayable, PaymentStatus, Receipt as ApiReceipt, CustomerStatement } from "@/services/api";
import { getPaymentVouchers, PaymentVoucher } from "@/services/api/payment";
import { invoiceApi, AccountPurchaseInvoice } from "@/services/api/invoice";
import { useToast } from "@/hooks/use-toast";
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

// Invoice interface is imported from API as ApiInvoice
// AccountReceivable interface is imported from API as ApiAccountReceivable
// Receipt interface is imported from API as ApiReceipt

interface CreditNote {
  id: number;
  customer: string;
  date: string;
  referenceNo: string;
  addedBy: string;
  status: string;
}

// StatementEntry imported from API as part of CustomerStatement

const countries = ["United Arab Emirates", "Singapore", "Pakistan", "Taiwan", "China", "Ethiopia", "India", "USA"];

// Base tabs for all customer types
const baseTabs = [
  { id: "profile", label: "Profile" },
  { id: "contacts", label: "Contacts" },
  { id: "account-details", label: "Account Details" },
];

// Tabs specific to Debtors
const debtorTabs = [
  { id: "receipt", label: "Receipt" },
  { id: "invoices", label: "Invoices" },
  { id: "account-receivable", label: "Account Receivable" },
  { id: "credit-notes", label: "Credit Notes" },
  { id: "statement-account", label: "Statement Account" },
];

// Tabs specific to Creditors
const creditorTabs = [
  { id: "payment-vouchers", label: "Payment Vouchers" },
  { id: "purchase-invoices", label: "Purchase Invoices" },
  { id: "account-payable", label: "Account Payable" },
];

// Function to get tabs based on master type
const getTabsForMasterType = (masterType: string) => {
  if (masterType === "Creditors") {
    return [...baseTabs, ...creditorTabs];
  }
  // Debtors and Neutral get debtor tabs
  return [...baseTabs, ...debtorTabs];
};

const CustomerDetail = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isViewMode = searchParams.get("mode") === "view";
  const isEditMode = !!id;

  const [activeTab, setActiveTab] = useState("profile");
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [openingBalanceModalOpen, setOpeningBalanceModalOpen] = useState(false);
  const [creditNoteModalOpen, setCreditNoteModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categoryTypes, setCategoryTypes] = useState<CustomerCategoryType[]>([]);
  const [currencyTypes, setCurrencyTypes] = useState<CurrencyType[]>([]);

  // Invoices state (declared early to avoid reference errors)
  const [invoices, setInvoices] = useState<ApiInvoice[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [invoicesPageNumber, setInvoicesPageNumber] = useState(1);
  const [invoicesPageSize, setInvoicesPageSize] = useState(10);
  const [invoicesTotalCount, setInvoicesTotalCount] = useState(0);
  const [invoicesTotalPages, setInvoicesTotalPages] = useState(0);

  // Account Receivables state
  const [accountReceivables, setAccountReceivables] = useState<ApiAccountReceivable[]>([]);
  const [arLoading, setArLoading] = useState(false);
  const [arPageNumber, setArPageNumber] = useState(1);
  const [arPageSize, setArPageSize] = useState(10);
  const [arTotalCount, setArTotalCount] = useState(0);
  const [arTotalPages, setArTotalPages] = useState(0);

  // Account Payables state (for Creditors)
  const [accountPayables, setAccountPayables] = useState<ApiAccountPayable[]>([]);
  const [apLoading, setApLoading] = useState(false);
  const [apPageNumber, setApPageNumber] = useState(1);
  const [apPageSize, setApPageSize] = useState(10);
  const [apTotalCount, setApTotalCount] = useState(0);
  const [apTotalPages, setApTotalPages] = useState(0);

  // Payment Vouchers state (for Creditors)
  const [paymentVouchers, setPaymentVouchers] = useState<PaymentVoucher[]>([]);
  const [pvLoading, setPvLoading] = useState(false);
  const [pvPageNumber, setPvPageNumber] = useState(1);
  const [pvPageSize, setPvPageSize] = useState(10);
  const [pvTotalCount, setPvTotalCount] = useState(0);
  const [pvTotalPages, setPvTotalPages] = useState(0);

  // Purchase Invoices state (for Creditors)
  const [purchaseInvoices, setPurchaseInvoices] = useState<AccountPurchaseInvoice[]>([]);
  const [piLoading, setPiLoading] = useState(false);
  const [piPageNumber, setPiPageNumber] = useState(1);
  const [piPageSize, setPiPageSize] = useState(10);
  const [piTotalCount, setPiTotalCount] = useState(0);
  const [piTotalPages, setPiTotalPages] = useState(0);

  // Receipts state
  const [receipts, setReceipts] = useState<ApiReceipt[]>([]);
  const [receiptsLoading, setReceiptsLoading] = useState(false);
  const [receiptsPageNumber, setReceiptsPageNumber] = useState(1);
  const [receiptsPageSize, setReceiptsPageSize] = useState(10);
  const [receiptsTotalCount, setReceiptsTotalCount] = useState(0);
  const [receiptsTotalPages, setReceiptsTotalPages] = useState(0);

  // Statement of Account state
  const [statementData, setStatementData] = useState<CustomerStatement | null>(null);
  const [statementLoading, setStatementLoading] = useState(false);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(2020, 9, 2),
    to: new Date()
  });

  // Contacts list
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactForm, setContactForm] = useState<Partial<Contact>>({});

  // Profile form state
  const [profileData, setProfileData] = useState({
    code: "",
    masterType: "Debtors" as "Debtors" | "Creditors" | "Neutral",
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
    currencyId: "",
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

        // Load currency types
        const currencyResponse = await settingsApi.getAllCurrencyTypes();
        if (currencyResponse.data) {
          setCurrencyTypes(currencyResponse.data);
        }

        // Load customer data if editing
        if (id) {
          const customerResponse = await customerApi.getById(parseInt(id));
          if (customerResponse.data) {
            const customer = customerResponse.data;
            setProfileData({
              code: customer.code,
              masterType: customer.masterType as "Debtors" | "Creditors" | "Neutral",
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
              currencyId: customer.currencyId?.toString() || "",
            });
            // Load account details currency from customer's base currency
            if (customer.currencyId && currencyResponse.data) {
              const currency = currencyResponse.data.find(c => c.id === customer.currencyId);
              if (currency) {
                setAccountDetails(prev => ({ ...prev, currency: currency.code }));
              }
            }
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

  // Fetch invoices when tab is active
  const fetchInvoices = async () => {
    if (!id) return;
    setInvoicesLoading(true);
    try {
      const response = await customerApi.getInvoices(parseInt(id), {
        pageNumber: invoicesPageNumber,
        pageSize: invoicesPageSize
      });
      if (response.data) {
        setInvoices(response.data.items);
        setInvoicesTotalCount(response.data.totalCount);
        setInvoicesTotalPages(response.data.totalPages);
      }
    } catch (error) {
      console.error("Error fetching invoices:", error);
      toast({
        title: "Error",
        description: "Failed to load invoices",
        variant: "destructive",
      });
    } finally {
      setInvoicesLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'invoices' && id) {
      fetchInvoices();
    }
  }, [activeTab, id, invoicesPageNumber, invoicesPageSize]);

  // Fetch account receivables when tab is active
  const fetchAccountReceivables = async () => {
    if (!id) return;
    setArLoading(true);
    try {
      const response = await customerApi.getAccountReceivables(parseInt(id), {
        pageNumber: arPageNumber,
        pageSize: arPageSize
      });
      if (response.data) {
        // Backend now filters by payment status (Pending, PartiallyPaid, Paid)
        setAccountReceivables(response.data.items);
        setArTotalCount(response.data.totalCount);
        setArTotalPages(response.data.totalPages);
      }
    } catch (error) {
      console.error("Error fetching account receivables:", error);
      toast({
        title: "Error",
        description: "Failed to load account receivables",
        variant: "destructive",
      });
    } finally {
      setArLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'account-receivable' && id) {
      fetchAccountReceivables();
    }
  }, [activeTab, id, arPageNumber, arPageSize]);

  // Fetch receipts when tab is active
  const fetchReceipts = async () => {
    if (!id) return;
    setReceiptsLoading(true);
    try {
      const response = await customerApi.getReceipts(parseInt(id), {
        pageNumber: receiptsPageNumber,
        pageSize: receiptsPageSize
      });
      if (response.data) {
        setReceipts(response.data.items);
        setReceiptsTotalCount(response.data.totalCount);
        setReceiptsTotalPages(response.data.totalPages);
      }
    } catch (error) {
      console.error("Error fetching receipts:", error);
      toast({
        title: "Error",
        description: "Failed to load receipts",
        variant: "destructive",
      });
    } finally {
      setReceiptsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'receipt' && id) {
      fetchReceipts();
    }
  }, [activeTab, id, receiptsPageNumber, receiptsPageSize]);

  // Fetch account payables when tab is active (for Creditors)
  const fetchAccountPayables = async () => {
    if (!id) return;
    setApLoading(true);
    try {
      const response = await customerApi.getAccountPayables(parseInt(id), {
        pageNumber: apPageNumber,
        pageSize: apPageSize
      });
      if (response.data) {
        setAccountPayables(response.data.items);
        setApTotalCount(response.data.totalCount);
        setApTotalPages(response.data.totalPages);
      }
    } catch (error) {
      console.error("Error fetching account payables:", error);
      toast({
        title: "Error",
        description: "Failed to load account payables",
        variant: "destructive",
      });
    } finally {
      setApLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'account-payable' && id) {
      fetchAccountPayables();
    }
  }, [activeTab, id, apPageNumber, apPageSize]);

  // Fetch payment vouchers when tab is active (for Creditors)
  const fetchPaymentVouchers = async () => {
    if (!id) return;
    setPvLoading(true);
    try {
      const response = await getPaymentVouchers({
        vendorId: parseInt(id),
        pageNumber: pvPageNumber,
        pageSize: pvPageSize
      });
      if (response.data) {
        setPaymentVouchers(response.data.items);
        setPvTotalCount(response.data.totalCount);
        setPvTotalPages(response.data.totalPages);
      }
    } catch (error) {
      console.error("Error fetching payment vouchers:", error);
    } finally {
      setPvLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "payment-vouchers" && id && profileData.masterType === "Creditors") {
      fetchPaymentVouchers();
    }
  }, [activeTab, id, pvPageNumber, pvPageSize, profileData.masterType]);

  // Fetch purchase invoices when tab is active (for Creditors)
  const fetchPurchaseInvoices = async () => {
    if (!id) return;
    setPiLoading(true);
    try {
      const response = await invoiceApi.getAllPurchaseInvoices({
        vendorId: parseInt(id),
        pageNumber: piPageNumber,
        pageSize: piPageSize
      });
      if (response.data) {
        setPurchaseInvoices(response.data.items);
        setPiTotalCount(response.data.totalCount);
        setPiTotalPages(response.data.totalPages);
      }
    } catch (error) {
      console.error("Error fetching purchase invoices:", error);
    } finally {
      setPiLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "purchase-invoices" && id && profileData.masterType === "Creditors") {
      fetchPurchaseInvoices();
    }
  }, [activeTab, id, piPageNumber, piPageSize, profileData.masterType]);

  // Fetch statement when tab is active
  const fetchStatement = async () => {
    if (!id) return;
    setStatementLoading(true);
    try {
      const fromDateStr = dateRange.from.toISOString().split('T')[0];
      const toDateStr = dateRange.to.toISOString().split('T')[0];
      const response = await customerApi.getStatement(parseInt(id), fromDateStr, toDateStr);
      if (response.data) {
        setStatementData(response.data);
      }
    } catch (error) {
      console.error("Error fetching statement:", error);
      toast({
        title: "Error",
        description: "Failed to load statement",
        variant: "destructive",
      });
    } finally {
      setStatementLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'statement-account' && id) {
      fetchStatement();
    }
  }, [activeTab, id, dateRange]);

  // Helper function to get payment status display and styling
  const getPaymentStatusDisplay = (status: PaymentStatus) => {
    switch (status) {
      case 'Pending':
        return { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' };
      case 'PartiallyPaid':
        return { label: 'Partially Paid', className: 'bg-orange-100 text-orange-800' };
      case 'Paid':
        return { label: 'Paid', className: 'bg-green-100 text-green-800' };
      case 'Overdue':
        return { label: 'Overdue', className: 'bg-red-100 text-red-800' };
      case 'Closed':
        return { label: 'Closed', className: 'bg-gray-100 text-gray-800' };
      default:
        return { label: status, className: 'bg-gray-100 text-gray-800' };
    }
  };

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
      // Look up currencyId from the account details currency code
      const selectedCurrency = currencyTypes.find(c => c.code === accountDetails.currency);
      const currencyId = selectedCurrency?.id;

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
          currencyId: currencyId || undefined,
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
          currencyId: currencyId || undefined,
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

  // Credit Notes
  const [creditNotes] = useState<CreditNote[]>([]);

  // Opening Balance form
  const [openingBalanceForm, setOpeningBalanceForm] = useState({
    invoiceId: "INVAE251869",
    invoiceDate: null as Date | null,
    amount: "",
    narration: "",
    currency: "AED"
  });

  // Credit Note form
  const [creditNoteForm, setCreditNoteForm] = useState({
    jobNumber: "",
    creditNoteNo: "CNAE251001",
    customerName: profileData.name,
    email: "123@test.com",
    invoiceDate: new Date(2025, 11, 25) as Date | null,
    referenceNo: "",
    status: "Active",
  });

  // Charges Details for Credit Note
  interface ChargeDetail {
    id: number;
    chargeDetails: string;
    bases: string;
    currency: string;
    rate: string;
    roe: string;
    quantity: string;
    amount: string;
  }
  const [chargeDetails, setChargeDetails] = useState<ChargeDetail[]>([]);
  const [newCharge, setNewCharge] = useState<Partial<ChargeDetail>>({
    chargeDetails: "",
    bases: "",
    currency: "",
    rate: "1",
    roe: "ROE",
    quantity: "",
    amount: ""
  });
  const [additionalContents, setAdditionalContents] = useState("");

  const handleAddCharge = () => {
    if (newCharge.chargeDetails) {
      setChargeDetails([...chargeDetails, { ...newCharge, id: Date.now() } as ChargeDetail]);
      setNewCharge({
        chargeDetails: "",
        bases: "",
        currency: "",
        rate: "1",
        roe: "ROE",
        quantity: "",
        amount: ""
      });
    }
  };

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
          <Select value={profileData.masterType} onValueChange={v => setProfileData({...profileData, masterType: v as "Debtors" | "Creditors" | "Neutral"})} disabled={isViewMode}>
            <SelectTrigger className="bg-muted/50"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Debtors">Debtors</SelectItem>
              <SelectItem value="Creditors">Creditors</SelectItem>
              <SelectItem value="Neutral">Neutral</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-sm">Category</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-between bg-muted/50 font-normal min-h-10 h-auto py-2" disabled={isViewMode}>
                <div className="flex flex-wrap gap-1 flex-1 max-h-[72px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {profileData.categoryIds.map(catId => {
                    const cat = categoryTypes.find(c => c.id === catId);
                    return cat ? (
                      <span key={catId} className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-primary text-primary-foreground rounded-md whitespace-nowrap">× {cat.name}</span>
                    ) : null;
                  })}
                </div>
                <ChevronDown className="h-4 w-4 shrink-0 opacity-50 ml-2" />
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
              {currencyTypes.map(c => <SelectItem key={c.code} value={c.code}>{c.code}</SelectItem>)}
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

  const renderReceiptTab = () => {
    const startEntry = receiptsTotalCount > 0 ? (receiptsPageNumber - 1) * receiptsPageSize + 1 : 0;
    const endEntry = Math.min(receiptsPageNumber * receiptsPageSize, receiptsTotalCount);

    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-primary">Receipt Voucher</h2>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Show:</span>
            <Select value={receiptsPageSize.toString()} onValueChange={(v) => { setReceiptsPageSize(parseInt(v)); setReceiptsPageNumber(1); }}>
              <SelectTrigger className="w-[70px] h-8"><SelectValue /></SelectTrigger>
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
              {receiptsLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Loading...</td>
                </tr>
              ) : receipts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No receipts found</td>
                </tr>
              ) : (
                receipts.map((r, i) => (
                  <tr key={r.id} className={`border-b border-border ${i % 2 === 0 ? "bg-card" : "bg-secondary/30"}`}>
                    <td className="px-4 py-3 text-sm">{formatDate(r.receiptDate)}</td>
                    <td className="px-4 py-3 text-sm text-primary">{r.receiptNo}</td>
                    <td className="px-4 py-3 text-sm">{r.type || "Bank"}</td>
                    <td className="px-4 py-3 text-sm">{r.currency} {r.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3 text-sm">{r.narration || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {startEntry} to {endEntry} of {receiptsTotalCount} entries
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setReceiptsPageNumber(p => Math.max(1, p - 1))}
              disabled={receiptsPageNumber === 1}
            >
              Previous
            </Button>
            {Array.from({ length: Math.min(5, receiptsTotalPages) }, (_, i) => {
              let pageNum: number;
              if (receiptsTotalPages <= 5) {
                pageNum = i + 1;
              } else if (receiptsPageNumber <= 3) {
                pageNum = i + 1;
              } else if (receiptsPageNumber >= receiptsTotalPages - 2) {
                pageNum = receiptsTotalPages - 4 + i;
              } else {
                pageNum = receiptsPageNumber - 2 + i;
              }
              return (
                <Button
                  key={pageNum}
                  variant={receiptsPageNumber === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => setReceiptsPageNumber(pageNum)}
                  className={receiptsPageNumber === pageNum ? "btn-success" : ""}
                >
                  {pageNum}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setReceiptsPageNumber(p => Math.min(receiptsTotalPages, p + 1))}
              disabled={receiptsPageNumber === receiptsTotalPages || receiptsTotalPages === 0}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderInvoicesTab = () => {
    const startEntry = invoicesTotalCount > 0 ? (invoicesPageNumber - 1) * invoicesPageSize + 1 : 0;
    const endEntry = Math.min(invoicesPageNumber * invoicesPageSize, invoicesTotalCount);

    return (
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
            <Select value={invoicesPageSize.toString()} onValueChange={(v) => { setInvoicesPageSize(parseInt(v)); setInvoicesPageNumber(1); }}>
              <SelectTrigger className="w-[70px] h-8"><SelectValue /></SelectTrigger>
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
                <th className="px-4 py-3 text-left text-sm font-semibold">Paid</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Balance</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Payment Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Receipts</th>
              </tr>
            </thead>
            <tbody>
              {invoicesLoading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">Loading...</td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">No invoices found</td>
                </tr>
              ) : (
                invoices.map((inv, i) => {
                  const statusDisplay = getPaymentStatusDisplay(inv.paymentStatus);
                  const hasBalance = (inv.balanceAmount ?? 0) > 0;
                  const balanceColorClass = hasBalance
                    ? "bg-green-100 text-green-800 font-medium px-2 py-1 rounded"
                    : "text-muted-foreground";
                  return (
                    <tr key={inv.id} className={`border-b border-border ${i % 2 === 0 ? "bg-card" : "bg-secondary/30"}`}>
                      <td className="px-4 py-3 text-sm">{formatDate(inv.invoiceDate)}</td>
                      <td className="px-4 py-3 text-sm text-primary">{inv.invoiceNo}</td>
                      <td className="px-4 py-3 text-sm">{inv.jobNo || "-"}</td>
                      <td className="px-4 py-3 text-sm">{inv.hblNo || "-"}</td>
                      <td className="px-4 py-3 text-sm">{inv.currency} {inv.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="px-4 py-3 text-sm">{inv.currency} {(inv.paidAmount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={balanceColorClass}>
                          {inv.currency} {(inv.balanceAmount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${statusDisplay.className}`}>
                          {statusDisplay.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {inv.receipts && inv.receipts.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {inv.receipts.map((r) => (
                              <span key={r.receiptId} className="text-primary text-xs underline cursor-pointer" title={`${r.currency} ${r.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} on ${formatDate(r.receiptDate)}`}>
                                {r.receiptNo}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {startEntry} to {endEntry} of {invoicesTotalCount} entries
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setInvoicesPageNumber(p => Math.max(1, p - 1))}
              disabled={invoicesPageNumber === 1}
            >
              Previous
            </Button>
            {Array.from({ length: Math.min(5, invoicesTotalPages) }, (_, i) => {
              let pageNum: number;
              if (invoicesTotalPages <= 5) {
                pageNum = i + 1;
              } else if (invoicesPageNumber <= 3) {
                pageNum = i + 1;
              } else if (invoicesPageNumber >= invoicesTotalPages - 2) {
                pageNum = invoicesTotalPages - 4 + i;
              } else {
                pageNum = invoicesPageNumber - 2 + i;
              }
              return (
                <Button
                  key={pageNum}
                  variant={invoicesPageNumber === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => setInvoicesPageNumber(pageNum)}
                  className={invoicesPageNumber === pageNum ? "btn-success" : ""}
                >
                  {pageNum}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setInvoicesPageNumber(p => Math.min(invoicesTotalPages, p + 1))}
              disabled={invoicesPageNumber === invoicesTotalPages || invoicesTotalPages === 0}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderAccountReceivableTab = () => {
    const startEntry = arTotalCount > 0 ? (arPageNumber - 1) * arPageSize + 1 : 0;
    const endEntry = Math.min(arPageNumber * arPageSize, arTotalCount);

    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-primary">Account Receivable (Unpaid Invoices)</h2>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Show:</span>
            <Select value={arPageSize.toString()} onValueChange={(v) => { setArPageSize(parseInt(v)); setArPageNumber(1); }}>
              <SelectTrigger className="w-[70px] h-8"><SelectValue /></SelectTrigger>
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
              {arLoading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">Loading...</td>
                </tr>
              ) : accountReceivables.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">No unpaid invoices found</td>
                </tr>
              ) : (
                accountReceivables.map((ar, i) => {
                  const statusDisplay = getPaymentStatusDisplay(ar.paymentStatus);
                  const hasBalance = ar.balance > 0;
                  const balanceColorClass = hasBalance
                    ? "bg-green-100 text-green-800 font-medium px-2 py-1 rounded"
                    : "text-muted-foreground";
                  return (
                    <tr key={ar.id} className={`border-b border-border ${i % 2 === 0 ? "bg-card" : "bg-secondary/30"}`}>
                      <td className="px-4 py-3 text-sm">{formatDate(ar.invoiceDate)}</td>
                      <td className="px-4 py-3 text-sm text-primary">{ar.invoiceNo}</td>
                      <td className="px-4 py-3 text-sm">{ar.customerRef || "-"}</td>
                      <td className="px-4 py-3 text-sm">{ar.jobHblNo || "-"}</td>
                      <td className="px-4 py-3 text-sm">{ar.currency} {ar.debit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={balanceColorClass}>
                          {ar.currency} {ar.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${statusDisplay.className}`}>
                          {statusDisplay.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">{ar.status || "Active"}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className="bg-primary text-primary-foreground px-2 py-1 rounded text-xs">
                          {ar.agingDays} Days
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {startEntry} to {endEntry} of {arTotalCount} entries
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setArPageNumber(p => Math.max(1, p - 1))}
              disabled={arPageNumber === 1}
            >
              Previous
            </Button>
            {Array.from({ length: Math.min(5, arTotalPages) }, (_, i) => {
              let pageNum: number;
              if (arTotalPages <= 5) {
                pageNum = i + 1;
              } else if (arPageNumber <= 3) {
                pageNum = i + 1;
              } else if (arPageNumber >= arTotalPages - 2) {
                pageNum = arTotalPages - 4 + i;
              } else {
                pageNum = arPageNumber - 2 + i;
              }
              return (
                <Button
                  key={pageNum}
                  variant={arPageNumber === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => setArPageNumber(pageNum)}
                  className={arPageNumber === pageNum ? "btn-success" : ""}
                >
                  {pageNum}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setArPageNumber(p => Math.min(arTotalPages, p + 1))}
              disabled={arPageNumber === arTotalPages || arTotalPages === 0}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderAccountPayableTab = () => {
    const startEntry = apTotalCount > 0 ? (apPageNumber - 1) * apPageSize + 1 : 0;
    const endEntry = Math.min(apPageNumber * apPageSize, apTotalCount);

    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-primary">Account Payable (Unpaid Purchase Invoices)</h2>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Show:</span>
            <Select value={apPageSize.toString()} onValueChange={(v) => { setApPageSize(parseInt(v)); setApPageNumber(1); }}>
              <SelectTrigger className="w-[70px] h-8"><SelectValue /></SelectTrigger>
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
            <Input className="w-[200px] h-8" />
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-table-header text-table-header-foreground">
                <th className="px-4 py-3 text-left text-sm font-semibold">Invoice Date</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Purchase Invoice No.</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Vendor Invoice No.</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Job/HBL No.</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Credit</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Balance</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Payment Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Aging</th>
              </tr>
            </thead>
            <tbody>
              {apLoading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">Loading...</td>
                </tr>
              ) : accountPayables.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">No unpaid purchase invoices found</td>
                </tr>
              ) : (
                accountPayables.map((ap, i) => {
                  const statusDisplay = getPaymentStatusDisplay(ap.paymentStatus);
                  const hasBalance = ap.balance > 0;
                  const balanceColorClass = hasBalance
                    ? "bg-orange-100 text-orange-800 font-medium px-2 py-1 rounded"
                    : "text-muted-foreground";
                  return (
                    <tr key={ap.id} className={`border-b border-border ${i % 2 === 0 ? "bg-card" : "bg-secondary/30"}`}>
                      <td className="px-4 py-3 text-sm">{formatDate(ap.invoiceDate)}</td>
                      <td className="px-4 py-3 text-sm text-primary">{ap.purchaseInvoiceNo}</td>
                      <td className="px-4 py-3 text-sm">{ap.vendorInvoiceNo || "-"}</td>
                      <td className="px-4 py-3 text-sm">{ap.jobHblNo || "-"}</td>
                      <td className="px-4 py-3 text-sm">{ap.currency} {ap.credit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={balanceColorClass}>
                          {ap.currency} {ap.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${statusDisplay.className}`}>
                          {statusDisplay.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">{ap.status || "Active"}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className="bg-primary text-primary-foreground px-2 py-1 rounded text-xs">
                          {ap.agingDays} Days
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {startEntry} to {endEntry} of {apTotalCount} entries
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setApPageNumber(p => Math.max(1, p - 1))}
              disabled={apPageNumber === 1}
            >
              Previous
            </Button>
            {Array.from({ length: Math.min(5, apTotalPages) }, (_, i) => {
              let pageNum: number;
              if (apTotalPages <= 5) {
                pageNum = i + 1;
              } else if (apPageNumber <= 3) {
                pageNum = i + 1;
              } else if (apPageNumber >= apTotalPages - 2) {
                pageNum = apTotalPages - 4 + i;
              } else {
                pageNum = apPageNumber - 2 + i;
              }
              return (
                <Button
                  key={pageNum}
                  variant={apPageNumber === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => setApPageNumber(pageNum)}
                  className={apPageNumber === pageNum ? "btn-success" : ""}
                >
                  {pageNum}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setApPageNumber(p => Math.min(apTotalPages, p + 1))}
              disabled={apPageNumber === apTotalPages || apTotalPages === 0}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    );
  };

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

  const handlePrintStatement = () => {
    if (!id) return;
    const fromDateStr = dateRange.from.toISOString().split('T')[0];
    const toDateStr = dateRange.to.toISOString().split('T')[0];
    window.open(`/master-customers/${id}/statement/print?fromDate=${fromDateStr}&toDate=${toDateStr}`, '_blank');
  };

  const renderStatementAccountTab = () => {
    const formatAmount = (amount: number) => amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-primary">Statement of Account</h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{format(dateRange.from, "MMMM d, yyyy")} - {format(dateRange.to, "MMMM d, yyyy")}</span>
            </div>
            <Button className="btn-success" onClick={handlePrintStatement}>PRINT</Button>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-table-header text-table-header-foreground">
                <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Invoice No.</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Receipt No.</th>
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
              {statementLoading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">Loading...</td>
                </tr>
              ) : !statementData || statementData.entries.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">No statement entries found</td>
                </tr>
              ) : (
                <>
                  {statementData.entries.map((entry, i) => (
                    <tr key={i} className={`border-b border-border ${i % 2 === 0 ? "bg-card" : "bg-secondary/30"}`}>
                      <td className="px-4 py-3 text-sm">{formatDate(entry.date)}</td>
                      <td className="px-4 py-3 text-sm text-primary">{entry.invoiceNo || "-"}</td>
                      <td className="px-4 py-3 text-sm text-primary">{entry.receiptNo || "-"}</td>
                      <td className="px-4 py-3 text-sm text-amber-600 max-w-[200px] truncate" title={entry.description}>{entry.description || "-"}</td>
                      <td className="px-4 py-3 text-sm">{entry.jobNo || "-"}</td>
                      <td className="px-4 py-3 text-sm">{entry.blAwbNo || "-"}</td>
                      <td className="px-4 py-3 text-sm">{entry.debit > 0 ? formatAmount(entry.debit) : "-"}</td>
                      <td className="px-4 py-3 text-sm">{entry.credit > 0 ? formatAmount(entry.credit) : "-"}</td>
                      <td className="px-4 py-3 text-sm">{formatAmount(entry.balance)}</td>
                      <td className="px-4 py-3 text-sm max-w-[150px] truncate" title={entry.remarks}>{entry.remarks || "-"}</td>
                    </tr>
                  ))}
                  <tr className="bg-muted/50 font-medium">
                    <td colSpan={3} className="px-4 py-3 text-sm">Net Outstanding Receivable</td>
                    <td colSpan={3} className="px-4 py-3 text-sm text-primary">
                      {statementData.currency} {formatAmount(statementData.netOutstandingReceivable)}
                    </td>
                    <td className="px-4 py-3 text-sm">{statementData.currency} {formatAmount(statementData.totalDebit)}</td>
                    <td className="px-4 py-3 text-sm">{statementData.currency} {formatAmount(statementData.totalCredit)}</td>
                    <td className="px-4 py-3 text-sm">{statementData.currency} {formatAmount(statementData.netOutstandingReceivable)}</td>
                    <td></td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderPaymentVouchersTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Input placeholder="Search payment vouchers..." className="w-1/3" />
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Entries:</span>
          <Select value={pvPageSize.toString()} onValueChange={(v) => { setPvPageSize(parseInt(v)); setPvPageNumber(1); }}>
            <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Date</th>
              <th className="px-4 py-3 text-left font-medium">Payment Voucher No.</th>
              <th className="px-4 py-3 text-left font-medium">Type</th>
              <th className="px-4 py-3 text-left font-medium">Purchases</th>
              <th className="px-4 py-3 text-right font-medium">Amount</th>
              <th className="px-4 py-3 text-left font-medium">Narration</th>
            </tr>
          </thead>
          <tbody>
            {pvLoading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center">Loading...</td></tr>
            ) : paymentVouchers.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No payment vouchers found</td></tr>
            ) : (
              paymentVouchers.map((pv) => (
                <tr key={pv.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">{formatDate(pv.paymentDate)}</td>
                  <td className="px-4 py-3 font-medium">{pv.paymentNo}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                      {pv.paymentMode}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-600">{pv.purchaseInvoiceCount} invoice(s)</span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {pv.currency} {pv.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">{pv.narration || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pvTotalPages > 1 && (
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">
            Showing {((pvPageNumber - 1) * pvPageSize) + 1} to {Math.min(pvPageNumber * pvPageSize, pvTotalCount)} of {pvTotalCount}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={pvPageNumber === 1} onClick={() => setPvPageNumber(p => p - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={pvPageNumber === pvTotalPages} onClick={() => setPvPageNumber(p => p + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );

  const renderPurchaseInvoicesTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Input placeholder="Search purchase invoices..." className="w-1/3" />
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Entries:</span>
          <Select value={piPageSize.toString()} onValueChange={(v) => { setPiPageSize(parseInt(v)); setPiPageNumber(1); }}>
            <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Date</th>
              <th className="px-4 py-3 text-left font-medium">Purchase No.</th>
              <th className="px-4 py-3 text-left font-medium">Vendor Inv. No.</th>
              <th className="px-4 py-3 text-left font-medium">Job No.</th>
              <th className="px-4 py-3 text-right font-medium">Amount</th>
              <th className="px-4 py-3 text-left font-medium">Payment Status</th>
            </tr>
          </thead>
          <tbody>
            {piLoading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center">Loading...</td></tr>
            ) : purchaseInvoices.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No purchase invoices found</td></tr>
            ) : (
              purchaseInvoices.map((pi) => (
                <tr key={pi.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">{formatDate(pi.purchaseDate)}</td>
                  <td className="px-4 py-3 font-medium">{pi.purchaseNo}</td>
                  <td className="px-4 py-3">{pi.vendorInvoiceNo || '-'}</td>
                  <td className="px-4 py-3">{pi.jobNo || '-'}</td>
                  <td className="px-4 py-3 text-right font-medium">
                    {pi.currency} {pi.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "px-2 py-1 text-xs rounded-full",
                      pi.paymentStatus === "Paid" ? "bg-green-100 text-green-800" :
                      pi.paymentStatus === "PartiallyPaid" ? "bg-orange-100 text-orange-800" :
                      "bg-yellow-100 text-yellow-800"
                    )}>
                      {pi.paymentStatus === "PartiallyPaid" ? "Partial" : pi.paymentStatus}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {piTotalPages > 1 && (
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">
            Showing {((piPageNumber - 1) * piPageSize) + 1} to {Math.min(piPageNumber * piPageSize, piTotalCount)} of {piTotalCount}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={piPageNumber === 1} onClick={() => setPiPageNumber(p => p - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={piPageNumber === piTotalPages} onClick={() => setPiPageNumber(p => p + 1)}>Next</Button>
          </div>
        </div>
      )}
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
      case "payment-vouchers": return renderPaymentVouchersTab();
      case "purchase-invoices": return renderPurchaseInvoicesTab();
      case "account-payable": return renderAccountPayableTab();
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
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2" onClick={() => navigate("/master-customers")}>
              <ArrowLeft size={16} /> Back
            </Button>
            {!isViewMode && (
              <Button className="btn-success" onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
            )}
          </div>
        </div>

        {/* Horizontal Tabs - Dynamic based on customer type */}
        <div className="bg-card border border-border rounded-lg p-1 flex flex-wrap gap-1">
          {getTabsForMasterType(profileData.masterType).map(tab => (
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
          {renderTabContent()}
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
                  {currencyTypes.map(c => <SelectItem key={c.code} value={c.code}>{c.code}</SelectItem>)}
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

      {/* Credit Note Modal */}
      <Dialog open={creditNoteModalOpen} onOpenChange={setCreditNoteModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Add New Credit Note</DialogTitle>
          </DialogHeader>

          {/* Credit Note Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-primary">Credit Note</h3>
              <Button className="btn-success">Save</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Job Number</Label>
                <Select value={creditNoteForm.jobNumber} onValueChange={v => setCreditNoteForm({...creditNoteForm, jobNumber: v})}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select One" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25UAE1582">25UAE1582</SelectItem>
                    <SelectItem value="25UAE1583">25UAE1583</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">*Credit Note #</Label>
                <Input value={creditNoteForm.creditNoteNo} onChange={e => setCreditNoteForm({...creditNoteForm, creditNoteNo: e.target.value})} className="bg-muted/50" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Customer Name</Label>
                <Select value={creditNoteForm.customerName} onValueChange={v => setCreditNoteForm({...creditNoteForm, customerName: v})}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={profileData.name}>{profileData.name}</SelectItem>
                    <SelectItem value="EES FREIGHT SERVICES PTE LTD">EES FREIGHT SERVICES PTE LTD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Email</Label>
                <Input value={creditNoteForm.email} onChange={e => setCreditNoteForm({...creditNoteForm, email: e.target.value})} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">*Invoice Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {creditNoteForm.invoiceDate ? format(creditNoteForm.invoiceDate, "dd-MM-yyyy") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-popover z-50">
                    <Calendar mode="single" selected={creditNoteForm.invoiceDate || undefined} onSelect={(d) => setCreditNoteForm({...creditNoteForm, invoiceDate: d || null})} />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Reference #</Label>
                <Input value={creditNoteForm.referenceNo} onChange={e => setCreditNoteForm({...creditNoteForm, referenceNo: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Status</Label>
                <Select value={creditNoteForm.status} onValueChange={v => setCreditNoteForm({...creditNoteForm, status: v})}>
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Charges Details Section */}
          <div className="space-y-4 mt-6">
            <h3 className="text-lg font-semibold text-primary">Charges Details</h3>
            
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-table-header text-table-header-foreground">
                    <th className="px-3 py-2 text-left text-sm font-semibold">Charges Details</th>
                    <th className="px-3 py-2 text-left text-sm font-semibold">Bases</th>
                    <th className="px-3 py-2 text-left text-sm font-semibold">Currency</th>
                    <th className="px-3 py-2 text-left text-sm font-semibold">Rate</th>
                    <th className="px-3 py-2 text-left text-sm font-semibold">ROE</th>
                    <th className="px-3 py-2 text-left text-sm font-semibold">Quantity</th>
                    <th className="px-3 py-2 text-left text-sm font-semibold">Amount</th>
                    <th className="px-3 py-2 text-left text-sm font-semibold"></th>
                  </tr>
                </thead>
                <tbody>
                  {chargeDetails.map((charge, i) => (
                    <tr key={charge.id} className={`border-b border-border ${i % 2 === 0 ? "bg-card" : "bg-secondary/30"}`}>
                      <td className="px-3 py-2 text-sm">{charge.chargeDetails}</td>
                      <td className="px-3 py-2 text-sm">{charge.bases}</td>
                      <td className="px-3 py-2 text-sm">{charge.currency}</td>
                      <td className="px-3 py-2 text-sm">{charge.rate}</td>
                      <td className="px-3 py-2 text-sm">{charge.roe}</td>
                      <td className="px-3 py-2 text-sm">{charge.quantity}</td>
                      <td className="px-3 py-2 text-sm">{charge.amount}</td>
                      <td className="px-3 py-2">
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setChargeDetails(chargeDetails.filter(c => c.id !== charge.id))}>
                          <Trash2 size={14} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {/* Add new charge row */}
                  <tr className="bg-card">
                    <td className="px-3 py-2">
                      <Select value={newCharge.chargeDetails} onValueChange={v => setNewCharge({...newCharge, chargeDetails: v})}>
                        <SelectTrigger className="h-8 text-xs bg-background">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Freight Charges">Freight Charges</SelectItem>
                          <SelectItem value="Handling Charges">Handling Charges</SelectItem>
                          <SelectItem value="Documentation">Documentation</SelectItem>
                          <SelectItem value="THC">THC</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-3 py-2">
                      <Input className="h-8 text-xs" placeholder="Bases" value={newCharge.bases} onChange={e => setNewCharge({...newCharge, bases: e.target.value})} />
                    </td>
                    <td className="px-3 py-2">
                      <Select value={newCharge.currency} onValueChange={v => setNewCharge({...newCharge, currency: v})}>
                        <SelectTrigger className="h-8 text-xs bg-background">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {currencyTypes.map(c => <SelectItem key={c.code} value={c.code}>{c.code}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-3 py-2">
                      <Input className="h-8 text-xs" placeholder="1" value={newCharge.rate} onChange={e => setNewCharge({...newCharge, rate: e.target.value})} />
                    </td>
                    <td className="px-3 py-2">
                      <Input className="h-8 text-xs" placeholder="ROE" value={newCharge.roe} onChange={e => setNewCharge({...newCharge, roe: e.target.value})} />
                    </td>
                    <td className="px-3 py-2">
                      <Input className="h-8 text-xs" placeholder="Quantity" value={newCharge.quantity} onChange={e => setNewCharge({...newCharge, quantity: e.target.value})} />
                    </td>
                    <td className="px-3 py-2">
                      <Input className="h-8 text-xs" placeholder="Amount" value={newCharge.amount} onChange={e => setNewCharge({...newCharge, amount: e.target.value})} />
                    </td>
                    <td className="px-3 py-2">
                      <Button size="sm" className="btn-success h-8 px-3 gap-1" onClick={handleAddCharge}>
                        <Plus size={14} /> Add
                      </Button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Additional Contents */}
          <div className="space-y-2 mt-6">
            <Label className="text-sm">Additional Contents</Label>
            <Textarea 
              className="min-h-[100px]" 
              value={additionalContents} 
              onChange={e => setAdditionalContents(e.target.value)} 
            />
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setCreditNoteModalOpen(false)}>Cancel</Button>
            <Button className="btn-success" onClick={() => setCreditNoteModalOpen(false)}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default CustomerDetail;
