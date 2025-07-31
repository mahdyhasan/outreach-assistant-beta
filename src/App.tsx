import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Auth } from "@/pages/Auth";
import Index from "./pages/Index";
import LeadManagement from "./pages/LeadManagement";
import KDMManagement from "./pages/KDMManagement";
import LeadMining from "./pages/LeadMining";
// Email campaigns functionality commented out - keeping routes for placeholders
import EmailCampaigns from "./pages/EmailCampaigns";
import EmailQueue from "./pages/EmailQueue";
import ExportLeads from "./pages/ExportLeads";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public route */}
          <Route path="/auth" element={<Auth />} />
          
          {/* Protected routes */}
          <Route path="/" element={<AuthGuard><DashboardLayout><Index /></DashboardLayout></AuthGuard>} />
          <Route path="/leads" element={<AuthGuard><DashboardLayout><LeadManagement /></DashboardLayout></AuthGuard>} />
          <Route path="/kdm" element={<AuthGuard><DashboardLayout><KDMManagement /></DashboardLayout></AuthGuard>} />
          <Route path="/mining" element={<AuthGuard><DashboardLayout><LeadMining /></DashboardLayout></AuthGuard>} />
          <Route path="/email-campaigns" element={<AuthGuard><DashboardLayout><EmailCampaigns /></DashboardLayout></AuthGuard>} />
          <Route path="/email-queue" element={<AuthGuard><DashboardLayout><EmailQueue /></DashboardLayout></AuthGuard>} />
          <Route path="/export" element={<AuthGuard><DashboardLayout><ExportLeads /></DashboardLayout></AuthGuard>} />
          <Route path="/analytics" element={<AuthGuard><DashboardLayout><Analytics /></DashboardLayout></AuthGuard>} />
          <Route path="/settings" element={<AuthGuard><DashboardLayout><Settings /></DashboardLayout></AuthGuard>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  );
}

export default App;