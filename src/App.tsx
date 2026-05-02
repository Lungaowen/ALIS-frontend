import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index.tsx";
import LoginPage from "./pages/Login.tsx";
import RegisterPage from "./pages/Register.tsx";
import NotFound from "./pages/NotFound.tsx";

import AdminDashboard from "./pages/admin/AdminDashboard.tsx";
import AdminClients from "./pages/admin/AdminClients.tsx";
import AdminAudit from "./pages/admin/AdminAudit.tsx";
import AdminReports from "./pages/admin/AdminReports.tsx";

import LegalDashboard from "./pages/legal/LegalDashboard.tsx";
import LegalDocuments from "./pages/legal/LegalDocuments.tsx";
import LegalRules from "./pages/legal/LegalRules.tsx";
import LegalReports from "./pages/legal/LegalReports.tsx";

import DealerDashboard from "./pages/dealer/DealerDashboard.tsx";
import DealerUpload from "./pages/dealer/DealerUpload.tsx";
import DealerDeals from "./pages/dealer/DealerDeals.tsx";
import DealerRisk from "./pages/dealer/DealerRisk.tsx";

import UserDashboard from "./pages/user/UserDashboard.tsx";
import UserUpload from "./pages/user/UserUpload.tsx";
import UserDocuments from "./pages/user/UserDocuments.tsx";
import UserReports from "./pages/user/UserReports.tsx";
import ProfilePage from "@/pages/Profile";

const queryClient = new QueryClient();

const guard = (allow: ("ADMIN" | "USER" | "LEGAL_PRACTITIONER" | "DEAL_MAKER")[], el: JSX.Element) =>
  <ProtectedRoute allow={allow}>{el}</ProtectedRoute>;

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Admin */}
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin/dashboard" element={guard(["ADMIN"], <AdminDashboard />)} />
            <Route path="/admin/clients" element={guard(["ADMIN"], <AdminClients />)} />
            <Route path="/admin/audit" element={guard(["ADMIN"], <AdminAudit />)} />
            <Route path="/admin/reports" element={guard(["ADMIN"], <AdminReports />)} />

            {/* Legal */}
            <Route path="/legal" element={<Navigate to="/legal/dashboard" replace />} />
            <Route path="/legal/dashboard" element={guard(["LEGAL_PRACTITIONER"], <LegalDashboard />)} />
            <Route path="/legal/documents" element={guard(["LEGAL_PRACTITIONER"], <LegalDocuments />)} />
            <Route path="/legal/rules" element={guard(["LEGAL_PRACTITIONER"], <LegalRules />)} />
            <Route path="/legal/reports" element={guard(["LEGAL_PRACTITIONER"], <LegalReports />)} />

            {/* Deal Maker */}
            <Route path="/dealer" element={<Navigate to="/dealer/dashboard" replace />} />
            <Route path="/dealer/dashboard" element={guard(["DEAL_MAKER"], <DealerDashboard />)} />
            <Route path="/dealer/upload" element={guard(["DEAL_MAKER"], <DealerUpload />)} />
            <Route path="/dealer/deals" element={guard(["DEAL_MAKER"], <DealerDeals />)} />
            <Route path="/dealer/risk" element={guard(["DEAL_MAKER"], <DealerRisk />)} />

            {/* User */}
            <Route path="/user" element={<Navigate to="/user/dashboard" replace />} />
            <Route path="/user/dashboard" element={guard(["USER"], <UserDashboard />)} />
            <Route path="/user/upload" element={guard(["USER"], <UserUpload />)} />
            <Route path="/user/documents" element={guard(["USER"], <UserDocuments />)} />
            <Route path="/user/reports" element={guard(["USER"], <UserReports />)} />

            {/* Profile – accessible to any authenticated user */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute allow={["ADMIN", "USER", "LEGAL_PRACTITIONER", "DEAL_MAKER"]}>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            {/* Legacy aliases — redirect old /dashboard to role home */}
            <Route path="/dashboard/*" element={<Navigate to="/login" replace />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;