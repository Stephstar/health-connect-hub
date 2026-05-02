import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/DashboardLayout';
import { Search, UserCheck, UserX, Star, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Doctor {
  id: string; name: string; email: string; specialty: string; status: string;
  rating: number; reviews: number; joined: string;
}

export default function AdminDoctors() {
  const { toast } = useToast();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadDoctors(); }, []);

  const loadDoctors = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('doctors')
      .select('id, user_id, full_name, specialty, status, rating, reviews_count, created_at')
      .order('created_at', { ascending: false });

    if (data) {
      const userIds = data.filter(d => d.user_id).map(d => d.user_id!);
      const { data: profiles } = await supabase.from('profiles').select('id, email').in('id', userIds);
      const emailMap = new Map((profiles || []).map(p => [p.id, p.email]));

      setDoctors(data.map(d => ({
        id: d.id,
        name: d.full_name,
        email: d.user_id ? emailMap.get(d.user_id) || '' : '',
        specialty: d.specialty,
        status: d.status,
        rating: Number(d.rating),
        reviews: d.reviews_count,
        joined: d.created_at.split('T')[0],
      })));
    }
    setLoading(false);
  };

  const filtered = doctors.filter(d => {
    const m1 = d.name.toLowerCase().includes(search.toLowerCase()) || d.specialty.toLowerCase().includes(search.toLowerCase());
    const m2 = statusFilter === 'all' || d.status === statusFilter;
    return m1 && m2;
  });

  const updateStatus = async (id: string, status: string, msg: string) => {
    await supabase.from('doctors').update({ status }).eq('id', id);
    setDoctors(prev => prev.map(d => d.id === id ? { ...d, status } : d));
    toast({ title: msg });
  };

  const statusBadge = (s: string) => {
    const c: Record<string, string> = { verified: 'bg-success/10 text-success', pending: 'bg-warning/10 text-warning', suspended: 'bg-destructive/10 text-destructive' };
    return <Badge className={`${c[s] || ''} border-0 text-xs capitalize`}>{s === 'verified' ? 'active' : s}</Badge>;
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
            {['all', 'verified', 'pending', 'suspended'].map(s => (
              <Button key={s} variant={statusFilter === s ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter(s)} className="capitalize">{s === 'all' ? 'All' : s === 'verified' ? 'Active' : s}</Button>
            ))}
          </div>
        </div>

        <Card className="shadow-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Doctor</TableHead>
                <TableHead>Specialty</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Reviews</TableHead>
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
                  <TableCell>{d.rating > 0 ? <span className="flex items-center gap-1 text-sm"><Star className="h-3 w-3 text-warning fill-warning" />{d.rating}</span> : <span className="text-xs text-muted-foreground">N/A</span>}</TableCell>
                  <TableCell className="text-sm">{d.reviews}</TableCell>
                  <TableCell>{statusBadge(d.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {d.status === 'pending' && (
                        <>
                          <Button size="sm" onClick={() => updateStatus(d.id, 'verified', `${d.name} approved`)}><CheckCircle2 className="h-3 w-3 mr-1" />Approve</Button>
                          <Button size="sm" variant="outline" onClick={() => updateStatus(d.id, 'suspended', `${d.name} rejected`)}><UserX className="h-3 w-3 mr-1" />Reject</Button>
                        </>
                      )}
                      {d.status === 'verified' && <Button size="sm" variant="outline" onClick={() => updateStatus(d.id, 'suspended', `${d.name} suspended`)}><UserX className="h-3 w-3 mr-1" />Suspend</Button>}
                      {d.status === 'suspended' && <Button size="sm" onClick={() => updateStatus(d.id, 'verified', `${d.name} reactivated`)}><UserCheck className="h-3 w-3 mr-1" />Activate</Button>}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No doctors found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </DashboardLayout>
  );
}
