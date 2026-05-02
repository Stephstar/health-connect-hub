import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import { Search, User, Phone, Mail, FileText, Calendar, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Patient {
  id: string; name: string; email: string; phone: string; gender: string;
  dob: string; lastVisit: string; status: string;
}

export default function DoctorPatients() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (user) loadPatients(); }, [user]);

  const loadPatients = async () => {
    setLoading(true);
    // Get doctor record
    const { data: docData } = await supabase.from('doctors').select('id').eq('user_id', user!.id).single();
    if (!docData) { setLoading(false); return; }

    // Get unique patient IDs from appointments
    const { data: apts } = await supabase
      .from('appointments')
      .select('patient_id, appointment_date')
      .eq('doctor_id', docData.id)
      .order('appointment_date', { ascending: false });

    if (!apts || apts.length === 0) { setLoading(false); return; }

    const patientLastVisit = new Map<string, string>();
    apts.forEach(a => {
      if (!patientLastVisit.has(a.patient_id)) patientLastVisit.set(a.patient_id, a.appointment_date);
    });

    const patientIds = [...patientLastVisit.keys()];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone, gender, date_of_birth, status')
      .in('id', patientIds);

    setPatients((profiles || []).map(p => ({
      id: p.id,
      name: p.full_name,
      email: p.email,
      phone: p.phone || '',
      gender: p.gender || '',
      dob: p.date_of_birth || '',
      lastVisit: patientLastVisit.get(p.id) || '',
      status: p.status,
    })));
    setLoading(false);
  };

  const filtered = patients.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.email.toLowerCase().includes(search.toLowerCase()));

  return (
    <DashboardLayout role="doctor" title="Patients">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search patients..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>

          <div className="space-y-2">
            {filtered.map(p => (
              <Card key={p.id}
                className={`p-4 shadow-card cursor-pointer transition-all hover:shadow-card-hover ${selectedPatient?.id === p.id ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setSelectedPatient(p)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                      {p.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.gender && `${p.gender} • `}Last visit: {p.lastVisit}</p>
                    </div>
                  </div>
                  <Badge variant={p.status === 'active' ? 'default' : 'secondary'} className="text-[10px] capitalize">{p.status}</Badge>
                </div>
              </Card>
            ))}
            {filtered.length === 0 && (
              <Card className="p-12 text-center shadow-card"><p className="text-muted-foreground">No patients found.</p></Card>
            )}
          </div>
        </div>

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
                  <div><p className="text-muted-foreground text-xs">Gender</p><p className="font-medium text-foreground">{selectedPatient.gender || 'N/A'}</p></div>
                  <div><p className="text-muted-foreground text-xs">Date of Birth</p><p className="font-medium text-foreground">{selectedPatient.dob || 'N/A'}</p></div>
                  <div><p className="text-muted-foreground text-xs">Status</p><Badge variant={selectedPatient.status === 'active' ? 'default' : 'secondary'} className="capitalize">{selectedPatient.status}</Badge></div>
                  <div><p className="text-muted-foreground text-xs">Last Visit</p><p className="font-medium text-foreground">{selectedPatient.lastVisit}</p></div>
                </div>
                <div className="space-y-1">
                  {selectedPatient.phone && <div className="flex items-center gap-2 text-sm"><Phone className="h-3 w-3 text-muted-foreground" /><span className="text-foreground">{selectedPatient.phone}</span></div>}
                  <div className="flex items-center gap-2 text-sm"><Mail className="h-3 w-3 text-muted-foreground" /><span className="text-foreground">{selectedPatient.email}</span></div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button size="sm" className="flex-1" onClick={() => toast({ title: 'Opening medical records' })}><FileText className="h-3 w-3 mr-1" />Records</Button>
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => toast({ title: 'Scheduling appointment' })}><Calendar className="h-3 w-3 mr-1" />Schedule</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
