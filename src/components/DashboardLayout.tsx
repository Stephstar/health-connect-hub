import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Heart, Home, Calendar, FileText, MessageSquare, Brain, CreditCard,
  Settings, LogOut, User, Menu, X, Bell, Users, BarChart3,
  Stethoscope, ClipboardList, Video, ChevronLeft
} from 'lucide-react';

const navItems = {
  patient: [
    { icon: Home, label: 'Dashboard', path: '/patient/dashboard' },
    { icon: Calendar, label: 'Appointments', path: '/patient/appointments' },
    { icon: FileText, label: 'Medical Records', path: '/patient/records' },
    { icon: MessageSquare, label: 'Messages', path: '/patient/messages' },
    { icon: Brain, label: 'AI Assistant', path: '/patient/ai-assistant' },
    { icon: CreditCard, label: 'Billing', path: '/patient/billing' },
    { icon: Settings, label: 'Settings', path: '/patient/settings' },
  ],
  doctor: [
    { icon: Home, label: 'Dashboard', path: '/doctor/dashboard' },
    { icon: Calendar, label: 'Appointments', path: '/doctor/appointments' },
    { icon: Users, label: 'Patients', path: '/doctor/patients' },
    { icon: ClipboardList, label: 'Prescriptions', path: '/doctor/prescriptions' },
    { icon: MessageSquare, label: 'Messages', path: '/doctor/messages' },
    { icon: Video, label: 'Consultations', path: '/doctor/consultations' },
    { icon: Settings, label: 'Settings', path: '/doctor/settings' },
  ],
  admin: [
    { icon: Home, label: 'Dashboard', path: '/admin/dashboard' },
    { icon: Users, label: 'Users', path: '/admin/users' },
    { icon: Stethoscope, label: 'Doctors', path: '/admin/doctors' },
    { icon: Calendar, label: 'Appointments', path: '/admin/appointments' },
    { icon: BarChart3, label: 'Analytics', path: '/admin/analytics' },
    { icon: CreditCard, label: 'Revenue', path: '/admin/revenue' },
    { icon: Settings, label: 'Settings', path: '/admin/settings' },
  ],
};

interface DashboardLayoutProps {
  role: 'patient' | 'doctor' | 'admin';
  title: string;
  children: React.ReactNode;
}

export default function DashboardLayout({ role, title, children }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const items = navItems[role];

  const dashboardPath = `/${role}/dashboard`;
  const isOnDashboard = location.pathname === dashboardPath;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-64 flex-col border-r bg-card fixed inset-y-0 left-0 z-30">
        <div className="h-16 flex items-center gap-2 px-6 border-b">
          <Heart className="h-6 w-6 text-primary" />
          <span className="font-bold font-heading text-foreground">MediConnect</span>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {items.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === item.path
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate capitalize">{role}</p>
            </div>
          </div>
          <Button variant="ghost" className="w-full justify-start text-muted-foreground" onClick={() => { logout(); navigate('/'); }}>
            <LogOut className="h-4 w-4 mr-2" /> Sign Out
          </Button>
        </div>
      </aside>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <aside className="fixed inset-y-0 left-0 w-72 bg-card shadow-elevated z-50 flex flex-col">
            <div className="h-16 flex items-center justify-between px-6 border-b">
              <div className="flex items-center gap-2">
                <Heart className="h-6 w-6 text-primary" />
                <span className="font-bold font-heading">MediConnect</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)}><X className="h-5 w-5" /></button>
            </div>
            <nav className="flex-1 p-4 space-y-1">
              {items.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === item.path ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="p-4 border-t">
              <Button variant="ghost" className="w-full justify-start text-muted-foreground" onClick={() => { logout(); setMobileMenuOpen(false); navigate('/'); }}>
                <LogOut className="h-4 w-4 mr-2" /> Sign Out
              </Button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 lg:ml-64">
        <header className="h-16 border-b bg-card flex items-center justify-between px-4 lg:px-8 sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <button className="lg:hidden" onClick={() => setMobileMenuOpen(true)}><Menu className="h-5 w-5" /></button>
            {!isOnDashboard && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)} aria-label="Go back">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            )}
            <h1 className="text-lg font-semibold font-heading text-foreground">{title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(role === 'patient' ? '/patient/notifications' : `/${role}/dashboard`)}
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5 text-muted-foreground" />
            </Button>
          </div>
        </header>
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
