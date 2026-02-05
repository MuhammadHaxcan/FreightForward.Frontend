import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit, Trash2, Plus, Loader2, Upload, History } from "lucide-react";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useCurrencyTypes,
  useCreateCurrencyType,
  useUpdateCurrencyType,
  useDeleteCurrencyType,
  usePorts,
  useCreatePort,
  useUpdatePort,
  useDeletePort,
  useChargeItems,
  useCreateChargeItem,
  useUpdateChargeItem,
  useDeleteChargeItem,
  useExpenseTypes,
  useCreateExpenseType,
  useUpdateExpenseType,
  useDeleteExpenseType,
} from "@/hooks/useSettings";
import {
  useBanks,
  useCreateBank,
  useUpdateBank,
  useDeleteBank,
} from "@/hooks/useBanks";
import {
  CurrencyType,
  Port,
  ChargeItem,
  ExpenseType,
  PaymentType,
  Company,
  Bank,
  companyApi,
  bankApi,
  fileApi,
} from "@/services/api";
import { toast } from "sonner";
import { CurrencyRateHistoryModal } from "@/components/settings/CurrencyRateHistoryModal";

const Settings = () => {
  // Pagination state
  const [currencyPage, setCurrencyPage] = useState(1);
  const [portPage, setPortPage] = useState(1);
  const [chargePage, setChargePage] = useState(1);
  const [expensePage, setExpensePage] = useState(1);
  const [bankPage, setBankPage] = useState(1);

  // Page size state
  const [currencyPageSize, setCurrencyPageSize] = useState("10");
  const [portPageSize, setPortPageSize] = useState("10");
  const [chargePageSize, setChargePageSize] = useState("10");
  const [expensePageSize, setExpensePageSize] = useState("10");
  const [bankPageSize, setBankPageSize] = useState("10");

  // Search state
  const [currencySearch, setCurrencySearch] = useState("");
  const [portSearch, setPortSearch] = useState("");
  const [chargeSearch, setChargeSearch] = useState("");
  const [expenseSearch, setExpenseSearch] = useState("");
  const [bankSearch, setBankSearch] = useState("");

  // Modal states
  const [addCurrencyModalOpen, setAddCurrencyModalOpen] = useState(false);
  const [addPortModalOpen, setAddPortModalOpen] = useState(false);
  const [addChargeModalOpen, setAddChargeModalOpen] = useState(false);
  const [addExpenseModalOpen, setAddExpenseModalOpen] = useState(false);
  const [addBankModalOpen, setAddBankModalOpen] = useState(false);

  const [editCurrencyModalOpen, setEditCurrencyModalOpen] = useState(false);
  const [editPortModalOpen, setEditPortModalOpen] = useState(false);
  const [editChargeModalOpen, setEditChargeModalOpen] = useState(false);
  const [editExpenseModalOpen, setEditExpenseModalOpen] = useState(false);
  const [editBankModalOpen, setEditBankModalOpen] = useState(false);

  // Edit form states
  const [editCurrency, setEditCurrency] = useState<CurrencyType | null>(null);
  const [editPort, setEditPort] = useState<Port | null>(null);

  // History modal state
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyModalCurrency, setHistoryModalCurrency] = useState<{ id: number; name: string; code: string } | null>(null);
  const [editCharge, setEditCharge] = useState<ChargeItem | null>(null);
  const [editExpense, setEditExpense] = useState<ExpenseType | null>(null);
  const [editBank, setEditBank] = useState<Bank | null>(null);

  // Company profile state
  const [companyId, setCompanyId] = useState<number | null>(null);
  const [companyLoading, setCompanyLoading] = useState(true);
  const [companySaving, setCompanySaving] = useState(false);
  const [allBanks, setAllBanks] = useState<Bank[]>([]);
  const [companyProfile, setCompanyProfile] = useState({
    name: "",
    companyType: "",
    legalTradingName: "",
    registrationNumber: "",
    contactNumber: "",
    email: "",
    website: "",
    vatId: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    stateProvince: "",
    zipCode: "",
    country: "",
    logoPath: "",
    sealPath: "",
    bankId: null as number | null,
  });

  // Form states
  const [currencyForm, setCurrencyForm] = useState({
    name: "",
    code: "",
    symbol: "",
    decimalName: "",
    usdRate: "",
    roe: "1.000",
  });

  const [portForm, setPortForm] = useState({
    name: "",
    country: "",
  });

  const [chargeForm, setChargeForm] = useState({
    name: "",
  });

  const [expenseForm, setExpenseForm] = useState({
    paymentDirection: "Outwards" as PaymentType,
    name: "",
  });

  const [bankForm, setBankForm] = useState({
    bankName: "",
    acHolder: "",
    acNumber: "",
    ibanNumber: "",
    swiftCode: "",
    branch: "",
  });

  // API queries
  const { data: currencyData, isLoading: currencyLoading } = useCurrencyTypes({
    pageNumber: currencyPage,
    pageSize: parseInt(currencyPageSize),
    searchTerm: currencySearch || undefined,
  });

  const { data: portData, isLoading: portLoading } = usePorts({
    pageNumber: portPage,
    pageSize: parseInt(portPageSize),
    searchTerm: portSearch || undefined,
  });

  const { data: chargeData, isLoading: chargeLoading } = useChargeItems({
    pageNumber: chargePage,
    pageSize: parseInt(chargePageSize),
    searchTerm: chargeSearch || undefined,
  });

  const { data: expenseData, isLoading: expenseLoading } = useExpenseTypes({
    pageNumber: expensePage,
    pageSize: parseInt(expensePageSize),
    searchTerm: expenseSearch || undefined,
  });

  const { data: bankData, isLoading: bankLoading } = useBanks({
    pageNumber: bankPage,
    pageSize: parseInt(bankPageSize),
    searchTerm: bankSearch || undefined,
  });

  // Mutations
  const createCurrencyMutation = useCreateCurrencyType();
  const updateCurrencyMutation = useUpdateCurrencyType();
  const deleteCurrencyMutation = useDeleteCurrencyType();

  const createPortMutation = useCreatePort();
  const updatePortMutation = useUpdatePort();
  const deletePortMutation = useDeletePort();

  const createChargeMutation = useCreateChargeItem();
  const updateChargeMutation = useUpdateChargeItem();
  const deleteChargeMutation = useDeleteChargeItem();

  const createExpenseMutation = useCreateExpenseType();
  const updateExpenseMutation = useUpdateExpenseType();
  const deleteExpenseMutation = useDeleteExpenseType();

  const createBankMutation = useCreateBank();
  const updateBankMutation = useUpdateBank();
  const deleteBankMutation = useDeleteBank();

  // Handlers
  const handleAddCurrency = () => {
    createCurrencyMutation.mutate(
      {
        name: currencyForm.name,
        code: currencyForm.code,
        symbol: currencyForm.symbol,
        decimalName: currencyForm.decimalName || undefined,
        usdRate: parseFloat(currencyForm.usdRate) || 1,
        roe: parseFloat(currencyForm.roe) || 1,
      },
      {
        onSuccess: () => {
          setAddCurrencyModalOpen(false);
          resetCurrencyForm();
        },
      }
    );
  };

  const handleUpdateCurrency = () => {
    if (!editCurrency) return;
    updateCurrencyMutation.mutate(
      {
        id: editCurrency.id,
        data: {
          id: editCurrency.id,
          name: editCurrency.name,
          code: editCurrency.code,
          symbol: editCurrency.symbol,
          decimalName: editCurrency.decimalName || undefined,
          usdRate: editCurrency.usdRate,
          roe: editCurrency.roe,
        },
      },
      {
        onSuccess: () => {
          setEditCurrencyModalOpen(false);
          setEditCurrency(null);
        },
      }
    );
  };

  const handleDeleteCurrency = (id: number) => {
    deleteCurrencyMutation.mutate(id);
  };

  const handleAddPort = () => {
    createPortMutation.mutate(
      {
        name: portForm.name,
        country: portForm.country,
      },
      {
        onSuccess: () => {
          setAddPortModalOpen(false);
          resetPortForm();
        },
      }
    );
  };

  const handleUpdatePort = () => {
    if (!editPort) return;
    updatePortMutation.mutate(
      {
        id: editPort.id,
        data: {
          id: editPort.id,
          name: editPort.name,
          country: editPort.country,
        },
      },
      {
        onSuccess: () => {
          setEditPortModalOpen(false);
          setEditPort(null);
        },
      }
    );
  };

  const handleDeletePort = (id: number) => {
    deletePortMutation.mutate(id);
  };

  const handleAddCharge = () => {
    createChargeMutation.mutate(
      {
        name: chargeForm.name,
      },
      {
        onSuccess: () => {
          setAddChargeModalOpen(false);
          resetChargeForm();
        },
      }
    );
  };

  const handleUpdateCharge = () => {
    if (!editCharge) return;
    updateChargeMutation.mutate(
      {
        id: editCharge.id,
        data: {
          id: editCharge.id,
          name: editCharge.name,
        },
      },
      {
        onSuccess: () => {
          setEditChargeModalOpen(false);
          setEditCharge(null);
        },
      }
    );
  };

  const handleDeleteCharge = (id: number) => {
    deleteChargeMutation.mutate(id);
  };

  const handleAddExpense = () => {
    createExpenseMutation.mutate(
      {
        paymentDirection: expenseForm.paymentDirection,
        name: expenseForm.name,
      },
      {
        onSuccess: () => {
          setAddExpenseModalOpen(false);
          resetExpenseForm();
        },
      }
    );
  };

  const handleUpdateExpense = () => {
    if (!editExpense) return;
    updateExpenseMutation.mutate(
      {
        id: editExpense.id,
        data: {
          id: editExpense.id,
          paymentDirection: editExpense.paymentDirection,
          name: editExpense.name,
        },
      },
      {
        onSuccess: () => {
          setEditExpenseModalOpen(false);
          setEditExpense(null);
        },
      }
    );
  };

  const handleDeleteExpense = (id: number) => {
    deleteExpenseMutation.mutate(id);
  };

  const handleAddBank = () => {
    createBankMutation.mutate(
      {
        bankName: bankForm.bankName,
        acHolder: bankForm.acHolder || undefined,
        acNumber: bankForm.acNumber || undefined,
        ibanNumber: bankForm.ibanNumber || undefined,
        swiftCode: bankForm.swiftCode || undefined,
        branch: bankForm.branch || undefined,
      },
      {
        onSuccess: () => {
          setAddBankModalOpen(false);
          resetBankForm();
        },
      }
    );
  };

  const handleUpdateBank = () => {
    if (!editBank) return;
    updateBankMutation.mutate(
      {
        id: editBank.id,
        data: {
          id: editBank.id,
          bankName: editBank.bankName,
          acHolder: editBank.acHolder || undefined,
          acNumber: editBank.acNumber || undefined,
          ibanNumber: editBank.ibanNumber || undefined,
          swiftCode: editBank.swiftCode || undefined,
          branch: editBank.branch || undefined,
        },
      },
      {
        onSuccess: () => {
          setEditBankModalOpen(false);
          setEditBank(null);
        },
      }
    );
  };

  const handleDeleteBank = (id: number) => {
    deleteBankMutation.mutate(id);
  };

  const resetCurrencyForm = () => {
    setCurrencyForm({
      name: "",
      code: "",
      symbol: "",
      decimalName: "",
      usdRate: "",
      roe: "1.000",
    });
  };

  const resetPortForm = () => {
    setPortForm({ name: "", country: "" });
  };

  const resetChargeForm = () => {
    setChargeForm({ name: "" });
  };

  const resetExpenseForm = () => {
    setExpenseForm({ paymentDirection: "Outwards", name: "" });
  };

  const resetBankForm = () => {
    setBankForm({ bankName: "", acHolder: "", acNumber: "", ibanNumber: "", swiftCode: "", branch: "" });
  };

  const countries = [
    "United Arab Emirates",
    "United States",
    "United Kingdom",
    "China",
    "India",
    "Turkey",
    "Ecuador",
    "Tanzania",
    "Papua New Guinea",
    "Gabon",
    "Saudi Arabia",
    "Qatar",
    "Pakistan",
    "Singapore",
    "Germany",
    "France",
    "Italy",
    "Japan",
    "South Korea",
    "Australia",
  ];

  // Load company profile and all banks on mount
  useEffect(() => {
    const loadCompanyData = async () => {
      setCompanyLoading(true);
      try {
        const [companyRes, bankRes] = await Promise.all([
          companyApi.getAll({ pageNumber: 1, pageSize: 1 }),
          bankApi.getAll({ pageNumber: 1, pageSize: 100 }),
        ]);
        if (bankRes.data) {
          setAllBanks(bankRes.data.items);
        }
        if (companyRes.data && companyRes.data.items.length > 0) {
          const c = companyRes.data.items[0];
          setCompanyId(c.id);
          setCompanyProfile({
            name: c.name || "",
            companyType: c.companyType || "",
            legalTradingName: c.legalTradingName || "",
            registrationNumber: c.registrationNumber || "",
            contactNumber: c.contactNumber || "",
            email: c.email || "",
            website: c.website || "",
            vatId: c.vatId || "",
            addressLine1: c.addressLine1 || "",
            addressLine2: c.addressLine2 || "",
            city: c.city || "",
            stateProvince: c.stateProvince || "",
            zipCode: c.zipCode || "",
            country: c.country || "",
            logoPath: c.logoPath || "",
            sealPath: c.sealPath || "",
            bankId: c.bankId ?? null,
          });
        }
      } catch (err) {
        console.error("Failed to load company data", err);
      } finally {
        setCompanyLoading(false);
      }
    };
    loadCompanyData();
  }, []);

  const handleFileUpload = async (file: File, field: "logoPath" | "sealPath") => {
    try {
      const result = await fileApi.upload(file);
      setCompanyProfile(prev => ({ ...prev, [field]: result.fileName }));
      toast.success(`${field === "logoPath" ? "Logo" : "Seal"} uploaded successfully`);
    } catch (err) {
      toast.error(`Failed to upload ${field === "logoPath" ? "logo" : "seal"}`);
    }
  };

  const handleSaveCompany = async () => {
    if (!companyProfile.name.trim()) {
      toast.error("Company name is required");
      return;
    }
    setCompanySaving(true);
    try {
      const payload = {
        name: companyProfile.name,
        companyType: companyProfile.companyType || undefined,
        legalTradingName: companyProfile.legalTradingName || undefined,
        registrationNumber: companyProfile.registrationNumber || undefined,
        contactNumber: companyProfile.contactNumber || undefined,
        email: companyProfile.email || undefined,
        website: companyProfile.website || undefined,
        vatId: companyProfile.vatId || undefined,
        addressLine1: companyProfile.addressLine1 || undefined,
        addressLine2: companyProfile.addressLine2 || undefined,
        city: companyProfile.city || undefined,
        stateProvince: companyProfile.stateProvince || undefined,
        zipCode: companyProfile.zipCode || undefined,
        country: companyProfile.country || undefined,
        logoPath: companyProfile.logoPath || undefined,
        sealPath: companyProfile.sealPath || undefined,
        bankId: companyProfile.bankId ?? undefined,
      };
      if (companyId) {
        const res = await companyApi.update(companyId, { ...payload, id: companyId });
        if (res.error) throw new Error(res.error);
        toast.success("Company updated successfully");
      } else {
        const res = await companyApi.create(payload);
        if (res.error) throw new Error(res.error);
        setCompanyId(res.data!);
        toast.success("Company created successfully");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save company");
    } finally {
      setCompanySaving(false);
    }
  };

  return (
    <MainLayout>
      <div className="p-6">
        <Tabs defaultValue="currency" className="w-full">
          <TabsList className="w-full justify-start mb-6 bg-card border border-border rounded-lg p-1 h-auto flex-wrap">
            <TabsTrigger
              value="currency"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6 py-2.5"
            >
              Currency Type
            </TabsTrigger>
            <TabsTrigger
              value="ports"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6 py-2.5"
            >
              Ports
            </TabsTrigger>
            <TabsTrigger
              value="charges"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6 py-2.5"
            >
              Charges Items
            </TabsTrigger>
            <TabsTrigger
              value="expenses"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6 py-2.5"
            >
              Expense Items
            </TabsTrigger>
            <TabsTrigger
              value="companies"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6 py-2.5"
            >
              Companies
            </TabsTrigger>
            <TabsTrigger
              value="banks"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6 py-2.5"
            >
              Banks
            </TabsTrigger>
          </TabsList>

          {/* Currency Tab */}
          <TabsContent value="currency">
            <div className="bg-card rounded-lg border border-border">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h2 className="text-lg font-semibold text-primary">List All Currencies</h2>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Show</span>
                    <SearchableSelect
                      options={[
                        { value: "10", label: "10" },
                        { value: "25", label: "25" },
                        { value: "50", label: "50" },
                        { value: "100", label: "100" },
                      ]}
                      value={currencyPageSize}
                      onValueChange={(value) => { setCurrencyPageSize(value); setCurrencyPage(1); }}
                      triggerClassName="w-[90px] h-8"
                    />
                    <span className="text-sm text-muted-foreground">entries</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Search:</span>
                    <Input
                      placeholder=""
                      value={currencySearch}
                      onChange={(e) => setCurrencySearch(e.target.value)}
                      className="h-9 w-48"
                    />
                  </div>
                  <PermissionGate permission="currency_add">
                    <Button className="btn-success gap-2" onClick={() => setAddCurrencyModalOpen(true)}>
                      <Plus size={16} />
                      Add New
                    </Button>
                  </PermissionGate>
                </div>
              </div>
              <div className="overflow-x-auto">
                {currencyLoading ? (
                  <div className="flex justify-center items-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="bg-table-header text-table-header-foreground">
                        <th className="px-4 py-3 text-left text-sm font-semibold">Action</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Code</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Symbol</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Decimal</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">1 USD</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currencyData?.items.map((currency, index) => (
                        <tr
                          key={currency.id}
                          className={`border-b border-border hover:bg-table-row-hover transition-colors ${
                            index % 2 === 0 ? "bg-card" : "bg-secondary/30"
                          }`}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <PermissionGate permission="currency_edit">
                                <button
                                  onClick={() => {
                                    setEditCurrency({ ...currency });
                                    setEditCurrencyModalOpen(true);
                                  }}
                                  className="p-1.5 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                                  title="Edit"
                                >
                                  <Edit size={14} />
                                </button>
                              </PermissionGate>
                              <PermissionGate permission="currency_view">
                                <button
                                  onClick={() => {
                                    setHistoryModalCurrency({ id: currency.id, name: currency.name, code: currency.code });
                                    setHistoryModalOpen(true);
                                  }}
                                  className="p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                  title="Rate History"
                                >
                                  <History size={14} />
                                </button>
                              </PermissionGate>
                              <PermissionGate permission="currency_delete">
                                <button
                                  onClick={() => handleDeleteCurrency(currency.id)}
                                  className="p-1.5 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </PermissionGate>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-primary font-medium">{currency.name}</td>
                          <td className="px-4 py-3 text-sm text-foreground">{currency.code}</td>
                          <td className="px-4 py-3 text-sm text-primary">{currency.symbol}</td>
                          <td className="px-4 py-3 text-sm text-foreground">{currency.decimalName}</td>
                          <td className="px-4 py-3 text-sm text-foreground">{currency.usdRate}</td>
                        </tr>
                      ))}
                      {currencyData?.items.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                            No currencies found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
              {currencyData && (
                <div className="flex items-center justify-between p-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {((currencyPage - 1) * parseInt(currencyPageSize)) + 1} to {Math.min(currencyPage * parseInt(currencyPageSize), currencyData.totalCount)} of {currencyData.totalCount} entries
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-3"
                      disabled={!currencyData.hasPreviousPage}
                      onClick={() => setCurrencyPage(p => p - 1)}
                    >
                      Previous
                    </Button>
                    <Button size="sm" className="h-8 w-8 bg-primary text-primary-foreground">{currencyPage}</Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-3"
                      disabled={!currencyData.hasNextPage}
                      onClick={() => setCurrencyPage(p => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Ports Tab */}
          <TabsContent value="ports">
            <div className="bg-card rounded-lg border border-border">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h2 className="text-lg font-semibold text-primary">List All Ports</h2>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Show</span>
                    <SearchableSelect
                      options={[
                        { value: "10", label: "10" },
                        { value: "25", label: "25" },
                        { value: "50", label: "50" },
                        { value: "100", label: "100" },
                      ]}
                      value={portPageSize}
                      onValueChange={(value) => { setPortPageSize(value); setPortPage(1); }}
                      triggerClassName="w-[90px] h-8"
                    />
                    <span className="text-sm text-muted-foreground">entries</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Search:</span>
                    <Input
                      placeholder=""
                      value={portSearch}
                      onChange={(e) => setPortSearch(e.target.value)}
                      className="h-9 w-48"
                    />
                  </div>
                  <PermissionGate permission="port_add">
                    <Button className="btn-success gap-2" onClick={() => setAddPortModalOpen(true)}>
                      <Plus size={16} />
                      Add New
                    </Button>
                  </PermissionGate>
                </div>
              </div>
              <div className="overflow-x-auto">
                {portLoading ? (
                  <div className="flex justify-center items-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="bg-table-header text-table-header-foreground">
                        <th className="px-4 py-3 text-left text-sm font-semibold">Action</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Country</th>
                      </tr>
                    </thead>
                    <tbody>
                      {portData?.items.map((port, index) => (
                        <tr
                          key={port.id}
                          className={`border-b border-border hover:bg-table-row-hover transition-colors ${
                            index % 2 === 0 ? "bg-card" : "bg-secondary/30"
                          }`}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <PermissionGate permission="port_edit">
                                <button
                                  onClick={() => {
                                    setEditPort({ ...port });
                                    setEditPortModalOpen(true);
                                  }}
                                  className="p-1.5 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                                >
                                  <Edit size={14} />
                                </button>
                              </PermissionGate>
                              <PermissionGate permission="port_delete">
                                <button
                                  onClick={() => handleDeletePort(port.id)}
                                  className="p-1.5 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 transition-colors"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </PermissionGate>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-primary font-medium">{port.name}</td>
                          <td className="px-4 py-3 text-sm text-primary">{port.country}</td>
                        </tr>
                      ))}
                      {portData?.items.length === 0 && (
                        <tr>
                          <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                            No ports found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
              {portData && (
                <div className="flex items-center justify-between p-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {((portPage - 1) * parseInt(portPageSize)) + 1} to {Math.min(portPage * parseInt(portPageSize), portData.totalCount)} of {portData.totalCount} entries
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-3"
                      disabled={!portData.hasPreviousPage}
                      onClick={() => setPortPage(p => p - 1)}
                    >
                      Previous
                    </Button>
                    <Button size="sm" className="h-8 w-8 bg-primary text-primary-foreground">{portPage}</Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-3"
                      disabled={!portData.hasNextPage}
                      onClick={() => setPortPage(p => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Charges Tab */}
          <TabsContent value="charges">
            <div className="bg-card rounded-lg border border-border">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h2 className="text-lg font-semibold text-primary">List All Charges</h2>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Show</span>
                    <SearchableSelect
                      options={[
                        { value: "10", label: "10" },
                        { value: "25", label: "25" },
                        { value: "50", label: "50" },
                        { value: "100", label: "100" },
                      ]}
                      value={chargePageSize}
                      onValueChange={(value) => { setChargePageSize(value); setChargePage(1); }}
                      triggerClassName="w-[90px] h-8"
                    />
                    <span className="text-sm text-muted-foreground">entries</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Search:</span>
                    <Input
                      placeholder=""
                      value={chargeSearch}
                      onChange={(e) => setChargeSearch(e.target.value)}
                      className="h-9 w-48"
                    />
                  </div>
                  <PermissionGate permission="chargeitem_add">
                    <Button className="btn-success gap-2" onClick={() => setAddChargeModalOpen(true)}>
                      <Plus size={16} />
                      Add New
                    </Button>
                  </PermissionGate>
                </div>
              </div>
              <div className="overflow-x-auto">
                {chargeLoading ? (
                  <div className="flex justify-center items-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="bg-table-header text-table-header-foreground">
                        <th className="px-4 py-3 text-left text-sm font-semibold">Action</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chargeData?.items.map((charge, index) => (
                        <tr
                          key={charge.id}
                          className={`border-b border-border hover:bg-table-row-hover transition-colors ${
                            index % 2 === 0 ? "bg-card" : "bg-secondary/30"
                          }`}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <PermissionGate permission="chargeitem_edit">
                                <button
                                  onClick={() => {
                                    setEditCharge({ ...charge });
                                    setEditChargeModalOpen(true);
                                  }}
                                  className="p-1.5 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                                >
                                  <Edit size={14} />
                                </button>
                              </PermissionGate>
                              <PermissionGate permission="chargeitem_delete">
                                <button
                                  onClick={() => handleDeleteCharge(charge.id)}
                                  className="p-1.5 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 transition-colors"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </PermissionGate>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-primary font-medium">{charge.name}</td>
                        </tr>
                      ))}
                      {chargeData?.items.length === 0 && (
                        <tr>
                          <td colSpan={2} className="px-4 py-8 text-center text-muted-foreground">
                            No charge items found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
              {chargeData && (
                <div className="flex items-center justify-between p-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {((chargePage - 1) * parseInt(chargePageSize)) + 1} to {Math.min(chargePage * parseInt(chargePageSize), chargeData.totalCount)} of {chargeData.totalCount} entries
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-3"
                      disabled={!chargeData.hasPreviousPage}
                      onClick={() => setChargePage(p => p - 1)}
                    >
                      Previous
                    </Button>
                    <Button size="sm" className="h-8 w-8 bg-primary text-primary-foreground">{chargePage}</Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-3"
                      disabled={!chargeData.hasNextPage}
                      onClick={() => setChargePage(p => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Expenses Tab */}
          <TabsContent value="expenses">
            <div className="bg-card rounded-lg border border-border">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h2 className="text-lg font-semibold text-primary">List All Expenses</h2>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Show</span>
                    <SearchableSelect
                      options={[
                        { value: "10", label: "10" },
                        { value: "25", label: "25" },
                        { value: "50", label: "50" },
                        { value: "100", label: "100" },
                      ]}
                      value={expensePageSize}
                      onValueChange={(value) => { setExpensePageSize(value); setExpensePage(1); }}
                      triggerClassName="w-[90px] h-8"
                    />
                    <span className="text-sm text-muted-foreground">entries</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Search:</span>
                    <Input
                      placeholder=""
                      value={expenseSearch}
                      onChange={(e) => setExpenseSearch(e.target.value)}
                      className="h-9 w-48"
                    />
                  </div>
                  <PermissionGate permission="expensetype_add">
                    <Button className="btn-success gap-2" onClick={() => setAddExpenseModalOpen(true)}>
                      <Plus size={16} />
                      Add New
                    </Button>
                  </PermissionGate>
                </div>
              </div>
              <div className="overflow-x-auto">
                {expenseLoading ? (
                  <div className="flex justify-center items-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="bg-table-header text-table-header-foreground">
                        <th className="px-4 py-3 text-left text-sm font-semibold">Action</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Category</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Payment Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenseData?.items.map((expense, index) => (
                        <tr
                          key={expense.id}
                          className={`border-b border-border hover:bg-table-row-hover transition-colors ${
                            index % 2 === 0 ? "bg-card" : "bg-secondary/30"
                          }`}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <PermissionGate permission="expensetype_edit">
                                <button
                                  onClick={() => {
                                    setEditExpense({ ...expense });
                                    setEditExpenseModalOpen(true);
                                  }}
                                  className="p-1.5 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                                >
                                  <Edit size={14} />
                                </button>
                              </PermissionGate>
                              <PermissionGate permission="expensetype_delete">
                                <button
                                  onClick={() => handleDeleteExpense(expense.id)}
                                  className="p-1.5 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 transition-colors"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </PermissionGate>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-foreground">{expense.paymentDirectionName}</td>
                          <td className="px-4 py-3 text-sm text-primary font-medium">{expense.name}</td>
                        </tr>
                      ))}
                      {expenseData?.items.length === 0 && (
                        <tr>
                          <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                            No expense types found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
              {expenseData && (
                <div className="flex items-center justify-between p-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {((expensePage - 1) * parseInt(expensePageSize)) + 1} to {Math.min(expensePage * parseInt(expensePageSize), expenseData.totalCount)} of {expenseData.totalCount} entries
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-3"
                      disabled={!expenseData.hasPreviousPage}
                      onClick={() => setExpensePage(p => p - 1)}
                    >
                      Previous
                    </Button>
                    <Button size="sm" className="h-8 w-8 bg-primary text-primary-foreground">{expensePage}</Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-3"
                      disabled={!expenseData.hasNextPage}
                      onClick={() => setExpensePage(p => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Companies Tab */}
          <TabsContent value="companies">
            <div className="bg-card rounded-lg border border-border">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h2 className="text-lg font-semibold text-primary">Company Profile</h2>
              </div>
              {companyLoading ? (
                <div className="flex justify-center items-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Left Column */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Company Name *</label>
                        <Input
                          placeholder="Enter Company Name"
                          value={companyProfile.name}
                          onChange={(e) => setCompanyProfile({ ...companyProfile, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Company Type</label>
                        <Input
                          placeholder="Enter Company Type"
                          value={companyProfile.companyType}
                          onChange={(e) => setCompanyProfile({ ...companyProfile, companyType: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Registration Number</label>
                        <Input
                          placeholder="Enter Registration Number"
                          value={companyProfile.registrationNumber}
                          onChange={(e) => setCompanyProfile({ ...companyProfile, registrationNumber: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Email</label>
                        <Input
                          placeholder="Enter Email"
                          type="email"
                          value={companyProfile.email}
                          onChange={(e) => setCompanyProfile({ ...companyProfile, email: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Company Logo</label>
                        <div className="flex items-center gap-2">
                          <Input
                            value={companyProfile.logoPath}
                            readOnly
                            placeholder="No file selected"
                            className="flex-1"
                          />
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileUpload(file, "logoPath");
                              }}
                            />
                            <div className="flex items-center gap-1 px-3 py-2 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90">
                              <Upload size={14} />
                              Upload
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Middle Column */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Legal/Trading Name</label>
                        <Input
                          placeholder="Enter Legal/Trading Name"
                          value={companyProfile.legalTradingName}
                          onChange={(e) => setCompanyProfile({ ...companyProfile, legalTradingName: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Contact Number</label>
                        <Input
                          placeholder="Enter Contact Number"
                          value={companyProfile.contactNumber}
                          onChange={(e) => setCompanyProfile({ ...companyProfile, contactNumber: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Website</label>
                        <Input
                          placeholder="Enter Website"
                          value={companyProfile.website}
                          onChange={(e) => setCompanyProfile({ ...companyProfile, website: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Company Seal</label>
                        <div className="flex items-center gap-2">
                          <Input
                            value={companyProfile.sealPath}
                            readOnly
                            placeholder="No file selected"
                            className="flex-1"
                          />
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileUpload(file, "sealPath");
                              }}
                            />
                            <div className="flex items-center gap-1 px-3 py-2 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90">
                              <Upload size={14} />
                              Upload
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">VAT ID / TRN</label>
                        <Input
                          placeholder="Enter VAT ID / TRN"
                          value={companyProfile.vatId}
                          onChange={(e) => setCompanyProfile({ ...companyProfile, vatId: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Address Line 1</label>
                        <Input
                          placeholder="Enter Address Line 1"
                          value={companyProfile.addressLine1}
                          onChange={(e) => setCompanyProfile({ ...companyProfile, addressLine1: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Address Line 2</label>
                        <Input
                          placeholder="Enter Address Line 2"
                          value={companyProfile.addressLine2}
                          onChange={(e) => setCompanyProfile({ ...companyProfile, addressLine2: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">City</label>
                        <Input
                          placeholder="Enter City"
                          value={companyProfile.city}
                          onChange={(e) => setCompanyProfile({ ...companyProfile, city: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">State / Province</label>
                        <Input
                          placeholder="Enter State / Province"
                          value={companyProfile.stateProvince}
                          onChange={(e) => setCompanyProfile({ ...companyProfile, stateProvince: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Zip Code</label>
                        <Input
                          placeholder="Enter Zip Code"
                          value={companyProfile.zipCode}
                          onChange={(e) => setCompanyProfile({ ...companyProfile, zipCode: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Country</label>
                        <SearchableSelect
                          options={countries.map((c) => ({ value: c, label: c }))}
                          value={companyProfile.country}
                          onValueChange={(val) => setCompanyProfile({ ...companyProfile, country: val })}
                          placeholder="Select Country"
                          searchPlaceholder="Search countries..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Bank</label>
                        <SearchableSelect
                          options={allBanks.map((b) => ({ value: b.id.toString(), label: b.bankName }))}
                          value={companyProfile.bankId?.toString() ?? ""}
                          onValueChange={(val) => setCompanyProfile({ ...companyProfile, bankId: val ? parseInt(val) : null })}
                          placeholder="Select Bank"
                          searchPlaceholder="Search banks..."
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-6">
                    <Button
                      className="btn-success"
                      onClick={handleSaveCompany}
                      disabled={companySaving}
                    >
                      {companySaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {companyId ? "Update" : "Save"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Banks Tab */}
          <TabsContent value="banks">
            <div className="bg-card rounded-lg border border-border">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h2 className="text-lg font-semibold text-primary">List All Banks</h2>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Show</span>
                    <SearchableSelect
                      options={[
                        { value: "10", label: "10" },
                        { value: "25", label: "25" },
                        { value: "50", label: "50" },
                        { value: "100", label: "100" },
                      ]}
                      value={bankPageSize}
                      onValueChange={(value) => { setBankPageSize(value); setBankPage(1); }}
                      triggerClassName="w-[90px] h-8"
                    />
                    <span className="text-sm text-muted-foreground">entries</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Search:</span>
                    <Input
                      placeholder=""
                      value={bankSearch}
                      onChange={(e) => setBankSearch(e.target.value)}
                      className="h-9 w-48"
                    />
                  </div>
                  <PermissionGate permission="banks_add">
                    <Button className="btn-success gap-2" onClick={() => setAddBankModalOpen(true)}>
                      <Plus size={16} />
                      Add New
                    </Button>
                  </PermissionGate>
                </div>
              </div>
              <div className="overflow-x-auto">
                {bankLoading ? (
                  <div className="flex justify-center items-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="bg-table-header text-table-header-foreground">
                        <th className="px-4 py-3 text-left text-sm font-semibold">Action</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Bank Name</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">A/C Holder</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">A/C Number</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">IBAN</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Swift Code</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Branch</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bankData?.items.map((bank, index) => (
                        <tr
                          key={bank.id}
                          className={`border-b border-border hover:bg-table-row-hover transition-colors ${
                            index % 2 === 0 ? "bg-card" : "bg-secondary/30"
                          }`}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <PermissionGate permission="banks_edit">
                                <button
                                  onClick={() => {
                                    setEditBank({ ...bank });
                                    setEditBankModalOpen(true);
                                  }}
                                  className="p-1.5 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                                >
                                  <Edit size={14} />
                                </button>
                              </PermissionGate>
                              <PermissionGate permission="banks_delete">
                                <button
                                  onClick={() => handleDeleteBank(bank.id)}
                                  className="p-1.5 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 transition-colors"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </PermissionGate>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-primary font-medium">{bank.bankName}</td>
                          <td className="px-4 py-3 text-sm text-foreground">{bank.acHolder || "-"}</td>
                          <td className="px-4 py-3 text-sm text-foreground">{bank.acNumber || "-"}</td>
                          <td className="px-4 py-3 text-sm text-foreground">{bank.ibanNumber || "-"}</td>
                          <td className="px-4 py-3 text-sm text-foreground">{bank.swiftCode || "-"}</td>
                          <td className="px-4 py-3 text-sm text-foreground">{bank.branch || "-"}</td>
                        </tr>
                      ))}
                      {bankData?.items.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                            No banks found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
              {bankData && (
                <div className="flex items-center justify-between p-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {((bankPage - 1) * parseInt(bankPageSize)) + 1} to {Math.min(bankPage * parseInt(bankPageSize), bankData.totalCount)} of {bankData.totalCount} entries
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-3"
                      disabled={!bankData.hasPreviousPage}
                      onClick={() => setBankPage(p => p - 1)}
                    >
                      Previous
                    </Button>
                    <Button size="sm" className="h-8 w-8 bg-primary text-primary-foreground">{bankPage}</Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-3"
                      disabled={!bankData.hasNextPage}
                      onClick={() => setBankPage(p => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Currency Modal */}
      <Dialog open={addCurrencyModalOpen} onOpenChange={(open) => { setAddCurrencyModalOpen(open); if (!open) resetCurrencyForm(); }}>
        <DialogContent className="sm:max-w-md bg-card">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold"><span className="font-bold">Add New</span> Currency Type</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Currency Name</label>
              <Input
                placeholder="Enter Currency Name"
                value={currencyForm.name}
                onChange={(e) => setCurrencyForm({ ...currencyForm, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Currency Code</label>
              <Input
                placeholder="Enter Currency Code"
                value={currencyForm.code}
                onChange={(e) => setCurrencyForm({ ...currencyForm, code: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Currency Symbol</label>
              <Input
                placeholder="Enter Currency Symbol"
                value={currencyForm.symbol}
                onChange={(e) => setCurrencyForm({ ...currencyForm, symbol: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Decimal Point</label>
              <Input
                placeholder="Enter Decimal Point Value"
                value={currencyForm.decimalName}
                onChange={(e) => setCurrencyForm({ ...currencyForm, decimalName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">1 USD =</label>
              <Input
                placeholder="1 USD ="
                value={currencyForm.usdRate}
                onChange={(e) => setCurrencyForm({ ...currencyForm, usdRate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">ROE</label>
              <Input
                placeholder="ROE"
                value={currencyForm.roe}
                onChange={(e) => setCurrencyForm({ ...currencyForm, roe: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setAddCurrencyModalOpen(false)}>Cancel</Button>
              <Button
                className="btn-success"
                onClick={handleAddCurrency}
                disabled={createCurrencyMutation.isPending}
              >
                {createCurrencyMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Currency Modal */}
      <Dialog open={editCurrencyModalOpen} onOpenChange={setEditCurrencyModalOpen}>
        <DialogContent className="sm:max-w-md bg-card">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Edit Currency Type</DialogTitle>
          </DialogHeader>
          {editCurrency && (
            <div className="space-y-4 py-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Currency Name</label>
                <Input value={editCurrency.name} onChange={(e) => setEditCurrency({ ...editCurrency, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Currency Code</label>
                <Input value={editCurrency.code} onChange={(e) => setEditCurrency({ ...editCurrency, code: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Currency Symbol</label>
                <Input value={editCurrency.symbol} onChange={(e) => setEditCurrency({ ...editCurrency, symbol: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Decimal Point</label>
                <Input value={editCurrency.decimalName || ""} onChange={(e) => setEditCurrency({ ...editCurrency, decimalName: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">1 USD =</label>
                <Input value={editCurrency.usdRate} onChange={(e) => setEditCurrency({ ...editCurrency, usdRate: parseFloat(e.target.value) || 0 })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">ROE</label>
                <Input value={editCurrency.roe} onChange={(e) => setEditCurrency({ ...editCurrency, roe: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setEditCurrencyModalOpen(false)}>Cancel</Button>
                <Button
                  className="btn-success"
                  onClick={handleUpdateCurrency}
                  disabled={updateCurrencyMutation.isPending}
                >
                  {updateCurrencyMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Port Modal */}
      <Dialog open={addPortModalOpen} onOpenChange={(open) => { setAddPortModalOpen(open); if (!open) resetPortForm(); }}>
        <DialogContent className="sm:max-w-md bg-card">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold"><span className="font-bold">Add New</span> Port</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Port Name</label>
              <Input
                placeholder="Ports Name"
                value={portForm.name}
                onChange={(e) => setPortForm({ ...portForm, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Country</label>
              <SearchableSelect
                options={countries.map((country) => ({ value: country, label: country }))}
                value={portForm.country}
                onValueChange={(value) => setPortForm({ ...portForm, country: value })}
                placeholder="Select Country"
                searchPlaceholder="Search countries..."
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setAddPortModalOpen(false)}>Cancel</Button>
              <Button
                className="btn-success"
                onClick={handleAddPort}
                disabled={createPortMutation.isPending}
              >
                {createPortMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Port Modal */}
      <Dialog open={editPortModalOpen} onOpenChange={setEditPortModalOpen}>
        <DialogContent className="sm:max-w-md bg-card">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Edit Port</DialogTitle>
          </DialogHeader>
          {editPort && (
            <div className="space-y-4 py-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Port Name</label>
                <Input value={editPort.name} onChange={(e) => setEditPort({ ...editPort, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Country</label>
                <SearchableSelect
                  options={countries.map((country) => ({ value: country, label: country }))}
                  value={editPort.country}
                  onValueChange={(value) => setEditPort({ ...editPort, country: value })}
                  placeholder="Select Country"
                  searchPlaceholder="Search countries..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setEditPortModalOpen(false)}>Cancel</Button>
                <Button
                  className="btn-success"
                  onClick={handleUpdatePort}
                  disabled={updatePortMutation.isPending}
                >
                  {updatePortMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Charge Modal */}
      <Dialog open={addChargeModalOpen} onOpenChange={(open) => { setAddChargeModalOpen(open); if (!open) resetChargeForm(); }}>
        <DialogContent className="sm:max-w-md bg-card">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold"><span className="font-bold">Add New</span> Charge</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Charge</label>
              <Input
                placeholder="Charge Item"
                value={chargeForm.name}
                onChange={(e) => setChargeForm({ ...chargeForm, name: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setAddChargeModalOpen(false)}>Cancel</Button>
              <Button
                className="btn-success"
                onClick={handleAddCharge}
                disabled={createChargeMutation.isPending}
              >
                {createChargeMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Charge Modal */}
      <Dialog open={editChargeModalOpen} onOpenChange={setEditChargeModalOpen}>
        <DialogContent className="sm:max-w-md bg-card">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Edit Charge Item</DialogTitle>
          </DialogHeader>
          {editCharge && (
            <div className="space-y-4 py-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Charge Name</label>
                <Input value={editCharge.name} onChange={(e) => setEditCharge({ ...editCharge, name: e.target.value })} />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setEditChargeModalOpen(false)}>Cancel</Button>
                <Button
                  className="btn-success"
                  onClick={handleUpdateCharge}
                  disabled={updateChargeMutation.isPending}
                >
                  {updateChargeMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Expense Modal */}
      <Dialog open={addExpenseModalOpen} onOpenChange={(open) => { setAddExpenseModalOpen(open); if (!open) resetExpenseForm(); }}>
        <DialogContent className="sm:max-w-md bg-card">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold"><span className="font-bold">Add New</span> Expense</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Category</label>
              <SearchableSelect
                options={[
                  { value: "Outwards", label: "Outwards" },
                  { value: "Inwards", label: "Inwards" },
                ]}
                value={expenseForm.paymentDirection}
                onValueChange={(value) => setExpenseForm({ ...expenseForm, paymentDirection: value as PaymentType })}
                placeholder="Select One"
                searchPlaceholder="Search..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Payment Type</label>
              <Input
                placeholder="Payment Type"
                value={expenseForm.name}
                onChange={(e) => setExpenseForm({ ...expenseForm, name: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setAddExpenseModalOpen(false)}>Cancel</Button>
              <Button
                className="btn-success"
                onClick={handleAddExpense}
                disabled={createExpenseMutation.isPending}
              >
                {createExpenseMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Expense Modal */}
      <Dialog open={editExpenseModalOpen} onOpenChange={setEditExpenseModalOpen}>
        <DialogContent className="sm:max-w-md bg-card">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Edit Expense Item</DialogTitle>
          </DialogHeader>
          {editExpense && (
            <div className="space-y-4 py-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Category</label>
                <SearchableSelect
                  options={[
                    { value: "Outwards", label: "Outwards" },
                    { value: "Inwards", label: "Inwards" },
                  ]}
                  value={editExpense.paymentDirection}
                  onValueChange={(value) => setEditExpense({ ...editExpense, paymentDirection: value as PaymentType })}
                  placeholder="Select Category"
                  searchPlaceholder="Search..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Payment Type</label>
                <Input value={editExpense.name} onChange={(e) => setEditExpense({ ...editExpense, name: e.target.value })} />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setEditExpenseModalOpen(false)}>Cancel</Button>
                <Button
                  className="btn-success"
                  onClick={handleUpdateExpense}
                  disabled={updateExpenseMutation.isPending}
                >
                  {updateExpenseMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Bank Modal */}
      <Dialog open={addBankModalOpen} onOpenChange={(open) => { setAddBankModalOpen(open); if (!open) resetBankForm(); }}>
        <DialogContent className="sm:max-w-md bg-card">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold"><span className="font-bold">Add New</span> Bank</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Bank Name *</label>
              <Input
                placeholder="Enter Bank Name"
                value={bankForm.bankName}
                onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Account Holder</label>
              <Input
                placeholder="Enter Account Holder Name"
                value={bankForm.acHolder}
                onChange={(e) => setBankForm({ ...bankForm, acHolder: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Account Number</label>
              <Input
                placeholder="Enter Account Number"
                value={bankForm.acNumber}
                onChange={(e) => setBankForm({ ...bankForm, acNumber: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">IBAN Number</label>
              <Input
                placeholder="Enter IBAN Number"
                value={bankForm.ibanNumber}
                onChange={(e) => setBankForm({ ...bankForm, ibanNumber: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Swift Code</label>
              <Input
                placeholder="Enter Swift Code"
                value={bankForm.swiftCode}
                onChange={(e) => setBankForm({ ...bankForm, swiftCode: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Branch</label>
              <Input
                placeholder="Enter Branch"
                value={bankForm.branch}
                onChange={(e) => setBankForm({ ...bankForm, branch: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setAddBankModalOpen(false)}>Cancel</Button>
              <Button
                className="btn-success"
                onClick={handleAddBank}
                disabled={createBankMutation.isPending}
              >
                {createBankMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Bank Modal */}
      <Dialog open={editBankModalOpen} onOpenChange={setEditBankModalOpen}>
        <DialogContent className="sm:max-w-md bg-card">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Edit Bank</DialogTitle>
          </DialogHeader>
          {editBank && (
            <div className="space-y-4 py-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Bank Name *</label>
                <Input value={editBank.bankName} onChange={(e) => setEditBank({ ...editBank, bankName: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Account Holder</label>
                <Input value={editBank.acHolder || ""} onChange={(e) => setEditBank({ ...editBank, acHolder: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Account Number</label>
                <Input value={editBank.acNumber || ""} onChange={(e) => setEditBank({ ...editBank, acNumber: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">IBAN Number</label>
                <Input value={editBank.ibanNumber || ""} onChange={(e) => setEditBank({ ...editBank, ibanNumber: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Swift Code</label>
                <Input value={editBank.swiftCode || ""} onChange={(e) => setEditBank({ ...editBank, swiftCode: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Branch</label>
                <Input value={editBank.branch || ""} onChange={(e) => setEditBank({ ...editBank, branch: e.target.value })} />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setEditBankModalOpen(false)}>Cancel</Button>
                <Button
                  className="btn-success"
                  onClick={handleUpdateBank}
                  disabled={updateBankMutation.isPending}
                >
                  {updateBankMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Currency Rate History Modal */}
      <CurrencyRateHistoryModal
        open={historyModalOpen}
        onOpenChange={setHistoryModalOpen}
        currencyId={historyModalCurrency?.id ?? null}
        currencyName={historyModalCurrency?.name ?? ""}
        currencyCode={historyModalCurrency?.code ?? ""}
      />
    </MainLayout>
  );
};

export default Settings;
