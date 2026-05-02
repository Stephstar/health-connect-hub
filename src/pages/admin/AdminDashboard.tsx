import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { Users, Stethoscope, Calendar, DollarSign, TrendingUp, UserCheck, UserX } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface PendingDoctor { id: string; name: string; specialty: string; }
interface RecentUser { id: string; name: string; role: string; status: string; joined: string; }

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stats, setStats] = useState({ users: 0, doctors: 0, appointmentsToday: 0, revenue: 0 });
  const [pendingDoctors, setPendingDoctors] = useState<PendingDoctor[]>([]);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [profilesRes, doctorsRes, aptsRes, invoicesRes, pendingRes, recentRes] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('doctors').select('id', { count: 'exact', head: true }).eq('status', 'verified'),
      supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('appointment_date', new Date().toISOString().split('T')[0]),
      supabase.from('invoices').select('amount').eq('status', 'paid'),
      supabase.from('doctors').select('id, full_name, specialty').eq('status', 'pending').limit(5),
      supabase.from('profiles').select('id, full_name, status, created_at').order('created_at', { ascending: false }).limit(5),
    ]);

    const totalRevenue = (invoicesRes.data || []).reduce((sum, inv) => sum + Number(inv.amount), 0);
    setStats({
      users: profilesRes.count || 0,
      doctors: doctorsRes.count || 0,
      appointmentsToday: aptsRes.count || 0,
      revenue: totalRevenue,
    });

    setPendingDoctors((pendingRes.data || []).map(d => ({ id: d.id, name: d.full_name, specialty: d.specialty })));

    // Get roles for recent users
    const userIds = (recentRes.data || []).map(u => u.id);
    const { data: roles } = await supabase.from('user_roles').select('user_id, role').in('user_id', userIds);
    const roleMap = new Map((roles || []).map(r => [r.user_id, r.role]));

    setRecentUsers((recentRes.data || []).map(u => ({
      id: u.id,
      name: u.full_name,
      role: roleMap.get(u.id) || 'patient',
      status: u.status,
      joined: u.created_at.split('T')[0],
    })));
    setLoading(false);
  };

  const handleApproveDoctor = async (doc: PendingDoctor) => {
    await supabase.from('doctors').update({ status: 'verified' }).eq('id', doc.id);
    setPendingDoctors(prev => prev.filter(d => d.id !== doc.id));
    toast({ title: `${doc.name} approved`, description: 'Doctor account has been activated.' });
    setStats(prev => ({ ...prev, doctors: prev.doctors + 1 }));
  };

  const handleRejectDoctor = async (doc: PendingDoctor) => {
    await supabase.from('doctors').update({ status: 'suspended' }).eq('id', doc.id);
    setPendingDoctors(prev => prev.filter(d => d.id !== doc.id));
    toast({ title: `${doc.name} rejected` });
  };

  const handleSuspendUser = async (u: RecentUser) => {
    await supabase.from('profiles').update({ status: 'suspended' }).eq('id', u.id);
    setRecentUsers(prev => prev.map(x => x.id === u.id ? { ...x, status: 'suspended' } : x));
    toast({ title: `${u.name} suspended` });
  };

  const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K` : String(n);

  return (
    <DashboardLayout role="admin" title="Admin Dashboard">
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Users', value: fmt(stats.users), icon: Users, color: 'text-primary bg-primary/10' },
            { label: 'Active Doctors', value: String(stats.doctors), icon: Stethoscope, color: 'text-success bg-success/10' },
            { label: 'Appointments Today', value: String(stats.appointmentsToday), icon: Calendar, color: 'text-accent bg-accent/10' },
            { label: 'Revenue (Total)', value: `$${fmt(stats.revenue)}`, icon: DollarSign, color: 'text-warning bg-warning/10' },
          ].map(s => (
            <Card key={s.label} className="p-4 shadow-card">
              <div className="flex items-center justify-between mb-2">
                <div className={`h-10 w-10 rounded-lg ${s.color} flex items-center justify-center`}><s.icon className="h-5 w-5" /></div>
              </div>
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </Card>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold font-heading text-foreground mb-4">Pending Doctor Approvals</h3>
            <div className="space-y-3">
              {pendingDoctors.length === 0 && <Card className="p-6 text-center text-muted-foreground shadow-card">No pending approvals.</Card>}
              {pendingDoctors.map(doc => (
                <Card key={doc.id} className="p-4 shadow-card">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">{doc.name.split(' ').slice(1).map(n => n[0]).join('')}</div>
                      <div>
                        <p className="font-medium text-foreground text-sm">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">{doc.specialty}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleApproveDoctor(doc)}><UserCheck className="h-3 w-3 mr-1" /> Approve</Button>
                      <Button size="sm" variant="outline" onClick={() => handleRejectDoctor(doc)}><UserX className="h-3 w-3 mr-1" /> Reject</Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold font-heading text-foreground mb-4">Recent Users</h3>
            <div className="space-y-3">
              {recentUsers.map(u => (
                <Card key={u.id} className="p-4 shadow-card">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">{u.name.split(' ').map(n => n[0]).join('')}</div>
                      <div>
                        <p className="font-medium text-foreground text-sm">{u.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{u.role} • Joined {u.joined}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="capitalize">{u.status}</Badge>
                      {u.role !== 'admin' && u.status === 'active' && (
                        <Button size="sm" variant="ghost" onClick={() => handleSuspendUser(u)}>Suspend</Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
