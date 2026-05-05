import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Users, MessageSquare, Clock, Video, CheckCircle2, Calendar, MapPin } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';

interface DashboardAppointment {
  id: string;
  patientName: string;
  patientId: string;
  date: string;
  time: string;
  type: 'video' | 'in-person';
  status: string;
  reason: string;
}

export default function DoctorDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<DashboardAppointment[]>([]);
  const [stats, setStats] = useState({ pending: 0, completed: 0, unread: 0, upcoming: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      // Get doctor record
      const { data: doc } = await supabase.from('doctors').select('id').eq('user_id', user.id).single();
      if (!doc) { setLoading(false); return; }

      const todayStr = new Date().toISOString().split('T')[0];

      // Get upcoming appointments
      const { data: apts } = await supabase
        .from('appointments')
        .select('id, patient_id, appointment_date, appointment_time, type, status, reason')
        .eq('doctor_id', doc.id)
        .gte('appointment_date', todayStr)
        .neq('status', 'cancelled')
        .order('appointment_date', { ascending: true })
        .limit(10);

      if (apts && apts.length > 0) {
        const patientIds = [...new Set(apts.map(a => a.patient_id))];
        const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', patientIds);
        const pMap = new Map((profiles || []).map(p => [p.id, p.full_name]));

        setAppointments(apts.map(a => ({
          id: a.id,
          patientName: pMap.get(a.patient_id) || 'Unknown Patient',
          patientId: a.patient_id,
          date: a.appointment_date,
          time: a.appointment_time,
          type: a.type as 'video' | 'in-person',
          status: a.status,
          reason: a.reason || 'Consultation',
        })));
      }

      // Count stats from all appointments
      const { data: allApts } = await supabase
        .from('appointments')
        .select('status')
        .eq('doctor_id', doc.id);

      const pending = (allApts || []).filter(a => a.status === 'pending').length;
      const completed = (allApts || []).filter(a => a.status === 'completed').length;
      const upcoming = (apts || []).filter(a => a.status === 'upcoming').length;

      // Get unread messages
      const { count } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('recipient_id', user.id)
        .eq('is_read', false);

      setStats({ pending, completed, unread: count || 0, upcoming });
      setLoading(false);
    })();
  }, [user]);

  const updateStatus = async (id: string, status: 'upcoming' | 'completed' | 'cancelled' | 'pending', msg: string) => {
    const confirmed = window.confirm(`Are you sure you want to ${status === 'upcoming' ? 'accept' : 'decline'} this appointment?`);
    if (!confirmed) return;
    await supabase.from('appointments').update({ status }).eq('id', id);
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    toast({ title: msg });
  };

  return (
    <DashboardLayout role="doctor" title="Dashboard">
      <div className="space-y-6">
        <div className="rounded-xl gradient-primary p-6">
          <h2 className="text-xl font-bold font-heading text-primary-foreground mb-1">Good day, Dr. {user?.name?.split(' ').slice(-1)[0]}! 👋</h2>
          <p className="text-primary-foreground/80 text-sm">
            You have {stats.upcoming} upcoming appointment{stats.upcoming !== 1 ? 's' : ''}
            {stats.pending > 0 ? ` and ${stats.pending} pending request${stats.pending !== 1 ? 's' : ''}` : ''}.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Upcoming', value: String(stats.upcoming), icon: Calendar, color: 'text-primary bg-primary/10', onClick: () => navigate('/doctor/appointments') },
            { label: 'Pending Requests', value: String(stats.pending), icon: Clock, color: 'text-warning bg-warning/10', onClick: () => navigate('/doctor/appointments') },
            { label: 'Unread Messages', value: String(stats.unread), icon: MessageSquare, color: 'text-accent bg-accent/10', onClick: () => navigate('/doctor/messages') },
            { label: 'Completed', value: String(stats.completed), icon: CheckCircle2, color: 'text-success bg-success/10', onClick: () => navigate('/doctor/consultations') },
          ].map(s => (
            <Card key={s.label} className="p-4 shadow-card hover:shadow-card-hover transition-shadow cursor-pointer" onClick={s.onClick}>
              <div className={`h-10 w-10 rounded-lg ${s.color} flex items-center justify-center mb-2`}><s.icon className="h-5 w-5" /></div>
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </Card>
          ))}
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold font-heading text-foreground">Upcoming Appointments</h3>
            <Button variant="ghost" size="sm" onClick={() => navigate('/doctor/appointments')}>View All →</Button>
          </div>
          <div className="space-y-3">
            {appointments.length === 0 ? (
              <Card className="p-6 text-center text-muted-foreground shadow-card">
                {loading ? 'Loading appointments...' : 'No upcoming appointments.'}
              </Card>
            ) : appointments.map(apt => (
              <Card key={apt.id} className="p-4 shadow-card hover:shadow-card-hover transition-shadow">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                      {apt.patientName.split(' ').map(n => n[0]).slice(0, 2).join('')}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground text-sm truncate">{apt.patientName}</p>
                      <p className="text-xs text-muted-foreground truncate">{apt.reason}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">{apt.date} {apt.time}</span>
                        <Badge variant={apt.type === 'video' ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0">
                          {apt.type === 'video' ? <><Video className="h-3 w-3 mr-0.5" />Video</> : <><MapPin className="h-3 w-3 mr-0.5" />In-Person</>}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {apt.status === 'pending' ? (
                      <>
                        <Button size="sm" onClick={() => updateStatus(apt.id, 'upcoming', 'Appointment accepted')}>Accept</Button>
                        <Button size="sm" variant="ghost" onClick={() => updateStatus(apt.id, 'cancelled', 'Appointment declined')}>Decline</Button>
                      </>
                    ) : apt.status === 'upcoming' && apt.type === 'video' ? (
                      <Button size="sm" onClick={() => navigate(`/patient/consultation?apt=${apt.id}`)}>
                        <Video className="h-3 w-3 mr-1" /> Start
                      </Button>
                    ) : (
                      <Badge variant="secondary" className="capitalize text-xs">{apt.status}</Badge>
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
