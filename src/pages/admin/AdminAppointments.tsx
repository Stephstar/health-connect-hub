import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import DashboardLayout from '@/components/DashboardLayout';
import { Search, Calendar, Video, MapPin } from 'lucide-react';

interface AppointmentRecord {
  id: string; patient: string; doctor: string; specialty: string; date: string; time: string;
  type: 'video' | 'in-person'; status: 'upcoming' | 'completed' | 'cancelled' | 'in-progress';
}

const APPOINTMENTS: AppointmentRecord[] = [
  { id: '1', patient: 'Sarah Johnson', doctor: 'Dr. Michael Chen', specialty: 'Cardiology', date: '2026-03-27', time: '10:00 AM', type: 'video', status: 'upcoming' },
  { id: '2', patient: 'James Owusu', doctor: 'Dr. Michael Chen', specialty: 'Cardiology', date: '2026-03-27', time: '11:30 AM', type: 'in-person', status: 'upcoming' },
  { id: '3', patient: 'Grace Mensah', doctor: 'Dr. Amara Okafor', specialty: 'Dermatology', date: '2026-03-27', time: '2:00 PM', type: 'video', status: 'in-progress' },
  { id: '4', patient: 'Kofi Agyeman', doctor: 'Dr. Emily Watson', specialty: 'General Practice', date: '2026-03-26', time: '9:00 AM', type: 'in-person', status: 'completed' },
  { id: '5', patient: 'Ama Darko', doctor: 'Dr. Amara Okafor', specialty: 'Dermatology', date: '2026-03-25', time: '3:00 PM', type: 'video', status: 'completed' },
  { id: '6', patient: 'Yaw Mensah', doctor: 'Dr. Michael Chen', specialty: 'Cardiology', date: '2026-03-24', time: '10:00 AM', type: 'video', status: 'cancelled' },
];

export default function AdminAppointments() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = APPOINTMENTS.filter(a => {
    const m1 = a.patient.toLowerCase().includes(search.toLowerCase()) || a.doctor.toLowerCase().includes(search.toLowerCase());
    const m2 = statusFilter === 'all' || a.status === statusFilter;
    return m1 && m2;
  });

  const statusColors: Record<string, string> = {
    upcoming: 'bg-primary/10 text-primary', 'in-progress': 'bg-warning/10 text-warning',
    completed: 'bg-success/10 text-success', cancelled: 'bg-destructive/10 text-destructive',
  };

  return (
    <DashboardLayout role="admin" title="Appointments">
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Today', value: '47', color: 'text-primary bg-primary/10' },
            { label: 'In Progress', value: '12', color: 'text-warning bg-warning/10' },
            { label: 'Completed', value: '28', color: 'text-success bg-success/10' },
            { label: 'Cancelled', value: '7', color: 'text-destructive bg-destructive/10' },
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
            {['all', 'upcoming', 'in-progress', 'completed', 'cancelled'].map(s => (
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
                  <TableCell><Badge className={`${statusColors[a.status]} border-0 text-xs capitalize`}>{a.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </DashboardLayout>
  );
}
