import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/DashboardLayout';
import { Plus, Send, Pill, Trash2, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface PrescriptionItem {
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
}

interface Prescription {
  id: string;
  patient: string;
  patient_id: string;
  date: string;
  items: PrescriptionItem[];
  status: 'active' | 'completed' | 'expired';
  notes: string;
}

export default function DoctorPrescriptions() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [doctorRecordId, setDoctorRecordId] = useState<string | null>(null);
  const [patientOptions, setPatientOptions] = useState<{ id: string; name: string }[]>([]);
  const [showBuilder, setShowBuilder] = useState(false);
  const [search, setSearch] = useState('');
  const [newPatientId, setNewPatientId] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newItems, setNewItems] = useState<PrescriptionItem[]>([{ medication: '', dosage: '', frequency: '', duration: '' }]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: doc } = await supabase.from('doctors').select('id').eq('user_id', user.id).maybeSingle();
      if (!doc) return;
      setDoctorRecordId(doc.id);
      const { data: rxs } = await supabase
        .from('prescriptions')
        .select('id, items, notes, status, created_at, patient_id')
        .eq('doctor_id', doc.id)
        .order('created_at', { ascending: false });
      const patientIds = Array.from(new Set((rxs || []).map(r => r.patient_id)));
      const { data: profs } = patientIds.length
        ? await supabase.from('profiles').select('id, full_name').in('id', patientIds)
        : { data: [] as { id: string; full_name: string }[] };
      const profMap = new Map((profs || []).map(p => [p.id, p.full_name || 'Patient']));
      setPrescriptions((rxs || []).map((r) => ({
        id: r.id,
        patient_id: r.patient_id,
        patient: profMap.get(r.patient_id) || 'Patient',
        date: new Date(r.created_at).toISOString().split('T')[0],
        items: (r.items as unknown as PrescriptionItem[]) || [],
        status: r.status as Prescription['status'],
        notes: r.notes || '',
      })));

      const { data: appts } = await supabase
        .from('appointments')
        .select('patient_id')
        .eq('doctor_id', doc.id);
      const ids = Array.from(new Set((appts || []).map(a => a.patient_id)));
      if (ids.length) {
        const { data: ap } = await supabase.from('profiles').select('id, full_name').in('id', ids);
        setPatientOptions((ap || []).map(p => ({ id: p.id, name: p.full_name || 'Patient' })));
      }
    })();
  }, [user]);

  const addItem = () => setNewItems(prev => [...prev, { medication: '', dosage: '', frequency: '', duration: '' }]);
  const removeItem = (i: number) => setNewItems(prev => prev.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: keyof PrescriptionItem, value: string) => {
    setNewItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item));
  };

  const handleSend = async () => {
    if (!newPatientId || newItems.some(i => !i.medication.trim()) || !doctorRecordId) {
      toast({ title: 'Please fill required fields', variant: 'destructive' });
      return;
    }
    const { data, error } = await supabase
      .from('prescriptions')
      .insert([{
        doctor_id: doctorRecordId,
        patient_id: newPatientId,
        items: newItems as unknown as Record<string, unknown>[],
        notes: newNotes,
        status: 'active' as const,
      }])
      .select('id, created_at')
      .single();
    if (error || !data) {
      toast({ title: 'Failed to send prescription', description: error?.message, variant: 'destructive' });
      return;
    }
    await supabase.from('notifications').insert({
      user_id: newPatientId,
      title: 'New Prescription',
      message: `${user?.name} has sent you a new prescription.`,
      type: 'prescription',
    });
    const patientName = patientOptions.find(p => p.id === newPatientId)?.name || 'Patient';
    setPrescriptions(prev => [{
      id: data.id,
      patient_id: newPatientId,
      patient: patientName,
      date: new Date(data.created_at).toISOString().split('T')[0],
      items: newItems,
      status: 'active',
      notes: newNotes,
    }, ...prev]);
    toast({ title: 'Prescription sent', description: `Sent to ${patientName}` });
    setShowBuilder(false);
    setNewPatientId('');
    setNewNotes('');
    setNewItems([{ medication: '', dosage: '', frequency: '', duration: '' }]);
  };

  const filtered = prescriptions.filter(p => p.patient.toLowerCase().includes(search.toLowerCase()));

  return (
    <DashboardLayout role="doctor" title="Prescriptions">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-3 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search prescriptions..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Button onClick={() => setShowBuilder(!showBuilder)}>
            <Plus className="h-4 w-4 mr-1" /> New Prescription
          </Button>
        </div>

        {showBuilder && (
          <Card className="shadow-card">
            <CardHeader><CardTitle className="text-lg">New Prescription</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Patient</Label>
                {patientOptions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No patients yet. Patients become available once they book an appointment with you.</p>
                ) : (
                  <select value={newPatientId} onChange={e => setNewPatientId(e.target.value)} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                    <option value="">Select patient...</option>
                    {patientOptions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                )}
              </div>

              <div className="space-y-3">
                <Label>Medications</Label>
                {newItems.map((item, i) => (
                  <div key={i} className="grid grid-cols-2 md:grid-cols-5 gap-2 items-end">
                    <Input placeholder="Medication" value={item.medication} onChange={e => updateItem(i, 'medication', e.target.value)} />
                    <Input placeholder="Dosage" value={item.dosage} onChange={e => updateItem(i, 'dosage', e.target.value)} />
                    <Input placeholder="Frequency" value={item.frequency} onChange={e => updateItem(i, 'frequency', e.target.value)} />
                    <Input placeholder="Duration" value={item.duration} onChange={e => updateItem(i, 'duration', e.target.value)} />
                    {newItems.length > 1 && (
                      <Button variant="ghost" size="icon" onClick={() => removeItem(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    )}
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addItem}><Plus className="h-3 w-3 mr-1" />Add Medication</Button>
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea value={newNotes} onChange={e => setNewNotes(e.target.value)} placeholder="Additional instructions..." rows={3} />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSend}><Send className="h-4 w-4 mr-1" />Send to Patient</Button>
                <Button variant="outline" onClick={() => setShowBuilder(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          {filtered.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground shadow-card">No prescriptions yet.</Card>
          ) : filtered.map(p => (
            <Card key={p.id} className="p-4 shadow-card">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    {p.patient.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">{p.patient}</p>
                    <p className="text-xs text-muted-foreground">{p.date}</p>
                  </div>
                </div>
                <Badge variant={p.status === 'active' ? 'default' : 'secondary'} className="capitalize text-xs">{p.status}</Badge>
              </div>
              <div className="mt-3 space-y-1">
                {p.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <Pill className="h-3 w-3 text-primary" />
                    <span className="text-foreground">{item.medication} {item.dosage}</span>
                    <span className="text-muted-foreground">• {item.frequency} • {item.duration}</span>
                  </div>
                ))}
              </div>
              {p.notes && <p className="text-xs text-muted-foreground mt-2 italic">Note: {p.notes}</p>}
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
