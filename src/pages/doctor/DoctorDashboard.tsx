import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, Users, MessageSquare, Clock, Video, CheckCircle2, AlertTriangle } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';

const TODAY_APPOINTMENTS = [
  { id: '1', patient: 'Sarah Johnson', time: '10:00 AM', type: 'video', status: 'upcoming', reason: 'Follow-up' },
  { id: '2', patient: 'James Owusu', time: '11:30 AM', type: 'in-person', status: 'upcoming', reason: 'New consultation' },
  { id: '3', patient: 'Grace Mensah', time: '2:00 PM', type: 'video', status: 'pending', reason: 'Chest pain review' },
];

export default function DoctorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <DashboardLayout role="doctor" title="Dashboard">
      <div className="space-y-6">
        <div className="rounded-xl gradient-primary p-6">
          <h2 className="text-xl font-bold font-heading text-primary-foreground mb-1">Good morning, {user?.name}! 👋</h2>
          <p className="text-primary-foreground/80 text-sm">You have {TODAY_APPOINTMENTS.length} appointments today.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Today's Patients", value: '3', icon: Users, color: 'text-primary bg-primary/10' },
            { label: 'Pending Requests', value: '5', icon: Clock, color: 'text-warning bg-warning/10' },
            { label: 'Messages', value: '8', icon: MessageSquare, color: 'text-accent bg-accent/10' },
            { label: 'Completed', value: '12', icon: CheckCircle2, color: 'text-success bg-success/10' },
          ].map(s => (
            <Card key={s.label} className="p-4 shadow-card">
              <div className={`h-10 w-10 rounded-lg ${s.color} flex items-center justify-center mb-2`}><s.icon className="h-5 w-5" /></div>
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </Card>
          ))}
        </div>

        <div>
          <h3 className="text-lg font-semibold font-heading text-foreground mb-4">Today's Appointments</h3>
          <div className="space-y-3">
            {TODAY_APPOINTMENTS.map(apt => (
              <Card key={apt.id} className="p-4 shadow-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">{apt.patient.split(' ').map(n=>n[0]).join('')}</div>
                    <div>
                      <p className="font-medium text-foreground text-sm">{apt.patient}</p>
                      <p className="text-xs text-muted-foreground">{apt.time} • {apt.reason}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={apt.type === 'video' ? 'default' : 'secondary'}>{apt.type === 'video' ? 'Video' : 'In-Person'}</Badge>
                    {apt.status === 'pending' ? (
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => navigate('/doctor/consultations')}>Accept</Button>
                        <Button size="sm" variant="ghost">Decline</Button>
                      </div>
                    ) : (
                      <Button size="sm" onClick={() => navigate('/doctor/consultations')}>
                        {apt.type === 'video' ? <><Video className="h-3 w-3 mr-1" /> Start</> : 'View'}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold font-heading text-foreground mb-4">Patient Alerts</h3>
          <Card className="p-4 shadow-card">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-warning" />
              <div>
                <p className="text-sm font-medium text-foreground">Grace Mensah - Elevated blood pressure</p>
                <p className="text-xs text-muted-foreground">Last reading: 150/95 mmHg • Requires follow-up</p>
              </div>
              <Button size="sm" variant="outline" className="ml-auto" onClick={() => navigate('/doctor/patients')}>Review</Button>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
