import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Heart, Loader2, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export default function Verify2FAPage() {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { verify2FA, isLoading, pendingUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = code.join('');
    if (fullCode.length < 6) {
      toast({ title: 'Enter all 6 digits', variant: 'destructive' });
      return;
    }
    try {
      await verify2FA(fullCode);
      toast({ title: 'Verified!', description: 'Welcome to MediConnect.' });
      // Route based on role
      if (pendingUser?.role === 'doctor') navigate('/doctor/dashboard');
      else if (pendingUser?.role === 'admin') navigate('/admin/dashboard');
      else if (pendingUser?.onboardingComplete === false) navigate('/onboarding');
      else navigate('/patient/dashboard');
    } catch {
      toast({ title: 'Verification failed', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <Heart className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold font-heading text-foreground">MediConnect</span>
          </Link>
        </div>

        <Card className="shadow-elevated">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <ShieldCheck className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-xl font-heading">Two-Factor Authentication</CardTitle>
            <CardDescription>Enter the 6-digit code sent to your device. For demo, enter any 6 digits.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex justify-center gap-3">
                {code.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleChange(i, e.target.value)}
                    onKeyDown={e => handleKeyDown(i, e)}
                    className="h-12 w-12 rounded-lg border-2 border-input bg-background text-center text-lg font-semibold text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                  />
                ))}
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Verifying...</> : 'Verify & Continue'}
              </Button>
            </form>
            <p className="text-center text-sm text-muted-foreground mt-4">
              Didn't receive a code? <button className="text-primary hover:underline font-medium">Resend</button>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
