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

import PatientDashboard from "./pages/patient/PatientDashboard";
import AppointmentBooking from "./pages/patient/AppointmentBooking";
import MedicalRecords from "./pages/patient/MedicalRecords";
import SecureMessaging from "./pages/patient/SecureMessaging";
import AIAssistant from "./pages/patient/AIAssistant";
import BillingDashboard from "./pages/patient/BillingDashboard";
import ConsultationPage from "./pages/patient/ConsultationPage";
import OnboardingPage from "./pages/patient/OnboardingPage";
import SettingsPage from "./pages/patient/SettingsPage";
import NotificationsPage from "./pages/patient/NotificationsPage";

import DoctorDashboard from "./pages/doctor/DoctorDashboard";
import DoctorAppointments from "./pages/doctor/DoctorAppointments";
import DoctorPatients from "./pages/doctor/DoctorPatients";
import DoctorPrescriptions from "./pages/doctor/DoctorPrescriptions";
import DoctorMessages from "./pages/doctor/DoctorMessages";
import DoctorConsultations from "./pages/doctor/DoctorConsultations";
import DoctorSettings from "./pages/doctor/DoctorSettings";

import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminDoctors from "./pages/admin/AdminDoctors";
import AdminAppointments from "./pages/admin/AdminAppointments";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminRevenue from "./pages/admin/AdminRevenue";
import AdminSettings from "./pages/admin/AdminSettings";

const queryClient = new QueryClient();

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { isAuthenticated, user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }
  return <>{children}</>;
}

function landingTarget(user: { role: string; onboardingComplete?: boolean } | null) {
  if (!user) return '/';
  if (user.role === 'patient' && !user.onboardingComplete) return '/onboarding';
  return `/${user.role}/dashboard`;
}

function AppRoutes() {
  const { isAuthenticated, user, isLoading } = useAuth();
  if (isLoading) return null;

  return (
    <Routes>
      <Route path="/" element={isAuthenticated ? <Navigate to={landingTarget(user)} replace /> : <LandingPage />} />
      <Route path="/login" element={isAuthenticated ? <Navigate to={landingTarget(user)} replace /> : <LoginPage />} />
      <Route path="/signup" element={isAuthenticated ? <Navigate to={landingTarget(user)} replace /> : <SignupPage />} />
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
      <Route path="/patient/settings" element={<ProtectedRoute allowedRoles={['patient']}><SettingsPage /></ProtectedRoute>} />
      <Route path="/patient/notifications" element={<ProtectedRoute allowedRoles={['patient']}><NotificationsPage /></ProtectedRoute>} />

      {/* Doctor Routes */}
      <Route path="/doctor/dashboard" element={<ProtectedRoute allowedRoles={['doctor']}><DoctorDashboard /></ProtectedRoute>} />
      <Route path="/doctor/appointments" element={<ProtectedRoute allowedRoles={['doctor']}><DoctorAppointments /></ProtectedRoute>} />
      <Route path="/doctor/patients" element={<ProtectedRoute allowedRoles={['doctor']}><DoctorPatients /></ProtectedRoute>} />
      <Route path="/doctor/prescriptions" element={<ProtectedRoute allowedRoles={['doctor']}><DoctorPrescriptions /></ProtectedRoute>} />
      <Route path="/doctor/messages" element={<ProtectedRoute allowedRoles={['doctor']}><DoctorMessages /></ProtectedRoute>} />
      <Route path="/doctor/consultations" element={<ProtectedRoute allowedRoles={['doctor']}><DoctorConsultations /></ProtectedRoute>} />
      <Route path="/doctor/settings" element={<ProtectedRoute allowedRoles={['doctor']}><DoctorSettings /></ProtectedRoute>} />
      <Route path="/doctor/video-call" element={<ProtectedRoute allowedRoles={['doctor']}><ConsultationPage /></ProtectedRoute>} />

      {/* Admin Routes */}
      <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><AdminUsers /></ProtectedRoute>} />
      <Route path="/admin/doctors" element={<ProtectedRoute allowedRoles={['admin']}><AdminDoctors /></ProtectedRoute>} />
      <Route path="/admin/appointments" element={<ProtectedRoute allowedRoles={['admin']}><AdminAppointments /></ProtectedRoute>} />
      <Route path="/admin/analytics" element={<ProtectedRoute allowedRoles={['admin']}><AdminAnalytics /></ProtectedRoute>} />
      <Route path="/admin/revenue" element={<ProtectedRoute allowedRoles={['admin']}><AdminRevenue /></ProtectedRoute>} />
      <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['admin']}><AdminSettings /></ProtectedRoute>} />

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
