import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/DashboardLayout';
import { Search, UserCheck, UserX, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface UserRecord {
  id: string; name: string; email: string; role: string; status: string; joined: string;
}

export default function AdminUsers() {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [confirmAction, setConfirmAction] = useState<{ user: UserRecord; newStatus: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    setLoading(true);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, email, status, created_at')
      .order('created_at', { ascending: false })
      .limit(200);

    if (profiles) {
      const ids = profiles.map(p => p.id);
      const { data: roles } = await supabase.from('user_roles').select('user_id, role').in('user_id', ids);
      const roleMap = new Map((roles || []).map(r => [r.user_id, r.role]));

      setUsers(profiles.map(p => ({
        id: p.id,
        name: p.full_name,
        email: p.email,
        role: roleMap.get(p.id) || 'patient',
        status: p.status,
        joined: p.created_at.split('T')[0],
      })));
    }
    setLoading(false);
  };

  const filtered = users.filter(u => {
    const m1 = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const m2 = roleFilter === 'all' || u.role === roleFilter;
    const m3 = statusFilter === 'all' || u.status === statusFilter;
    return m1 && m2 && m3;
  });

  const requestToggle = (u: UserRecord) => {
    const newStatus = u.status === 'active' ? 'suspended' : 'active';
    setConfirmAction({ user: u, newStatus });
  };

  const executeToggle = async () => {
    if (!confirmAction) return;
    setActionLoading(true);
    const { user: u, newStatus } = confirmAction;
    const { error } = await supabase.from('profiles').update({ status: newStatus as any }).eq('id', u.id);
    if (error) {
      toast({ title: 'Action failed', description: error.message, variant: 'destructive' });
    } else {
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, status: newStatus } : x));
      toast({ title: `User ${newStatus}`, description: `${u.name} has been ${newStatus}.` });
    }
    setActionLoading(false);
    setConfirmAction(null);
  };

  const statusBadge = (s: string) => {
    const colors: Record<string, string> = { active: 'bg-success/10 text-success', suspended: 'bg-destructive/10 text-destructive', pending: 'bg-warning/10 text-warning' };
    return <Badge className={`${colors[s] || ''} border-0 text-xs capitalize`}>{s}</Badge>;
  };

  return (
    <DashboardLayout role="admin" title="User Management">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['all', 'patient', 'doctor', 'admin'].map(r => (
              <Button key={r} variant={roleFilter === r ? 'default' : 'outline'} size="sm" onClick={() => setRoleFilter(r)} className="capitalize">{r === 'all' ? 'All Roles' : r}</Button>
            ))}
          </div>
          <div className="flex gap-2 flex-wrap">
            {['all', 'active', 'suspended'].map(s => (
              <Button key={s} variant={statusFilter === s ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter(s)} className="capitalize">{s === 'all' ? 'All Status' : s}</Button>
            ))}
          </div>
        </div>

        <Card className="shadow-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(u => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">{u.name.split(' ').map(n => n[0]).join('')}</div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{u.name}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="secondary" className="capitalize text-xs">{u.role}</Badge></TableCell>
                  <TableCell>{statusBadge(u.status)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{u.joined}</TableCell>
                  <TableCell className="text-right">
                    {u.role !== 'admin' && (
                      <Button size="sm" variant={u.status === 'active' ? 'outline' : 'default'} onClick={() => requestToggle(u)}>
                        {u.status === 'active' ? <><UserX className="h-3 w-3 mr-1" />Suspend</> : <><UserCheck className="h-3 w-3 mr-1" />Activate</>}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No users found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      <Dialog open={!!confirmAction} onOpenChange={open => { if (!open) setConfirmAction(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Confirm {confirmAction?.newStatus === 'suspended' ? 'Suspension' : 'Activation'}
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to {confirmAction?.newStatus === 'suspended' ? 'suspend' : 'activate'} <strong>{confirmAction?.user.name}</strong>?
              {confirmAction?.newStatus === 'suspended' && ' This user will lose access to the platform immediately.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmAction(null)} disabled={actionLoading}>Cancel</Button>
            <Button variant={confirmAction?.newStatus === 'suspended' ? 'destructive' : 'default'} onClick={executeToggle} disabled={actionLoading}>
              {actionLoading ? 'Processing...' : confirmAction?.newStatus === 'suspended' ? 'Suspend User' : 'Activate User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
