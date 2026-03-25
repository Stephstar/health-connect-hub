import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreditCard, Smartphone, Building2, CheckCircle2, Loader2, Receipt, Download } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { useToast } from '@/hooks/use-toast';

const PAYMENT_METHODS = [
  { id: 'card', label: 'Credit/Debit Card', icon: CreditCard },
  { id: 'mobile', label: 'Mobile Money', icon: Smartphone },
  { id: 'insurance', label: 'Insurance', icon: Building2 },
];

const MOBILE_PROVIDERS = ['MTN Mobile Money', 'Airtel Money'];

const TRANSACTIONS = [
  { id: '1', date: '2026-03-15', description: 'Video Consultation - Dr. Watson', amount: 50, status: 'paid', method: 'Visa •••• 4242' },
  { id: '2', date: '2026-03-01', description: 'Lab Work - Blood Panel', amount: 85, status: 'paid', method: 'MTN Mobile Money' },
  { id: '3', date: '2026-02-15', description: 'Cardiology Follow-up - Dr. Chen', amount: 75, status: 'paid', method: 'Insurance - Blue Cross' },
  { id: '4', date: '2026-02-01', description: 'Prescription Refill', amount: 25, status: 'refunded', method: 'Visa •••• 4242' },
];

export default function BillingDashboard() {
  const { toast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [mobileProvider, setMobileProvider] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [insuranceId, setInsuranceId] = useState('');

  const handlePayment = async () => {
    // Validate
    if (paymentMethod === 'card' && (!cardNumber || !expiry || !cvv)) {
      toast({ title: 'Please fill in all card details', variant: 'destructive' }); return;
    }
    if (paymentMethod === 'mobile' && (!mobileProvider || !mobileNumber)) {
      toast({ title: 'Please select provider and enter phone number', variant: 'destructive' }); return;
    }
    if (paymentMethod === 'insurance' && !insuranceId) {
      toast({ title: 'Please enter insurance ID', variant: 'destructive' }); return;
    }

    setIsProcessing(true);
    await new Promise(r => setTimeout(r, 2000));
    setIsProcessing(false);
    setPaymentSuccess(true);
    toast({ title: 'Payment Successful!', description: 'Your payment has been processed.' });
  };

  return (
    <DashboardLayout role="patient" title="Billing & Payments">
      <Tabs defaultValue="pay">
        <TabsList className="mb-6">
          <TabsTrigger value="pay">Make Payment</TabsTrigger>
          <TabsTrigger value="history">Payment History</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
        </TabsList>

        <TabsContent value="pay">
          {paymentSuccess ? (
            <Card className="max-w-lg mx-auto p-8 text-center shadow-card">
              <div className="mx-auto h-16 w-16 rounded-full bg-success/10 flex items-center justify-center mb-4">
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
              <h3 className="text-xl font-bold font-heading text-foreground mb-2">Payment Successful</h3>
              <p className="text-muted-foreground mb-6">Your transaction has been completed.</p>
              <Button onClick={() => setPaymentSuccess(false)}>Make Another Payment</Button>
            </Card>
          ) : (
            <div className="max-w-lg mx-auto space-y-6">
              <Card className="p-6 shadow-card">
                <h3 className="font-semibold font-heading text-foreground mb-4">Payment Method</h3>
                <div className="space-y-3">
                  {PAYMENT_METHODS.map(pm => (
                    <button
                      key={pm.id}
                      onClick={() => setPaymentMethod(pm.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${paymentMethod === pm.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`}
                    >
                      <pm.icon className={`h-5 w-5 ${paymentMethod === pm.id ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className={`text-sm font-medium ${paymentMethod === pm.id ? 'text-primary' : 'text-muted-foreground'}`}>{pm.label}</span>
                    </button>
                  ))}
                </div>
              </Card>

              <Card className="p-6 shadow-card">
                <h3 className="font-semibold font-heading text-foreground mb-4">Payment Details</h3>
                {paymentMethod === 'card' && (
                  <div className="space-y-4">
                    <div>
                      <Label>Card Number</Label>
                      <Input placeholder="1234 5678 9012 3456" value={cardNumber} onChange={e => setCardNumber(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><Label>Expiry</Label><Input placeholder="MM/YY" value={expiry} onChange={e => setExpiry(e.target.value)} /></div>
                      <div><Label>CVV</Label><Input placeholder="123" type="password" value={cvv} onChange={e => setCvv(e.target.value)} /></div>
                    </div>
                  </div>
                )}
                {paymentMethod === 'mobile' && (
                  <div className="space-y-4">
                    <div>
                      <Label>Provider</Label>
                      <div className="grid grid-cols-2 gap-3 mt-2">
                        {MOBILE_PROVIDERS.map(p => (
                          <button key={p} onClick={() => setMobileProvider(p)} className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${mobileProvider === p ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground'}`}>{p}</button>
                        ))}
                      </div>
                    </div>
                    <div><Label>Phone Number</Label><Input placeholder="+256 700 000 000" value={mobileNumber} onChange={e => setMobileNumber(e.target.value)} /></div>
                  </div>
                )}
                {paymentMethod === 'insurance' && (
                  <div className="space-y-4">
                    <div><Label>Insurance Provider</Label><Input placeholder="Blue Cross Blue Shield" /></div>
                    <div><Label>Policy Number</Label><Input placeholder="INS-123456" value={insuranceId} onChange={e => setInsuranceId(e.target.value)} /></div>
                    <div><Label>Group Number</Label><Input placeholder="GRP-789" /></div>
                  </div>
                )}
                <Button className="w-full mt-6" onClick={handlePayment} disabled={isProcessing}>
                  {isProcessing ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Processing...</> : 'Pay $75.00'}
                </Button>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="history">
          <div className="space-y-3">
            {TRANSACTIONS.map(tx => (
              <Card key={tx.id} className="p-4 shadow-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Receipt className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">{tx.date} • {tx.method}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={tx.status === 'paid' ? 'default' : 'secondary'}>{tx.status}</Badge>
                    <span className="font-semibold text-foreground">${tx.amount}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="invoices">
          <div className="space-y-3">
            {TRANSACTIONS.filter(t => t.status === 'paid').map(tx => (
              <Card key={tx.id} className="p-4 shadow-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{tx.description}</p>
                    <p className="text-xs text-muted-foreground">Invoice #{tx.id.padStart(6, '0')} • {tx.date}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-foreground">${tx.amount}</span>
                    <Button variant="outline" size="sm" onClick={() => toast({ title: 'Downloading invoice...' })}>
                      <Download className="h-3 w-3 mr-1" /> PDF
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
