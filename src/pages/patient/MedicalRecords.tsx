import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Download, Calendar, FlaskConical, Pill, ChevronDown, ChevronUp } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { useToast } from '@/hooks/use-toast';

const RECORDS = {
  timeline: [
    { id: '1', date: '2026-03-15', title: 'General Checkup', doctor: 'Dr. Emily Watson', type: 'visit', summary: 'Routine annual physical. All vitals normal. Blood pressure 120/80.' },
    { id: '2', date: '2026-03-01', title: 'Blood Work Results', doctor: 'Lab Services', type: 'lab', summary: 'Complete blood count and metabolic panel. All values within normal range.' },
    { id: '3', date: '2026-02-15', title: 'Prescription Renewed', doctor: 'Dr. Michael Chen', type: 'prescription', summary: 'Lisinopril 10mg renewed for 90 days.' },
    { id: '4', date: '2026-01-20', title: 'Cardiology Follow-up', doctor: 'Dr. Michael Chen', type: 'visit', summary: 'ECG results normal. Continue current medication regimen.' },
  ],
  labResults: [
    { id: '1', test: 'Complete Blood Count', date: '2026-03-01', status: 'normal', values: [{ name: 'WBC', value: '6.5', range: '4.5-11.0', unit: 'K/uL' }, { name: 'RBC', value: '4.8', range: '4.0-5.5', unit: 'M/uL' }, { name: 'Hemoglobin', value: '14.2', range: '12.0-16.0', unit: 'g/dL' }] },
    { id: '2', test: 'Metabolic Panel', date: '2026-03-01', status: 'normal', values: [{ name: 'Glucose', value: '95', range: '70-100', unit: 'mg/dL' }, { name: 'Creatinine', value: '0.9', range: '0.7-1.3', unit: 'mg/dL' }] },
  ],
  prescriptions: [
    { id: '1', medication: 'Lisinopril 10mg', prescriber: 'Dr. Michael Chen', date: '2026-02-15', refills: 2, status: 'active' },
    { id: '2', medication: 'Metformin 500mg', prescriber: 'Dr. Emily Watson', date: '2026-01-10', refills: 5, status: 'active' },
    { id: '3', medication: 'Aspirin 81mg', prescriber: 'Dr. Michael Chen', date: '2025-12-01', refills: 0, status: 'expired' },
  ],
};

export default function MedicalRecords() {
  const { toast } = useToast();
  const [expandedLab, setExpandedLab] = useState<string | null>(null);

  const handleDownload = (name: string) => {
    toast({ title: 'Downloading...', description: `${name} report is being prepared.` });
  };

  const typeIcon = (type: string) => {
    switch (type) {
      case 'lab': return <FlaskConical className="h-4 w-4" />;
      case 'prescription': return <Pill className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <DashboardLayout role="patient" title="Medical Records">
      <Tabs defaultValue="timeline">
        <TabsList className="mb-6">
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="lab">Lab Results</TabsTrigger>
          <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="space-y-3">
          {RECORDS.timeline.map(r => (
            <Card key={r.id} className="p-4 shadow-card hover:shadow-card-hover transition-shadow">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">{typeIcon(r.type)}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-foreground text-sm">{r.title}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{r.date}</span>
                      <Button variant="ghost" size="sm" onClick={() => handleDownload(r.title)}><Download className="h-3 w-3" /></Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{r.doctor}</p>
                  <p className="text-sm text-muted-foreground mt-2">{r.summary}</p>
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="lab" className="space-y-3">
          {RECORDS.labResults.map(lab => (
            <Card key={lab.id} className="shadow-card">
              <button
                className="w-full p-4 flex items-center justify-between text-left"
                onClick={() => setExpandedLab(expandedLab === lab.id ? null : lab.id)}
              >
                <div className="flex items-center gap-3">
                  <FlaskConical className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-foreground text-sm">{lab.test}</p>
                    <p className="text-xs text-muted-foreground">{lab.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="bg-success text-success-foreground">{lab.status}</Badge>
                  {expandedLab === lab.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>
              {expandedLab === lab.id && (
                <div className="px-4 pb-4 border-t">
                  <table className="w-full mt-3">
                    <thead>
                      <tr className="text-xs text-muted-foreground"><th className="text-left py-1">Test</th><th className="text-left py-1">Value</th><th className="text-left py-1">Range</th><th className="text-left py-1">Unit</th></tr>
                    </thead>
                    <tbody>
                      {lab.values.map((v, i) => (
                        <tr key={i} className="text-sm"><td className="py-1 text-foreground">{v.name}</td><td className="py-1 font-medium text-foreground">{v.value}</td><td className="py-1 text-muted-foreground">{v.range}</td><td className="py-1 text-muted-foreground">{v.unit}</td></tr>
                      ))}
                    </tbody>
                  </table>
                  <Button size="sm" variant="outline" className="mt-3" onClick={() => handleDownload(lab.test)}>
                    <Download className="h-3 w-3 mr-1" /> Download Report
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="prescriptions" className="space-y-3">
          {RECORDS.prescriptions.map(rx => (
            <Card key={rx.id} className="p-4 shadow-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Pill className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-foreground text-sm">{rx.medication}</p>
                    <p className="text-xs text-muted-foreground">Prescribed by {rx.prescriber} • {rx.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={rx.status === 'active' ? 'default' : 'secondary'}>{rx.status}</Badge>
                  <span className="text-xs text-muted-foreground">{rx.refills} refills left</span>
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
