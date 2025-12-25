import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit, Trash2, Plus } from "lucide-react";
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

type SettingsTab = "currency" | "ports" | "charges" | "expenses";

interface Currency {
  id: number;
  name: string;
  code: string;
  symbol: string;
  decimal: string;
  usdRate: string;
  roe?: string;
}

interface Port {
  id: number;
  name: string;
  country: string;
}

interface Charge {
  id: number;
  name: string;
}

interface Expense {
  id: number;
  category: string;
  paymentType: string;
}

const mockCurrencies: Currency[] = [
  { id: 1, name: "Dhirham", code: "AED", symbol: "AED", decimal: "fils", usdRate: "3.685", roe: "1.000" },
  { id: 2, name: "Dollar", code: "USD", symbol: "$", decimal: "Cent", usdRate: "1.000", roe: "1.000" },
  { id: 3, name: "EURO", code: "EURO", symbol: "€", decimal: "cent", usdRate: "0.860", roe: "1.000" },
  { id: 4, name: "POUND", code: "GBP", symbol: "£", decimal: "Penny", usdRate: "0.790", roe: "1.000" },
  { id: 5, name: "Qatari riyal", code: "QAR", symbol: "Qar", decimal: "Dirham", usdRate: "3.655", roe: "1.000" },
  { id: 6, name: "Pakistani rupee", code: "PKR", symbol: "PKR", decimal: "Paisa", usdRate: "175.000", roe: "1.000" },
];

const mockPorts: Port[] = [
  { id: 1, name: "HAZIRA", country: "India" },
  { id: 2, name: "GEMLIK", country: "Turkey" },
  { id: 3, name: "GUAYAQUIL", country: "Ecuador" },
  { id: 4, name: "DA CHAN BAY", country: "China" },
  { id: 5, name: "ZANZIBAR", country: "Tanzania, United Republic of" },
  { id: 6, name: "Lianyungang", country: "China" },
  { id: 7, name: "Moresby", country: "Papua New Guinea" },
  { id: 8, name: "HALDIA", country: "India" },
  { id: 9, name: "MOTUKEA ISLAND", country: "Papua New Guinea" },
  { id: 10, name: "Libreville", country: "Gabon" },
];

const mockCharges: Charge[] = [
  { id: 1, name: "License Fee" },
  { id: 2, name: "LONG LENGTH SURCHARGE" },
  { id: 3, name: "Import & Re-Export Charges" },
  { id: 4, name: "Freight & Local Charges" },
  { id: 5, name: "EXIT CERTIFICATE" },
  { id: 6, name: "LATE MANIFEST CHARGES" },
  { id: 7, name: "ADDITIONAL RE-WORKING CHARGES" },
  { id: 8, name: "TS D/O" },
  { id: 9, name: "LINER FEE" },
  { id: 10, name: "SEA WAY BL FEE" },
];

const mockExpenses: Expense[] = [
  { id: 1, category: "Outwards", paymentType: "Admin Expense" },
  { id: 2, category: "Outwards", paymentType: "Selling Expenses" },
  { id: 3, category: "Outwards", paymentType: "Operating Expenses" },
  { id: 4, category: "Outwards", paymentType: "Marketing Expenses" },
  { id: 5, category: "Outwards", paymentType: "Bank & Financial Charges" },
  { id: 6, category: "Outwards", paymentType: "FCL Expenses" },
  { id: 7, category: "Outwards", paymentType: "LCL Expenses" },
  { id: 8, category: "Outwards", paymentType: "Open Top Selling" },
  { id: 9, category: "Outwards", paymentType: "Import Selling Expense" },
  { id: 10, category: "Outwards", paymentType: "Air Selling Expense" },
];

const Settings = () => {
  const [searchTerm, setSearchTerm] = useState("");

  // Add modal states
  const [addCurrencyModalOpen, setAddCurrencyModalOpen] = useState(false);
  const [addPortModalOpen, setAddPortModalOpen] = useState(false);
  const [addChargeModalOpen, setAddChargeModalOpen] = useState(false);
  const [addExpenseModalOpen, setAddExpenseModalOpen] = useState(false);

  // Currency form state
  const [currencyName, setCurrencyName] = useState("");
  const [currencyCode, setCurrencyCode] = useState("");
  const [currencySymbol, setCurrencySymbol] = useState("");
  const [decimalPoint, setDecimalPoint] = useState("");
  const [usdValue, setUsdValue] = useState("");
  const [roe, setRoe] = useState("");

  // Port form state
  const [portName, setPortName] = useState("");
  const [portCountry, setPortCountry] = useState("");

  // Charge form state
  const [chargeName, setChargeName] = useState("");

  // Expense form state
  const [expenseCategory, setExpenseCategory] = useState("");
  const [expensePaymentType, setExpensePaymentType] = useState("");

  // Edit modal states
  const [editCurrencyModalOpen, setEditCurrencyModalOpen] = useState(false);
  const [editPortModalOpen, setEditPortModalOpen] = useState(false);
  const [editChargeModalOpen, setEditChargeModalOpen] = useState(false);
  const [editExpenseModalOpen, setEditExpenseModalOpen] = useState(false);

  // Edit form states
  const [editCurrency, setEditCurrency] = useState<Currency | null>(null);
  const [editPort, setEditPort] = useState<Port | null>(null);
  const [editCharge, setEditCharge] = useState<Charge | null>(null);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);

  const handleEditCurrency = (currency: Currency) => {
    setEditCurrency({ ...currency });
    setEditCurrencyModalOpen(true);
  };

  const handleEditPort = (port: Port) => {
    setEditPort({ ...port });
    setEditPortModalOpen(true);
  };

  const handleEditCharge = (charge: Charge) => {
    setEditCharge({ ...charge });
    setEditChargeModalOpen(true);
  };

  const handleEditExpense = (expense: Expense) => {
    setEditExpense({ ...expense });
    setEditExpenseModalOpen(true);
  };

  const resetCurrencyForm = () => {
    setCurrencyName("");
    setCurrencyCode("");
    setCurrencySymbol("");
    setDecimalPoint("");
    setUsdValue("");
    setRoe("");
  };

  const resetPortForm = () => {
    setPortName("");
    setPortCountry("");
  };

  const resetChargeForm = () => {
    setChargeName("");
  };

  const resetExpenseForm = () => {
    setExpenseCategory("");
    setExpensePaymentType("");
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
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
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
                <table className="w-full">
                  <thead>
                    <tr className="bg-table-header text-table-header-foreground">
                      <th className="px-4 py-3 text-left text-sm font-semibold">Action ↕</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Name ↕</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Code ↕</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Symbol ↕</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Decimal ↕</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">1 USD ↕</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockCurrencies.map((currency, index) => (
                      <tr
                        key={currency.id}
                        className={`border-b border-border hover:bg-table-row-hover transition-colors ${
                          index % 2 === 0 ? "bg-card" : "bg-secondary/30"
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => handleEditCurrency(currency)}
                              className="p-1.5 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                            >
                              <Edit size={14} />
                            </button>
                            <button className="p-1.5 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 transition-colors">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-primary font-medium">{currency.name}</td>
                        <td className="px-4 py-3 text-sm text-foreground">{currency.code}</td>
                        <td className="px-4 py-3 text-sm text-primary">{currency.symbol}</td>
                        <td className="px-4 py-3 text-sm text-foreground">{currency.decimal}</td>
                        <td className="px-4 py-3 text-sm text-foreground">{currency.usdRate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between p-4">
                <p className="text-sm text-muted-foreground">Showing 1 to 6 of 6 entries</p>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" className="h-8 px-3" disabled>Previous</Button>
                  <Button size="sm" className="h-8 w-8 bg-primary text-primary-foreground">1</Button>
                  <Button variant="outline" size="sm" className="h-8 px-3">Next</Button>
                </div>
              </div>
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
                    <Input placeholder="" className="h-9 w-48" />
                  </div>
                  <Button className="btn-success gap-2" onClick={() => setAddPortModalOpen(true)}>
                    <Plus size={16} />
                    Add New
                  </Button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-table-header text-table-header-foreground">
                      <th className="px-4 py-3 text-left text-sm font-semibold">Action ↕</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Name ↕</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Country ↕</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockPorts.map((port, index) => (
                      <tr
                        key={port.id}
                        className={`border-b border-border hover:bg-table-row-hover transition-colors ${
                          index % 2 === 0 ? "bg-card" : "bg-secondary/30"
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => handleEditPort(port)}
                              className="p-1.5 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                            >
                              <Edit size={14} />
                            </button>
                            <button className="p-1.5 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 transition-colors">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-primary font-medium">{port.name}</td>
                        <td className="px-4 py-3 text-sm text-primary">{port.country}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between p-4">
                <p className="text-sm text-muted-foreground">Showing 1 to 10 of 225 entries</p>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" className="h-8 px-3" disabled>Previous</Button>
                  <Button size="sm" className="h-8 w-8 bg-primary text-primary-foreground">1</Button>
                  <Button variant="outline" size="sm" className="h-8 w-8">2</Button>
                  <Button variant="outline" size="sm" className="h-8 w-8">3</Button>
                  <span className="text-muted-foreground mx-1">...</span>
                  <Button variant="outline" size="sm" className="h-8 w-8">23</Button>
                  <Button variant="outline" size="sm" className="h-8 px-3">Next</Button>
                </div>
              </div>
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
                    <Input placeholder="" className="h-9 w-48" />
                  </div>
                  <Button className="btn-success gap-2" onClick={() => setAddChargeModalOpen(true)}>
                    <Plus size={16} />
                    Add New
                  </Button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-table-header text-table-header-foreground">
                      <th className="px-4 py-3 text-left text-sm font-semibold">Action ↕</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Name ↕</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockCharges.map((charge, index) => (
                      <tr
                        key={charge.id}
                        className={`border-b border-border hover:bg-table-row-hover transition-colors ${
                          index % 2 === 0 ? "bg-card" : "bg-secondary/30"
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => handleEditCharge(charge)}
                              className="p-1.5 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                            >
                              <Edit size={14} />
                            </button>
                            <button className="p-1.5 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 transition-colors">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-primary font-medium">{charge.name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between p-4">
                <p className="text-sm text-muted-foreground">Showing 1 to 10 of 253 entries</p>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" className="h-8 px-3" disabled>Previous</Button>
                  <Button size="sm" className="h-8 w-8 bg-primary text-primary-foreground">1</Button>
                  <Button variant="outline" size="sm" className="h-8 w-8">2</Button>
                  <Button variant="outline" size="sm" className="h-8 w-8">3</Button>
                  <span className="text-muted-foreground mx-1">...</span>
                  <Button variant="outline" size="sm" className="h-8 w-8">26</Button>
                  <Button variant="outline" size="sm" className="h-8 px-3">Next</Button>
                </div>
              </div>
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
                    <Input placeholder="" className="h-9 w-48" />
                  </div>
                  <Button className="btn-success gap-2" onClick={() => setAddExpenseModalOpen(true)}>
                    <Plus size={16} />
                    Add New
                  </Button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-table-header text-table-header-foreground">
                      <th className="px-4 py-3 text-left text-sm font-semibold">Action ↕</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Category ↕</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Payment Type ↕</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockExpenses.map((expense, index) => (
                      <tr
                        key={expense.id}
                        className={`border-b border-border hover:bg-table-row-hover transition-colors ${
                          index % 2 === 0 ? "bg-card" : "bg-secondary/30"
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => handleEditExpense(expense)}
                              className="p-1.5 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                            >
                              <Edit size={14} />
                            </button>
                            <button className="p-1.5 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 transition-colors">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground">{expense.category}</td>
                        <td className="px-4 py-3 text-sm text-primary font-medium">{expense.paymentType}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between p-4">
                <p className="text-sm text-muted-foreground">Showing 1 to 10 of 73 entries</p>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" className="h-8 px-3" disabled>Previous</Button>
                  <Button size="sm" className="h-8 w-8 bg-primary text-primary-foreground">1</Button>
                  <Button variant="outline" size="sm" className="h-8 w-8">2</Button>
                  <Button variant="outline" size="sm" className="h-8 w-8">3</Button>
                  <span className="text-muted-foreground mx-1">...</span>
                  <Button variant="outline" size="sm" className="h-8 w-8">8</Button>
                  <Button variant="outline" size="sm" className="h-8 px-3">Next</Button>
                </div>
              </div>
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
              <Input placeholder="Enter Currency Name" value={currencyName} onChange={(e) => setCurrencyName(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Currency Code</label>
              <Input placeholder="Enter Currency Code" value={currencyCode} onChange={(e) => setCurrencyCode(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Currency Symbol</label>
              <Input placeholder="Enter Currency Symbol" value={currencySymbol} onChange={(e) => setCurrencySymbol(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Decimal Point</label>
              <Input placeholder="Enter Decimal Point Value" value={decimalPoint} onChange={(e) => setDecimalPoint(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">1 USD =</label>
              <Input placeholder="1 USD =" value={usdValue} onChange={(e) => setUsdValue(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">ROE</label>
              <Input placeholder="ROE" value={roe} onChange={(e) => setRoe(e.target.value)} />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setAddCurrencyModalOpen(false)}>Cancel</Button>
              <Button className="btn-success" onClick={() => setAddCurrencyModalOpen(false)}>Save</Button>
            </div>
          </div>
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
              <Input placeholder="Ports Name" value={portName} onChange={(e) => setPortName(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Country</label>
              <Select value={portCountry} onValueChange={setPortCountry}>
                <SelectTrigger><SelectValue placeholder="Select Country" /></SelectTrigger>
                <SelectContent className="bg-popover border border-border">
                  <SelectItem value="india">India</SelectItem>
                  <SelectItem value="china">China</SelectItem>
                  <SelectItem value="usa">USA</SelectItem>
                  <SelectItem value="uae">UAE</SelectItem>
                  <SelectItem value="turkey">Turkey</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setAddPortModalOpen(false)}>Cancel</Button>
              <Button className="btn-success" onClick={() => setAddPortModalOpen(false)}>Save</Button>
            </div>
          </div>
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
              <Input placeholder="Charge Item" value={chargeName} onChange={(e) => setChargeName(e.target.value)} />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setAddChargeModalOpen(false)}>Cancel</Button>
              <Button className="btn-success" onClick={() => setAddChargeModalOpen(false)}>Save</Button>
            </div>
          </div>
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
              <Select value={expenseCategory} onValueChange={setExpenseCategory}>
                <SelectTrigger><SelectValue placeholder="Select One" /></SelectTrigger>
                <SelectContent className="bg-popover border border-border">
                  <SelectItem value="outwards">Outwards</SelectItem>
                  <SelectItem value="inwards">Inwards</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Payment Type</label>
              <Input placeholder="Payment Type" value={expensePaymentType} onChange={(e) => setExpensePaymentType(e.target.value)} />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setAddExpenseModalOpen(false)}>Cancel</Button>
              <Button className="btn-success" onClick={() => setAddExpenseModalOpen(false)}>Save</Button>
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
                <Input value={editCurrency.decimal} onChange={(e) => setEditCurrency({ ...editCurrency, decimal: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">1 USD =</label>
                <Input value={editCurrency.usdRate} onChange={(e) => setEditCurrency({ ...editCurrency, usdRate: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">ROE</label>
                <Input value={editCurrency.roe || ""} onChange={(e) => setEditCurrency({ ...editCurrency, roe: e.target.value })} />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setEditCurrencyModalOpen(false)}>Close</Button>
                <Button className="btn-success" onClick={() => setEditCurrencyModalOpen(false)}>Update</Button>
              </div>
            </div>
          )}
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
                <Select value={editPort.country.toLowerCase()} onValueChange={(value) => setEditPort({ ...editPort, country: value })}>
                  <SelectTrigger><SelectValue placeholder="Select Country" /></SelectTrigger>
                  <SelectContent className="bg-popover border border-border">
                    <SelectItem value="india">India</SelectItem>
                    <SelectItem value="china">China</SelectItem>
                    <SelectItem value="usa">USA</SelectItem>
                    <SelectItem value="uae">UAE</SelectItem>
                    <SelectItem value="turkey">Turkey</SelectItem>
                    <SelectItem value="ecuador">Ecuador</SelectItem>
                    <SelectItem value="tanzania, united republic of">Tanzania, United Republic of</SelectItem>
                    <SelectItem value="papua new guinea">Papua New Guinea</SelectItem>
                    <SelectItem value="gabon">Gabon</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setEditPortModalOpen(false)}>Close</Button>
                <Button className="btn-success" onClick={() => setEditPortModalOpen(false)}>Update</Button>
              </div>
            </div>
          )}
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
                <Button className="btn-success" onClick={() => setEditChargeModalOpen(false)}>Update</Button>
              </div>
            </div>
          )}
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
                <Select value={editExpense.category.toLowerCase()} onValueChange={(value) => setEditExpense({ ...editExpense, category: value })}>
                  <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                  <SelectContent className="bg-popover border border-border">
                    <SelectItem value="outwards">Outwards</SelectItem>
                    <SelectItem value="inwards">Inwards</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Payment Type</label>
                <Input value={editExpense.paymentType} onChange={(e) => setEditExpense({ ...editExpense, paymentType: e.target.value })} />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setEditExpenseModalOpen(false)}>Close</Button>
                <Button className="btn-success" onClick={() => setEditExpenseModalOpen(false)}>Update</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Settings;
