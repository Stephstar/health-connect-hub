import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import { Video, Clock, Save, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ConsultationRecord {
  id: string; patient: string; patientId: string; date: string; time: string;
  type: 'video' | 'in-person'; status: string; notes: string;
}

export default function DoctorConsultations() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [consultations, setConsultations] = useState<ConsultationRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (user) loadConsultations(); }, [user]);

  const loadConsultations = async () => {
    setLoading(true);
    const { data: docData } = await supabase.from('doctors').select('id').eq('user_id', user!.id).single();
    if (!docData) { setLoading(false); return; }

    const { data } = await supabase
      .from('appointments')
      .select('id, patient_id, appointment_date, appointment_time, type, status, notes')
      .eq('doctor_id', docData.id)
      .in('status', ['upcoming', 'completed', 'pending'])
      .order('appointment_date', { ascending: false })
      .limit(50);

    if (data) {
      const patientIds = [...new Set(data.map(a => a.patient_id))];
      const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', patientIds);
      const pMap = new Map((profiles || []).map(p => [p.id, p.full_name]));

      setConsultations(data.map(a => ({
        id: a.id,
        patient: pMap.get(a.patient_id) || 'Unknown',
        patientId: a.patient_id,
        date: a.appointment_date,
        time: a.appointment_time,
        type: a.type as 'video' | 'in-person',
        status: a.status,
        notes: a.notes || '',
      })));
    }
    setLoading(false);
  };

  const selected = consultations.find(c => c.id === selectedId);

  const handleSelect = (c: ConsultationRecord) => {
    setSelectedId(c.id);
    setNotes(c.notes);
  };

  const handleSaveNotes = async () => {
    if (!selectedId) return;
    await supabase.from('appointments').update({ notes }).eq('id', selectedId);
    setConsultations(prev => prev.map(c => c.id === selectedId ? { ...c, notes } : c));
    toast({ title: 'Notes saved' });
  };

  const handleComplete = async () => {
    if (!selectedId) return;
    await supabase.from('appointments').update({ status: 'completed', notes }).eq('id', selectedId);
    setConsultations(prev => prev.map(c => c.id === selectedId ? { ...c, status: 'completed', notes } : c));
    toast({ title: 'Consultation marked as completed' });
  };

  return (
    <DashboardLayout role="doctor" title="Consultations">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Consultation History</h3>
          {consultations.map(c => (
            <Card key={c.id}
              className={`p-4 shadow-card cursor-pointer transition-all hover:shadow-card-hover ${selectedId === c.id ? 'ring-2 ring-primary' : ''}`}
              onClick={() => handleSelect(c)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    {c.patient.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">{c.patient}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">{c.date}</span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" />{c.time}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={c.type === 'video' ? 'default' : 'secondary'} className="text-[10px]">{c.type}</Badge>
                  <Badge className={`text-[10px] border-0 ${c.status === 'completed' ? 'bg-success/10 text-success' : c.status === 'pending' ? 'bg-warning/10 text-warning' : 'bg-primary/10 text-primary'}`}>
                    {c.status}
                  </Badge>
                  {c.status === 'upcoming' && c.type === 'video' && (
                    <Button size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/patient/consultation?apt=${c.id}`); }}>
                      <Video className="h-3 w-3 mr-1" />Start
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
          {consultations.length === 0 && (
            <Card className="p-12 text-center shadow-card"><p className="text-muted-foreground">No consultations found.</p></Card>
          )}
        </div>

        {selected && (
          <div className="lg:w-[420px]">
            <Card className="shadow-card sticky top-24">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Consultation Notes</CardTitle>
                <p className="text-sm text-muted-foreground">{selected.patient} — {selected.date}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Write consultation notes..." rows={6} />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleSaveNotes} className="flex-1"><Save className="h-4 w-4 mr-1" />Save</Button>
                  {selected.status !== 'completed' && (
                    <Button variant="outline" onClick={handleComplete} className="flex-1"><Send className="h-4 w-4 mr-1" />Complete</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
