import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit, Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SettingsTab = "currency" | "ports" | "charges" | "expenses";

interface Currency {
  id: number;
  name: string;
  code: string;
  symbol: string;
  decimal: string;
  usdRate: string;
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
  { id: 1, name: "Dhirham", code: "AED", symbol: "AED", decimal: "fils", usdRate: "3.685" },
  { id: 2, name: "Dollar", code: "USD", symbol: "$", decimal: "Cent", usdRate: "1.000" },
  { id: 3, name: "EURO", code: "EURO", symbol: "€", decimal: "cent", usdRate: "0.860" },
  { id: 4, name: "POUND", code: "GBP", symbol: "£", decimal: "Penny", usdRate: "0.790" },
  { id: 5, name: "Qatari riyal", code: "QAR", symbol: "Qar", decimal: "Dirham", usdRate: "3.655" },
  { id: 6, name: "Pakistani rupee", code: "PKR", symbol: "PKR", decimal: "Paisa", usdRate: "175.000" },
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
  const [activeTab, setActiveTab] = useState<SettingsTab>("currency");
  const [searchTerm, setSearchTerm] = useState("");

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

  const tabs = [
    { id: "currency" as SettingsTab, label: "Currency Type" },
    { id: "ports" as SettingsTab, label: "Ports" },
    { id: "charges" as SettingsTab, label: "Charges Items" },
    { id: "expenses" as SettingsTab, label: "Expense Items" },
  ];

  const renderForm = () => {
    switch (activeTab) {
      case "currency":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Currency Name</label>
              <Input
                placeholder="Enter Currency Name"
                value={currencyName}
                onChange={(e) => setCurrencyName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Currency Code</label>
              <Input
                placeholder="Enter Currency Code"
                value={currencyCode}
                onChange={(e) => setCurrencyCode(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Currency Symbol</label>
              <Input
                placeholder="Enter Currency Symbol"
                value={currencySymbol}
                onChange={(e) => setCurrencySymbol(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Decimal Point</label>
              <Input
                placeholder="Enter Decimal Point Value"
                value={decimalPoint}
                onChange={(e) => setDecimalPoint(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">1 USD =</label>
              <Input
                placeholder="1 USD ="
                value={usdValue}
                onChange={(e) => setUsdValue(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">ROE</label>
              <Input
                placeholder="ROE"
                value={roe}
                onChange={(e) => setRoe(e.target.value)}
              />
            </div>
          </div>
        );
      case "ports":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Port Name</label>
              <Input
                placeholder="Ports Name"
                value={portName}
                onChange={(e) => setPortName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Country</label>
              <Select value={portCountry} onValueChange={setPortCountry}>
                <SelectTrigger>
                  <SelectValue placeholder="Default Currency Symbol" />
                </SelectTrigger>
                <SelectContent className="bg-popover border border-border">
                  <SelectItem value="india">India</SelectItem>
                  <SelectItem value="china">China</SelectItem>
                  <SelectItem value="usa">USA</SelectItem>
                  <SelectItem value="uae">UAE</SelectItem>
                  <SelectItem value="turkey">Turkey</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      case "charges":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Charge</label>
              <Input
                placeholder="Charge Item"
                value={chargeName}
                onChange={(e) => setChargeName(e.target.value)}
              />
            </div>
          </div>
        );
      case "expenses":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Category</label>
              <Select value={expenseCategory} onValueChange={setExpenseCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select One" />
                </SelectTrigger>
                <SelectContent className="bg-popover border border-border">
                  <SelectItem value="outwards">Outwards</SelectItem>
                  <SelectItem value="inwards">Inwards</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Payment Type</label>
              <Input
                placeholder="Payment Type"
                value={expensePaymentType}
                onChange={(e) => setExpensePaymentType(e.target.value)}
              />
            </div>
          </div>
        );
    }
  };

  const renderTable = () => {
    switch (activeTab) {
      case "currency":
        return (
          <table className="w-full">
            <thead>
              <tr className="bg-table-header text-table-header-foreground">
                <th className="px-3 py-3 text-left text-xs font-semibold">Action ↕</th>
                <th className="px-3 py-3 text-left text-xs font-semibold">Name ↕</th>
                <th className="px-3 py-3 text-left text-xs font-semibold">Code ↕</th>
                <th className="px-3 py-3 text-left text-xs font-semibold">Symbol ↕</th>
                <th className="px-3 py-3 text-left text-xs font-semibold">Decimal ↕</th>
                <th className="px-3 py-3 text-left text-xs font-semibold">1 USD ↕</th>
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
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1">
                      <button className="p-1.5 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors">
                        <Edit size={14} />
                      </button>
                      <button className="p-1.5 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-sm text-primary font-medium">{currency.name}</td>
                  <td className="px-3 py-2.5 text-sm text-foreground">{currency.code}</td>
                  <td className="px-3 py-2.5 text-sm text-primary">{currency.symbol}</td>
                  <td className="px-3 py-2.5 text-sm text-foreground">{currency.decimal}</td>
                  <td className="px-3 py-2.5 text-sm text-foreground">{currency.usdRate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      case "ports":
        return (
          <table className="w-full">
            <thead>
              <tr className="bg-table-header text-table-header-foreground">
                <th className="px-3 py-3 text-left text-xs font-semibold">Action ↕</th>
                <th className="px-3 py-3 text-left text-xs font-semibold">Name ↕</th>
                <th className="px-3 py-3 text-left text-xs font-semibold">Country ↕</th>
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
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1">
                      <button className="p-1.5 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors">
                        <Edit size={14} />
                      </button>
                      <button className="p-1.5 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-sm text-primary font-medium">{port.name}</td>
                  <td className="px-3 py-2.5 text-sm text-primary">{port.country}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      case "charges":
        return (
          <table className="w-full">
            <thead>
              <tr className="bg-table-header text-table-header-foreground">
                <th className="px-3 py-3 text-left text-xs font-semibold">Action ↕</th>
                <th className="px-3 py-3 text-left text-xs font-semibold">Name ↕</th>
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
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1">
                      <button className="p-1.5 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors">
                        <Edit size={14} />
                      </button>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-sm text-primary font-medium">{charge.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      case "expenses":
        return (
          <table className="w-full">
            <thead>
              <tr className="bg-table-header text-table-header-foreground">
                <th className="px-3 py-3 text-left text-xs font-semibold">Action ↕</th>
                <th className="px-3 py-3 text-left text-xs font-semibold">Category ↕</th>
                <th className="px-3 py-3 text-left text-xs font-semibold">Payment Type ↕</th>
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
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1">
                      <button className="p-1.5 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors">
                        <Edit size={14} />
                      </button>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-sm text-foreground">{expense.category}</td>
                  <td className="px-3 py-2.5 text-sm text-primary font-medium">{expense.paymentType}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );
    }
  };

  const getListTitle = () => {
    switch (activeTab) {
      case "currency":
        return "List All Currencies";
      case "ports":
        return "List All Ports";
      case "charges":
        return "List All Charges";
      case "expenses":
        return "List All Expense";
    }
  };

  return (
    <MainLayout>
      <div className="p-6">
        <div className="flex gap-6">
          {/* Left Sidebar - Tabs */}
          <div className="w-56 flex-shrink-0">
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full px-4 py-3 text-left text-sm transition-colors ${
                    activeTab === tab.id
                      ? "bg-primary text-primary-foreground font-medium"
                      : "text-primary hover:bg-secondary/50"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Middle - Add Form */}
          <div className="w-80 flex-shrink-0">
            <div className="bg-card rounded-lg border border-border p-6">
              <h2 className="text-lg font-semibold text-foreground mb-6">
                <span className="font-bold">Add New</span>{" "}
                {activeTab === "currency" && "Currency Type"}
                {activeTab === "ports" && "Port"}
                {activeTab === "charges" && "Charge"}
                {activeTab === "expenses" && "Expense"}
              </h2>
              {renderForm()}
              <Button className="btn-success mt-6">Save</Button>
            </div>
          </div>

          {/* Right - List Table */}
          <div className="flex-1">
            <div className="bg-card rounded-lg border border-border">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h2 className="text-lg font-semibold text-primary">{getListTitle()}</h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Search:</span>
                  <Input
                    placeholder=""
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-9 w-48"
                  />
                </div>
              </div>
              <div className="overflow-x-auto">{renderTable()}</div>
              <div className="flex items-center justify-between p-4">
                <p className="text-sm text-muted-foreground">
                  Showing 1 to 10 of {activeTab === "ports" ? "225" : activeTab === "charges" ? "253" : activeTab === "expenses" ? "73" : "6"} entries
                </p>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" className="h-8 px-3" disabled>
                    Previous
                  </Button>
                  <Button size="sm" className="h-8 w-8 bg-primary text-primary-foreground">
                    1
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 w-8">
                    2
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 w-8">
                    3
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 w-8">
                    4
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 w-8">
                    5
                  </Button>
                  <span className="text-muted-foreground mx-1">...</span>
                  <Button variant="outline" size="sm" className="h-8 w-8">
                    23
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 px-3">
                    Next
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Settings;
