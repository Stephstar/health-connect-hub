import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import DashboardLayout from '@/components/DashboardLayout';
import { DollarSign, TrendingUp, CreditCard, ArrowUpRight, ArrowDownRight, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useToast } from '@/hooks/use-toast';

const revenueData = [
  { month: 'Jan', revenue: 41000, expenses: 12000 },
  { month: 'Feb', revenue: 46600, expenses: 13200 },
  { month: 'Mar', revenue: 55050, expenses: 14800 },
  { month: 'Apr', revenue: 49000, expenses: 13500 },
  { month: 'May', revenue: 62500, expenses: 15200 },
  { month: 'Jun', revenue: 67000, expenses: 16000 },
];

const TRANSACTIONS = [
  { id: '1', patient: 'Sarah Johnson', doctor: 'Dr. Michael Chen', amount: 75, type: 'Consultation', method: 'Card', status: 'completed', date: '2026-03-27' },
  { id: '2', patient: 'James Owusu', doctor: 'Dr. Michael Chen', amount: 120, type: 'In-Person Visit', method: 'Mobile Money', status: 'completed', date: '2026-03-27' },
  { id: '3', patient: 'Grace Mensah', doctor: 'Dr. Amara Okafor', amount: 90, type: 'Consultation', method: 'Insurance', status: 'pending', date: '2026-03-26' },
  { id: '4', patient: 'Kofi Agyeman', doctor: 'Dr. Emily Watson', amount: 50, type: 'Follow-up', method: 'PayPal', status: 'completed', date: '2026-03-25' },
  { id: '5', patient: 'Ama Darko', doctor: 'Dr. Amara Okafor', amount: 75, type: 'Consultation', method: 'Card', status: 'refunded', date: '2026-03-24' },
];

export default function AdminRevenue() {
  const { toast } = useToast();
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');

  return (
    <DashboardLayout role="admin" title="Revenue">
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Revenue', value: '$321,150', change: '+15%', up: true, icon: DollarSign },
            { label: 'Net Profit', value: '$236,450', change: '+12%', up: true, icon: TrendingUp },
            { label: 'Avg Transaction', value: '$82', change: '+3%', up: true, icon: CreditCard },
            { label: 'Refunds', value: '$4,200', change: '-8%', up: false, icon: ArrowDownRight },
          ].map(s => (
            <Card key={s.label} className="p-4 shadow-card">
              <div className="flex items-center justify-between mb-2">
                <s.icon className="h-5 w-5 text-muted-foreground" />
                <span className={`text-xs font-medium flex items-center gap-1 ${s.up ? 'text-success' : 'text-destructive'}`}>
                  {s.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}{s.change}
                </span>
              </div>
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </Card>
          ))}
        </div>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Revenue vs Expenses</CardTitle>
            <div className="flex gap-2">
              {(['week', 'month', 'year'] as const).map(p => (
                <Button key={p} variant={period === p ? 'default' : 'outline'} size="sm" onClick={() => setPeriod(p)} className="capitalize">{p}</Button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={v => `$${v/1000}K`} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(v: number) => [`$${v.toLocaleString()}`]} />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Revenue" />
                <Bar dataKey="expenses" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Transactions</CardTitle>
            <Button variant="outline" size="sm" onClick={() => toast({ title: 'Exporting transactions...' })}><Download className="h-4 w-4 mr-1" />Export</Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {TRANSACTIONS.map(t => (
                  <TableRow key={t.id}>
                    <TableCell className="text-sm font-medium">{t.patient}</TableCell>
                    <TableCell className="text-sm">{t.doctor}</TableCell>
                    <TableCell className="text-sm">{t.type}</TableCell>
                    <TableCell><Badge variant="secondary" className="text-xs">{t.method}</Badge></TableCell>
                    <TableCell className="text-sm font-medium">${t.amount}</TableCell>
                    <TableCell>
                      <Badge className={`border-0 text-xs capitalize ${t.status === 'completed' ? 'bg-success/10 text-success' : t.status === 'pending' ? 'bg-warning/10 text-warning' : 'bg-destructive/10 text-destructive'}`}>{t.status}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{t.date}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
