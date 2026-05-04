import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import { Users, Stethoscope, Calendar, DollarSign, UserCheck, UserX, AlertTriangle } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface PendingDoctor { id: string; name: string; specialty: string; }
interface RecentUser { id: string; name: string; role: string; status: string; joined: string; }

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [stats, setStats] = useState({ users: 0, doctors: 0, appointmentsToday: 0, revenue: 0 });
  const [pendingDoctors, setPendingDoctors] = useState<PendingDoctor[]>([]);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmAction, setConfirmAction] = useState<{ type: 'approve' | 'reject' | 'suspend'; target: { id: string; name: string } } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => { loadData(); }, []);

  const checkAdmin = async () => {
    if (!user) return false;
    const { data } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
    if (!data) { toast({ title: 'Access denied', description: 'Admin role required.', variant: 'destructive' }); return false; }
    return true;
  };

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
    setStats({ users: profilesRes.count || 0, doctors: doctorsRes.count || 0, appointmentsToday: aptsRes.count || 0, revenue: totalRevenue });
    setPendingDoctors((pendingRes.data || []).map(d => ({ id: d.id, name: d.full_name, specialty: d.specialty })));

    const userIds = (recentRes.data || []).map(u => u.id);
    const { data: roles } = await supabase.from('user_roles').select('user_id, role').in('user_id', userIds);
    const roleMap = new Map((roles || []).map(r => [r.user_id, r.role]));
    setRecentUsers((recentRes.data || []).map(u => ({ id: u.id, name: u.full_name, role: roleMap.get(u.id) || 'patient', status: u.status, joined: u.created_at.split('T')[0] })));
    setLoading(false);
  };

  const executeAction = async () => {
    if (!confirmAction) return;
    if (!(await checkAdmin())) { setConfirmAction(null); return; }
    setActionLoading(true);
    const { type, target } = confirmAction;
    let error: any = null;

    if (type === 'approve') {
      ({ error } = await supabase.from('doctors').update({ status: 'verified' as any }).eq('id', target.id));
      if (!error) { setPendingDoctors(prev => prev.filter(d => d.id !== target.id)); setStats(prev => ({ ...prev, doctors: prev.doctors + 1 })); }
    } else if (type === 'reject') {
      ({ error } = await supabase.from('doctors').update({ status: 'suspended' as any }).eq('id', target.id));
      if (!error) setPendingDoctors(prev => prev.filter(d => d.id !== target.id));
    } else if (type === 'suspend') {
      ({ error } = await supabase.from('profiles').update({ status: 'suspended' as any }).eq('id', target.id));
      if (!error) setRecentUsers(prev => prev.map(x => x.id === target.id ? { ...x, status: 'suspended' } : x));
    }

    if (error) {
      toast({ title: 'Action failed', description: error.message, variant: 'destructive' });
    } else {
      const labels = { approve: 'approved', reject: 'rejected', suspend: 'suspended' };
      toast({ title: `${target.name} ${labels[type]}` });
    }
    setActionLoading(false);
    setConfirmAction(null);
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
                      <Button size="sm" onClick={() => setConfirmAction({ type: 'approve', target: doc })}><UserCheck className="h-3 w-3 mr-1" /> Approve</Button>
                      <Button size="sm" variant="outline" onClick={() => setConfirmAction({ type: 'reject', target: doc })}><UserX className="h-3 w-3 mr-1" /> Reject</Button>
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
                        <Button size="sm" variant="ghost" onClick={() => setConfirmAction({ type: 'suspend', target: { id: u.id, name: u.name } })}>Suspend</Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={!!confirmAction} onOpenChange={open => { if (!open) setConfirmAction(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Confirm {confirmAction?.type === 'approve' ? 'Approval' : confirmAction?.type === 'reject' ? 'Rejection' : 'Suspension'}
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to {confirmAction?.type} <strong>{confirmAction?.target.name}</strong>?
              {confirmAction?.type === 'suspend' && ' This user will lose access immediately.'}
              {confirmAction?.type === 'reject' && ' The doctor account will be suspended.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmAction(null)} disabled={actionLoading}>Cancel</Button>
            <Button variant={confirmAction?.type === 'approve' ? 'default' : 'destructive'} onClick={executeAction} disabled={actionLoading}>
              {actionLoading ? 'Processing…' : confirmAction?.type === 'approve' ? 'Approve' : confirmAction?.type === 'reject' ? 'Reject' : 'Suspend'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
