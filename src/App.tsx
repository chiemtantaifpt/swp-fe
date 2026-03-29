import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import queryClient from "@/lib/queryClient";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Landing from "./pages/Landing";
import AuthPage from "./pages/auth/AuthPage";
import VerifyEmailPage from "./pages/auth/VerifyEmailPage";
import CitizenDashboard from "./pages/citizen/CitizenDashboard";
import EnterpriseDashboard from "./pages/enterprise/EnterpriseDashboard";
import CollectorDashboard from "./pages/collector/CollectorDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ProfilePage from "./pages/profile/ProfilePage";
import NotFound from "./pages/NotFound";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<AuthPage />} />
            <Route path="/register" element={<AuthPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/citizen" element={<ProtectedRoute allowedRoles={["Citizen"]}><CitizenDashboard /></ProtectedRoute>} />
            <Route path="/enterprise" element={<ProtectedRoute allowedRoles={["Enterprise"]}><EnterpriseDashboard /></ProtectedRoute>} />
            <Route path="/collector" element={<ProtectedRoute allowedRoles={["Collector"]}><CollectorDashboard /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute allowedRoles={["Admin"]}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute allowedRoles={["Citizen", "Enterprise", "Collector", "Admin"]}><ProfilePage /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
