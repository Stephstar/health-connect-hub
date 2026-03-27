import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/DashboardLayout';
import { Search, User, Phone, Mail, FileText, Calendar, X, Activity } from 'lucide-react';

interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  email: string;
  lastVisit: string;
  conditions: string[];
  status: 'active' | 'inactive';
  bloodType: string;
  allergies: string[];
  medications: string[];
}

const PATIENTS: Patient[] = [
  { id: '1', name: 'Sarah Johnson', age: 34, gender: 'Female', phone: '+1 555-0101', email: 'sarah@email.com', lastVisit: '2026-03-20', conditions: ['Hypertension', 'Asthma'], status: 'active', bloodType: 'A+', allergies: ['Penicillin'], medications: ['Lisinopril 10mg', 'Albuterol inhaler'] },
  { id: '2', name: 'James Owusu', age: 45, gender: 'Male', phone: '+1 555-0102', email: 'james@email.com', lastVisit: '2026-03-18', conditions: ['Diabetes Type 2'], status: 'active', bloodType: 'O+', allergies: [], medications: ['Metformin 500mg'] },
  { id: '3', name: 'Grace Mensah', age: 28, gender: 'Female', phone: '+1 555-0103', email: 'grace@email.com', lastVisit: '2026-03-15', conditions: ['Migraine'], status: 'active', bloodType: 'B+', allergies: ['Sulfa drugs'], medications: ['Sumatriptan'] },
  { id: '4', name: 'Kofi Agyeman', age: 52, gender: 'Male', phone: '+1 555-0104', email: 'kofi@email.com', lastVisit: '2026-02-28', conditions: ['Hypertension', 'High Cholesterol'], status: 'inactive', bloodType: 'AB+', allergies: [], medications: ['Amlodipine 5mg', 'Atorvastatin 20mg'] },
  { id: '5', name: 'Ama Darko', age: 31, gender: 'Female', phone: '+1 555-0105', email: 'ama@email.com', lastVisit: '2026-03-22', conditions: ['Eczema'], status: 'active', bloodType: 'O-', allergies: ['Latex'], medications: ['Hydrocortisone cream'] },
];

export default function DoctorPatients() {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const filtered = PATIENTS.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.conditions.some(c => c.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <DashboardLayout role="doctor" title="Patients">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search patients or conditions..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <div className="flex gap-2">
              {(['all', 'active', 'inactive'] as const).map(s => (
                <Button key={s} variant={statusFilter === s ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter(s)} className="capitalize">{s}</Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {filtered.map(p => (
              <Card
                key={p.id}
                className={`p-4 shadow-card cursor-pointer transition-all hover:shadow-card-hover ${selectedPatient?.id === p.id ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setSelectedPatient(p)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                      {p.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.age}y, {p.gender} • Last visit: {p.lastVisit}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {p.conditions.slice(0, 2).map(c => (
                      <Badge key={c} variant="secondary" className="text-[10px]">{c}</Badge>
                    ))}
                    <Badge variant={p.status === 'active' ? 'default' : 'secondary'} className="text-[10px]">{p.status}</Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Patient Detail Panel */}
        {selectedPatient && (
          <div className="lg:w-96">
            <Card className="shadow-card sticky top-24">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{selectedPatient.name}</CardTitle>
                  <button onClick={() => setSelectedPatient(null)}><X className="h-4 w-4 text-muted-foreground" /></button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Age</p>
                    <p className="font-medium text-foreground">{selectedPatient.age}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Gender</p>
                    <p className="font-medium text-foreground">{selectedPatient.gender}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Blood Type</p>
                    <p className="font-medium text-foreground">{selectedPatient.bloodType}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Status</p>
                    <Badge variant={selectedPatient.status === 'active' ? 'default' : 'secondary'}>{selectedPatient.status}</Badge>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm"><Phone className="h-3 w-3 text-muted-foreground" /><span className="text-foreground">{selectedPatient.phone}</span></div>
                  <div className="flex items-center gap-2 text-sm"><Mail className="h-3 w-3 text-muted-foreground" /><span className="text-foreground">{selectedPatient.email}</span></div>
                </div>

                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Conditions</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedPatient.conditions.map(c => <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>)}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Allergies</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedPatient.allergies.length > 0 ? selectedPatient.allergies.map(a => <Badge key={a} variant="destructive" className="text-xs">{a}</Badge>) : <span className="text-xs text-muted-foreground">None reported</span>}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Current Medications</p>
                  <div className="space-y-1">
                    {selectedPatient.medications.map(m => (
                      <div key={m} className="flex items-center gap-2 text-sm"><Activity className="h-3 w-3 text-primary" /><span className="text-foreground">{m}</span></div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button size="sm" className="flex-1" onClick={() => toast({ title: 'Opening medical records', description: `Viewing records for ${selectedPatient.name}` })}><FileText className="h-3 w-3 mr-1" />Records</Button>
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => toast({ title: 'Scheduling appointment', description: `Booking for ${selectedPatient.name}` })}><Calendar className="h-3 w-3 mr-1" />Schedule</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
