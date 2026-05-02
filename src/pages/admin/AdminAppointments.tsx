import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import DashboardLayout from '@/components/DashboardLayout';
import { Search, Video, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AppointmentRecord {
  id: string; patient: string; doctor: string; specialty: string; date: string; time: string;
  type: 'video' | 'in-person'; status: string;
}

export default function AdminAppointments() {
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('appointments')
      .select('id, appointment_date, appointment_time, type, status, patient_id, doctor_id, doctors!inner(full_name, specialty)')
      .order('appointment_date', { ascending: false })
      .limit(100);

    if (data) {
      const patientIds = [...new Set(data.map(a => a.patient_id))];
      const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', patientIds);
      const pMap = new Map((profiles || []).map(p => [p.id, p.full_name]));

      setAppointments(data.map((a: any) => ({
        id: a.id,
        patient: pMap.get(a.patient_id) || 'Unknown',
        doctor: a.doctors.full_name,
        specialty: a.doctors.specialty,
        date: a.appointment_date,
        time: a.appointment_time,
        type: a.type,
        status: a.status,
      })));
    }
    setLoading(false);
  };

  const filtered = appointments.filter(a => {
    const m1 = a.patient.toLowerCase().includes(search.toLowerCase()) || a.doctor.toLowerCase().includes(search.toLowerCase());
    const m2 = statusFilter === 'all' || a.status === statusFilter;
    return m1 && m2;
  });

  const todayStr = new Date().toISOString().split('T')[0];
  const todayApts = appointments.filter(a => a.date === todayStr);

  const statusColors: Record<string, string> = {
    upcoming: 'bg-primary/10 text-primary', pending: 'bg-warning/10 text-warning',
    completed: 'bg-success/10 text-success', cancelled: 'bg-destructive/10 text-destructive',
  };

  return (
    <DashboardLayout role="admin" title="Appointments">
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Today', value: String(todayApts.length), color: 'text-primary bg-primary/10' },
            { label: 'Upcoming', value: String(todayApts.filter(a => a.status === 'upcoming').length), color: 'text-warning bg-warning/10' },
            { label: 'Completed', value: String(todayApts.filter(a => a.status === 'completed').length), color: 'text-success bg-success/10' },
            { label: 'Cancelled', value: String(todayApts.filter(a => a.status === 'cancelled').length), color: 'text-destructive bg-destructive/10' },
          ].map(s => (
            <Card key={s.label} className="p-4 shadow-card">
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </Card>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search patient or doctor..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['all', 'upcoming', 'pending', 'completed', 'cancelled'].map(s => (
              <Button key={s} variant={statusFilter === s ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter(s)} className="capitalize">{s === 'all' ? 'All' : s}</Button>
            ))}
          </div>
        </div>

        <Card className="shadow-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(a => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium text-sm">{a.patient}</TableCell>
                  <TableCell>
                    <div><p className="text-sm">{a.doctor}</p><p className="text-xs text-muted-foreground">{a.specialty}</p></div>
                  </TableCell>
                  <TableCell className="text-sm">{a.date} at {a.time}</TableCell>
                  <TableCell>
                    <Badge variant={a.type === 'video' ? 'default' : 'secondary'} className="text-xs">
                      {a.type === 'video' ? <><Video className="h-3 w-3 mr-0.5" />Video</> : <><MapPin className="h-3 w-3 mr-0.5" />In-Person</>}
                    </Badge>
                  </TableCell>
                  <TableCell><Badge className={`${statusColors[a.status] || ''} border-0 text-xs capitalize`}>{a.status}</Badge></TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No appointments found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </DashboardLayout>
  );
}
