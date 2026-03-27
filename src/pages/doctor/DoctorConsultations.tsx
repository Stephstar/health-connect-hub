import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/DashboardLayout';
import { Video, FileText, Clock, Paperclip, Save, Send, Plus } from 'lucide-react';

interface ConsultationRecord {
  id: string;
  patient: string;
  date: string;
  duration: string;
  type: 'video' | 'in-person';
  status: 'in-progress' | 'completed' | 'scheduled';
  notes: string;
  attachments: string[];
}

const CONSULTATIONS: ConsultationRecord[] = [
  { id: '1', patient: 'Sarah Johnson', date: '2026-03-27', duration: '25 min', type: 'video', status: 'scheduled', notes: '', attachments: [] },
  { id: '2', patient: 'James Owusu', date: '2026-03-27', duration: '30 min', type: 'in-person', status: 'scheduled', notes: '', attachments: [] },
  { id: '3', patient: 'Grace Mensah', date: '2026-03-25', duration: '20 min', type: 'video', status: 'completed', notes: 'Patient reports chest pain has subsided. Recommended continued monitoring. Scheduled follow-up in 2 weeks.', attachments: ['ECG_Report.pdf'] },
  { id: '4', patient: 'Kofi Agyeman', date: '2026-03-24', duration: '35 min', type: 'in-person', status: 'completed', notes: 'Annual physical completed. All vitals normal. Blood work ordered for cholesterol panel.', attachments: ['Lab_Order.pdf', 'Vitals_Chart.pdf'] },
];

export default function DoctorConsultations() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [consultations, setConsultations] = useState(CONSULTATIONS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [attachmentName, setAttachmentName] = useState('');

  const selected = consultations.find(c => c.id === selectedId);

  const handleSelectConsultation = (c: ConsultationRecord) => {
    setSelectedId(c.id);
    setNotes(c.notes);
  };

  const handleSaveNotes = () => {
    if (!selectedId) return;
    setConsultations(prev => prev.map(c => c.id === selectedId ? { ...c, notes } : c));
    toast({ title: 'Notes saved' });
  };

  const handleAddAttachment = () => {
    if (!selectedId || !attachmentName.trim()) return;
    setConsultations(prev => prev.map(c => c.id === selectedId ? { ...c, attachments: [...c.attachments, attachmentName] } : c));
    setAttachmentName('');
    toast({ title: 'Attachment added' });
  };

  const handleSendNotes = () => {
    if (!selectedId) return;
    toast({ title: 'Notes sent to patient', description: `Consultation notes sent to ${selected?.patient}` });
  };

  const startVideoCall = () => {
    navigate('/doctor/video-call');
  };

  return (
    <DashboardLayout role="doctor" title="Consultations">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Consultation History</h3>
          {consultations.map(c => (
            <Card
              key={c.id}
              className={`p-4 shadow-card cursor-pointer transition-all hover:shadow-card-hover ${selectedId === c.id ? 'ring-2 ring-primary' : ''}`}
              onClick={() => handleSelectConsultation(c)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    {c.patient.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">{c.patient}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">{c.date}</span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" />{c.duration}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={c.type === 'video' ? 'default' : 'secondary'} className="text-[10px]">{c.type}</Badge>
                  <Badge className={`text-[10px] border-0 ${c.status === 'completed' ? 'bg-success/10 text-success' : c.status === 'in-progress' ? 'bg-warning/10 text-warning' : 'bg-primary/10 text-primary'}`}>
                    {c.status}
                  </Badge>
                  {c.status === 'scheduled' && c.type === 'video' && (
                    <Button size="sm" onClick={(e) => { e.stopPropagation(); startVideoCall(); }}>
                      <Video className="h-3 w-3 mr-1" />Start
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
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

                <div>
                  <Label className="mb-2 block">Attachments</Label>
                  {selected.attachments.length > 0 && (
                    <div className="space-y-1 mb-2">
                      {selected.attachments.map((a, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <FileText className="h-3 w-3 text-primary" />
                          <span className="text-foreground">{a}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Input placeholder="File name..." value={attachmentName} onChange={e => setAttachmentName(e.target.value)} className="flex-1" />
                    <Button variant="outline" size="sm" onClick={handleAddAttachment}><Paperclip className="h-3 w-3 mr-1" />Add</Button>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button onClick={handleSaveNotes} className="flex-1"><Save className="h-4 w-4 mr-1" />Save</Button>
                  <Button variant="outline" onClick={handleSendNotes} className="flex-1"><Send className="h-4 w-4 mr-1" />Send to Patient</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
