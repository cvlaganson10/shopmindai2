import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardLayout from "./components/DashboardLayout";
import DashboardHome from "./pages/DashboardHome";
import UploadPage from "./pages/UploadPage";
import ConversationsPage from "./pages/ConversationsPage";
import ProductsPage from "./pages/ProductsPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import SettingsPage from "./pages/SettingsPage";
import KnowledgeBasePage from "./pages/KnowledgeBasePage";
import BillingPage from "./pages/BillingPage";
import AgentSettingsPage from "./pages/AgentSettingsPage";
import TeamPage from "./pages/TeamPage";
import ChatWidget from "./pages/ChatWidget";
import VoiceAssistant from "./pages/VoiceAssistant";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/chat/:storeId" element={<ChatWidget />} />
            <Route path="/voice/:storeId" element={<VoiceAssistant />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardHome />} />
              <Route path="upload" element={<UploadPage />} />
              <Route path="conversations" element={<ConversationsPage />} />
              <Route path="products" element={<ProductsPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="knowledge-base" element={<KnowledgeBasePage />} />
              <Route path="billing" element={<BillingPage />} />
              <Route path="agent-settings" element={<AgentSettingsPage />} />
              <Route path="team" element={<TeamPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
