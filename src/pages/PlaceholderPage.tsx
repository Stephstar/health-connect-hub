import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Construction } from 'lucide-react';

interface PlaceholderPageProps {
  role: 'patient' | 'doctor' | 'admin';
  title: string;
}

export default function PlaceholderPage({ role, title }: PlaceholderPageProps) {
  return (
    <DashboardLayout role={role} title={title}>
      <Card className="p-12 text-center shadow-card">
        <Construction className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold font-heading text-foreground mb-2">{title}</h2>
        <p className="text-muted-foreground">This page is under development. Check back soon!</p>
      </Card>
    </DashboardLayout>
  );
}
