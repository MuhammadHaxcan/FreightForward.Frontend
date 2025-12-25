import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Companies from "./pages/Companies";
import Shipments from "./pages/Shipments";
import MasterCustomers from "./pages/MasterCustomers";
import CustomerDetail from "./pages/CustomerDetail";
import Settings from "./pages/Settings";
import Banks from "./pages/Banks";
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
          <Route path="/master-customers" element={<MasterCustomers />} />
          <Route path="/master-customers/:id/edit" element={<CustomerDetail />} />
          <Route path="/sales" element={<Dashboard />} />
          <Route path="/accounts" element={<Dashboard />} />
          <Route path="/users" element={<Dashboard />} />
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
