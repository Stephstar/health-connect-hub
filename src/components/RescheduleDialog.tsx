import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useApp, type Appointment } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';

const TIME_SLOTS = ['9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM'];

export default function RescheduleDialog({ appointment, open, onOpenChange, onDone }: {
  appointment: Appointment | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onDone?: () => void;
}) {
  const { rescheduleAppointment } = useApp();
  const { toast } = useToast();
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const dates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return { full: d.toISOString().split('T')[0], day: d.toLocaleDateString('en', { weekday: 'short' }), date: d.getDate(), month: d.toLocaleDateString('en', { month: 'short' }) };
  });

  const submit = async () => {
    if (!appointment || !date || !time) return;
    setSubmitting(true);
    const res = await rescheduleAppointment(appointment.id, date, time);
    setSubmitting(false);
    if (res.ok) {
      toast({ title: 'Appointment rescheduled', description: `Moved to ${date} at ${time}.` });
      onOpenChange(false);
      setDate(''); setTime('');
      onDone?.();
    } else {
      toast({ title: 'Could not reschedule', description: res.error, variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Reschedule appointment</DialogTitle>
        </DialogHeader>
        {appointment && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              With <span className="font-medium text-foreground">{appointment.doctorName}</span> — currently {appointment.date} at {appointment.time}.
            </p>
            <div>
              <p className="text-sm font-medium mb-2">New date</p>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {dates.map(d => (
                  <button key={d.full} onClick={() => setDate(d.full)}
                    className={`flex flex-col items-center px-3 py-2 rounded-lg border-2 min-w-[60px] transition-all ${date === d.full ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:border-primary/30'}`}>
                    <span className="text-xs">{d.day}</span>
                    <span className="text-lg font-bold">{d.date}</span>
                    <span className="text-xs">{d.month}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">New time</p>
              <div className="grid grid-cols-4 gap-2">
                {TIME_SLOTS.map(t => (
                  <button key={t} onClick={() => setTime(t)}
                    className={`px-2 py-1.5 rounded-lg border-2 text-xs font-medium transition-all ${time === t ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:border-primary/30'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!date || !time || submitting}>
            {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</> : 'Confirm reschedule'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
