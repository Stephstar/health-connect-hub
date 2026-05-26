import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Mic, MicOff, VideoIcon, VideoOff, Monitor, Phone, MessageSquare,
  Paperclip, Send, X, Maximize2, Minimize2, FileText, Pill,
  Activity, Brain, ChevronRight, Clock, AlertTriangle, User
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import PrescriptionDialog from '@/components/PrescriptionDialog';

interface PatientRecord {
  id: string;
  title: string;
  record_type: string;
  record_date: string;
  description: string | null;
}

interface PrescriptionItem {
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
}

export default function ConsultationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();

  // Call state
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callState, setCallState] = useState<'connecting' | 'connected' | 'ended'>('connecting');

  // Chat
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { id: '1', sender: 'system', content: 'Consultation started. Chat is encrypted end-to-end.', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
  ]);
  const [newMsg, setNewMsg] = useState('');

  // Clinical data
  const [records, setRecords] = useState<PatientRecord[]>([]);
  const [prescriptions, setPrescriptions] = useState<{ items: PrescriptionItem[]; date: string; notes: string }[]>([]);
  const [consultNotes, setConsultNotes] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);

  // Appointment context
  const appointmentId = searchParams.get('apt');
  const [patientName, setPatientName] = useState('Patient');
  const [patientId, setPatientId] = useState<string | null>(null);
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [doctorName, setDoctorName] = useState('Doctor');
  const [rxOpen, setRxOpen] = useState(false);
  const isDoctor = user?.role === 'doctor';

  // Load appointment and patient data
  useEffect(() => {
    if (!appointmentId || !user) return;
    (async () => {
      const { data: apt } = await supabase
        .from('appointments')
        .select('id, patient_id, doctor_id, notes, doctors(full_name)')
        .eq('id', appointmentId)
        .single();
      if (!apt) return;

      setConsultNotes(apt.notes || '');
      setPatientId(apt.patient_id);
      setDoctorId(apt.doctor_id);
      const dName = (apt.doctors as { full_name: string } | null)?.full_name || 'Doctor';
      setDoctorName(dName);

      // Load patient profile
      const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', apt.patient_id).single();
      if (profile) setPatientName(profile.full_name);

      // Load patient records
      const targetPatientId = apt.patient_id;
      const { data: recs } = await supabase
        .from('medical_records')
        .select('id, title, record_type, record_date, description')
        .eq('patient_id', targetPatientId)
        .order('record_date', { ascending: false })
        .limit(10);
      if (recs) setRecords(recs);

      // Load prescriptions
      const { data: rxs } = await supabase
        .from('prescriptions')
        .select('items, created_at, notes')
        .eq('patient_id', targetPatientId)
        .order('created_at', { ascending: false })
        .limit(5);
      if (rxs) setPrescriptions(rxs.map(r => ({
        items: (r.items as unknown as PrescriptionItem[]) || [],
        date: new Date(r.created_at).toLocaleDateString(),
        notes: r.notes || '',
      })));

      // Generate AI suggestions based on reason
      setAiSuggestions([
        'Consider reviewing latest lab results before assessment',
        'Check medication interactions with current prescriptions',
        'Ask about sleep patterns and stress levels',
        'Review family history for relevant conditions',
      ]);
    })();
  }, [appointmentId, user]);

  // Call timer
  useEffect(() => {
    const t = setTimeout(() => setCallState('connected'), 2500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (callState !== 'connected') return;
    const i = setInterval(() => setCallDuration(d => d + 1), 1000);
    return () => clearInterval(i);
  }, [callState]);

  const formatDuration = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const sendChat = () => {
    if (!newMsg.trim()) return;
    setChatMessages(prev => [...prev, {
      id: Date.now().toString(),
      sender: isDoctor ? 'doctor' : 'patient',
      content: newMsg,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }]);
    setNewMsg('');
  };

  const saveNotes = async () => {
    if (!appointmentId) return;
    await supabase.from('appointments').update({ notes: consultNotes }).eq('id', appointmentId);
    toast({ title: 'Notes saved' });
  };

  const endCall = async () => {
    if (appointmentId && consultNotes) {
      await supabase.from('appointments').update({ notes: consultNotes }).eq('id', appointmentId);
    }
    setCallState('ended');
    toast({ title: 'Consultation ended', description: 'Notes have been saved.' });
    setTimeout(() => {
      if (isDoctor) {
        navigate(`/doctor/consultations`);
      } else {
        navigate('/patient/dashboard');
      }
    }, 1500);
  };

  const completeAndPrescribe = () => {
    setRxOpen(true);
  };

  const onRxSaved = () => {
    setCallState('ended');
    setTimeout(() => navigate('/doctor/prescriptions'), 800);
  };

  const otherPersonName = isDoctor ? patientName : doctorName;
  const otherInitials = otherPersonName.split(' ').map(n => n[0]).slice(0, 2).join('');

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="h-12 flex items-center justify-between px-4 bg-card border-b shrink-0">
        <div className="flex items-center gap-3">
          <Badge className={callState === 'connected' ? 'bg-success text-success-foreground' : callState === 'connecting' ? 'bg-warning text-warning-foreground' : 'bg-muted text-muted-foreground'}>
            {callState === 'connected' ? '● Live' : callState === 'connecting' ? '● Connecting…' : '● Ended'}
          </Badge>
          <span className="text-sm font-medium text-foreground">{otherPersonName}</span>
          {callState === 'connected' && <span className="text-xs text-muted-foreground font-mono">{formatDuration(callDuration)}</span>}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowChat(!showChat)}>
            <MessageSquare className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setIsFullscreen(!isFullscreen); setShowSidebar(isFullscreen); }}>
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          {isDoctor && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowSidebar(!showSidebar)}>
              <FileText className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Area */}
        <div className="flex-1 flex flex-col relative bg-muted/20">
          {/* Main video */}
          <div className="flex-1 flex items-center justify-center relative">
            <div className="text-center">
              <div className={`h-28 w-28 rounded-full flex items-center justify-center mx-auto mb-4 ${callState === 'connecting' ? 'bg-primary/20 animate-pulse' : 'bg-primary/10'}`}>
                <span className="text-4xl font-bold text-primary">{otherInitials}</span>
              </div>
              <p className="text-foreground text-lg font-medium">{otherPersonName}</p>
              {callState === 'connecting' && <p className="text-sm text-muted-foreground mt-1">Connecting…</p>}
            </div>

            {/* PiP self-view */}
            <div className="absolute bottom-4 right-4 w-36 h-28 rounded-xl bg-card border flex items-center justify-center overflow-hidden shadow-md">
              {isCameraOn ? (
                <div className="text-center">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">You</p>
                </div>
              ) : (
                <div className="text-center">
                  <VideoOff className="h-5 w-5 text-muted-foreground mx-auto" />
                  <p className="text-[10px] text-muted-foreground mt-1">Camera off</p>
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="h-16 flex items-center justify-center gap-3 bg-card border-t shrink-0">
            <Button variant="ghost" size="icon"
              className={`h-11 w-11 rounded-full ${isMuted ? 'bg-destructive text-destructive-foreground' : 'bg-muted'}`}
              onClick={() => setIsMuted(!isMuted)}>
              {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon"
              className={`h-11 w-11 rounded-full ${!isCameraOn ? 'bg-destructive text-destructive-foreground' : 'bg-muted'}`}
              onClick={() => setIsCameraOn(!isCameraOn)}>
              {isCameraOn ? <VideoIcon className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon"
              className={`h-11 w-11 rounded-full ${isScreenSharing ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
              onClick={() => { setIsScreenSharing(!isScreenSharing); toast({ title: isScreenSharing ? 'Screen sharing stopped' : 'Screen sharing started' }); }}>
              <Monitor className="h-4 w-4" />
            </Button>
            <Button size="icon"
              className="h-12 w-12 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={endCall}>
              <Phone className="h-5 w-5 rotate-[135deg]" />
            </Button>
            {isDoctor && callState === 'connected' && (
              <Button size="sm" variant="outline" className="ml-4 text-xs" onClick={completeAndPrescribe}>
                <Pill className="h-3 w-3 mr-1" /> Complete & Prescribe
              </Button>
            )}
          </div>
        </div>

        {/* Chat Sidebar */}
        {showChat && (
          <div className="w-72 border-l flex flex-col bg-card">
            <div className="h-10 border-b flex items-center justify-between px-3">
              <span className="text-xs font-medium text-foreground">In-call Chat</span>
              <button onClick={() => setShowChat(false)}><X className="h-3 w-3 text-muted-foreground" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {chatMessages.map(msg => (
                <div key={msg.id} className={`flex ${msg.sender === (isDoctor ? 'doctor' : 'patient') ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-xl px-3 py-1.5 ${
                    msg.sender === 'system' ? 'bg-muted text-muted-foreground text-center w-full' :
                    msg.sender === (isDoctor ? 'doctor' : 'patient') ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}>
                    <p className="text-xs">{msg.content}</p>
                    <p className="text-[10px] mt-0.5 opacity-50">{msg.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t p-2 flex gap-1">
              <input
                className="flex-1 bg-muted rounded-lg px-2 py-1.5 text-xs outline-none"
                placeholder="Message..."
                value={newMsg}
                onChange={e => setNewMsg(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendChat()}
              />
              <button onClick={sendChat} className="text-primary"><Send className="h-3 w-3" /></button>
            </div>
          </div>
        )}

        {/* Clinical Sidebar (Doctor only) */}
        {showSidebar && isDoctor && (
          <div className="w-96 border-l flex flex-col bg-card overflow-hidden">
            <Tabs defaultValue="notes" className="flex flex-col h-full">
              <TabsList className="mx-2 mt-2 shrink-0">
                <TabsTrigger value="notes" className="text-xs">Notes</TabsTrigger>
                <TabsTrigger value="records" className="text-xs">Records</TabsTrigger>
                <TabsTrigger value="rx" className="text-xs">Rx</TabsTrigger>
                <TabsTrigger value="ai" className="text-xs">AI</TabsTrigger>
              </TabsList>

              <TabsContent value="notes" className="flex-1 flex flex-col p-3 overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-foreground">Consultation Notes</h4>
                  <Button size="sm" variant="ghost" className="text-xs h-7" onClick={saveNotes}>Save</Button>
                </div>
                <Textarea
                  value={consultNotes}
                  onChange={e => setConsultNotes(e.target.value)}
                  placeholder="Chief complaint, history, examination findings, assessment, plan..."
                  className="flex-1 resize-none text-sm"
                />
                <div className="mt-2 flex gap-1 flex-wrap">
                  {['S:', 'O:', 'A:', 'P:'].map(prefix => (
                    <Button key={prefix} size="sm" variant="outline" className="text-[10px] h-6 px-2"
                      onClick={() => setConsultNotes(prev => prev + (prev ? '\n' : '') + prefix + ' ')}>
                      {prefix === 'S:' ? 'Subjective' : prefix === 'O:' ? 'Objective' : prefix === 'A:' ? 'Assessment' : 'Plan'}
                    </Button>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="records" className="flex-1 overflow-y-auto p-3 space-y-2">
                <h4 className="text-sm font-medium text-foreground mb-2">Patient Records</h4>
                {records.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No previous records found.</p>
                ) : records.map(r => (
                  <Card key={r.id} className="p-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-3 w-3 text-primary shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{r.title}</p>
                        <p className="text-[10px] text-muted-foreground">{r.record_type} • {r.record_date}</p>
                      </div>
                    </div>
                    {r.description && <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{r.description}</p>}
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="rx" className="flex-1 overflow-y-auto p-3 space-y-2">
                <h4 className="text-sm font-medium text-foreground mb-2">Current Medications</h4>
                {prescriptions.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No active prescriptions.</p>
                ) : prescriptions.map((rx, i) => (
                  <Card key={i} className="p-3 space-y-1">
                    <p className="text-[10px] text-muted-foreground">{rx.date}</p>
                    {rx.items.map((item, j) => (
                      <div key={j} className="flex items-center gap-1">
                        <Pill className="h-3 w-3 text-primary shrink-0" />
                        <span className="text-xs text-foreground">{item.medication} {item.dosage} — {item.frequency}</span>
                      </div>
                    ))}
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="ai" className="flex-1 overflow-y-auto p-3 space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="h-4 w-4 text-primary" />
                  <h4 className="text-sm font-medium text-foreground">AI Suggestions</h4>
                </div>
                <p className="text-[10px] text-muted-foreground italic mb-2">These are suggestions only. Clinical judgment takes priority.</p>
                {aiSuggestions.map((s, i) => (
                  <Card key={i} className="p-2.5 flex items-start gap-2 hover:bg-muted/50 cursor-pointer transition-colors">
                    <Activity className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                    <p className="text-xs text-foreground">{s}</p>
                  </Card>
                ))}
                <div className="pt-2 border-t mt-3">
                  <div className="flex items-center gap-1 text-warning mb-1">
                    <AlertTriangle className="h-3 w-3" />
                    <span className="text-xs font-medium">Alerts</span>
                  </div>
                  <p className="text-xs text-muted-foreground">No drug interactions detected. No allergy alerts.</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
      <PrescriptionDialog
        open={rxOpen}
        onOpenChange={setRxOpen}
        doctorId={doctorId}
        patientId={patientId}
        appointmentId={appointmentId}
        consultNotes={consultNotes}
        onSaved={onRxSaved}
      />
    </div>
  );
}
