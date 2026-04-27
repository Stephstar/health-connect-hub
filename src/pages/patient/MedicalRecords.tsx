import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Download, FlaskConical, Pill, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface RecordRow {
  id: string;
  record_type: string;
  title: string;
  description: string | null;
  data: Record<string, unknown>;
  record_date: string;
  doctor_id: string | null;
  doctor_name?: string;
}

interface PrescriptionRow {
  id: string;
  items: { medication: string; dosage: string; frequency: string; duration: string }[];
  notes: string | null;
  status: string;
  created_at: string;
  doctor_name?: string;
}

export default function MedicalRecords() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [expandedLab, setExpandedLab] = useState<string | null>(null);
  const [records, setRecords] = useState<RecordRow[]>([]);
  const [prescriptions, setPrescriptions] = useState<PrescriptionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([
      supabase.from('medical_records')
        .select('id, record_type, title, description, data, record_date, doctor_id, doctors(full_name)')
        .eq('patient_id', user.id)
        .order('record_date', { ascending: false }),
      supabase.from('prescriptions')
        .select('id, items, notes, status, created_at, doctors(full_name)')
        .eq('patient_id', user.id)
        .order('created_at', { ascending: false }),
    ]).then(([recRes, rxRes]) => {
      setRecords((recRes.data || []).map((r) => ({
        id: r.id,
        record_type: r.record_type,
        title: r.title,
        description: r.description,
        data: (r.data as Record<string, unknown>) || {},
        record_date: r.record_date,
        doctor_id: r.doctor_id,
        doctor_name: (r.doctors as { full_name: string } | null)?.full_name,
      })));
      setPrescriptions((rxRes.data || []).map((p) => ({
        id: p.id,
        items: (p.items as PrescriptionRow['items']) || [],
        notes: p.notes,
        status: p.status,
        created_at: p.created_at,
        doctor_name: (p.doctors as { full_name: string } | null)?.full_name,
      })));
      setLoading(false);
    });
  }, [user]);

  const handleDownload = (name: string) => {
    toast({ title: 'Preparing download...', description: `${name} report will download shortly.` });
  };

  const typeIcon = (type: string) => {
    switch (type) {
      case 'lab': return <FlaskConical className="h-4 w-4" />;
      case 'prescription': return <Pill className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const labRecords = records.filter(r => r.record_type === 'lab');
  const otherRecords = records;

  if (loading) {
    return (
      <DashboardLayout role="patient" title="Medical Records">
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="patient" title="Medical Records">
      <Tabs defaultValue="timeline">
        <TabsList className="mb-6">
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="lab">Lab Results</TabsTrigger>
          <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="space-y-3">
          {otherRecords.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground shadow-card">No records yet. Records will appear here after your first visit.</Card>
          ) : otherRecords.map(r => (
            <Card key={r.id} className="p-4 shadow-card hover:shadow-card-hover transition-shadow">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">{typeIcon(r.record_type)}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-foreground text-sm">{r.title}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{r.record_date}</span>
                      <Button variant="ghost" size="sm" onClick={() => handleDownload(r.title)}><Download className="h-3 w-3" /></Button>
                    </div>
                  </div>
                  {r.doctor_name && <p className="text-xs text-muted-foreground">{r.doctor_name}</p>}
                  {r.description && <p className="text-sm text-muted-foreground mt-2">{r.description}</p>}
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="lab" className="space-y-3">
          {labRecords.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground shadow-card">No lab results yet.</Card>
          ) : labRecords.map(lab => {
            const values = Array.isArray(lab.data.values) ? lab.data.values as { name: string; value: string; range: string; unit: string }[] : [];
            return (
              <Card key={lab.id} className="shadow-card">
                <button className="w-full p-4 flex items-center justify-between text-left" onClick={() => setExpandedLab(expandedLab === lab.id ? null : lab.id)}>
                  <div className="flex items-center gap-3">
                    <FlaskConical className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium text-foreground text-sm">{lab.title}</p>
                      <p className="text-xs text-muted-foreground">{lab.record_date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="bg-success text-success-foreground">{(lab.data.status as string) || 'normal'}</Badge>
                    {expandedLab === lab.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>
                {expandedLab === lab.id && values.length > 0 && (
                  <div className="px-4 pb-4 border-t">
                    <table className="w-full mt-3">
                      <thead>
                        <tr className="text-xs text-muted-foreground"><th className="text-left py-1">Test</th><th className="text-left py-1">Value</th><th className="text-left py-1">Range</th><th className="text-left py-1">Unit</th></tr>
                      </thead>
                      <tbody>
                        {values.map((v, i) => (
                          <tr key={i} className="text-sm"><td className="py-1 text-foreground">{v.name}</td><td className="py-1 font-medium text-foreground">{v.value}</td><td className="py-1 text-muted-foreground">{v.range}</td><td className="py-1 text-muted-foreground">{v.unit}</td></tr>
                        ))}
                      </tbody>
                    </table>
                    <Button size="sm" variant="outline" className="mt-3" onClick={() => handleDownload(lab.title)}>
                      <Download className="h-3 w-3 mr-1" /> Download Report
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="prescriptions" className="space-y-3">
          {prescriptions.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground shadow-card">No prescriptions yet.</Card>
          ) : prescriptions.map(rx => (
            <Card key={rx.id} className="p-4 shadow-card">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <Pill className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    {rx.items.map((it, i) => (
                      <p key={i} className="font-medium text-foreground text-sm">{it.medication} {it.dosage} • {it.frequency}</p>
                    ))}
                    <p className="text-xs text-muted-foreground mt-1">
                      Prescribed by {rx.doctor_name || 'Doctor'} • {new Date(rx.created_at).toLocaleDateString()}
                    </p>
                    {rx.notes && <p className="text-xs text-muted-foreground italic mt-1">{rx.notes}</p>}
                  </div>
                </div>
                <Badge variant={rx.status === 'active' ? 'default' : 'secondary'}>{rx.status}</Badge>
              </div>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
