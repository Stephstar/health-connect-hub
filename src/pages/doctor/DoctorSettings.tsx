import React, { useState } from 'react';
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

export default function DoctorSettings() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('profile');
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState('Board-certified cardiologist with 12 years of experience specializing in preventive cardiology and heart failure management.');
  const [consultationFee, setConsultationFee] = useState('75');
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [appointmentAlerts, setAppointmentAlerts] = useState(true);

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'availability', label: 'Availability', icon: Clock },
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
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{user?.name}</p>
                    <Badge className="mt-1">Cardiologist</Badge>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Full Name</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
                  <div className="space-y-2"><Label>Email</Label><Input value={user?.email} disabled className="bg-muted" /></div>
                  <div className="space-y-2"><Label>Specialty</Label><Input defaultValue="Cardiology" /></div>
                  <div className="space-y-2"><Label>License Number</Label><Input defaultValue="MC-2014-05821" /></div>
                  <div className="space-y-2"><Label>Consultation Fee ($)</Label><Input value={consultationFee} onChange={e => setConsultationFee(e.target.value)} /></div>
                  <div className="space-y-2"><Label>Experience</Label><Input defaultValue="12 years" /></div>
                </div>
                <div className="space-y-2"><Label>Bio</Label><Textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} /></div>
                <Button onClick={() => { updateUser({ name }); toast({ title: 'Profile updated' }); }}>Save Changes</Button>
              </CardContent>
            </Card>
          )}

          {activeTab === 'availability' && (
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-lg">Availability Schedule</CardTitle>
                <CardDescription>Set your working hours</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => (
                  <div key={day} className="flex items-center justify-between py-2">
                    <span className="text-sm font-medium text-foreground w-24">{day}</span>
                    <div className="flex items-center gap-2">
                      <Input type="time" defaultValue="09:00" className="w-32" />
                      <span className="text-muted-foreground">to</span>
                      <Input type="time" defaultValue="17:00" className="w-32" />
                      <Switch defaultChecked />
                    </div>
                  </div>
                ))}
                <Button onClick={() => toast({ title: 'Schedule saved' })}>Save Schedule</Button>
              </CardContent>
            </Card>
          )}

          {activeTab === 'notifications' && (
            <Card className="shadow-card">
              <CardHeader><CardTitle className="text-lg">Notifications</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: 'Email Notifications', checked: emailNotifs, onChange: setEmailNotifs },
                  { label: 'Appointment Alerts', checked: appointmentAlerts, onChange: setAppointmentAlerts },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between py-2">
                    <span className="text-sm font-medium text-foreground">{item.label}</span>
                    <Switch checked={item.checked} onCheckedChange={item.onChange} />
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
                <div className="space-y-2"><Label>Current Password</Label><Input type="password" placeholder="••••••••" /></div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>New Password</Label><Input type="password" placeholder="••••••••" /></div>
                  <div className="space-y-2"><Label>Confirm Password</Label><Input type="password" placeholder="••••••••" /></div>
                </div>
                <Button onClick={() => toast({ title: 'Password updated' })}>Update Password</Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
