import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import DashboardLayout from '@/components/DashboardLayout';
import { DollarSign, TrendingUp, CreditCard, ArrowUpRight, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Transaction {
  id: string; patient: string; amount: number; description: string; method: string; status: string; date: string;
}

export default function AdminRevenue() {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [pendingAmount, setPendingAmount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadInvoices(); }, []);

  const loadInvoices = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('invoices')
      .select('id, patient_id, amount, description, status, payment_method, invoice_date')
      .order('invoice_date', { ascending: false })
      .limit(100);

    if (data) {
      const patientIds = [...new Set(data.map(i => i.patient_id))];
      const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', patientIds);
      const pMap = new Map((profiles || []).map(p => [p.id, p.full_name]));

      setTransactions(data.map(i => ({
        id: i.id,
        patient: pMap.get(i.patient_id) || 'Unknown',
        amount: Number(i.amount),
        description: i.description,
        method: i.payment_method || 'N/A',
        status: i.status,
        date: i.invoice_date,
      })));

      setTotalRevenue(data.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.amount), 0));
      setPendingAmount(data.filter(i => i.status === 'pending').reduce((s, i) => s + Number(i.amount), 0));
    }
    setLoading(false);
  };

  const fmt = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(1)}K` : `$${n}`;

  return (
    <DashboardLayout role="admin" title="Revenue">
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { label: 'Total Revenue', value: fmt(totalRevenue), icon: DollarSign },
            { label: 'Pending', value: fmt(pendingAmount), icon: CreditCard },
            { label: 'Transactions', value: String(transactions.length), icon: TrendingUp },
          ].map(s => (
            <Card key={s.label} className="p-4 shadow-card">
              <div className="flex items-center justify-between mb-2">
                <s.icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </Card>
          ))}
        </div>

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
                  <TableHead>Description</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map(t => (
                  <TableRow key={t.id}>
                    <TableCell className="text-sm font-medium">{t.patient}</TableCell>
                    <TableCell className="text-sm">{t.description}</TableCell>
                    <TableCell><Badge variant="secondary" className="text-xs">{t.method}</Badge></TableCell>
                    <TableCell className="text-sm font-medium">${t.amount}</TableCell>
                    <TableCell>
                      <Badge className={`border-0 text-xs capitalize ${t.status === 'paid' ? 'bg-success/10 text-success' : t.status === 'pending' ? 'bg-warning/10 text-warning' : 'bg-destructive/10 text-destructive'}`}>{t.status}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{t.date}</TableCell>
                  </TableRow>
                ))}
                {transactions.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No transactions found.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
