import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Clock } from 'lucide-react';

interface Slot {
  id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  _new?: boolean;
  _dirty?: boolean;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function AvailabilityEditor() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data: doc } = await supabase.from('doctors').select('id').eq('user_id', user.id).maybeSingle();
    if (!doc) { setLoading(false); return; }
    setDoctorId(doc.id);
    const { data } = await supabase
      .from('doctor_availability')
      .select('id, day_of_week, start_time, end_time, slot_duration_minutes')
      .eq('doctor_id', doc.id)
      .order('day_of_week')
      .order('start_time');
    setSlots((data || []).map(s => ({ ...s, start_time: s.start_time.slice(0, 5), end_time: s.end_time.slice(0, 5) })));
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const addSlot = (day: number) => {
    setSlots(prev => [...prev, { day_of_week: day, start_time: '09:00', end_time: '17:00', slot_duration_minutes: 30, _new: true, _dirty: true }]);
  };

  const updateSlot = (idx: number, patch: Partial<Slot>) => {
    setSlots(prev => prev.map((s, i) => i === idx ? { ...s, ...patch, _dirty: true } : s));
  };

  const removeSlot = async (idx: number) => {
    const s = slots[idx];
    if (s.id) {
      const { error } = await supabase.from('doctor_availability').delete().eq('id', s.id);
      if (error) { toast({ title: 'Could not remove', description: error.message, variant: 'destructive' }); return; }
    }
    setSlots(prev => prev.filter((_, i) => i !== idx));
  };

  const saveAll = async () => {
    if (!doctorId) return;
    setSaving(true);
    const dirty = slots.filter(s => s._dirty);
    let ok = true;
    for (const s of dirty) {
      if (s.end_time <= s.start_time) { ok = false; toast({ title: 'Invalid block', description: `${DAYS[s.day_of_week]}: end must be after start`, variant: 'destructive' }); continue; }
      if (s._new) {
        const { error } = await supabase.from('doctor_availability').insert({
          doctor_id: doctorId, day_of_week: s.day_of_week, start_time: s.start_time, end_time: s.end_time, slot_duration_minutes: s.slot_duration_minutes,
        });
        if (error) { ok = false; toast({ title: 'Save failed', description: error.message, variant: 'destructive' }); }
      } else if (s.id) {
        const { error } = await supabase.from('doctor_availability').update({
          start_time: s.start_time, end_time: s.end_time, slot_duration_minutes: s.slot_duration_minutes,
        }).eq('id', s.id);
        if (error) { ok = false; toast({ title: 'Save failed', description: error.message, variant: 'destructive' }); }
      }
    }
    setSaving(false);
    if (ok) toast({ title: 'Availability saved' });
    load();
  };

  if (loading) return <div className="text-sm text-muted-foreground">Loading availability…</div>;

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2"><Clock className="h-5 w-5 text-primary" /> Weekly Availability</CardTitle>
        <CardDescription>Set the hours you accept appointments. Patients will only see open slots inside these blocks.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {DAYS.map((day, di) => {
          const daySlots = slots.map((s, i) => ({ s, i })).filter(x => x.s.day_of_week === di);
          return (
            <div key={di} className="border border-border rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-foreground">{day}</p>
                <Button size="sm" variant="ghost" onClick={() => addSlot(di)}><Plus className="h-4 w-4 mr-1" /> Add block</Button>
              </div>
              {daySlots.length === 0 && <p className="text-xs text-muted-foreground">No hours — closed</p>}
              {daySlots.map(({ s, i }) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-end mt-2">
                  <div className="col-span-4 space-y-1"><Label className="text-xs">Start</Label><Input type="time" value={s.start_time} onChange={e => updateSlot(i, { start_time: e.target.value })} /></div>
                  <div className="col-span-4 space-y-1"><Label className="text-xs">End</Label><Input type="time" value={s.end_time} onChange={e => updateSlot(i, { end_time: e.target.value })} /></div>
                  <div className="col-span-3 space-y-1"><Label className="text-xs">Slot (min)</Label><Input type="number" min={5} max={240} value={s.slot_duration_minutes} onChange={e => updateSlot(i, { slot_duration_minutes: Number(e.target.value) })} /></div>
                  <div className="col-span-1"><Button size="icon" variant="ghost" onClick={() => removeSlot(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button></div>
                </div>
              ))}
            </div>
          );
        })}
        <Button onClick={saveAll} disabled={saving}>{saving ? 'Saving…' : 'Save Availability'}</Button>
      </CardContent>
    </Card>
  );
}
