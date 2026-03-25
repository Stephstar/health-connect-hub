import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Heart, ChevronRight, ChevronLeft, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';

const STEPS = ['Personal Info', 'Medical History', 'Allergies', 'Medications', 'Insurance', 'Preferences'];

const CONDITIONS = ['Diabetes', 'Hypertension', 'Heart Disease', 'Asthma', 'Arthritis', 'Depression', 'None'];
const ALLERGY_OPTIONS = ['Penicillin', 'Sulfa', 'Aspirin', 'Latex', 'Peanuts', 'Shellfish', 'None'];
const MED_OPTIONS = ['Lisinopril', 'Metformin', 'Atorvastatin', 'Levothyroxine', 'Amlodipine', 'None'];

export default function OnboardingPage() {
  const { updateUser } = useAuth();
  const { onboardingData, updateOnboarding } = useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [data, setData] = useState(onboardingData);

  const progress = ((step + 1) / STEPS.length) * 100;

  const updateField = (section: string, field: string, value: any) => {
    setData(prev => ({ ...prev, [section]: { ...(prev as any)[section], [field]: value } }));
  };

  const toggleArrayItem = (section: string, field: string, item: string) => {
    setData(prev => {
      const arr = (prev as any)[section][field] as string[];
      const updated = arr.includes(item) ? arr.filter((i: string) => i !== item) : [...arr, item];
      return { ...prev, [section]: { ...(prev as any)[section], [field]: updated } };
    });
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) { setStep(step + 1); updateOnboarding(data); }
    else {
      updateOnboarding({ ...data, step: STEPS.length });
      updateUser({ onboardingComplete: true });
      navigate('/patient/dashboard');
    }
  };

  const handleBack = () => { if (step > 0) setStep(step - 1); };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl animate-fade-in">
        <div className="text-center mb-8">
          <Heart className="h-8 w-8 text-primary mx-auto mb-2" />
          <h1 className="text-2xl font-bold font-heading text-foreground">Complete Your Profile</h1>
          <p className="text-muted-foreground text-sm mt-1">Step {step + 1} of {STEPS.length}: {STEPS[step]}</p>
        </div>

        <Progress value={progress} className="mb-6 h-2" />

        <Card className="p-6 lg:p-8 shadow-elevated">
          {step === 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>First Name</Label><Input value={data.personalInfo.firstName} onChange={e => updateField('personalInfo', 'firstName', e.target.value)} placeholder="Sarah" /></div>
                <div><Label>Last Name</Label><Input value={data.personalInfo.lastName} onChange={e => updateField('personalInfo', 'lastName', e.target.value)} placeholder="Johnson" /></div>
              </div>
              <div><Label>Date of Birth</Label><Input type="date" value={data.personalInfo.dob} onChange={e => updateField('personalInfo', 'dob', e.target.value)} /></div>
              <div>
                <Label>Gender</Label>
                <div className="grid grid-cols-3 gap-3 mt-2">
                  {['Male', 'Female', 'Other'].map(g => (
                    <button key={g} onClick={() => updateField('personalInfo', 'gender', g)} className={`p-2 rounded-lg border-2 text-sm font-medium transition-all ${data.personalInfo.gender === g ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground'}`}>{g}</button>
                  ))}
                </div>
              </div>
              <div><Label>Phone</Label><Input value={data.personalInfo.phone} onChange={e => updateField('personalInfo', 'phone', e.target.value)} placeholder="+1 (555) 000-0000" /></div>
              <div><Label>Address</Label><Input value={data.personalInfo.address} onChange={e => updateField('personalInfo', 'address', e.target.value)} placeholder="123 Main St, City, State" /></div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <Label>Select any existing conditions</Label>
              <div className="grid grid-cols-2 gap-3">
                {CONDITIONS.map(c => (
                  <button key={c} onClick={() => toggleArrayItem('medicalHistory', 'conditions', c)} className={`p-3 rounded-lg border-2 text-sm font-medium text-left transition-all ${data.medicalHistory.conditions.includes(c) ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground'}`}>{c}</button>
                ))}
              </div>
              <div><Label>Previous Surgeries</Label><Input value={data.medicalHistory.surgeries} onChange={e => updateField('medicalHistory', 'surgeries', e.target.value)} placeholder="List any previous surgeries" /></div>
              <div><Label>Family Medical History</Label><Input value={data.medicalHistory.familyHistory} onChange={e => updateField('medicalHistory', 'familyHistory', e.target.value)} placeholder="Any relevant family conditions" /></div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <Label>Select any known allergies</Label>
              <div className="grid grid-cols-2 gap-3">
                {ALLERGY_OPTIONS.map(a => (
                  <button key={a} onClick={() => toggleArrayItem('allergies', 'list', a)} className={`p-3 rounded-lg border-2 text-sm font-medium text-left transition-all ${data.allergies.list.includes(a) ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground'}`}>{a}</button>
                ))}
              </div>
              <div><Label>Other Allergies</Label><Input value={data.allergies.custom} onChange={e => updateField('allergies', 'custom', e.target.value)} placeholder="List any other allergies" /></div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <Label>Current Medications</Label>
              <div className="grid grid-cols-2 gap-3">
                {MED_OPTIONS.map(m => (
                  <button key={m} onClick={() => toggleArrayItem('medications', 'current', m)} className={`p-3 rounded-lg border-2 text-sm font-medium text-left transition-all ${data.medications.current.includes(m) ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground'}`}>{m}</button>
                ))}
              </div>
              <div><Label>Other Medications</Label><Input value={data.medications.custom} onChange={e => updateField('medications', 'custom', e.target.value)} placeholder="List any other medications" /></div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div><Label>Insurance Provider</Label><Input value={data.insurance.provider} onChange={e => updateField('insurance', 'provider', e.target.value)} placeholder="Blue Cross Blue Shield" /></div>
              <div><Label>Policy Number</Label><Input value={data.insurance.policyNumber} onChange={e => updateField('insurance', 'policyNumber', e.target.value)} placeholder="INS-123456" /></div>
              <div><Label>Group Number</Label><Input value={data.insurance.groupNumber} onChange={e => updateField('insurance', 'groupNumber', e.target.value)} placeholder="GRP-789" /></div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4 text-center">
              <div className="mx-auto h-16 w-16 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
              <h3 className="text-lg font-semibold font-heading text-foreground">Almost Done!</h3>
              <p className="text-sm text-muted-foreground">Review your information and complete your profile to start using MediConnect.</p>
            </div>
          )}

          <div className="flex justify-between mt-8">
            <Button variant="outline" onClick={handleBack} disabled={step === 0}><ChevronLeft className="h-4 w-4 mr-1" /> Back</Button>
            <Button onClick={handleNext}>
              {step === STEPS.length - 1 ? 'Complete Profile' : <>Next <ChevronRight className="h-4 w-4 ml-1" /></>}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
