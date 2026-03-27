import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/DashboardLayout';
import { Settings, Shield, Bell, Globe } from 'lucide-react';

export default function AdminSettings() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('general');
  const [platformName, setPlatformName] = useState('MediConnect');
  const [supportEmail, setSupportEmail] = useState('support@mediconnect.com');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [newRegistrations, setNewRegistrations] = useState(true);
  const [autoApprove, setAutoApprove] = useState(false);
  const [emailNotifs, setEmailNotifs] = useState(true);

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <DashboardLayout role="admin" title="Settings">
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
          {activeTab === 'general' && (
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-lg">Platform Settings</CardTitle>
                <CardDescription>Manage global platform configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Platform Name</Label><Input value={platformName} onChange={e => setPlatformName(e.target.value)} /></div>
                  <div className="space-y-2"><Label>Support Email</Label><Input value={supportEmail} onChange={e => setSupportEmail(e.target.value)} /></div>
                </div>
                <div className="space-y-2"><Label>Platform Description</Label><Textarea defaultValue="A modern telemedicine platform connecting patients with healthcare providers." rows={3} /></div>
                <div className="border-t pt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div><p className="text-sm font-medium text-foreground">Maintenance Mode</p><p className="text-xs text-muted-foreground">Temporarily disable the platform</p></div>
                    <Switch checked={maintenanceMode} onCheckedChange={setMaintenanceMode} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div><p className="text-sm font-medium text-foreground">New Registrations</p><p className="text-xs text-muted-foreground">Allow new user sign-ups</p></div>
                    <Switch checked={newRegistrations} onCheckedChange={setNewRegistrations} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div><p className="text-sm font-medium text-foreground">Auto-Approve Doctors</p><p className="text-xs text-muted-foreground">Skip manual review for new doctors</p></div>
                    <Switch checked={autoApprove} onCheckedChange={setAutoApprove} />
                  </div>
                </div>
                <Button onClick={() => toast({ title: 'Settings saved' })}>Save Changes</Button>
              </CardContent>
            </Card>
          )}

          {activeTab === 'security' && (
            <Card className="shadow-card">
              <CardHeader><CardTitle className="text-lg">Security Settings</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div><p className="text-sm font-medium text-foreground">Enforce 2FA for Doctors</p><p className="text-xs text-muted-foreground">Require two-factor authentication</p></div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between py-2">
                  <div><p className="text-sm font-medium text-foreground">Session Timeout</p><p className="text-xs text-muted-foreground">Auto-logout after inactivity</p></div>
                  <select className="h-9 rounded-md border border-input bg-background px-3 text-sm">
                    <option>30 minutes</option><option>1 hour</option><option>2 hours</option><option>4 hours</option>
                  </select>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div><p className="text-sm font-medium text-foreground">Password Policy</p><p className="text-xs text-muted-foreground">Minimum password requirements</p></div>
                  <select className="h-9 rounded-md border border-input bg-background px-3 text-sm">
                    <option>Standard (8+ chars)</option><option>Strong (12+ chars, mixed)</option><option>Very Strong (16+ chars)</option>
                  </select>
                </div>
                <Button onClick={() => toast({ title: 'Security settings saved' })}>Save</Button>
              </CardContent>
            </Card>
          )}

          {activeTab === 'notifications' && (
            <Card className="shadow-card">
              <CardHeader><CardTitle className="text-lg">Admin Notifications</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: 'New Doctor Registrations', desc: 'Get notified when doctors sign up' },
                  { label: 'Payment Issues', desc: 'Alerts for failed transactions' },
                  { label: 'System Alerts', desc: 'Server health and performance' },
                  { label: 'Daily Summary', desc: 'Daily platform activity report' },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between py-2">
                    <div><p className="text-sm font-medium text-foreground">{item.label}</p><p className="text-xs text-muted-foreground">{item.desc}</p></div>
                    <Switch defaultChecked />
                  </div>
                ))}
                <Button onClick={() => toast({ title: 'Notification preferences saved' })}>Save</Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
