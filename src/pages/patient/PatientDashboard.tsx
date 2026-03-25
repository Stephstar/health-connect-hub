import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Heart, Calendar, FileText, Brain, MessageSquare, CreditCard,
  Video, Bell, Clock, ChevronRight, Pill, Activity,
  LogOut, User, Settings, Home, Menu, X
} from 'lucide-react';
import { useState } from 'react';

const sidebarItems = [
  { icon: Home, label: 'Dashboard', path: '/patient/dashboard' },
  { icon: Calendar, label: 'Appointments', path: '/patient/appointments' },
  { icon: FileText, label: 'Medical Records', path: '/patient/records' },
  { icon: MessageSquare, label: 'Messages', path: '/patient/messages' },
  { icon: Brain, label: 'AI Assistant', path: '/patient/ai-assistant' },
  { icon: CreditCard, label: 'Billing', path: '/patient/billing' },
  { icon: Settings, label: 'Settings', path: '/patient/settings' },
];

const quickActions = [
  { icon: Calendar, label: 'Book Appointment', path: '/patient/appointments', color: 'bg-primary/10 text-primary' },
  { icon: FileText, label: 'View Records', path: '/patient/records', color: 'bg-accent/10 text-accent' },
  { icon: Brain, label: 'AI Assistant', path: '/patient/ai-assistant', color: 'bg-success/10 text-success' },
  { icon: MessageSquare, label: 'Messages', path: '/patient/messages', color: 'bg-warning/10 text-warning' },
  { icon: CreditCard, label: 'Billing', path: '/patient/billing', color: 'bg-destructive/10 text-destructive' },
  { icon: Video, label: 'Start Consultation', path: '/patient/consultation', color: 'bg-primary/10 text-primary' },
];

export default function PatientDashboard() {
  const { user, logout } = useAuth();
  const { appointments, notifications } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const upcomingAppointments = appointments.filter(a => a.status === 'upcoming');
  const unreadNotifications = notifications.filter(n => !n.read);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-64 flex-col border-r bg-card fixed inset-y-0 left-0 z-30">
        <div className="h-16 flex items-center gap-2 px-6 border-b">
          <Heart className="h-6 w-6 text-primary" />
          <span className="font-bold font-heading text-foreground">MediConnect</span>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {sidebarItems.map(item => (
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
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
          <Button variant="ghost" className="w-full justify-start text-muted-foreground" onClick={logout}>
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
              {sidebarItems.map(item => (
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
              <Button variant="ghost" className="w-full justify-start text-muted-foreground" onClick={() => { logout(); setMobileMenuOpen(false); }}>
                <LogOut className="h-4 w-4 mr-2" /> Sign Out
              </Button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 lg:ml-64">
        {/* Top bar */}
        <header className="h-16 border-b bg-card flex items-center justify-between px-4 lg:px-8 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button className="lg:hidden" onClick={() => setMobileMenuOpen(true)}><Menu className="h-5 w-5" /></button>
            <h1 className="text-lg font-semibold font-heading text-foreground">Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-lg hover:bg-muted transition-colors" onClick={() => navigate('/patient/notifications')}>
              <Bell className="h-5 w-5 text-muted-foreground" />
              {unreadNotifications.length > 0 && (
                <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-bold">{unreadNotifications.length}</span>
              )}
            </button>
          </div>
        </header>

        <div className="p-4 lg:p-8 space-y-6">
          {/* Welcome */}
          <div className="rounded-xl gradient-primary p-6 lg:p-8">
            <h2 className="text-xl lg:text-2xl font-bold font-heading text-primary-foreground mb-2">
              Welcome back, {user?.name?.split(' ')[0]}! 👋
            </h2>
            <p className="text-primary-foreground/80 text-sm lg:text-base">You have {upcomingAppointments.length} upcoming appointment{upcomingAppointments.length !== 1 ? 's' : ''}.</p>
          </div>

          {/* Quick Actions */}
          <div>
            <h3 className="text-lg font-semibold font-heading text-foreground mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {quickActions.map(action => (
                <Card
                  key={action.label}
                  className="p-4 shadow-card hover:shadow-card-hover cursor-pointer transition-all group"
                  onClick={() => navigate(action.path)}
                >
                  <div className={`h-10 w-10 rounded-lg ${action.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                    <action.icon className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-medium text-foreground">{action.label}</p>
                </Card>
              ))}
            </div>
          </div>

          {/* Upcoming Appointments */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold font-heading text-foreground">Upcoming Appointments</h3>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/patient/appointments">View All <ChevronRight className="h-4 w-4 ml-1" /></Link>
              </Button>
            </div>
            <div className="space-y-3">
              {upcomingAppointments.length === 0 ? (
                <Card className="p-6 text-center shadow-card">
                  <p className="text-muted-foreground">No upcoming appointments</p>
                  <Button size="sm" className="mt-3" onClick={() => navigate('/patient/appointments')}>Book Now</Button>
                </Card>
              ) : (
                upcomingAppointments.map(apt => (
                  <Card key={apt.id} className="p-4 shadow-card hover:shadow-card-hover transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <Activity className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground text-sm">{apt.doctorName}</p>
                          <p className="text-xs text-muted-foreground">{apt.doctorSpecialty}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{apt.date} at {apt.time}</span>
                            <Badge variant={apt.type === 'video' ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0">
                              {apt.type === 'video' ? 'Video' : 'In-Person'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <Button size="sm" onClick={() => navigate(apt.type === 'video' ? '/patient/consultation' : '/patient/appointments')}>
                        {apt.type === 'video' ? 'Join Call' : 'Details'}
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Notifications & Medications */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold font-heading text-foreground mb-4">Recent Notifications</h3>
              <Card className="shadow-card divide-y">
                {notifications.slice(0, 3).map(n => (
                  <div key={n.id} className={`p-4 flex items-start gap-3 ${!n.read ? 'bg-primary/5' : ''}`}>
                    <Bell className={`h-4 w-4 mt-0.5 ${!n.read ? 'text-primary' : 'text-muted-foreground'}`} />
                    <div>
                      <p className="text-sm font-medium text-foreground">{n.title}</p>
                      <p className="text-xs text-muted-foreground">{n.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{n.time}</p>
                    </div>
                  </div>
                ))}
              </Card>
            </div>
            <div>
              <h3 className="text-lg font-semibold font-heading text-foreground mb-4">Medication Reminders</h3>
              <Card className="shadow-card divide-y">
                {[
                  { name: 'Lisinopril 10mg', time: '8:00 AM', status: 'taken' },
                  { name: 'Metformin 500mg', time: '12:00 PM', status: 'upcoming' },
                  { name: 'Aspirin 81mg', time: '8:00 PM', status: 'upcoming' },
                ].map((med, i) => (
                  <div key={i} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Pill className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{med.name}</p>
                        <p className="text-xs text-muted-foreground">{med.time}</p>
                      </div>
                    </div>
                    <Badge variant={med.status === 'taken' ? 'default' : 'secondary'} className="text-xs">
                      {med.status === 'taken' ? '✓ Taken' : 'Upcoming'}
                    </Badge>
                  </div>
                ))}
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
