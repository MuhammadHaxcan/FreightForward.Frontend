import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit, Trash2, Plus, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  CurrencyType,
  Port,
  ChargeItem,
  ExpenseType,
  PaymentType,
} from "@/services/api";

const Settings = () => {
  // Pagination state
  const [currencyPage, setCurrencyPage] = useState(1);
  const [portPage, setPortPage] = useState(1);
  const [chargePage, setChargePage] = useState(1);
  const [expensePage, setExpensePage] = useState(1);

  // Search state
  const [currencySearch, setCurrencySearch] = useState("");
  const [portSearch, setPortSearch] = useState("");
  const [chargeSearch, setChargeSearch] = useState("");
  const [expenseSearch, setExpenseSearch] = useState("");

  // Modal states
  const [addCurrencyModalOpen, setAddCurrencyModalOpen] = useState(false);
  const [addPortModalOpen, setAddPortModalOpen] = useState(false);
  const [addChargeModalOpen, setAddChargeModalOpen] = useState(false);
  const [addExpenseModalOpen, setAddExpenseModalOpen] = useState(false);

  const [editCurrencyModalOpen, setEditCurrencyModalOpen] = useState(false);
  const [editPortModalOpen, setEditPortModalOpen] = useState(false);
  const [editChargeModalOpen, setEditChargeModalOpen] = useState(false);
  const [editExpenseModalOpen, setEditExpenseModalOpen] = useState(false);

  // Edit form states
  const [editCurrency, setEditCurrency] = useState<CurrencyType | null>(null);
  const [editPort, setEditPort] = useState<Port | null>(null);
  const [editCharge, setEditCharge] = useState<ChargeItem | null>(null);
  const [editExpense, setEditExpense] = useState<ExpenseType | null>(null);

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

  // API queries
  const { data: currencyData, isLoading: currencyLoading } = useCurrencyTypes({
    pageNumber: currencyPage,
    pageSize: 10,
    searchTerm: currencySearch || undefined,
  });

  const { data: portData, isLoading: portLoading } = usePorts({
    pageNumber: portPage,
    pageSize: 10,
    searchTerm: portSearch || undefined,
  });

  const { data: chargeData, isLoading: chargeLoading } = useChargeItems({
    pageNumber: chargePage,
    pageSize: 10,
    searchTerm: chargeSearch || undefined,
  });

  const { data: expenseData, isLoading: expenseLoading } = useExpenseTypes({
    pageNumber: expensePage,
    pageSize: 10,
    searchTerm: expenseSearch || undefined,
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
          </TabsList>

          {/* Currency Tab */}
          <TabsContent value="currency">
            <div className="bg-card rounded-lg border border-border">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h2 className="text-lg font-semibold text-primary">List All Currencies</h2>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Search:</span>
                    <Input
                      placeholder=""
                      value={currencySearch}
                      onChange={(e) => setCurrencySearch(e.target.value)}
                      className="h-9 w-48"
                    />
                  </div>
                  <Button className="btn-success gap-2" onClick={() => setAddCurrencyModalOpen(true)}>
                    <Plus size={16} />
                    Add New
                  </Button>
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
                              <button
                                onClick={() => {
                                  setEditCurrency({ ...currency });
                                  setEditCurrencyModalOpen(true);
                                }}
                                className="p-1.5 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteCurrency(currency.id)}
                                className="p-1.5 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
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
                    Showing {((currencyPage - 1) * 10) + 1} to {Math.min(currencyPage * 10, currencyData.totalCount)} of {currencyData.totalCount} entries
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
                    <span className="text-sm text-muted-foreground">Search:</span>
                    <Input
                      placeholder=""
                      value={portSearch}
                      onChange={(e) => setPortSearch(e.target.value)}
                      className="h-9 w-48"
                    />
                  </div>
                  <Button className="btn-success gap-2" onClick={() => setAddPortModalOpen(true)}>
                    <Plus size={16} />
                    Add New
                  </Button>
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
                              <button
                                onClick={() => {
                                  setEditPort({ ...port });
                                  setEditPortModalOpen(true);
                                }}
                                className="p-1.5 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                onClick={() => handleDeletePort(port.id)}
                                className="p-1.5 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
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
                    Showing {((portPage - 1) * 10) + 1} to {Math.min(portPage * 10, portData.totalCount)} of {portData.totalCount} entries
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
                    <span className="text-sm text-muted-foreground">Search:</span>
                    <Input
                      placeholder=""
                      value={chargeSearch}
                      onChange={(e) => setChargeSearch(e.target.value)}
                      className="h-9 w-48"
                    />
                  </div>
                  <Button className="btn-success gap-2" onClick={() => setAddChargeModalOpen(true)}>
                    <Plus size={16} />
                    Add New
                  </Button>
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
                              <button
                                onClick={() => {
                                  setEditCharge({ ...charge });
                                  setEditChargeModalOpen(true);
                                }}
                                className="p-1.5 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteCharge(charge.id)}
                                className="p-1.5 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
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
                    Showing {((chargePage - 1) * 10) + 1} to {Math.min(chargePage * 10, chargeData.totalCount)} of {chargeData.totalCount} entries
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
                    <span className="text-sm text-muted-foreground">Search:</span>
                    <Input
                      placeholder=""
                      value={expenseSearch}
                      onChange={(e) => setExpenseSearch(e.target.value)}
                      className="h-9 w-48"
                    />
                  </div>
                  <Button className="btn-success gap-2" onClick={() => setAddExpenseModalOpen(true)}>
                    <Plus size={16} />
                    Add New
                  </Button>
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
                              <button
                                onClick={() => {
                                  setEditExpense({ ...expense });
                                  setEditExpenseModalOpen(true);
                                }}
                                className="p-1.5 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteExpense(expense.id)}
                                className="p-1.5 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
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
                    Showing {((expensePage - 1) * 10) + 1} to {Math.min(expensePage * 10, expenseData.totalCount)} of {expenseData.totalCount} entries
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
                <Button variant="outline" onClick={() => setEditCurrencyModalOpen(false)}>Close</Button>
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
              <Select value={portForm.country} onValueChange={(value) => setPortForm({ ...portForm, country: value })}>
                <SelectTrigger><SelectValue placeholder="Select Country" /></SelectTrigger>
                <SelectContent className="bg-popover border border-border">
                  {countries.map((country) => (
                    <SelectItem key={country} value={country}>{country}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                <Select value={editPort.country} onValueChange={(value) => setEditPort({ ...editPort, country: value })}>
                  <SelectTrigger><SelectValue placeholder="Select Country" /></SelectTrigger>
                  <SelectContent className="bg-popover border border-border">
                    {countries.map((country) => (
                      <SelectItem key={country} value={country}>{country}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setEditPortModalOpen(false)}>Close</Button>
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
                <Button variant="outline" onClick={() => setEditChargeModalOpen(false)}>Close</Button>
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
              <Select value={expenseForm.paymentDirection} onValueChange={(value: PaymentType) => setExpenseForm({ ...expenseForm, paymentDirection: value })}>
                <SelectTrigger><SelectValue placeholder="Select One" /></SelectTrigger>
                <SelectContent className="bg-popover border border-border">
                  <SelectItem value="Outwards">Outwards</SelectItem>
                  <SelectItem value="Inwards">Inwards</SelectItem>
                </SelectContent>
              </Select>
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
                <Select value={editExpense.paymentDirection} onValueChange={(value: PaymentType) => setEditExpense({ ...editExpense, paymentDirection: value })}>
                  <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                  <SelectContent className="bg-popover border border-border">
                    <SelectItem value="Outwards">Outwards</SelectItem>
                    <SelectItem value="Inwards">Inwards</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Payment Type</label>
                <Input value={editExpense.name} onChange={(e) => setEditExpense({ ...editExpense, name: e.target.value })} />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setEditExpenseModalOpen(false)}>Close</Button>
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
    </MainLayout>
  );
};

export default Settings;
