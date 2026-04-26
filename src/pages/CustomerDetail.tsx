import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { SearchableMultiSelect } from "@/components/ui/searchable-multi-select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ArrowLeft, Plus, CalendarIcon, Pencil, Trash2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { formatDate, formatDateToISO, cn } from "@/lib/utils";
import { customerApi, PaymentStatus } from "@/services/api";
import { usePurchaseInvoices } from "@/hooks/useInvoices";
import { usePaymentVouchers } from "@/hooks/usePaymentVouchers";
import {
  useCustomer,
  useCreateCustomer,
  useUpdateCustomer,
  useCustomerInvoices,
  useCustomerReceipts,
  useCustomerCreditNotes,
  useCustomerAccountReceivables,
  useCustomerAccountPayables,
  useCustomerStatement,
} from "@/hooks/useCustomers";
import { useCreateCreditNote, useCustomerCreditNoteUnpaidInvoices } from "@/hooks/useCreditNotes";
import {
  useAllCustomerCategoryTypes,
  useAllCurrencyTypes,
  useAllChargeItems,
} from "@/hooks/useSettings";
import { hrEmployeeApi } from "@/services/api/hr";
import { toast } from "sonner";
import { useBaseCurrency } from "@/hooks/useBaseCurrency";
import { useAllCountries } from "@/hooks/useSettings";
import { format } from "date-fns";
import { DateRangePicker, DateRangeValue } from "@/components/ui/date-range-picker";

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

// CreditNote type imported from API (customer.ts)

// StatementEntry imported from API as part of CustomerStatement

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
  { id: "account-receivable", label: "Statement of Account" },
  { id: "credit-notes", label: "Credit Notes" },
  { id: "statement-account", label: "Customer Ledger" },
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
  const queryClient = useQueryClient();
  const baseCurrencyCode = useBaseCurrency();
  const { data: countriesData } = useAllCountries();
  const countries = countriesData || [];
  const isViewMode = searchParams.get("mode") === "view";
  const isEditMode = !!id;
  const customerId = id ? parseInt(id) : 0;
  const [isPendingCustomer, setIsPendingCustomer] = useState(false);

  const [activeTab, setActiveTab] = useState("profile");
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [openingBalanceModalOpen, setOpeningBalanceModalOpen] = useState(false);
  const [creditNoteModalOpen, setCreditNoteModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Pagination state for each tab
  const [invoicesPageNumber, setInvoicesPageNumber] = useState(1);
  const [invoicesPageSize, setInvoicesPageSize] = useState(10);
  const [arPageNumber, setArPageNumber] = useState(1);
  const [arPageSize, setArPageSize] = useState(10);
  const [apPageNumber, setApPageNumber] = useState(1);
  const [apPageSize, setApPageSize] = useState(10);
  const [pvPageNumber, setPvPageNumber] = useState(1);
  const [pvPageSize, setPvPageSize] = useState(10);
  const [piPageNumber, setPiPageNumber] = useState(1);
  const [piPageSize, setPiPageSize] = useState(10);
  const [receiptsPageNumber, setReceiptsPageNumber] = useState(1);
  const [receiptsPageSize, setReceiptsPageSize] = useState(10);
  const [cnPageNumber, setCnPageNumber] = useState(1);
  const [cnPageSize, setCnPageSize] = useState(10);

  // Date range state
  const [dateRange, setDateRange] = useState<DateRangeValue>({
    from: new Date(new Date().getFullYear() - 5, 0, 1),
    to: new Date(),
  });
  const [soaDateRange, setSoaDateRange] = useState<DateRangeValue | undefined>(undefined);

  // Contacts + form state
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactForm, setContactForm] = useState<Partial<Contact>>({});

  // Profile form state
  const [profileData, setProfileData] = useState({
    code: "",
    masterType: "Debtors" as "Debtors" | "Creditors" | "Neutral",
    categoryIds: [] as string[],
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
    salesperson: "",
  });

  // Reference data (shared cache across app)
  const { data: categoryTypes = [] } = useAllCustomerCategoryTypes();
  const { data: currencyTypes = [] } = useAllCurrencyTypes();
  const { data: employeesResp } = useQuery({
    queryKey: ['hr-employees-dropdown'],
    queryFn: () => hrEmployeeApi.getDropdown(),
    staleTime: 5 * 60 * 1000,
  });
  const employees = employeesResp?.data ?? [];

  // Customer detail
  const { data: customer } = useCustomer(customerId);

  // Tab data — gated by activeTab (and masterType for Creditor tabs)
  const { data: invoicesPage, isLoading: invoicesLoading } = useCustomerInvoices(customerId, {
    pageNumber: invoicesPageNumber,
    pageSize: invoicesPageSize,
    enabled: activeTab === 'invoices',
  });
  const invoices = invoicesPage?.items ?? [];
  const invoicesTotalCount = invoicesPage?.totalCount ?? 0;
  const invoicesTotalPages = invoicesPage?.totalPages ?? 0;

  const { data: receiptsPage, isLoading: receiptsLoading } = useCustomerReceipts(customerId, {
    pageNumber: receiptsPageNumber,
    pageSize: receiptsPageSize,
    enabled: activeTab === 'receipt',
  });
  const receipts = receiptsPage?.items ?? [];
  const receiptsTotalCount = receiptsPage?.totalCount ?? 0;
  const receiptsTotalPages = receiptsPage?.totalPages ?? 0;

  const { data: creditNotesPage, isLoading: cnLoading } = useCustomerCreditNotes(customerId, {
    pageNumber: cnPageNumber,
    pageSize: cnPageSize,
    enabled: activeTab === 'credit-notes',
  });
  const creditNotes = creditNotesPage?.items ?? [];
  const cnTotalCount = creditNotesPage?.totalCount ?? 0;
  const cnTotalPages = creditNotesPage?.totalPages ?? 0;

  const { data: arPage, isLoading: arLoading } = useCustomerAccountReceivables(customerId, {
    pageNumber: arPageNumber,
    pageSize: arPageSize,
    fromDate: soaDateRange?.from ? formatDateToISO(soaDateRange.from) : undefined,
    toDate: soaDateRange?.to ? formatDateToISO(soaDateRange.to) : undefined,
    enabled: activeTab === 'account-receivable',
  });
  const accountReceivables = arPage?.items ?? [];
  const arTotalCount = arPage?.totalCount ?? 0;
  const arTotalPages = arPage?.totalPages ?? 0;

  const { data: apPage, isLoading: apLoading } = useCustomerAccountPayables(customerId, {
    pageNumber: apPageNumber,
    pageSize: apPageSize,
    enabled: activeTab === 'account-payable',
  });
  const accountPayables = apPage?.items ?? [];
  const apTotalCount = apPage?.totalCount ?? 0;
  const apTotalPages = apPage?.totalPages ?? 0;

  const { data: pvPage, isLoading: pvLoading } = usePaymentVouchers({
    vendorId: customerId,
    pageNumber: pvPageNumber,
    pageSize: pvPageSize,
  });
  // Gate via enabled through the mounted component — we only read it when Creditor tab is active
  const paymentVouchers = (activeTab === 'payment-vouchers' && profileData.masterType === 'Creditors')
    ? (pvPage?.items ?? [])
    : [];
  const pvTotalCount = pvPage?.totalCount ?? 0;
  const pvTotalPages = pvPage?.totalPages ?? 0;

  const { data: piPage, isLoading: piLoading } = usePurchaseInvoices({
    vendorId: customerId,
    pageNumber: piPageNumber,
    pageSize: piPageSize,
  });
  const purchaseInvoices = (activeTab === 'purchase-invoices' && profileData.masterType === 'Creditors')
    ? (piPage?.items ?? [])
    : [];
  const piTotalCount = piPage?.totalCount ?? 0;
  const piTotalPages = piPage?.totalPages ?? 0;

  const { data: statementData, isLoading: statementLoading } = useCustomerStatement(
    customerId,
    dateRange.from ? formatDateToISO(dateRange.from) : "",
    dateRange.to ? formatDateToISO(dateRange.to) : "",
    { enabled: activeTab === 'statement-account' }
  );

  // Initial form population — fires ONLY when customer identity changes (not on background refetches),
  // so cross-entity invalidations don't wipe user edits.
  const initializedForIdRef = useRef<number | null>(null);
  useEffect(() => {
    if (!customer || initializedForIdRef.current === customer.id) return;

    setIsPendingCustomer(customer.isApproved === false);
    setProfileData({
      code: customer.code,
      masterType: customer.masterType as "Debtors" | "Creditors" | "Neutral",
      categoryIds: customer.categories?.map(c => c.id.toString()) || [],
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
      salesperson: customer.salesperson || "",
    });
    initializedForIdRef.current = customer.id;
  }, [customer]);

  // Sync account details from customer (re-runs on customer refetch so currency stays correct,
  // but only when we have currencies loaded to resolve the code).
  useEffect(() => {
    if (!customer || currencyTypes.length === 0) return;
    if (customer.accountDetail) {
      const ad = customer.accountDetail;
      const acCurrency = ad.currencyId
        ? currencyTypes.find(c => c.id === ad.currencyId)
        : null;
      setAccountDetails({
        acName: ad.acName || "",
        bankAcNo: ad.bankAcNo || "",
        currency: acCurrency?.code || baseCurrencyCode,
        type: ad.type || "Credit",
        notes: ad.notes || "",
        swiftCode: ad.swiftCode || "",
        acType: ad.acType || "",
        approvedCreditDays: ad.approvedCreditDays?.toString() || "0",
        alertCreditDays: ad.alertCreditDays?.toString() || "0",
        cc: ad.cc || "",
        approvedCreditAmount: ad.approvedCreditAmount?.toString() || "0.00",
        alertCreditAmount: ad.alertCreditAmount?.toString() || "0.00",
        bcc: ad.bcc || "",
      });
    } else if (customer.currencyId) {
      const currency = currencyTypes.find(c => c.id === customer.currencyId);
      if (currency) {
        setAccountDetails(prev => ({ ...prev, currency: currency.code }));
      }
    }
  }, [customer, currencyTypes, baseCurrencyCode]);

  // Keep contacts in sync with server data on every customer refetch.
  useEffect(() => {
    if (customer?.contacts) {
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
  }, [customer?.contacts]);

  // Charge items and CN unpaid invoices are loaded via shared hooks (declared below).

  // Save credit note handler
  const createCreditNoteMutation = useCreateCreditNote();
  const handleSaveCreditNote = async () => {
    if (!id || !creditNoteForm.creditNoteDate) {
      toast.error("Please fill in required fields");
      return;
    }
    setCnSaving(true);
    try {
      // Auto-add pending charge if filled but not explicitly added
      let allCharges = [...chargeDetails];
      if (newCharge.chargeDetails && newCharge.amount) {
        allCharges.push({ ...newCharge, id: Date.now() } as ChargeDetail);
      }

      // Validate: total allocated cannot exceed total charges
      const totalCharges = allCharges.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);
      const totalAllocated = cnSelectedInvoices.reduce((sum, inv) => sum + inv.allocatedAmount, 0);
      if (totalAllocated > totalCharges) {
        toast.error("Allocated amount cannot exceed credit note total");
        setCnSaving(false);
        return;
      }

      await createCreditNoteMutation.mutateAsync({
        customerId: parseInt(id),
        creditNoteDate: format(creditNoteForm.creditNoteDate, "yyyy-MM-dd"),
        jobNumber: creditNoteForm.jobNumber || undefined,
        referenceNo: creditNoteForm.referenceNo || undefined,
        email: creditNoteForm.email || undefined,
        additionalContents: additionalContents || undefined,
        status: creditNoteForm.status || "Active",
        details: allCharges.map(d => ({
          chargeDetails: d.chargeDetails || undefined,
          bases: d.bases || undefined,
          currencyId: d.currencyId,
          rate: parseFloat(d.rate) || 0,
          roe: parseFloat(d.roe) || 1,
          quantity: parseFloat(d.quantity) || 0,
          amount: parseFloat(d.amount) || 0,
        })),
        invoices: cnSelectedInvoices.map(inv => ({
          invoiceId: inv.invoiceId,
          amount: inv.allocatedAmount,
          currencyId: inv.currencyId,
        })),
      });
      setCreditNoteModalOpen(false);
      setChargeDetails([]);
      setAdditionalContents("");
      setCnSelectedInvoices([]);
      setCreditNoteForm({ jobNumber: "", email: "", creditNoteDate: new Date(), referenceNo: "", status: "Active" });
    } catch {
      // toast already shown by mutation's onError
    } finally {
      setCnSaving(false);
    }
  };

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
  const createCustomerMutation = useCreateCustomer();
  const updateCustomerMutation = useUpdateCustomer();
  const handleSave = async () => {
    if (!profileData.name.trim()) {
      toast.error("Customer name is required");
      return;
    }

    setSaving(true);
    try {
      const selectedCurrency = currencyTypes.find(c => c.code === accountDetails.currency);
      const currencyId = selectedCurrency?.id;

      if (isEditMode && id) {
        await updateCustomerMutation.mutateAsync({
          id: parseInt(id),
          data: {
            id: parseInt(id),
            name: profileData.name,
            masterType: profileData.masterType,
            categoryIds: profileData.categoryIds.map(cid => parseInt(cid)),
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
            salesperson: profileData.salesperson || undefined,
          },
        });
      } else {
        await createCustomerMutation.mutateAsync({
          name: profileData.name,
          masterType: profileData.masterType,
          categoryIds: profileData.categoryIds.map(cid => parseInt(cid)),
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
          salesperson: profileData.salesperson || undefined,
        });
        navigate("/master-customers");
      }
    } catch {
      // toast already shown by mutation's onError
    } finally {
      setSaving(false);
    }
  };

  // Account Details state
  const [accountDetails, setAccountDetails] = useState({
    acName: "",
    bankAcNo: "",
    currency: baseCurrencyCode,
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

  // Opening Balance form
  const [openingBalanceForm, setOpeningBalanceForm] = useState({
    invoiceId: "INVAE251869",
    invoiceDate: null as Date | null,
    amount: "",
    narration: "",
    currency: baseCurrencyCode
  });

  // Credit Note form
  const [creditNoteForm, setCreditNoteForm] = useState({
    jobNumber: "",
    email: "",
    creditNoteDate: new Date() as Date | null,
    referenceNo: "",
    status: "Active",
  });

  // Charges Details for Credit Note
  interface ChargeDetail {
    id: number;
    chargeDetails: string;
    bases: string;
    currencyId?: number;
    rate: string;
    roe: string;
    quantity: string;
    amount: string;
  }
  const [chargeDetails, setChargeDetails] = useState<ChargeDetail[]>([]);
  const [newCharge, setNewCharge] = useState<Partial<ChargeDetail>>({
    chargeDetails: "",
    bases: "",
    currencyId: undefined,
    rate: "1",
    roe: "1",
    quantity: "",
    amount: ""
  });
  const [additionalContents, setAdditionalContents] = useState("");
  const [cnSaving, setCnSaving] = useState(false);

  // Charge items + CN unpaid invoices (loaded via shared hooks; CN unpaid only when modal opens)
  const { data: chargeItemsList = [] } = useAllChargeItems();
  const { data: cnUnpaidInvoices = [] } = useCustomerCreditNoteUnpaidInvoices(
    customerId,
    undefined,
    { enabled: creditNoteModalOpen }
  );

  // Invoice allocation state for credit notes
  const [cnSelectedInvoices, setCnSelectedInvoices] = useState<{
    invoiceId: number;
    invoiceNo: string;
    invoiceDate?: string;
    jobNo?: string;
    hblNo?: string;
    currencyId?: number;
    currencyCode?: string;
    pendingAmount: number;
    allocatedAmount: number;
  }[]>([]);

  const handleAddCharge = () => {
    if (newCharge.chargeDetails) {
      setChargeDetails([...chargeDetails, { ...newCharge, id: Date.now() } as ChargeDetail]);
      setNewCharge({
        chargeDetails: "",
        bases: "",
        currencyId: undefined,
        rate: "1",
        roe: "1",
        quantity: "",
        amount: ""
      });
    }
  };

  const handleSaveContact = async () => {
    if (!contactForm.name) return;

    if (!id) {
      // For new customer (not yet saved), just add locally
      setContacts([...contacts, { ...contactForm, id: Date.now() } as Contact]);
      setContactForm({});
      setContactModalOpen(false);
      return;
    }

    try {
      const response = await customerApi.createContact(parseInt(id), {
        customerId: parseInt(id),
        name: contactForm.name,
        email: contactForm.email || undefined,
        mobile: contactForm.mobile || undefined,
        position: contactForm.position || undefined,
        phone: contactForm.phone || undefined,
        designation: contactForm.designation || undefined,
        department: contactForm.department || undefined,
        directTel: contactForm.directTel || undefined,
        whatsapp: contactForm.whatsapp || undefined,
        skype: contactForm.skype || undefined,
        enableRateRequest: contactForm.enableRateRequest || false,
      });
      if (response.error) throw new Error(response.error);

      // Let the useCustomer hook refetch; contacts sync useEffect will pick up the new list.
      queryClient.invalidateQueries({ queryKey: ['customers', parseInt(id)] });

      toast.success("Contact added successfully");
      setContactForm({});
      setContactModalOpen(false);
    } catch (error) {
      console.error("Error saving contact:", error);
      toast.error(error instanceof Error ? error.message : "Failed to add contact");
    }
  };

  const handleDeleteContact = async (contactId: number) => {
    if (!id) {
      setContacts(contacts.filter(c => c.id !== contactId));
      return;
    }

    try {
      const response = await customerApi.deleteContact(contactId);
      if (response.error) throw new Error(response.error);

      // Optimistic local update; server truth will sync via invalidation.
      setContacts(contacts.filter(c => c.id !== contactId));
      queryClient.invalidateQueries({ queryKey: ['customers', parseInt(id)] });
      toast.success("Contact deleted successfully");
    } catch (error) {
      console.error("Error deleting contact:", error);
      toast.error("Failed to delete contact");
    }
  };

  const handleSaveAccountDetails = async () => {
    if (!id) return;

    setSaving(true);
    try {
      const selectedCurrency = currencyTypes.find(c => c.code === accountDetails.currency);
      const data = {
        acName: accountDetails.acName || undefined,
        bankAcNo: accountDetails.bankAcNo || undefined,
        currencyId: selectedCurrency?.id || undefined,
        type: accountDetails.type || undefined,
        notes: accountDetails.notes || undefined,
        swiftCode: accountDetails.swiftCode || undefined,
        acType: accountDetails.acType || undefined,
        approvedCreditDays: accountDetails.approvedCreditDays ? parseInt(accountDetails.approvedCreditDays) : undefined,
        alertCreditDays: accountDetails.alertCreditDays ? parseInt(accountDetails.alertCreditDays) : undefined,
        approvedCreditAmount: accountDetails.approvedCreditAmount ? parseFloat(accountDetails.approvedCreditAmount) : undefined,
        alertCreditAmount: accountDetails.alertCreditAmount ? parseFloat(accountDetails.alertCreditAmount) : undefined,
        cc: accountDetails.cc || undefined,
        bcc: accountDetails.bcc || undefined,
      };

      const response = await customerApi.updateAccountDetail(parseInt(id), data);
      if (response.error) throw new Error(response.error);

      queryClient.invalidateQueries({ queryKey: ['customers', parseInt(id)] });
      toast.success("Account details saved successfully");
    } catch (error) {
      console.error("Error saving account details:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save account details");
    } finally {
      setSaving(false);
    }
  };

  const lockPendingEditableFields = isViewMode || (isEditMode && !isPendingCustomer);

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
          <SearchableSelect
            options={[
              { value: "Debtors", label: "Debtors" },
              { value: "Creditors", label: "Creditors" },
              { value: "Neutral", label: "Neutral" },
            ]}
            value={profileData.masterType}
            onValueChange={v => setProfileData({...profileData, masterType: v as "Debtors" | "Creditors" | "Neutral"})}
            disabled={lockPendingEditableFields}
            triggerClassName={lockPendingEditableFields ? "bg-muted/50" : undefined}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm">Category</Label>
          <SearchableMultiSelect
            options={categoryTypes.map(cat => ({ value: cat.id.toString(), label: cat.name }))}
            values={profileData.categoryIds}
            onValuesChange={values => setProfileData({...profileData, categoryIds: values})}
            disabled={isViewMode}
            triggerClassName="bg-muted/50"
            placeholder="Select categories..."
            searchPlaceholder="Search categories..."
          />
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
          <SearchableSelect
            options={countries.map(c => ({ value: c.name, label: c.name }))}
            value={profileData.country}
            onValueChange={v => setProfileData({...profileData, country: v})}
            disabled={isViewMode}
            searchPlaceholder="Search countries..."
          />
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

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
          <SearchableSelect
            options={[
              { value: "Active", label: "Active" },
              { value: "Inactive", label: "Inactive" },
            ]}
            value={profileData.status}
            onValueChange={v => setProfileData({...profileData, status: v})}
            disabled={isViewMode}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm">Carrier Code</Label>
          <Input value={profileData.carrierCode} onChange={e => setProfileData({...profileData, carrierCode: e.target.value})} disabled={isViewMode} />
        </div>
        <div className="space-y-2">
          <Label className="text-sm">Salesperson</Label>
          <SearchableSelect
            options={employees.map(emp => ({ value: emp.fullName, label: `${emp.fullName} (${emp.employeeCode})` }))}
            value={profileData.salesperson}
            onValueChange={v => setProfileData({...profileData, salesperson: v})}
            disabled={isViewMode}
            searchPlaceholder="Search employees..."
            placeholder="Select employee..."
          />
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
            <SearchableSelect
              options={[
                { value: "10", label: "10" },
                { value: "25", label: "25" },
              ]}
              value="10"
              onValueChange={() => {}}
              triggerClassName="w-[90px] h-8"
            />
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
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDeleteContact(contact.id)}><Trash2 size={16} /></Button>
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
          <SearchableSelect
            options={currencyTypes.map(c => ({ value: c.code, label: c.code }))}
            value={accountDetails.currency}
            onValueChange={v => setAccountDetails({...accountDetails, currency: v})}
            disabled={lockPendingEditableFields}
            searchPlaceholder="Search currencies..."
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm">Type</Label>
          <SearchableSelect
            options={[
              { value: "Credit", label: "Credit" },
              { value: "Debit", label: "Debit" },
            ]}
            value={accountDetails.type}
            onValueChange={v => setAccountDetails({...accountDetails, type: v})}
            disabled={isViewMode}
          />
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

      {!isViewMode && isEditMode && (
        <div className="flex justify-end pt-4">
          <Button className="btn-success" onClick={handleSaveAccountDetails} disabled={saving}>
            {saving ? "Saving..." : "Save Account Details"}
          </Button>
        </div>
      )}
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
            <SearchableSelect
              options={[
                { value: "10", label: "10" },
                { value: "25", label: "25" },
                { value: "50", label: "50" },
                { value: "100", label: "100" },
              ]}
              value={receiptsPageSize.toString()}
              onValueChange={(v) => { setReceiptsPageSize(parseInt(v)); setReceiptsPageNumber(1); }}
              triggerClassName="w-[90px] h-8"
            />
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
                    <td className="px-4 py-3 text-sm">{r.type}</td>
                    <td className="px-4 py-3 text-sm">{r.currencyCode} {r.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
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
            <SearchableSelect
              options={[
                { value: "10", label: "10" },
                { value: "25", label: "25" },
                { value: "50", label: "50" },
                { value: "100", label: "100" },
              ]}
              value={invoicesPageSize.toString()}
              onValueChange={(v) => { setInvoicesPageSize(parseInt(v)); setInvoicesPageNumber(1); }}
              triggerClassName="w-[90px] h-8"
            />
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
                              <span key={r.receiptId} className="text-primary text-xs underline cursor-pointer" title={`${r.currencyCode} ${r.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} on ${formatDate(r.receiptDate)}`}>
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
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-primary">Statement of Account</h2>
          <DateRangePicker
            value={soaDateRange}
            onApply={setSoaDateRange}
            placeholder="Filter by date range"
            className="min-w-[240px]"
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Show:</span>
            <SearchableSelect
              options={[
                { value: "10", label: "10" },
                { value: "25", label: "25" },
                { value: "50", label: "50" },
                { value: "100", label: "100" },
              ]}
              value={arPageSize.toString()}
              onValueChange={(v) => { setArPageSize(parseInt(v)); setArPageNumber(1); }}
              triggerClassName="w-[90px] h-8"
            />
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
                      <td className="px-4 py-3 text-sm">{ar.currencyCode} {ar.debit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={balanceColorClass}>
                          {ar.currencyCode} {(ar.balance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
        <h2 className="text-xl font-semibold text-primary">Account Payable</h2>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Show:</span>
            <SearchableSelect
              options={[
                { value: "10", label: "10" },
                { value: "25", label: "25" },
                { value: "50", label: "50" },
                { value: "100", label: "100" },
              ]}
              value={apPageSize.toString()}
              onValueChange={(v) => { setApPageSize(parseInt(v)); setApPageNumber(1); }}
              triggerClassName="w-[90px] h-8"
            />
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
                      <td className="px-4 py-3 text-sm">{ap.currencyCode} {ap.credit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={balanceColorClass}>
                          {ap.currencyCode} {(ap.balance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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

  const renderCreditNotesTab = () => {
    const cnStartEntry = cnTotalCount > 0 ? (cnPageNumber - 1) * cnPageSize + 1 : 0;
    const cnEndEntry = Math.min(cnPageNumber * cnPageSize, cnTotalCount);

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-primary">Credit Notes</h2>
          {!isViewMode && (
            <Button className="btn-success gap-2" onClick={() => {
              setCnSelectedInvoices([]);
              setCreditNoteModalOpen(true);
            }}>
              <Plus size={16} /> Credit Notes
            </Button>
          )}
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Show:</span>
            <SearchableSelect
              options={[
                { value: "10", label: "10" },
                { value: "25", label: "25" },
                { value: "50", label: "50" },
              ]}
              value={cnPageSize.toString()}
              onValueChange={(v) => { setCnPageSize(parseInt(v)); setCnPageNumber(1); }}
              triggerClassName="w-[90px] h-8"
            />
            <span className="text-sm text-muted-foreground">entries</span>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-table-header text-table-header-foreground">
                <th className="px-4 py-3 text-left text-sm font-semibold">Credit Note #</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Job #</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Reference #</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Total</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Added By</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {cnLoading ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
              ) : creditNotes.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">No credit notes found</td></tr>
              ) : (
                creditNotes.map((cn, i) => (
                  <tr key={cn.id} className={`border-b border-border ${i % 2 === 0 ? "bg-card" : "bg-secondary/30"}`}>
                    <td className="px-4 py-3 text-sm text-primary font-medium">{cn.creditNoteNo}</td>
                    <td className="px-4 py-3 text-sm">{formatDate(cn.creditNoteDate)}</td>
                    <td className="px-4 py-3 text-sm">{cn.jobNumber || "-"}</td>
                    <td className="px-4 py-3 text-sm">{cn.referenceNo || "-"}</td>
                    <td className="px-4 py-3 text-sm">{cn.totalAmount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}</td>
                    <td className="px-4 py-3 text-sm">{cn.addedBy || "-"}</td>
                    <td className="px-4 py-3 text-sm">{cn.status || "-"}</td>
                    <td className="px-4 py-3">
                      <Button size="sm" className="btn-success" onClick={() => navigate(`/accounts/credit-notes/${cn.id}`)}>
                        View
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Showing {cnStartEntry} to {cnEndEntry} of {cnTotalCount} entries</p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" disabled={cnPageNumber === 1} onClick={() => setCnPageNumber(p => p - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={cnPageNumber === cnTotalPages || cnTotalPages === 0} onClick={() => setCnPageNumber(p => p + 1)}>Next</Button>
          </div>
        </div>
      </div>
    );
  };

  const handlePrintStatement = () => {
    if (!id) return;
    const fromDateStr = dateRange.from ? formatDateToISO(dateRange.from) : "";
    const toDateStr = dateRange.to ? formatDateToISO(dateRange.to) : "";
    window.open(`/master-customers/${id}/statement/print?fromDate=${fromDateStr}&toDate=${toDateStr}`, '_blank');
  };

  const renderStatementAccountTab = () => {
    const formatAmount = (amount: number) => amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-primary">Customer Ledger</h2>
          <div className="flex items-center gap-3">
            <DateRangePicker
              value={dateRange}
              onApply={(range) => {
                if (range?.from && range?.to) setDateRange(range);
              }}
              excludePresets={["all"]}
              className="min-w-[240px]"
            />
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
                      <td className="px-4 py-3 text-sm text-primary">{entry.invoiceNo || entry.creditNoteNo || "-"}</td>
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
          <span className="text-sm text-muted-foreground">Entries:</span>
          <SearchableSelect
            options={[
              { value: "10", label: "10" },
              { value: "25", label: "25" },
              { value: "50", label: "50" },
              { value: "100", label: "100" },
            ]}
            value={pvPageSize.toString()}
            onValueChange={(v) => { setPvPageSize(parseInt(v)); setPvPageNumber(1); }}
            triggerClassName="w-[90px]"
          />
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-table-header">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-table-header-foreground">Date</th>
              <th className="px-4 py-3 text-left font-medium text-table-header-foreground">Payment Voucher No.</th>
              <th className="px-4 py-3 text-left font-medium text-table-header-foreground">Type</th>
              <th className="px-4 py-3 text-left font-medium text-table-header-foreground">Purchases</th>
              <th className="px-4 py-3 text-right font-medium text-table-header-foreground">Amount</th>
              <th className="px-4 py-3 text-left font-medium text-table-header-foreground">Narration</th>
            </tr>
          </thead>
          <tbody>
            {pvLoading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
            ) : paymentVouchers.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No payment vouchers found</td></tr>
            ) : (
              paymentVouchers.map((pv, index) => (
                <tr key={pv.id} className={`border-b border-border hover:bg-table-row-hover transition-colors ${index % 2 === 0 ? "bg-card" : "bg-secondary/30"}`}>
                  <td className="px-4 py-3">{formatDate(pv.paymentDate)}</td>
                  <td className="px-4 py-3 font-medium">{pv.paymentNo}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                      {pv.paymentMode}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-muted-foreground">{pv.purchaseInvoiceCount} invoice(s)</span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {pv.currencyCode} {pv.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">{pv.narration || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pvTotalPages > 1 && (
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">
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
          <span className="text-sm text-muted-foreground">Entries:</span>
          <SearchableSelect
            options={[
              { value: "10", label: "10" },
              { value: "25", label: "25" },
              { value: "50", label: "50" },
              { value: "100", label: "100" },
            ]}
            value={piPageSize.toString()}
            onValueChange={(v) => { setPiPageSize(parseInt(v)); setPiPageNumber(1); }}
            triggerClassName="w-[90px]"
          />
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-table-header">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-table-header-foreground">Date</th>
              <th className="px-4 py-3 text-left font-medium text-table-header-foreground">Purchase No.</th>
              <th className="px-4 py-3 text-left font-medium text-table-header-foreground">Vendor Inv. No.</th>
              <th className="px-4 py-3 text-left font-medium text-table-header-foreground">Job No.</th>
              <th className="px-4 py-3 text-right font-medium text-table-header-foreground">Amount</th>
              <th className="px-4 py-3 text-left font-medium text-table-header-foreground">Payment Status</th>
            </tr>
          </thead>
          <tbody>
            {piLoading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
            ) : purchaseInvoices.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No purchase invoices found</td></tr>
            ) : (
              purchaseInvoices.map((pi, index) => (
                <tr key={pi.id} className={`border-b border-border hover:bg-table-row-hover transition-colors ${index % 2 === 0 ? "bg-card" : "bg-secondary/30"}`}>
                  <td className="px-4 py-3">{formatDate(pi.purchaseDate)}</td>
                  <td className="px-4 py-3 font-medium">{pi.purchaseNo}</td>
                  <td className="px-4 py-3">{pi.vendorInvoiceNo || '-'}</td>
                  <td className="px-4 py-3">{pi.jobNo || '-'}</td>
                  <td className="px-4 py-3 text-right font-medium">
                    {pi.currencyCode} {pi.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3">
                    {(() => {
                      const statusDisplay = getPaymentStatusDisplay(pi.paymentStatus);
                      return (
                        <span className={`px-2 py-1 rounded text-xs font-medium ${statusDisplay.className}`}>
                          {statusDisplay.label}
                        </span>
                      );
                    })()}
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
          <span className="text-sm text-muted-foreground">
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
        <DialogContent className="max-w-lg p-0 bg-card">
          <DialogHeader className="bg-modal-header text-white p-4 rounded-t-lg">
            <DialogTitle className="text-white">Add new contact</DialogTitle>
            <p className="text-xs text-white/80">{profileData.name}</p>
          </DialogHeader>
          <div className="p-6 grid grid-cols-2 gap-4">
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
            <div className="col-span-2 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setContactModalOpen(false)}>Cancel</Button>
              <Button className="btn-success" onClick={handleSaveContact}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Opening Balance Modal */}
      <Dialog open={openingBalanceModalOpen} onOpenChange={setOpeningBalanceModalOpen}>
        <DialogContent className="max-w-md p-0 bg-card">
          <DialogHeader className="bg-modal-header text-white p-4 rounded-t-lg">
            <DialogTitle className="text-white">Add Opening Balance</DialogTitle>
            <p className="text-xs text-white/80">{profileData.name}</p>
          </DialogHeader>
          <div className="p-6 space-y-4">
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
              <SearchableSelect
                options={currencyTypes.map(c => ({ value: c.code, label: c.code }))}
                value={openingBalanceForm.currency}
                onValueChange={v => setOpeningBalanceForm({...openingBalanceForm, currency: v})}
                searchPlaceholder="Search currencies..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpeningBalanceModalOpen(false)}>Cancel</Button>
              <Button className="btn-success" onClick={() => setOpeningBalanceModalOpen(false)}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Credit Note Modal */}
      <Dialog open={creditNoteModalOpen} onOpenChange={setCreditNoteModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 bg-card">
          <DialogHeader className="bg-modal-header text-white p-4 rounded-t-lg">
            <DialogTitle className="text-white text-xl">Add New Credit Note</DialogTitle>
          </DialogHeader>

          {/* Credit Note Section */}
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-primary">Credit Note</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Job Number</Label>
                <Input value={creditNoteForm.jobNumber} onChange={e => setCreditNoteForm({...creditNoteForm, jobNumber: e.target.value})} placeholder="Enter job number" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Customer Name</Label>
                <Input value={profileData.name} disabled className="bg-muted/50" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Email</Label>
                <Input value={creditNoteForm.email} onChange={e => setCreditNoteForm({...creditNoteForm, email: e.target.value})} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">*Credit Note Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {creditNoteForm.creditNoteDate ? format(creditNoteForm.creditNoteDate, "dd-MM-yyyy") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-popover z-50">
                    <Calendar mode="single" selected={creditNoteForm.creditNoteDate || undefined} onSelect={(d) => setCreditNoteForm({...creditNoteForm, creditNoteDate: d || null})} />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Reference #</Label>
                <Input value={creditNoteForm.referenceNo} onChange={e => setCreditNoteForm({...creditNoteForm, referenceNo: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Status</Label>
                <SearchableSelect
                  options={[
                    { value: "Active", label: "Active" },
                    { value: "Inactive", label: "Inactive" },
                  ]}
                  value={creditNoteForm.status}
                  onValueChange={v => setCreditNoteForm({...creditNoteForm, status: v})}
                  triggerClassName="bg-background"
                />
              </div>
            </div>
          </div>

          {/* Charges Details Section */}
          <div className="px-6 space-y-4">
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
                      <td className="px-3 py-2 text-sm">{currencyTypes.find(c => c.id === charge.currencyId)?.code || "-"}</td>
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
                      <SearchableSelect
                        options={chargeItemsList.map(ci => ({ value: ci.name, label: ci.name }))}
                        value={newCharge.chargeDetails || ""}
                        onValueChange={v => setNewCharge({...newCharge, chargeDetails: v})}
                        placeholder="Select"
                        triggerClassName="h-8 text-xs bg-background"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input className="h-8 text-xs" placeholder="Bases" value={newCharge.bases || ""} onChange={e => setNewCharge({...newCharge, bases: e.target.value})} />
                    </td>
                    <td className="px-3 py-2">
                      <SearchableSelect
                        options={currencyTypes.map(c => ({ value: c.id.toString(), label: c.code }))}
                        value={newCharge.currencyId?.toString() || ""}
                        onValueChange={v => setNewCharge({...newCharge, currencyId: parseInt(v)})}
                        placeholder="Select"
                        triggerClassName="h-8 text-xs bg-background"
                        searchPlaceholder="Search currencies..."
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input className="h-8 text-xs" placeholder="1" value={newCharge.rate || ""} onChange={e => setNewCharge({...newCharge, rate: e.target.value})} />
                    </td>
                    <td className="px-3 py-2">
                      <Input className="h-8 text-xs" placeholder="1" value={newCharge.roe || ""} onChange={e => setNewCharge({...newCharge, roe: e.target.value})} />
                    </td>
                    <td className="px-3 py-2">
                      <Input className="h-8 text-xs" placeholder="Quantity" value={newCharge.quantity || ""} onChange={e => setNewCharge({...newCharge, quantity: e.target.value})} />
                    </td>
                    <td className="px-3 py-2">
                      <Input className="h-8 text-xs" placeholder="Amount" value={newCharge.amount || ""} onChange={e => setNewCharge({...newCharge, amount: e.target.value})} />
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

          {/* Apply to Invoices */}
          <div className="px-6 space-y-4">
            <h3 className="text-lg font-semibold text-primary">Apply to Invoices</h3>

            {/* Selected invoices chips */}
            {cnSelectedInvoices.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {cnSelectedInvoices.map(inv => (
                  <span
                    key={inv.invoiceId}
                    className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-md text-xs"
                  >
                    {inv.invoiceNo}
                    <button
                      type="button"
                      onClick={() => setCnSelectedInvoices(cnSelectedInvoices.filter(si => si.invoiceId !== inv.invoiceId))}
                      className="text-primary/50 hover:text-primary"
                    >
                      <Trash2 size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Invoice picker */}
            <div className="max-w-md">
              <SearchableSelect
                options={cnUnpaidInvoices
                  .filter(ui => !cnSelectedInvoices.some(si => si.invoiceId === ui.id))
                  .map(ui => ({
                    value: ui.id.toString(),
                    label: `${ui.invoiceNo} - Pending: ${ui.currencyCode || ''} ${(ui.pendingAmount ?? 0).toFixed(2)}`,
                  }))}
                value=""
                onValueChange={(v) => {
                  const inv = cnUnpaidInvoices.find(ui => ui.id === parseInt(v));
                  if (inv) {
                    setCnSelectedInvoices([...cnSelectedInvoices, {
                      invoiceId: inv.id,
                      invoiceNo: inv.invoiceNo,
                      invoiceDate: inv.invoiceDate,
                      jobNo: inv.jobNo,
                      hblNo: inv.hblNo,
                      currencyId: inv.currencyId,
                      currencyCode: inv.currencyCode,
                      pendingAmount: inv.pendingAmount,
                      allocatedAmount: inv.pendingAmount,
                    }]);
                  }
                }}
                placeholder="Select invoice to apply..."
                searchPlaceholder="Search invoices..."
                emptyMessage="No unpaid invoices"
              />
            </div>

            {/* Selected invoices table */}
            {cnSelectedInvoices.length > 0 && (
              <>
                <div className="bg-card rounded-lg border border-border overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-table-header text-table-header-foreground">
                        <th className="px-3 py-2 text-left text-sm font-semibold">Invoice No</th>
                        <th className="px-3 py-2 text-left text-sm font-semibold">Date</th>
                        <th className="px-3 py-2 text-left text-sm font-semibold">Job No</th>
                        <th className="px-3 py-2 text-left text-sm font-semibold">Currency</th>
                        <th className="px-3 py-2 text-right text-sm font-semibold">Pending</th>
                        <th className="px-3 py-2 text-right text-sm font-semibold">Allocating</th>
                        <th className="px-3 py-2 text-sm font-semibold"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {cnSelectedInvoices.map((inv, i) => (
                        <tr key={inv.invoiceId} className={`border-b border-border ${i % 2 === 0 ? "bg-card" : "bg-secondary/30"}`}>
                          <td className="px-3 py-2 text-sm text-blue-600">{inv.invoiceNo}</td>
                          <td className="px-3 py-2 text-sm">{inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString() : '-'}</td>
                          <td className="px-3 py-2 text-sm">{inv.jobNo || '-'}</td>
                          <td className="px-3 py-2 text-sm">{inv.currencyCode || '-'}</td>
                          <td className="px-3 py-2 text-sm text-right">{(inv.pendingAmount ?? 0).toFixed(2)}</td>
                          <td className="px-3 py-2">
                            <Input
                              type="number"
                              className="h-8 text-xs text-right w-28 ml-auto"
                              value={inv.allocatedAmount}
                              min={0}
                              max={inv.pendingAmount}
                              onChange={e => {
                                const val = Math.max(0, Math.min(parseFloat(e.target.value) || 0, inv.pendingAmount));
                                setCnSelectedInvoices(cnSelectedInvoices.map(si =>
                                  si.invoiceId === inv.invoiceId ? { ...si, allocatedAmount: val } : si
                                ));
                              }}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setCnSelectedInvoices(cnSelectedInvoices.filter(si => si.invoiceId !== inv.invoiceId))}>
                              <Trash2 size={14} />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-end">
                  <div className="text-sm">
                    <span className="font-semibold">Total Allocated: </span>
                    <span className="font-bold">{cnSelectedInvoices.reduce((sum, inv) => sum + inv.allocatedAmount, 0).toFixed(2)}</span>
                    <span className="text-muted-foreground ml-2">
                      / Credit Note Total: {chargeDetails.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Additional Contents */}
          <div className="px-6 pb-6 space-y-4">
            <div className="space-y-2">
              <Label className="text-sm">Additional Contents</Label>
              <Textarea
                className="min-h-[100px]"
                value={additionalContents}
                onChange={e => setAdditionalContents(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCreditNoteModalOpen(false)}>Cancel</Button>
              <Button className="btn-success" onClick={handleSaveCreditNote} disabled={cnSaving}>
                {cnSaving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default CustomerDetail;
