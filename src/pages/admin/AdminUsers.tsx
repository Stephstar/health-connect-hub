import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/DashboardLayout';
import { Search, UserCheck, UserX, MoreVertical, Filter } from 'lucide-react';

interface UserRecord {
  id: string; name: string; email: string; role: 'patient' | 'doctor' | 'admin'; status: 'active' | 'suspended' | 'pending'; joined: string; lastActive: string;
}

const INITIAL_USERS: UserRecord[] = [
  { id: '1', name: 'Sarah Johnson', email: 'sarah@email.com', role: 'patient', status: 'active', joined: '2026-01-15', lastActive: '2026-03-27' },
  { id: '2', name: 'James Owusu', email: 'james@email.com', role: 'patient', status: 'active', joined: '2026-02-10', lastActive: '2026-03-26' },
  { id: '3', name: 'Dr. Michael Chen', email: 'mchen@email.com', role: 'doctor', status: 'active', joined: '2025-11-01', lastActive: '2026-03-27' },
  { id: '4', name: 'Dr. Amara Okafor', email: 'aokafor@email.com', role: 'doctor', status: 'active', joined: '2025-12-15', lastActive: '2026-03-25' },
  { id: '5', name: 'Grace Mensah', email: 'grace@email.com', role: 'patient', status: 'suspended', joined: '2026-01-20', lastActive: '2026-03-10' },
  { id: '6', name: 'Dr. Lisa Nguyen', email: 'lisa@email.com', role: 'doctor', status: 'pending', joined: '2026-03-25', lastActive: '2026-03-25' },
  { id: '7', name: 'Kofi Agyeman', email: 'kofi@email.com', role: 'patient', status: 'active', joined: '2026-03-01', lastActive: '2026-03-27' },
  { id: '8', name: 'Admin User', email: 'admin@demo.com', role: 'admin', status: 'active', joined: '2025-01-01', lastActive: '2026-03-27' },
];

export default function AdminUsers() {
  const { toast } = useToast();
  const [users, setUsers] = useState(INITIAL_USERS);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filtered = users.filter(u => {
    const m1 = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const m2 = roleFilter === 'all' || u.role === roleFilter;
    const m3 = statusFilter === 'all' || u.status === statusFilter;
    return m1 && m2 && m3;
  });

  const toggleStatus = (id: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id !== id) return u;
      const newStatus = u.status === 'active' ? 'suspended' : 'active';
      toast({ title: `User ${newStatus}`, description: `${u.name} has been ${newStatus}.` });
      return { ...u, status: newStatus as UserRecord['status'] };
    }));
  };

  const approveUser = (id: string) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status: 'active' as const } : u));
    toast({ title: 'User approved' });
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
            {['all', 'active', 'suspended', 'pending'].map(s => (
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
                <TableHead>Last Active</TableHead>
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
                  <TableCell className="text-sm text-muted-foreground">{u.lastActive}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {u.status === 'pending' && <Button size="sm" onClick={() => approveUser(u.id)}><UserCheck className="h-3 w-3 mr-1" />Approve</Button>}
                      {u.status !== 'pending' && u.role !== 'admin' && (
                        <Button size="sm" variant={u.status === 'active' ? 'outline' : 'default'} onClick={() => toggleStatus(u.id)}>
                          {u.status === 'active' ? <><UserX className="h-3 w-3 mr-1" />Suspend</> : <><UserCheck className="h-3 w-3 mr-1" />Activate</>}
                        </Button>
                      )}
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
