import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Brain, Loader2, AlertTriangle, ChevronLeft, ChevronRight, Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface TriageResult {
  symptoms: string;
  duration: string;
  severity: number;
  urgency: 'low' | 'moderate' | 'high';
  guidance: string;
  intake: { allergies: string; currentMeds: string; relevantHistory: string };
}

export default function TriageStep({ specialty, onBack, onComplete }: {
  specialty: string;
  onBack: () => void;
  onComplete: (r: TriageResult) => void;
}) {
  const { toast } = useToast();
  const [symptoms, setSymptoms] = useState('');
  const [duration, setDuration] = useState('');
  const [severity, setSeverity] = useState(5);
  const [allergies, setAllergies] = useState('');
  const [currentMeds, setCurrentMeds] = useState('');
  const [relevantHistory, setRelevantHistory] = useState('');
  const [urgency, setUrgency] = useState<'low' | 'moderate' | 'high' | null>(null);
  const [guidance, setGuidance] = useState('');
  const [loading, setLoading] = useState(false);

  const runTriage = async () => {
    if (!symptoms.trim()) {
      toast({ title: 'Please describe your symptoms', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          messages: [{
            role: 'user',
            content: `Pre-consultation triage for a ${specialty} appointment.
Symptoms: ${symptoms}
Duration: ${duration || 'not specified'}
Severity (1-10): ${severity}

Provide: urgency line, brief guidance, and 2-3 recommended intake details the patient should prepare.`,
          }],
        },
      });
      if (error) throw error;
      const content: string = data?.content || '';
      const u: 'low' | 'moderate' | 'high' = (data?.urgency as 'low' | 'moderate' | 'high') || 'low';
      setUrgency(u);
      setGuidance(content);
    } catch (e) {
      console.error(e);
      // Fallback heuristic
      const u: 'low' | 'moderate' | 'high' = severity >= 8 ? 'high' : severity >= 5 ? 'moderate' : 'low';
      setUrgency(u);
      setGuidance('Triage service unavailable. Based on severity score, please attend your appointment as scheduled and seek emergency care if symptoms worsen.');
    } finally {
      setLoading(false);
    }
  };

  const urgencyColor = urgency === 'high' ? 'bg-destructive text-destructive-foreground'
    : urgency === 'moderate' ? 'bg-warning text-warning-foreground'
    : 'bg-success text-success-foreground';

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <Button variant="ghost" onClick={onBack}><ChevronLeft className="h-4 w-4 mr-1" /> Back</Button>

      <Card className="p-6 shadow-card space-y-5">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold font-heading">Pre-visit symptom check</h3>
        </div>
        <p className="text-sm text-muted-foreground">A quick triage helps your doctor prepare and prioritise care. Not a diagnosis.</p>

        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium block mb-1.5">What brings you in?</label>
            <Textarea rows={3} placeholder="Describe your main symptoms…" value={symptoms} onChange={e => setSymptoms(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium block mb-1.5">How long?</label>
              <Input placeholder="e.g. 3 days" value={duration} onChange={e => setDuration(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">Severity: <span className="text-primary font-bold">{severity}/10</span></label>
              <input type="range" min={1} max={10} value={severity} onChange={e => setSeverity(Number(e.target.value))} className="w-full accent-primary" />
            </div>
          </div>
          <Button onClick={runTriage} disabled={loading} variant="outline" className="w-full">
            {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Analysing…</> : <><Activity className="h-4 w-4 mr-2" />Run triage</>}
          </Button>
        </div>

        {urgency && (
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center gap-2">
              <Badge className={urgencyColor + ' border-0'}>Urgency: {urgency}</Badge>
              {urgency === 'high' && <span className="text-xs text-destructive flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Seek urgent care if needed</span>}
            </div>
            <Card className="p-3 bg-muted/40">
              <p className="text-sm whitespace-pre-wrap text-foreground">{guidance}</p>
            </Card>

            <div className="space-y-3 pt-2">
              <p className="text-sm font-medium">Recommended intake details for your doctor</p>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Known allergies</label>
                <Input placeholder="e.g. penicillin, peanuts" value={allergies} onChange={e => setAllergies(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Current medications</label>
                <Input placeholder="e.g. Lisinopril 10mg daily" value={currentMeds} onChange={e => setCurrentMeds(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Relevant medical history</label>
                <Input placeholder="e.g. asthma, recent surgery" value={relevantHistory} onChange={e => setRelevantHistory(e.target.value)} />
              </div>
            </div>
          </div>
        )}

        <Button
          className="w-full"
          disabled={!urgency}
          onClick={() => onComplete({
            symptoms, duration, severity, urgency: urgency!,
            guidance, intake: { allergies, currentMeds, relevantHistory },
          })}
        >
          Continue to confirmation <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </Card>
    </div>
  );
}
