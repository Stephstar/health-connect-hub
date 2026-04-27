import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/DashboardLayout';
import { Plus, Send, Pill, Trash2, Search } from 'lucide-react';

interface PrescriptionItem {
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
}

interface Prescription {
  id: string;
  patient: string;
  date: string;
  items: PrescriptionItem[];
  status: 'active' | 'completed' | 'expired';
  notes: string;
}

export default function DoctorPrescriptions() {
  const { toast } = useToast();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [showBuilder, setShowBuilder] = useState(false);
  const [search, setSearch] = useState('');
  const [newPatient, setNewPatient] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newItems, setNewItems] = useState<PrescriptionItem[]>([{ medication: '', dosage: '', frequency: '', duration: '' }]);

  const addItem = () => setNewItems(prev => [...prev, { medication: '', dosage: '', frequency: '', duration: '' }]);
  const removeItem = (i: number) => setNewItems(prev => prev.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: keyof PrescriptionItem, value: string) => {
    setNewItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item));
  };

  const handleSend = () => {
    if (!newPatient.trim() || newItems.some(i => !i.medication.trim())) {
      toast({ title: 'Please fill required fields', variant: 'destructive' });
      return;
    }
    toast({ title: 'Prescription sent', description: `Prescription sent to ${newPatient}` });
    setShowBuilder(false);
    setNewPatient('');
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
            <CardHeader>
              <CardTitle className="text-lg">New Prescription</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Patient Name</Label>
                <Input value={newPatient} onChange={e => setNewPatient(e.target.value)} placeholder="Enter patient name" />
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
          {filtered.map(p => (
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
