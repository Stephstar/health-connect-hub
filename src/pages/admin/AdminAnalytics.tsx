import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import DashboardLayout from '@/components/DashboardLayout';
import { Users, Calendar, DollarSign, Activity, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { supabase } from '@/integrations/supabase/client';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--muted-foreground))'];

export default function AdminAnalytics() {
  const [stats, setStats] = useState({ users: 0, appointments: 0, revenue: 0, doctors: 0 });
  const [specialtyData, setSpecialtyData] = useState<{ name: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAnalytics(); }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    const [usersRes, aptsRes, invoicesRes, doctorsRes] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('appointments').select('id', { count: 'exact', head: true }),
      supabase.from('invoices').select('amount').eq('status', 'paid'),
      supabase.from('doctors').select('specialty').eq('status', 'verified'),
    ]);

    const totalRevenue = (invoicesRes.data || []).reduce((s, i) => s + Number(i.amount), 0);
    setStats({
      users: usersRes.count || 0,
      appointments: aptsRes.count || 0,
      revenue: totalRevenue,
      doctors: (doctorsRes.data || []).length,
    });

    // Specialty distribution
    const specMap = new Map<string, number>();
    (doctorsRes.data || []).forEach(d => specMap.set(d.specialty, (specMap.get(d.specialty) || 0) + 1));
    setSpecialtyData(Array.from(specMap.entries()).map(([name, value]) => ({ name, value })));
    setLoading(false);
  };

  const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K` : String(n);

  return (
    <DashboardLayout role="admin" title="Analytics">
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Users', value: fmt(stats.users), icon: Users },
            { label: 'Appointments', value: fmt(stats.appointments), icon: Calendar },
            { label: 'Revenue', value: `$${fmt(stats.revenue)}`, icon: DollarSign },
            { label: 'Active Doctors', value: String(stats.doctors), icon: Activity },
          ].map(s => (
            <Card key={s.label} className="p-4 shadow-card">
              <div className="flex items-center justify-between mb-2">
                <s.icon className="h-5 w-5 text-muted-foreground" />
                <TrendingUp className="h-3 w-3 text-success" />
              </div>
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </Card>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="shadow-card">
            <CardHeader><CardTitle className="text-lg">Doctors by Specialty</CardTitle></CardHeader>
            <CardContent>
              {specialtyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={specialtyData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {specialtyData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-12">No data yet</p>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader><CardTitle className="text-lg">Platform Summary</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4 py-4">
                {[
                  { label: 'Total Users', value: stats.users },
                  { label: 'Total Appointments', value: stats.appointments },
                  { label: 'Active Doctors', value: stats.doctors },
                  { label: 'Revenue Collected', value: `$${stats.revenue.toLocaleString()}` },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between py-2 border-b last:border-0">
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                    <span className="text-sm font-bold text-foreground">{item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
