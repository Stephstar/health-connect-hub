import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/DashboardLayout';
import { Search, UserCheck, UserX, Star, CheckCircle2 } from 'lucide-react';

interface Doctor {
  id: string; name: string; email: string; specialty: string; status: 'active' | 'pending' | 'suspended';
  rating: number; patients: number; joined: string; license: string;
}

const DOCTORS: Doctor[] = [
  { id: '1', name: 'Dr. Michael Chen', email: 'mchen@email.com', specialty: 'Cardiology', status: 'active', rating: 4.9, patients: 245, joined: '2025-11-01', license: 'MC-2014-05821' },
  { id: '2', name: 'Dr. Amara Okafor', email: 'aokafor@email.com', specialty: 'Dermatology', status: 'active', rating: 4.8, patients: 189, joined: '2025-12-15', license: 'MC-2016-08234' },
  { id: '3', name: 'Dr. Emily Watson', email: 'ewatson@email.com', specialty: 'General Practice', status: 'active', rating: 4.7, patients: 320, joined: '2025-10-01', license: 'MC-2012-03412' },
  { id: '4', name: 'Dr. Lisa Nguyen', email: 'lisa@email.com', specialty: 'Pediatrics', status: 'pending', rating: 0, patients: 0, joined: '2026-03-25', license: 'MC-2020-11234' },
  { id: '5', name: 'Dr. Ahmed Hassan', email: 'ahmed@email.com', specialty: 'Orthopedics', status: 'pending', rating: 0, patients: 0, joined: '2026-03-26', license: 'MC-2019-09876' },
  { id: '6', name: 'Dr. Robert Mensah', email: 'rmensah@email.com', specialty: 'Neurology', status: 'suspended', rating: 3.2, patients: 45, joined: '2025-09-01', license: 'MC-2015-06543' },
];

export default function AdminDoctors() {
  const { toast } = useToast();
  const [doctors, setDoctors] = useState(DOCTORS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = doctors.filter(d => {
    const m1 = d.name.toLowerCase().includes(search.toLowerCase()) || d.specialty.toLowerCase().includes(search.toLowerCase());
    const m2 = statusFilter === 'all' || d.status === statusFilter;
    return m1 && m2;
  });

  const updateStatus = (id: string, status: Doctor['status'], msg: string) => {
    setDoctors(prev => prev.map(d => d.id === id ? { ...d, status } : d));
    toast({ title: msg });
  };

  const statusBadge = (s: string) => {
    const c: Record<string, string> = { active: 'bg-success/10 text-success', pending: 'bg-warning/10 text-warning', suspended: 'bg-destructive/10 text-destructive' };
    return <Badge className={`${c[s]} border-0 text-xs capitalize`}>{s}</Badge>;
  };

  return (
    <DashboardLayout role="admin" title="Doctor Management">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search doctors..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <div className="flex gap-2">
            {['all', 'active', 'pending', 'suspended'].map(s => (
              <Button key={s} variant={statusFilter === s ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter(s)} className="capitalize">{s === 'all' ? 'All' : s}</Button>
            ))}
          </div>
        </div>

        <Card className="shadow-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Doctor</TableHead>
                <TableHead>Specialty</TableHead>
                <TableHead>License</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Patients</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(d => (
                <TableRow key={d.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">{d.name.split(' ').slice(1).map(n => n[0]).join('')}</div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{d.name}</p>
                        <p className="text-xs text-muted-foreground">{d.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{d.specialty}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{d.license}</TableCell>
                  <TableCell>{d.rating > 0 ? <span className="flex items-center gap-1 text-sm"><Star className="h-3 w-3 text-warning fill-warning" />{d.rating}</span> : <span className="text-xs text-muted-foreground">N/A</span>}</TableCell>
                  <TableCell className="text-sm">{d.patients}</TableCell>
                  <TableCell>{statusBadge(d.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {d.status === 'pending' && (
                        <>
                          <Button size="sm" onClick={() => updateStatus(d.id, 'active', `${d.name} approved`)}><CheckCircle2 className="h-3 w-3 mr-1" />Approve</Button>
                          <Button size="sm" variant="outline" onClick={() => updateStatus(d.id, 'suspended', `${d.name} rejected`)}><UserX className="h-3 w-3 mr-1" />Reject</Button>
                        </>
                      )}
                      {d.status === 'active' && <Button size="sm" variant="outline" onClick={() => updateStatus(d.id, 'suspended', `${d.name} suspended`)}><UserX className="h-3 w-3 mr-1" />Suspend</Button>}
                      {d.status === 'suspended' && <Button size="sm" onClick={() => updateStatus(d.id, 'active', `${d.name} reactivated`)}><UserCheck className="h-3 w-3 mr-1" />Activate</Button>}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </DashboardLayout>
  );
}
