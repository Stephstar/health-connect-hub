import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppProvider } from "@/contexts/AppContext";

import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import Verify2FAPage from "./pages/Verify2FAPage";
import NotFound from "./pages/NotFound";
import PlaceholderPage from "./pages/PlaceholderPage";

import PatientDashboard from "./pages/patient/PatientDashboard";
import AppointmentBooking from "./pages/patient/AppointmentBooking";
import MedicalRecords from "./pages/patient/MedicalRecords";
import SecureMessaging from "./pages/patient/SecureMessaging";
import AIAssistant from "./pages/patient/AIAssistant";
import BillingDashboard from "./pages/patient/BillingDashboard";
import ConsultationPage from "./pages/patient/ConsultationPage";
import OnboardingPage from "./pages/patient/OnboardingPage";

import DoctorDashboard from "./pages/doctor/DoctorDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";

const queryClient = new QueryClient();

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated, user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={isAuthenticated ? <Navigate to={`/${user?.role}/dashboard`} replace /> : <LandingPage />} />
      <Route path="/login" element={isAuthenticated ? <Navigate to={`/${user?.role}/dashboard`} replace /> : <LoginPage />} />
      <Route path="/signup" element={isAuthenticated ? <Navigate to={`/${user?.role}/dashboard`} replace /> : <SignupPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/verify-2fa" element={<Verify2FAPage />} />
      <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />

      {/* Patient Routes */}
      <Route path="/patient/dashboard" element={<ProtectedRoute allowedRoles={['patient']}><PatientDashboard /></ProtectedRoute>} />
      <Route path="/patient/appointments" element={<ProtectedRoute allowedRoles={['patient']}><AppointmentBooking /></ProtectedRoute>} />
      <Route path="/patient/records" element={<ProtectedRoute allowedRoles={['patient']}><MedicalRecords /></ProtectedRoute>} />
      <Route path="/patient/messages" element={<ProtectedRoute allowedRoles={['patient']}><SecureMessaging /></ProtectedRoute>} />
      <Route path="/patient/ai-assistant" element={<ProtectedRoute allowedRoles={['patient']}><AIAssistant /></ProtectedRoute>} />
      <Route path="/patient/billing" element={<ProtectedRoute allowedRoles={['patient']}><BillingDashboard /></ProtectedRoute>} />
      <Route path="/patient/consultation" element={<ProtectedRoute allowedRoles={['patient']}><ConsultationPage /></ProtectedRoute>} />
      <Route path="/patient/settings" element={<ProtectedRoute allowedRoles={['patient']}><PlaceholderPage role="patient" title="Settings" /></ProtectedRoute>} />
      <Route path="/patient/notifications" element={<ProtectedRoute allowedRoles={['patient']}><PlaceholderPage role="patient" title="Notifications" /></ProtectedRoute>} />

      {/* Doctor Routes */}
      <Route path="/doctor/dashboard" element={<ProtectedRoute allowedRoles={['doctor']}><DoctorDashboard /></ProtectedRoute>} />
      <Route path="/doctor/appointments" element={<ProtectedRoute allowedRoles={['doctor']}><PlaceholderPage role="doctor" title="Appointments" /></ProtectedRoute>} />
      <Route path="/doctor/patients" element={<ProtectedRoute allowedRoles={['doctor']}><PlaceholderPage role="doctor" title="Patients" /></ProtectedRoute>} />
      <Route path="/doctor/prescriptions" element={<ProtectedRoute allowedRoles={['doctor']}><PlaceholderPage role="doctor" title="Prescriptions" /></ProtectedRoute>} />
      <Route path="/doctor/messages" element={<ProtectedRoute allowedRoles={['doctor']}><PlaceholderPage role="doctor" title="Messages" /></ProtectedRoute>} />
      <Route path="/doctor/consultations" element={<ProtectedRoute allowedRoles={['doctor']}><PlaceholderPage role="doctor" title="Consultations" /></ProtectedRoute>} />
      <Route path="/doctor/settings" element={<ProtectedRoute allowedRoles={['doctor']}><PlaceholderPage role="doctor" title="Settings" /></ProtectedRoute>} />

      {/* Admin Routes */}
      <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><PlaceholderPage role="admin" title="User Management" /></ProtectedRoute>} />
      <Route path="/admin/doctors" element={<ProtectedRoute allowedRoles={['admin']}><PlaceholderPage role="admin" title="Doctor Management" /></ProtectedRoute>} />
      <Route path="/admin/appointments" element={<ProtectedRoute allowedRoles={['admin']}><PlaceholderPage role="admin" title="Appointments" /></ProtectedRoute>} />
      <Route path="/admin/analytics" element={<ProtectedRoute allowedRoles={['admin']}><PlaceholderPage role="admin" title="Analytics" /></ProtectedRoute>} />
      <Route path="/admin/revenue" element={<ProtectedRoute allowedRoles={['admin']}><PlaceholderPage role="admin" title="Revenue" /></ProtectedRoute>} />
      <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['admin']}><PlaceholderPage role="admin" title="Settings" /></ProtectedRoute>} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <AppProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AppProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
