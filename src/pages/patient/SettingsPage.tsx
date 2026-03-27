import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/DashboardLayout';
import { User, Bell, Shield, Palette, Globe, Smartphone } from 'lucide-react';

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('profile');
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [smsNotifs, setSmsNotifs] = useState(false);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [appointmentReminders, setAppointmentReminders] = useState(true);
  const [twoFactor, setTwoFactor] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'preferences', label: 'Preferences', icon: Palette },
  ];

  const handleSave = () => {
    updateUser({ name, phone });
    toast({ title: 'Settings saved', description: 'Your changes have been applied.' });
  };

  return (
    <DashboardLayout role="patient" title="Settings">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-56 flex md:flex-col gap-1">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                activeTab === t.id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              <t.icon className="h-4 w-4" /> {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 space-y-6">
          {activeTab === 'profile' && (
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-lg">Profile Information</CardTitle>
                <CardDescription>Update your personal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{user?.name}</p>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                    <Badge className="mt-1 capitalize">{user?.role}</Badge>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input value={name} onChange={e => setName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input value={user?.email} disabled className="bg-muted" />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" />
                  </div>
                  <div className="space-y-2">
                    <Label>Date of Birth</Label>
                    <Input type="date" defaultValue="1990-05-15" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input defaultValue="123 Health Street, Medical City, MC 12345" />
                </div>
                <Button onClick={handleSave}>Save Changes</Button>
              </CardContent>
            </Card>
          )}

          {activeTab === 'notifications' && (
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-lg">Notification Preferences</CardTitle>
                <CardDescription>Choose how you want to receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {[
                  { label: 'Email Notifications', desc: 'Receive updates via email', checked: emailNotifs, onChange: setEmailNotifs, icon: Globe },
                  { label: 'SMS Notifications', desc: 'Receive text message alerts', checked: smsNotifs, onChange: setSmsNotifs, icon: Smartphone },
                  { label: 'Push Notifications', desc: 'Browser push notifications', checked: pushNotifs, onChange: setPushNotifs, icon: Bell },
                  { label: 'Appointment Reminders', desc: 'Get reminded before appointments', checked: appointmentReminders, onChange: setAppointmentReminders, icon: Bell },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                        <item.icon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                    <Switch checked={item.checked} onCheckedChange={item.onChange} />
                  </div>
                ))}
                <Button onClick={() => toast({ title: 'Preferences saved' })}>Save Preferences</Button>
              </CardContent>
            </Card>
          )}

          {activeTab === 'security' && (
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-lg">Security Settings</CardTitle>
                <CardDescription>Manage your account security</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Current Password</Label>
                    <Input type="password" placeholder="••••••••" />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>New Password</Label>
                      <Input type="password" placeholder="••••••••" />
                    </div>
                    <div className="space-y-2">
                      <Label>Confirm Password</Label>
                      <Input type="password" placeholder="••••••••" />
                    </div>
                  </div>
                  <Button onClick={() => toast({ title: 'Password updated' })}>Update Password</Button>
                </div>
                <div className="border-t pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">Two-Factor Authentication</p>
                      <p className="text-xs text-muted-foreground">Add an extra layer of security</p>
                    </div>
                    <Switch checked={twoFactor} onCheckedChange={setTwoFactor} />
                  </div>
                </div>
                <div className="border-t pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">Active Sessions</p>
                      <p className="text-xs text-muted-foreground">1 active session on this device</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => toast({ title: 'All other sessions logged out' })}>Log Out Others</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'preferences' && (
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-lg">App Preferences</CardTitle>
                <CardDescription>Customize your experience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">Dark Mode</p>
                    <p className="text-xs text-muted-foreground">Switch to dark theme</p>
                  </div>
                  <Switch checked={darkMode} onCheckedChange={setDarkMode} />
                </div>
                <div className="space-y-2">
                  <Label>Language</Label>
                  <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                    <option>English</option>
                    <option>French</option>
                    <option>Spanish</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                    <option>UTC-5 (Eastern)</option>
                    <option>UTC-6 (Central)</option>
                    <option>UTC-8 (Pacific)</option>
                    <option>UTC+0 (GMT)</option>
                    <option>UTC+1 (WAT)</option>
                  </select>
                </div>
                <Button onClick={() => toast({ title: 'Preferences saved' })}>Save Preferences</Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
