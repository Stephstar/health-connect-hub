import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp, type Doctor } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Video, MapPin, Star, ChevronLeft, ChevronRight, CheckCircle2, Loader2 } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { useToast } from '@/hooks/use-toast';
import TriageStep, { type TriageResult } from '@/components/TriageStep';

const TIME_SLOTS = ['9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM'];

export default function AppointmentBooking() {
  const navigate = useNavigate();
  const { doctors, bookAppointment } = useApp();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [specialty, setSpecialty] = useState('All');
  const [consultationType, setConsultationType] = useState<'video' | 'in-person'>('video');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [step, setStep] = useState<'browse' | 'schedule' | 'triage' | 'confirm' | 'success'>('browse');
  const [submitting, setSubmitting] = useState(false);
  const [bookedAppointmentId, setBookedAppointmentId] = useState<string | null>(null);
  const [triage, setTriage] = useState<TriageResult | null>(null);

  const specialties = useMemo(() => {
    const set = new Set<string>(['All']);
    doctors.forEach(d => set.add(d.specialty));
    return Array.from(set);
  }, [doctors]);

  const filtered = doctors.filter(d => {
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase());
    const matchSpec = specialty === 'All' || d.specialty === specialty;
    return matchSearch && matchSpec;
  });

  // Generate next 14 days
  const dates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return { full: d.toISOString().split('T')[0], day: d.toLocaleDateString('en', { weekday: 'short' }), date: d.getDate(), month: d.toLocaleDateString('en', { month: 'short' }) };
  });

  const handleBook = async () => {
    if (!selectedDoctor || !selectedDate || !selectedTime) return;
    setSubmitting(true);
    const reasonText = triage
      ? `Chief complaint: ${triage.symptoms}\nDuration: ${triage.duration}\nSeverity: ${triage.severity}/10\nUrgency: ${triage.urgency}\nAllergies: ${triage.intake.allergies || 'none reported'}\nCurrent meds: ${triage.intake.currentMeds || 'none reported'}\nRelevant history: ${triage.intake.relevantHistory || 'none reported'}`
      : undefined;
    const result = await bookAppointment({
      doctorId: selectedDoctor.id,
      date: selectedDate,
      time: selectedTime,
      type: consultationType,
      price: selectedDoctor.price,
      reason: reasonText,
    });
    setSubmitting(false);
    if (result) {
      setBookedAppointmentId(result.id);
      toast({ title: 'Appointment booked', description: `Your appointment with ${selectedDoctor.name} is confirmed.` });
      setStep('success');
    } else {
      toast({ title: 'Booking failed', description: 'That slot may already be booked. Please pick another time.', variant: 'destructive' });
    }
  };

  return (
    <DashboardLayout role="patient" title="Book Appointment">
      <div className="space-y-6">
        {step === 'browse' && (
          <>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search doctors..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
              </div>
              <div className="flex gap-2 flex-wrap">
                {specialties.map(s => (
                  <Button key={s} variant={specialty === s ? 'default' : 'outline'} size="sm" onClick={() => setSpecialty(s)}>{s}</Button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setConsultationType('video')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${consultationType === 'video' ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground'}`}
              >
                <Video className="h-4 w-4" /> Video Call
              </button>
              <button
                onClick={() => setConsultationType('in-person')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${consultationType === 'in-person' ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground'}`}
              >
                <MapPin className="h-4 w-4" /> In-Person Visit
              </button>
            </div>

            {filtered.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground shadow-card">
                {doctors.length === 0 ? 'Loading doctors...' : 'No doctors match your filters.'}
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map(doc => (
                  <Card key={doc.id} className={`p-5 shadow-card hover:shadow-card-hover transition-all cursor-pointer ${selectedDoctor?.id === doc.id ? 'ring-2 ring-primary' : ''}`} onClick={() => setSelectedDoctor(doc)}>
                    <div className="flex items-start gap-4">
                      <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                        {doc.name.split(' ').slice(1).map(n => n[0]).join('')}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-foreground text-sm">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">{doc.specialty}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="h-3 w-3 fill-warning text-warning" />
                          <span className="text-xs font-medium text-foreground">{doc.rating}</span>
                          <span className="text-xs text-muted-foreground">({doc.reviews})</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-3 border-t">
                      <span className="text-lg font-bold text-foreground">${doc.price}</span>
                      <Badge variant="default">{doc.yearsExperience}y exp</Badge>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {selectedDoctor && (
              <div className="flex justify-end">
                <Button onClick={() => setStep('schedule')}>
                  Continue with {selectedDoctor.name} <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </>
        )}

        {step === 'schedule' && selectedDoctor && (
          <div className="max-w-2xl mx-auto space-y-6">
            <Button variant="ghost" onClick={() => setStep('browse')}><ChevronLeft className="h-4 w-4 mr-1" /> Back</Button>

            <Card className="p-6 shadow-card">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">{selectedDoctor.name.split(' ').slice(1).map(n => n[0]).join('')}</div>
                <div>
                  <p className="font-semibold text-foreground">{selectedDoctor.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedDoctor.specialty} • ${selectedDoctor.price}</p>
                </div>
              </div>

              <h4 className="font-semibold text-foreground mb-3">Select Date</h4>
              <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
                {dates.map(d => (
                  <button
                    key={d.full}
                    onClick={() => setSelectedDate(d.full)}
                    className={`flex flex-col items-center px-3 py-2 rounded-lg border-2 min-w-[60px] transition-all ${selectedDate === d.full ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:border-primary/30'}`}
                  >
                    <span className="text-xs">{d.day}</span>
                    <span className="text-lg font-bold">{d.date}</span>
                    <span className="text-xs">{d.month}</span>
                  </button>
                ))}
              </div>

              <h4 className="font-semibold text-foreground mb-3">Select Time</h4>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-2 mb-6">
                {TIME_SLOTS.map(t => (
                  <button
                    key={t}
                    onClick={() => setSelectedTime(t)}
                    className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${selectedTime === t ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:border-primary/30'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <Button className="w-full" disabled={!selectedDate || !selectedTime} onClick={() => setStep('triage')}>
                Continue to symptom check
              </Button>
            </Card>
          </div>
        )}

        {step === 'triage' && selectedDoctor && (
          <TriageStep
            specialty={selectedDoctor.specialty}
            onBack={() => setStep('schedule')}
            onComplete={(r) => { setTriage(r); setStep('confirm'); }}
          />
        )}

        {step === 'confirm' && selectedDoctor && (
          <div className="max-w-lg mx-auto space-y-6">
            <Button variant="ghost" onClick={() => setStep('triage')}><ChevronLeft className="h-4 w-4 mr-1" /> Back</Button>

            <Card className="p-6 shadow-card">
              <h3 className="text-lg font-semibold font-heading text-foreground mb-4">Booking Summary</h3>
              <div className="space-y-3 divide-y">
                <div className="flex justify-between py-2"><span className="text-muted-foreground text-sm">Doctor</span><span className="font-medium text-foreground text-sm">{selectedDoctor.name}</span></div>
                <div className="flex justify-between py-2"><span className="text-muted-foreground text-sm">Specialty</span><span className="text-sm text-foreground">{selectedDoctor.specialty}</span></div>
                <div className="flex justify-between py-2"><span className="text-muted-foreground text-sm">Date</span><span className="text-sm text-foreground">{selectedDate}</span></div>
                <div className="flex justify-between py-2"><span className="text-muted-foreground text-sm">Time</span><span className="text-sm text-foreground">{selectedTime}</span></div>
                <div className="flex justify-between py-2"><span className="text-muted-foreground text-sm">Type</span><span className="text-sm text-foreground capitalize">{consultationType === 'video' ? 'Video Call' : 'In-Person'}</span></div>
                <div className="flex justify-between py-2"><span className="text-muted-foreground text-sm">Price</span><span className="text-lg font-bold text-foreground">${selectedDoctor.price}</span></div>
              </div>
              <Button className="w-full mt-6" onClick={handleBook} disabled={submitting}>
                {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Booking...</> : 'Confirm Booking'}
              </Button>
            </Card>
          </div>
        )}

        {step === 'success' && (
          <div className="max-w-lg mx-auto text-center space-y-6 py-12">
            <div className="mx-auto h-20 w-20 rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-success" />
            </div>
            <h3 className="text-2xl font-bold font-heading text-foreground">Booking Confirmed!</h3>
            <p className="text-muted-foreground">Your appointment has been scheduled. You'll see it on your dashboard.</p>
            <div className="flex flex-col gap-3 items-center">
              {consultationType === 'video' && bookedAppointmentId && (
                <Button onClick={() => navigate(`/patient/consultation?apt=${bookedAppointmentId}`)}>
                  <Video className="h-4 w-4 mr-2" /> Join Consultation Now
                </Button>
              )}
              <div className="flex gap-3">
                <Button variant={consultationType === 'video' ? 'outline' : 'default'} onClick={() => navigate('/patient/dashboard')}>Go to Dashboard</Button>
                <Button variant="outline" onClick={() => { setStep('browse'); setSelectedDoctor(null); setSelectedDate(''); setSelectedTime(''); setBookedAppointmentId(null); }}>Book Another</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
