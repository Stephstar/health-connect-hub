import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { Users, MessageSquare, Clock, Video, CheckCircle2 } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';

export default function DoctorDashboard() {
  const { user } = useAuth();
  const { appointments, messages, updateAppointmentStatus } = useApp();
  const navigate = useNavigate();
  const [today, setToday] = useState<typeof appointments>([]);

  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    setToday(appointments.filter(a => a.date >= todayStr && a.status !== 'cancelled').slice(0, 5));
  }, [appointments]);

  const pending = appointments.filter(a => a.status === 'pending').length;
  const completed = appointments.filter(a => a.status === 'completed').length;
  const unreadMsgs = messages.filter(m => !m.isRead && m.recipientId === user?.id).length;

  return (
    <DashboardLayout role="doctor" title="Dashboard">
      <div className="space-y-6">
        <div className="rounded-xl gradient-primary p-6">
          <h2 className="text-xl font-bold font-heading text-primary-foreground mb-1">Good day, {user?.name}! 👋</h2>
          <p className="text-primary-foreground/80 text-sm">You have {today.length} upcoming appointment{today.length !== 1 ? 's' : ''}.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Upcoming', value: String(today.length), icon: Users, color: 'text-primary bg-primary/10' },
            { label: 'Pending Requests', value: String(pending), icon: Clock, color: 'text-warning bg-warning/10' },
            { label: 'Unread Messages', value: String(unreadMsgs), icon: MessageSquare, color: 'text-accent bg-accent/10' },
            { label: 'Completed', value: String(completed), icon: CheckCircle2, color: 'text-success bg-success/10' },
          ].map(s => (
            <Card key={s.label} className="p-4 shadow-card">
              <div className={`h-10 w-10 rounded-lg ${s.color} flex items-center justify-center mb-2`}><s.icon className="h-5 w-5" /></div>
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </Card>
          ))}
        </div>

        <div>
          <h3 className="text-lg font-semibold font-heading text-foreground mb-4">Upcoming Appointments</h3>
          <div className="space-y-3">
            {today.length === 0 ? (
              <Card className="p-6 text-center text-muted-foreground shadow-card">No upcoming appointments.</Card>
            ) : today.map(apt => (
              <Card key={apt.id} className="p-4 shadow-card">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                      {apt.doctorName.split(' ').map(n => n[0]).slice(0, 2).join('')}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground text-sm truncate">{apt.doctorName}</p>
                      <p className="text-xs text-muted-foreground truncate">{apt.date} {apt.time} • {apt.reason || 'Consultation'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={apt.type === 'video' ? 'default' : 'secondary'}>{apt.type === 'video' ? 'Video' : 'In-Person'}</Badge>
                    {apt.status === 'pending' ? (
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => updateAppointmentStatus(apt.id, 'upcoming')}>Accept</Button>
                        <Button size="sm" variant="ghost" onClick={() => updateAppointmentStatus(apt.id, 'cancelled')}>Decline</Button>
                      </div>
                    ) : (
                      <Button size="sm" onClick={() => navigate('/doctor/video-call')}>
                        {apt.type === 'video' ? <><Video className="h-3 w-3 mr-1" /> Start</> : 'View'}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
