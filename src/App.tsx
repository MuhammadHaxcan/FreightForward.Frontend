import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Companies from "./pages/Companies";
import Shipments from "./pages/Shipments";
import ShipmentDetail from "./pages/ShipmentDetail";
import AddShipment from "./pages/AddShipment";
import MasterCustomers from "./pages/MasterCustomers";
import CustomerDetail from "./pages/CustomerDetail";
import CreditorDetail from "./pages/CreditorDetail";
import NeutralDetail from "./pages/NeutralDetail";
import AllUsers from "./pages/AllUsers";
import PermissionRoles from "./pages/PermissionRoles";
import Settings from "./pages/Settings";
import Banks from "./pages/Banks";
import Leads from "./pages/Leads";
import RateRequests from "./pages/RateRequests";
import Quotations from "./pages/Quotations";
import QuotationView from "./pages/QuotationView";
import DailyExpenses from "./pages/DailyExpenses";
import Invoices from "./pages/Invoices";
import InvoiceView from "./pages/InvoiceView";
import PurchaseInvoices from "./pages/PurchaseInvoices";
import PurchaseInvoiceView from "./pages/PurchaseInvoiceView";
import ReceiptVouchers from "./pages/ReceiptVouchers";
import ReceiptView from "./pages/ReceiptView";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/companies" element={<Companies />} />
          <Route path="/shipments" element={<Shipments />} />
          <Route path="/shipments/add" element={<AddShipment />} />
          <Route path="/shipments/:id/edit" element={<ShipmentDetail />} />
          <Route path="/master-customers" element={<MasterCustomers />} />
          <Route path="/master-customers/:id/edit" element={<CustomerDetail />} />
          <Route path="/master-customers/:id/creditor/edit" element={<CreditorDetail />} />
          <Route path="/master-customers/:id/neutral/edit" element={<NeutralDetail />} />
          <Route path="/sales/leads" element={<Leads />} />
          <Route path="/sales/rate-requests" element={<RateRequests />} />
          <Route path="/sales/quotations" element={<Quotations />} />
          <Route path="/sales/quotations/:id/view" element={<QuotationView />} />
          <Route path="/accounts" element={<Invoices />} />
          <Route path="/accounts/invoices" element={<Invoices />} />
          <Route path="/accounts/invoices/:id" element={<InvoiceView />} />
          <Route path="/accounts/purchase-invoices" element={<PurchaseInvoices />} />
          <Route path="/accounts/purchase-invoices/:id" element={<PurchaseInvoiceView />} />
          <Route path="/accounts/daily-expenses" element={<DailyExpenses />} />
          <Route path="/accounts/receipt-vouchers" element={<ReceiptVouchers />} />
          <Route path="/accounts/receipt-vouchers/:id" element={<ReceiptView />} />
          <Route path="/users" element={<Dashboard />} />
          <Route path="/users/all" element={<AllUsers />} />
          <Route path="/users/roles" element={<PermissionRoles />} />
          <Route path="/banks" element={<Banks />} />
          <Route path="/general-document" element={<Dashboard />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
