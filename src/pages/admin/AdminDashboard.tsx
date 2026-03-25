import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { Users, Stethoscope, Calendar, DollarSign, TrendingUp, UserCheck, UserX, AlertTriangle } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { useToast } from '@/hooks/use-toast';

const PENDING_DOCTORS = [
  { id: '1', name: 'Dr. Lisa Nguyen', specialty: 'Pediatrics', status: 'pending' },
  { id: '2', name: 'Dr. Ahmed Hassan', specialty: 'Orthopedics', status: 'pending' },
];

const RECENT_USERS = [
  { id: '1', name: 'Sarah Johnson', role: 'Patient', status: 'active', joined: '2026-03-20' },
  { id: '2', name: 'James Owusu', role: 'Patient', status: 'active', joined: '2026-03-19' },
  { id: '3', name: 'Dr. Robert Mensah', role: 'Doctor', status: 'active', joined: '2026-03-18' },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleApprove = (name: string) => toast({ title: `${name} approved`, description: 'Doctor account has been activated.' });
  const handleSuspend = (name: string) => toast({ title: `${name} suspended`, description: 'Account has been suspended.' });

  return (
    <DashboardLayout role="admin" title="Admin Dashboard">
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Users', value: '12,847', icon: Users, color: 'text-primary bg-primary/10', change: '+12%' },
            { label: 'Active Doctors', value: '523', icon: Stethoscope, color: 'text-success bg-success/10', change: '+5%' },
            { label: 'Appointments Today', value: '1,284', icon: Calendar, color: 'text-accent bg-accent/10', change: '+8%' },
            { label: 'Revenue (MTD)', value: '$284K', icon: DollarSign, color: 'text-warning bg-warning/10', change: '+15%' },
          ].map(s => (
            <Card key={s.label} className="p-4 shadow-card">
              <div className="flex items-center justify-between mb-2">
                <div className={`h-10 w-10 rounded-lg ${s.color} flex items-center justify-center`}><s.icon className="h-5 w-5" /></div>
                <span className="text-xs font-medium text-success flex items-center gap-1"><TrendingUp className="h-3 w-3" />{s.change}</span>
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
              {PENDING_DOCTORS.map(doc => (
                <Card key={doc.id} className="p-4 shadow-card">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">{doc.name.split(' ').slice(1).map(n=>n[0]).join('')}</div>
                      <div>
                        <p className="font-medium text-foreground text-sm">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">{doc.specialty}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleApprove(doc.name)}><UserCheck className="h-3 w-3 mr-1" /> Approve</Button>
                      <Button size="sm" variant="outline" onClick={() => handleSuspend(doc.name)}><UserX className="h-3 w-3 mr-1" /> Reject</Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold font-heading text-foreground mb-4">Recent Users</h3>
            <div className="space-y-3">
              {RECENT_USERS.map(u => (
                <Card key={u.id} className="p-4 shadow-card">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">{u.name.split(' ').map(n=>n[0]).join('')}</div>
                      <div>
                        <p className="font-medium text-foreground text-sm">{u.name}</p>
                        <p className="text-xs text-muted-foreground">{u.role} • Joined {u.joined}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="default">{u.status}</Badge>
                      <Button size="sm" variant="ghost" onClick={() => handleSuspend(u.name)}>Suspend</Button>
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
