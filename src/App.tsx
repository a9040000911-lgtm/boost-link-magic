import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Privacy from "./pages/Privacy";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import AdminLayout from "./pages/AdminLayout";
import DashboardOverview from "./pages/dashboard/DashboardOverview";
import DashboardOrders from "./pages/dashboard/DashboardOrders";
import DashboardProjects from "./pages/dashboard/DashboardProjects";
import DashboardSettings from "./pages/dashboard/DashboardSettings";
import DashboardProjectDetail from "./pages/dashboard/DashboardProjectDetail";
import DashboardTransactions from "./pages/dashboard/DashboardTransactions";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminServices from "./pages/admin/AdminServices";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminUserDetail from "./pages/admin/AdminUserDetail";
import AdminSupport from "./pages/admin/AdminSupport";
import AdminStaff from "./pages/admin/AdminStaff";
import AdminProviders from "./pages/admin/AdminProviders";
import AdminTransactions from "./pages/admin/AdminTransactions";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminSettingsPage from "./pages/admin/AdminSettingsPage";
import CookieConsent from "./components/CookieConsent";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />}>
            <Route index element={<DashboardOverview />} />
            <Route path="orders" element={<DashboardOrders />} />
            <Route path="transactions" element={<DashboardTransactions />} />
            <Route path="projects" element={<DashboardProjects />} />
            <Route path="projects/:projectId" element={<DashboardProjectDetail />} />
            <Route path="settings" element={<DashboardSettings />} />
          </Route>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="transactions" element={<AdminTransactions />} />
            <Route path="services" element={<AdminServices />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="users/:userId" element={<AdminUserDetail />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="support" element={<AdminSupport />} />
            <Route path="staff" element={<AdminStaff />} />
            <Route path="providers" element={<AdminProviders />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
        <CookieConsent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
