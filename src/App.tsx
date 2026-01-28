import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import Login from "./pages/Login";
import Unauthorized from "./pages/Unauthorized";
import Dashboard from "./pages/Dashboard";
import Companies from "./pages/Companies";
import Shipments from "./pages/Shipments";
import ShipmentDetail from "./pages/ShipmentDetail";
import AddShipment from "./pages/AddShipment";
import MasterCustomers from "./pages/MasterCustomers";
import CustomerDetail from "./pages/CustomerDetail";
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
import ExpensePrintView from "./pages/ExpensePrintView";
import Invoices from "./pages/Invoices";
import InvoiceView from "./pages/InvoiceView";
import InvoicePrintView from "./pages/InvoicePrintView";
import PurchaseInvoices from "./pages/PurchaseInvoices";
import PurchaseInvoiceView from "./pages/PurchaseInvoiceView";
import PurchaseInvoicePrintView from "./pages/PurchaseInvoicePrintView";
import StatementPrintView from "./pages/StatementPrintView";
import ReceiptVouchers from "./pages/ReceiptVouchers";
import ReceiptView from "./pages/ReceiptView";
import ReceiptPrintView from "./pages/ReceiptPrintView";
import PaymentVouchers from "./pages/PaymentVouchers";
import PaymentView from "./pages/PaymentView";
import PaymentVoucherPrintView from "./pages/PaymentVoucherPrintView";
import CostSheet from "./pages/CostSheet";
import CostSheetDetail from "./pages/CostSheetDetail";
import CostSheetPrintView from "./pages/CostSheetPrintView";
import CostSheetDetailPrintView from "./pages/CostSheetDetailPrintView";
import VatReport from "./pages/VatReport";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Protected routes */}
            <Route path="/" element={
              <ProtectedRoute permission="dash_view">
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/companies" element={
              <ProtectedRoute permission="company_view">
                <Companies />
              </ProtectedRoute>
            } />
            <Route path="/shipments" element={
              <ProtectedRoute permission="ship_view">
                <Shipments />
              </ProtectedRoute>
            } />
            <Route path="/shipments/add" element={
              <ProtectedRoute permission="ship_add">
                <AddShipment />
              </ProtectedRoute>
            } />
            <Route path="/shipments/:id/edit" element={
              <ProtectedRoute permission="ship_view">
                <ShipmentDetail />
              </ProtectedRoute>
            } />
            <Route path="/master-customers" element={
              <ProtectedRoute permission="cust_view">
                <MasterCustomers />
              </ProtectedRoute>
            } />
            <Route path="/master-customers/:id/edit" element={
              <ProtectedRoute permission="cust_view">
                <CustomerDetail />
              </ProtectedRoute>
            } />
            <Route path="/master-customers/:id/neutral/edit" element={
              <ProtectedRoute permission="cust_view">
                <NeutralDetail />
              </ProtectedRoute>
            } />
            <Route path="/master-customers/:id/statement/print" element={
              <ProtectedRoute permission="cust_view">
                <StatementPrintView />
              </ProtectedRoute>
            } />
            <Route path="/sales/leads" element={
              <ProtectedRoute permission="leads_view">
                <Leads />
              </ProtectedRoute>
            } />
            <Route path="/sales/rate-requests" element={
              <ProtectedRoute permission="ratereq_view">
                <RateRequests />
              </ProtectedRoute>
            } />
            <Route path="/sales/quotations" element={
              <ProtectedRoute permission="quot_view">
                <Quotations />
              </ProtectedRoute>
            } />
            <Route path="/sales/quotations/:id/view" element={
              <ProtectedRoute permission="quot_view">
                <QuotationView />
              </ProtectedRoute>
            } />
            <Route path="/accounts" element={
              <ProtectedRoute permission="invoice_view">
                <Invoices />
              </ProtectedRoute>
            } />
            <Route path="/accounts/invoices" element={
              <ProtectedRoute permission="invoice_view">
                <Invoices />
              </ProtectedRoute>
            } />
            <Route path="/accounts/invoices/:id" element={
              <ProtectedRoute permission="invoice_view">
                <InvoiceView />
              </ProtectedRoute>
            } />
            <Route path="/accounts/invoices/:id/print" element={
              <ProtectedRoute permission="invoice_view">
                <InvoicePrintView />
              </ProtectedRoute>
            } />
            <Route path="/accounts/purchase-invoices" element={
              <ProtectedRoute permission="invoice_view">
                <PurchaseInvoices />
              </ProtectedRoute>
            } />
            <Route path="/accounts/purchase-invoices/:id" element={
              <ProtectedRoute permission="invoice_view">
                <PurchaseInvoiceView />
              </ProtectedRoute>
            } />
            <Route path="/accounts/purchase-invoices/:id/print" element={
              <ProtectedRoute permission="invoice_view">
                <PurchaseInvoicePrintView />
              </ProtectedRoute>
            } />
            <Route path="/accounts/daily-expenses" element={
              <ProtectedRoute permission="expense_view">
                <DailyExpenses />
              </ProtectedRoute>
            } />
            <Route path="/accounts/expenses/print" element={
              <ProtectedRoute permission="expense_view">
                <ExpensePrintView />
              </ProtectedRoute>
            } />
            <Route path="/accounts/receipt-vouchers" element={
              <ProtectedRoute permission="receipt_view">
                <ReceiptVouchers />
              </ProtectedRoute>
            } />
            <Route path="/accounts/receipt-vouchers/:id" element={
              <ProtectedRoute permission="receipt_view">
                <ReceiptView />
              </ProtectedRoute>
            } />
            <Route path="/accounts/receipt-vouchers/:id/print" element={
              <ProtectedRoute permission="receipt_view">
                <ReceiptPrintView />
              </ProtectedRoute>
            } />
            <Route path="/accounts/payment-vouchers" element={
              <ProtectedRoute permission="paymentvoucher_view">
                <PaymentVouchers />
              </ProtectedRoute>
            } />
            <Route path="/accounts/payment-vouchers/:id" element={
              <ProtectedRoute permission="paymentvoucher_view">
                <PaymentView />
              </ProtectedRoute>
            } />
            <Route path="/accounts/payment-vouchers/:id/print" element={
              <ProtectedRoute permission="paymentvoucher_view">
                <PaymentVoucherPrintView />
              </ProtectedRoute>
            } />
            <Route path="/accounts/cost-sheet" element={
              <ProtectedRoute permission="ship_view">
                <CostSheet />
              </ProtectedRoute>
            } />
            <Route path="/accounts/cost-sheet/print" element={
              <ProtectedRoute permission="ship_view">
                <CostSheetPrintView />
              </ProtectedRoute>
            } />
            <Route path="/accounts/cost-sheet/:id" element={
              <ProtectedRoute permission="ship_view">
                <CostSheetDetail />
              </ProtectedRoute>
            } />
            <Route path="/accounts/cost-sheet/:shipmentId/print" element={
              <ProtectedRoute permission="ship_view">
                <CostSheetDetailPrintView />
              </ProtectedRoute>
            } />
            <Route path="/accounts/vat-report" element={
              <ProtectedRoute permission="invoice_view">
                <VatReport />
              </ProtectedRoute>
            } />
            <Route path="/users" element={
              <ProtectedRoute permission="user_view">
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/users/all" element={
              <ProtectedRoute permission="user_view">
                <AllUsers />
              </ProtectedRoute>
            } />
            <Route path="/users/roles" element={
              <ProtectedRoute permission="role_view">
                <PermissionRoles />
              </ProtectedRoute>
            } />
            <Route path="/banks" element={
              <ProtectedRoute permission="banks_view">
                <Banks />
              </ProtectedRoute>
            } />
            <Route path="/general-document" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
