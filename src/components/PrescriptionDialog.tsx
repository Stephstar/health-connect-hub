import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Plus, Trash2, Loader2, Pill } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RxItem { medication: string; dosage: string; frequency: string; duration: string }

export default function PrescriptionDialog({
  open, onOpenChange, doctorId, patientId, appointmentId, consultNotes, onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  doctorId: string | null;
  patientId: string | null;
  appointmentId: string | null;
  consultNotes: string;
  onSaved?: () => void;
}) {
  const { toast } = useToast();
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<RxItem[]>([{ medication: '', dosage: '', frequency: '', duration: '' }]);
  const [saving, setSaving] = useState(false);

  const update = (i: number, k: keyof RxItem, v: string) =>
    setItems(prev => prev.map((it, idx) => idx === i ? { ...it, [k]: v } : it));

  const submit = async () => {
    if (!doctorId || !patientId) {
      toast({ title: 'Missing doctor or patient context', variant: 'destructive' }); return;
    }
    if (!diagnosis.trim()) {
      toast({ title: 'Please enter a diagnosis', variant: 'destructive' }); return;
    }
    const validItems = items.filter(it => it.medication.trim());
    setSaving(true);
    try {
      // 1. Save prescription
      if (validItems.length > 0) {
        const { error: rxErr } = await supabase.from('prescriptions').insert([{
          doctor_id: doctorId,
          patient_id: patientId,
          items: validItems,
          notes: `Diagnosis: ${diagnosis}${notes ? '\n' + notes : ''}`,
          status: 'active',
        }]);
        if (rxErr) throw rxErr;
      }
      // 2. Add to EMR timeline as medical record
      const { error: mrErr } = await supabase.from('medical_records').insert({
        patient_id: patientId,
        doctor_id: doctorId,
        record_type: 'consultation',
        title: `Consultation — ${diagnosis}`,
        description: consultNotes || notes,
        data: { diagnosis, prescription: validItems, notes },
      });
      if (mrErr) throw mrErr;
      // 3. Mark appointment completed
      if (appointmentId) {
        await supabase.from('appointments').update({ status: 'completed', notes: consultNotes }).eq('id', appointmentId);
      }
      // 4. Notify patient
      await supabase.from('notifications').insert({
        user_id: patientId,
        title: 'Consultation completed',
        message: `Your consultation summary and ${validItems.length > 0 ? 'new prescription are' : 'notes are'} available in your records.`,
        type: 'consultation',
      });
      toast({ title: 'Consultation completed', description: 'Prescription saved to patient EMR.' });
      onSaved?.();
      onOpenChange(false);
    } catch (e) {
      console.error(e);
      toast({ title: 'Failed to save prescription', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Pill className="h-5 w-5 text-primary" />Complete consultation & prescribe</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1.5">Diagnosis / Assessment *</label>
            <Input value={diagnosis} onChange={e => setDiagnosis(e.target.value)} placeholder="e.g. Acute bronchitis (J20.9)" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Medications</label>
              <Button size="sm" variant="outline" onClick={() => setItems(p => [...p, { medication: '', dosage: '', frequency: '', duration: '' }])}>
                <Plus className="h-3 w-3 mr-1" />Add
              </Button>
            </div>
            <div className="space-y-2">
              {items.map((it, i) => (
                <Card key={i} className="p-3 grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-4"><label className="text-xs text-muted-foreground">Medication</label>
                    <Input value={it.medication} onChange={e => update(i, 'medication', e.target.value)} placeholder="Amoxicillin" /></div>
                  <div className="col-span-2"><label className="text-xs text-muted-foreground">Dosage</label>
                    <Input value={it.dosage} onChange={e => update(i, 'dosage', e.target.value)} placeholder="500mg" /></div>
                  <div className="col-span-3"><label className="text-xs text-muted-foreground">Frequency</label>
                    <Input value={it.frequency} onChange={e => update(i, 'frequency', e.target.value)} placeholder="3x daily" /></div>
                  <div className="col-span-2"><label className="text-xs text-muted-foreground">Duration</label>
                    <Input value={it.duration} onChange={e => update(i, 'duration', e.target.value)} placeholder="7 days" /></div>
                  <div className="col-span-1">
                    <Button size="icon" variant="ghost" onClick={() => setItems(p => p.filter((_, idx) => idx !== i))} disabled={items.length === 1}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium block mb-1.5">Additional notes for patient</label>
            <Textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Follow-up advice, lifestyle recommendations…" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</> : 'Complete & save to EMR'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
