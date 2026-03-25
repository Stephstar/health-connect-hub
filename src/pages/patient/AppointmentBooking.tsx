import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Search, Video, MapPin, Star, Clock, ChevronLeft, ChevronRight, X, CheckCircle2 } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';

const SPECIALTIES = ['All', 'Cardiology', 'Dermatology', 'General Practice', 'Neurology', 'Pediatrics', 'Orthopedics'];

const DOCTORS = [
  { id: '1', name: 'Dr. Michael Chen', specialty: 'Cardiology', rating: 4.9, reviews: 127, price: 75, avatar: '', available: true, nextSlot: '10:00 AM' },
  { id: '2', name: 'Dr. Amara Okafor', specialty: 'Dermatology', rating: 4.8, reviews: 98, price: 120, avatar: '', available: true, nextSlot: '2:30 PM' },
  { id: '3', name: 'Dr. Emily Watson', specialty: 'General Practice', rating: 4.7, reviews: 215, price: 50, avatar: '', available: true, nextSlot: '9:00 AM' },
  { id: '4', name: 'Dr. James Adeyemi', specialty: 'Neurology', rating: 4.9, reviews: 89, price: 150, avatar: '', available: false, nextSlot: '' },
  { id: '5', name: 'Dr. Sarah Kim', specialty: 'Pediatrics', rating: 4.6, reviews: 156, price: 65, avatar: '', available: true, nextSlot: '11:30 AM' },
  { id: '6', name: 'Dr. Robert Mensah', specialty: 'Orthopedics', rating: 4.8, reviews: 73, price: 130, avatar: '', available: true, nextSlot: '3:00 PM' },
];

const TIME_SLOTS = ['9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM'];

export default function AppointmentBooking() {
  const navigate = useNavigate();
  const { addAppointment } = useApp();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [specialty, setSpecialty] = useState('All');
  const [consultationType, setConsultationType] = useState<'video' | 'in-person'>('video');
  const [selectedDoctor, setSelectedDoctor] = useState<typeof DOCTORS[0] | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [step, setStep] = useState<'browse' | 'schedule' | 'confirm' | 'success'>('browse');

  const filtered = DOCTORS.filter(d => {
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

  const handleBook = () => {
    if (!selectedDoctor || !selectedDate || !selectedTime) return;
    const apt = {
      id: Date.now().toString(),
      doctorName: selectedDoctor.name,
      doctorSpecialty: selectedDoctor.specialty,
      doctorAvatar: '',
      date: selectedDate,
      time: selectedTime,
      type: consultationType,
      status: 'upcoming' as const,
      price: selectedDoctor.price,
    };
    addAppointment(apt);
    setStep('success');
  };

  return (
    <DashboardLayout role="patient" title="Book Appointment">
      <div className="space-y-6">
        {step === 'browse' && (
          <>
            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search doctors..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
              </div>
              <div className="flex gap-2 flex-wrap">
                {SPECIALTIES.map(s => (
                  <Button key={s} variant={specialty === s ? 'default' : 'outline'} size="sm" onClick={() => setSpecialty(s)}>{s}</Button>
                ))}
              </div>
            </div>

            {/* Consultation Type */}
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

            {/* Doctor Cards */}
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
                    <Badge variant={doc.available ? 'default' : 'secondary'}>
                      {doc.available ? `Next: ${doc.nextSlot}` : 'Unavailable'}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>

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

              {/* Date Selection */}
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

              {/* Time Selection */}
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

              <Button className="w-full" disabled={!selectedDate || !selectedTime} onClick={() => setStep('confirm')}>
                Review Booking
              </Button>
            </Card>
          </div>
        )}

        {step === 'confirm' && selectedDoctor && (
          <div className="max-w-lg mx-auto space-y-6">
            <Button variant="ghost" onClick={() => setStep('schedule')}><ChevronLeft className="h-4 w-4 mr-1" /> Back</Button>
            
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
              <Button className="w-full mt-6" onClick={handleBook}>Confirm Booking</Button>
            </Card>
          </div>
        )}

        {step === 'success' && (
          <div className="max-w-lg mx-auto text-center space-y-6 py-12">
            <div className="mx-auto h-20 w-20 rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-success" />
            </div>
            <h3 className="text-2xl font-bold font-heading text-foreground">Booking Confirmed!</h3>
            <p className="text-muted-foreground">Your appointment has been scheduled. You'll receive a confirmation email shortly.</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => navigate('/patient/dashboard')}>Go to Dashboard</Button>
              <Button variant="outline" onClick={() => { setStep('browse'); setSelectedDoctor(null); setSelectedDate(''); setSelectedTime(''); }}>Book Another</Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
