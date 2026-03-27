import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useApp } from '@/contexts/AppContext';
import DashboardLayout from '@/components/DashboardLayout';
import { Bell, Calendar, FileText, CreditCard, CheckCircle2 } from 'lucide-react';

const iconMap: Record<string, React.ElementType> = {
  'Appointment': Calendar,
  'Lab': FileText,
  'Prescription': FileText,
  'Payment': CreditCard,
};

function getIcon(title: string) {
  const key = Object.keys(iconMap).find(k => title.includes(k));
  return key ? iconMap[key] : Bell;
}

export default function NotificationsPage() {
  const { notifications, markNotificationRead } = useApp();
  const unread = notifications.filter(n => !n.read).length;

  return (
    <DashboardLayout role="patient" title="Notifications">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{unread} unread notification{unread !== 1 ? 's' : ''}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => notifications.forEach(n => markNotificationRead(n.id))}>
            <CheckCircle2 className="h-4 w-4 mr-1" /> Mark All Read
          </Button>
        </div>

        <div className="space-y-2">
          {notifications.map(n => {
            const Icon = getIcon(n.title);
            return (
              <Card
                key={n.id}
                className={`p-4 shadow-card cursor-pointer transition-all hover:shadow-card-hover ${!n.read ? 'border-l-4 border-l-primary bg-primary/5' : ''}`}
                onClick={() => markNotificationRead(n.id)}
              >
                <div className="flex items-start gap-3">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${!n.read ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-medium ${!n.read ? 'text-foreground' : 'text-muted-foreground'}`}>{n.title}</p>
                      {!n.read && <Badge variant="default" className="text-[10px] px-1.5 py-0">New</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{n.time}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {notifications.length === 0 && (
          <Card className="p-12 text-center shadow-card">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No notifications yet</p>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
