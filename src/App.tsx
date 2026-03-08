import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Privacy from "./pages/Privacy";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import AdminLayout from "./pages/AdminLayout";
import DashboardOverview from "./pages/dashboard/DashboardOverview";
import DashboardOrders from "./pages/dashboard/DashboardOrders";
import DashboardProjects from "./pages/dashboard/DashboardProjects";
import DashboardSettings from "./pages/dashboard/DashboardSettings";
import DashboardProjectDetail from "./pages/dashboard/DashboardProjectDetail";
import DashboardTransactions from "./pages/dashboard/DashboardTransactions";
import DashboardSupport from "./pages/dashboard/DashboardSupport";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
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
import AdminPromocodes from "./pages/admin/AdminPromocodes";
import AdminPages from "./pages/admin/AdminPages";
import AdminFAQ from "./pages/admin/AdminFAQ";
import AdminWidgets from "./pages/admin/AdminWidgets";
import AdminLinks from "./pages/admin/AdminLinks";
import AdminDocs from "./pages/admin/AdminDocs";
import CookieConsent from "./components/CookieConsent";
import SiteWidgets from "./components/SiteWidgets";
import DynamicPage from "./pages/DynamicPage";
import Catalog from "./pages/Catalog";
import LicenseGate from "./components/LicenseGate";
import AdminLicenses from "./pages/admin/AdminLicenses";
import AdminBots from "./pages/admin/AdminBots";
import AdminInquiries from "./pages/admin/AdminInquiries";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminAPI from "./pages/admin/AdminAPI";
import Contact from "./pages/Contact";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <LicenseGate>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/dashboard" element={<Dashboard />}>
              <Route index element={<DashboardOverview />} />
              <Route path="orders" element={<DashboardOrders />} />
              <Route path="transactions" element={<DashboardTransactions />} />
              <Route path="projects" element={<DashboardProjects />} />
              <Route path="projects/:projectId" element={<DashboardProjectDetail />} />
              <Route path="settings" element={<DashboardSettings />} />
              <Route path="support" element={<DashboardSupport />} />
            </Route>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="analytics" element={<AdminAnalytics />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="transactions" element={<AdminTransactions />} />
              <Route path="services" element={<AdminServices />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="users/:userId" element={<AdminUserDetail />} />
              <Route path="categories" element={<AdminCategories />} />
              <Route path="promocodes" element={<AdminPromocodes />} />
              <Route path="settings" element={<AdminSettingsPage />} />
              <Route path="pages" element={<AdminPages />} />
              <Route path="faq" element={<AdminFAQ />} />
              <Route path="widgets" element={<AdminWidgets />} />
              <Route path="support" element={<AdminSupport />} />
              <Route path="staff" element={<AdminStaff />} />
              <Route path="providers" element={<AdminProviders />} />
              <Route path="links" element={<AdminLinks />} />
              <Route path="docs" element={<AdminDocs />} />
              <Route path="licenses" element={<AdminLicenses />} />
              <Route path="bots" element={<AdminBots />} />
              <Route path="inquiries" element={<AdminInquiries />} />
              <Route path="payments" element={<AdminPayments />} />
            </Route>
            <Route path="/page/:slug" element={<DynamicPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </LicenseGate>
        <CookieConsent />
        <SiteWidgets />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
