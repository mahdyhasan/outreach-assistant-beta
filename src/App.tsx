import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Auth } from "@/pages/Auth";
import Index from "./pages/Index";
import LeadManagement from "./pages/LeadManagement";
import LeadMining from "./pages/LeadMining";
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
          <Route path="/" element={<AuthGuard><Index /></AuthGuard>} />
          <Route path="/leads" element={<AuthGuard><LeadManagement /></AuthGuard>} />
          <Route path="/mining" element={<AuthGuard><LeadMining /></AuthGuard>} />
          <Route path="/email-campaigns" element={<AuthGuard><EmailCampaigns /></AuthGuard>} />
          <Route path="/email-queue" element={<AuthGuard><EmailQueue /></AuthGuard>} />
          <Route path="/export" element={<AuthGuard><ExportLeads /></AuthGuard>} />
          <Route path="/analytics" element={<AuthGuard><Analytics /></AuthGuard>} />
          <Route path="/settings" element={<AuthGuard><Settings /></AuthGuard>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  );
}

export default App;