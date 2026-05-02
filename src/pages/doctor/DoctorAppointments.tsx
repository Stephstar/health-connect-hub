import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import { Calendar, Clock, Video, MapPin, Search, CheckCircle2, XCircle, RotateCcw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface DoctorAppointment {
  id: string; patient: string; date: string; time: string;
  type: 'video' | 'in-person'; status: string; reason: string;
}

export default function DoctorAppointments() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<DoctorAppointment[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (user) loadAppointments(); }, [user]);

  const loadAppointments = async () => {
    setLoading(true);
    // Get the doctor record for this user
    const { data: docData } = await supabase.from('doctors').select('id').eq('user_id', user!.id).single();
    if (!docData) { setLoading(false); return; }

    const { data } = await supabase
      .from('appointments')
      .select('id, patient_id, appointment_date, appointment_time, type, status, reason')
      .eq('doctor_id', docData.id)
      .order('appointment_date', { ascending: false })
      .limit(100);

    if (data) {
      const patientIds = [...new Set(data.map(a => a.patient_id))];
      const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', patientIds);
      const pMap = new Map((profiles || []).map(p => [p.id, p.full_name]));

      setAppointments(data.map(a => ({
        id: a.id,
        patient: pMap.get(a.patient_id) || 'Unknown',
        date: a.appointment_date,
        time: a.appointment_time,
        type: a.type as 'video' | 'in-person',
        status: a.status,
        reason: a.reason || 'Consultation',
      })));
    }
    setLoading(false);
  };

  const filtered = appointments.filter(a => {
    const matchesFilter = filter === 'all' || a.status === filter;
    const matchesSearch = a.patient.toLowerCase().includes(search.toLowerCase()) || a.reason.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const updateStatus = async (id: string, status: string, msg: string) => {
    await supabase.from('appointments').update({ status }).eq('id', id);
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    toast({ title: msg });
  };

  const statusColors: Record<string, string> = {
    upcoming: 'bg-primary/10 text-primary', pending: 'bg-warning/10 text-warning',
    completed: 'bg-success/10 text-success', cancelled: 'bg-destructive/10 text-destructive',
  };

  return (
    <DashboardLayout role="doctor" title="Appointments">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search patients or reasons..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['all', 'upcoming', 'pending', 'completed', 'cancelled'].map(f => (
              <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f)} className="capitalize">{f}</Button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {filtered.map(apt => (
            <Card key={apt.id} className="p-4 shadow-card hover:shadow-card-hover transition-shadow">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-4">
                  <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    {apt.patient.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">{apt.patient}</p>
                    <p className="text-xs text-muted-foreground">{apt.reason}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground"><Calendar className="h-3 w-3" /> {apt.date}</span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" /> {apt.time}</span>
                      <Badge variant={apt.type === 'video' ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0">
                        {apt.type === 'video' ? <><Video className="h-3 w-3 mr-0.5" />Video</> : <><MapPin className="h-3 w-3 mr-0.5" />In-Person</>}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={`${statusColors[apt.status] || ''} border-0 text-xs capitalize`}>{apt.status}</Badge>
                  {apt.status === 'pending' && (
                    <>
                      <Button size="sm" onClick={() => updateStatus(apt.id, 'upcoming', 'Appointment accepted')}><CheckCircle2 className="h-3 w-3 mr-1" />Accept</Button>
                      <Button size="sm" variant="outline" onClick={() => updateStatus(apt.id, 'cancelled', 'Appointment declined')}><XCircle className="h-3 w-3 mr-1" />Decline</Button>
                    </>
                  )}
                  {apt.status === 'upcoming' && (
                    <>
                      <Button size="sm" onClick={() => navigate('/doctor/consultations')}>
                        {apt.type === 'video' ? <><Video className="h-3 w-3 mr-1" />Start</> : 'View'}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => updateStatus(apt.id, 'cancelled', 'Appointment cancelled')}><XCircle className="h-3 w-3" /></Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
          {filtered.length === 0 && (
            <Card className="p-12 text-center shadow-card">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No appointments found</p>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
