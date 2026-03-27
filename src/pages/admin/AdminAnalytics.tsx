import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import DashboardLayout from '@/components/DashboardLayout';
import { TrendingUp, TrendingDown, Users, Calendar, DollarSign, Activity, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const monthlyData = [
  { month: 'Jan', appointments: 820, users: 450, revenue: 41000 },
  { month: 'Feb', appointments: 932, users: 520, revenue: 46600 },
  { month: 'Mar', appointments: 1101, users: 610, revenue: 55050 },
  { month: 'Apr', appointments: 980, users: 580, revenue: 49000 },
  { month: 'May', appointments: 1250, users: 700, revenue: 62500 },
  { month: 'Jun', appointments: 1340, users: 780, revenue: 67000 },
];

const specialtyData = [
  { name: 'Cardiology', value: 28 },
  { name: 'Dermatology', value: 22 },
  { name: 'General', value: 30 },
  { name: 'Pediatrics', value: 12 },
  { name: 'Other', value: 8 },
];

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--muted-foreground))'];

export default function AdminAnalytics() {
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');

  return (
    <DashboardLayout role="admin" title="Analytics">
      <div className="space-y-6">
        <div className="flex justify-end gap-2">
          {(['week', 'month', 'year'] as const).map(p => (
            <Button key={p} variant={period === p ? 'default' : 'outline'} size="sm" onClick={() => setPeriod(p)} className="capitalize">{p}</Button>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Users', value: '12,847', change: '+12%', up: true, icon: Users },
            { label: 'Appointments', value: '6,423', change: '+8%', up: true, icon: Calendar },
            { label: 'Revenue', value: '$321K', change: '+15%', up: true, icon: DollarSign },
            { label: 'Satisfaction', value: '4.8/5', change: '+2%', up: true, icon: Activity },
          ].map(s => (
            <Card key={s.label} className="p-4 shadow-card">
              <div className="flex items-center justify-between mb-2">
                <s.icon className="h-5 w-5 text-muted-foreground" />
                <span className={`text-xs font-medium flex items-center gap-1 ${s.up ? 'text-success' : 'text-destructive'}`}>
                  {s.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}{s.change}
                </span>
              </div>
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </Card>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="shadow-card">
            <CardHeader><CardTitle className="text-lg">Appointments Trend</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Bar dataKey="appointments" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader><CardTitle className="text-lg">User Growth</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Line type="monotone" dataKey="users" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))' }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="shadow-card">
            <CardHeader><CardTitle className="text-lg">Revenue Trend</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={v => `$${v/1000}K`} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(v: number) => [`$${v.toLocaleString()}`, 'Revenue']} />
                  <Line type="monotone" dataKey="revenue" stroke="hsl(var(--success))" strokeWidth={2} dot={{ fill: 'hsl(var(--success))' }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader><CardTitle className="text-lg">Appointments by Specialty</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={specialtyData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {specialtyData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
