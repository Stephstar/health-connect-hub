import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/DashboardLayout';
import { User, Bell, Shield, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function DoctorSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('profile');
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [consultationFee, setConsultationFee] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (user) loadProfile(); }, [user]);

  const loadProfile = async () => {
    setLoading(true);
    const { data: doc } = await supabase.from('doctors').select('*').eq('user_id', user!.id).single();
    if (doc) {
      setName(doc.full_name);
      setBio(doc.bio || '');
      setSpecialty(doc.specialty);
      setConsultationFee(String(doc.consultation_fee));
    }
    setLoading(false);
  };

  const saveProfile = async () => {
    await supabase.from('doctors').update({
      full_name: name,
      bio,
      specialty,
      consultation_fee: Number(consultationFee),
    }).eq('user_id', user!.id);
    await supabase.from('profiles').update({ full_name: name }).eq('id', user!.id);
    toast({ title: 'Profile updated' });
  };

  const changePassword = async () => {
    const newPw = (document.getElementById('new-pw') as HTMLInputElement)?.value;
    if (!newPw || newPw.length < 6) { toast({ title: 'Password must be at least 6 characters', variant: 'destructive' }); return; }
    const { error } = await supabase.auth.updateUser({ password: newPw });
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else toast({ title: 'Password updated' });
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  return (
    <DashboardLayout role="doctor" title="Settings">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-56 flex md:flex-col gap-1">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${activeTab === t.id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}>
              <t.icon className="h-4 w-4" /> {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1">
          {activeTab === 'profile' && (
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-lg">Doctor Profile</CardTitle>
                <CardDescription>Manage your professional profile</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center"><User className="h-8 w-8 text-primary" /></div>
                  <div>
                    <p className="font-medium text-foreground">{name}</p>
                    <Badge className="mt-1">{specialty}</Badge>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Full Name</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
                  <div className="space-y-2"><Label>Email</Label><Input value={user?.email} disabled className="bg-muted" /></div>
                  <div className="space-y-2"><Label>Specialty</Label><Input value={specialty} onChange={e => setSpecialty(e.target.value)} /></div>
                  <div className="space-y-2"><Label>Consultation Fee ($)</Label><Input value={consultationFee} onChange={e => setConsultationFee(e.target.value)} /></div>
                </div>
                <div className="space-y-2"><Label>Bio</Label><Textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} /></div>
                <Button onClick={saveProfile}>Save Changes</Button>
              </CardContent>
            </Card>
          )}

          {activeTab === 'notifications' && (
            <Card className="shadow-card">
              <CardHeader><CardTitle className="text-lg">Notifications</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {['Email Notifications', 'Appointment Alerts', 'Message Notifications'].map(label => (
                  <div key={label} className="flex items-center justify-between py-2">
                    <span className="text-sm font-medium text-foreground">{label}</span>
                    <Switch defaultChecked />
                  </div>
                ))}
                <Button onClick={() => toast({ title: 'Preferences saved' })}>Save</Button>
              </CardContent>
            </Card>
          )}

          {activeTab === 'security' && (
            <Card className="shadow-card">
              <CardHeader><CardTitle className="text-lg">Security</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>New Password</Label><Input id="new-pw" type="password" placeholder="••••••••" /></div>
                  <div className="space-y-2"><Label>Confirm Password</Label><Input type="password" placeholder="••••••••" /></div>
                </div>
                <Button onClick={changePassword}>Update Password</Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
