import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreditCard, Smartphone, Building2, CheckCircle2, Loader2, Receipt, Download } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const PAYMENT_METHODS = [
  { id: 'card', label: 'Credit/Debit Card', icon: CreditCard },
  { id: 'mobile', label: 'Mobile Money', icon: Smartphone },
  { id: 'insurance', label: 'Insurance', icon: Building2 },
];

const MOBILE_PROVIDERS = ['MTN Mobile Money', 'Airtel Money'];

interface Invoice {
  id: string;
  amount: number;
  description: string;
  status: string;
  payment_method: string | null;
  invoice_date: string;
  paid_at: string | null;
}

export default function BillingDashboard() {
  const { user } = useAuth();
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
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const loadInvoices = useMemo(() => async () => {
    if (!user) return;
    const { data } = await supabase
      .from('invoices')
      .select('id, amount, description, status, payment_method, invoice_date, paid_at')
      .eq('patient_id', user.id)
      .order('invoice_date', { ascending: false });
    if (data) {
      const mapped = data.map(d => ({ ...d, amount: Number(d.amount) }));
      setInvoices(mapped);
      const firstPending = mapped.find(i => i.status === 'pending');
      setSelectedInvoice(prev => prev ?? firstPending ?? null);
    }
  }, [user]);

  useEffect(() => { loadInvoices(); }, [loadInvoices]);

  const pendingTotal = invoices.filter(i => i.status === 'pending').reduce((s, i) => s + i.amount, 0);
  const payAmount = selectedInvoice?.amount ?? pendingTotal;

  const handlePayment = async () => {
    if (paymentMethod === 'card' && (!cardNumber || !expiry || !cvv)) {
      toast({ title: 'Please fill in all card details', variant: 'destructive' }); return;
    }
    if (paymentMethod === 'mobile' && (!mobileProvider || !mobileNumber)) {
      toast({ title: 'Please select provider and enter phone number', variant: 'destructive' }); return;
    }
    if (paymentMethod === 'insurance' && !insuranceId) {
      toast({ title: 'Please enter insurance ID', variant: 'destructive' }); return;
    }
    if (!selectedInvoice) {
      toast({ title: 'No invoice to pay', variant: 'destructive' }); return;
    }

    setIsProcessing(true);
    // Simulate gateway delay
    await new Promise(r => setTimeout(r, 1500));
    const methodLabel = paymentMethod === 'card'
      ? `Card ••${cardNumber.slice(-4)}`
      : paymentMethod === 'mobile'
      ? mobileProvider
      : 'Insurance';
    await supabase
      .from('invoices')
      .update({ status: 'paid', payment_method: methodLabel, paid_at: new Date().toISOString() })
      .eq('id', selectedInvoice.id);
    setIsProcessing(false);
    setPaymentSuccess(true);
    toast({ title: 'Payment successful', description: 'Your payment has been processed.' });
    await loadInvoices();
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
              <Button onClick={() => { setPaymentSuccess(false); setSelectedInvoice(null); }}>Done</Button>
            </Card>
          ) : (
            <div className="max-w-lg mx-auto space-y-6">
              <Card className="p-6 shadow-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Outstanding Balance</p>
                    <p className="text-2xl font-bold text-foreground">${pendingTotal.toFixed(2)}</p>
                  </div>
                  <Receipt className="h-8 w-8 text-primary" />
                </div>
              </Card>

              {invoices.filter(i => i.status === 'pending').length > 0 && (
                <Card className="p-6 shadow-card">
                  <h3 className="font-semibold font-heading text-foreground mb-3">Select Invoice</h3>
                  <div className="space-y-2">
                    {invoices.filter(i => i.status === 'pending').map(inv => (
                      <button
                        key={inv.id}
                        onClick={() => setSelectedInvoice(inv)}
                        className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all ${selectedInvoice?.id === inv.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`}
                      >
                        <div className="text-left">
                          <p className="text-sm font-medium text-foreground">{inv.description}</p>
                          <p className="text-xs text-muted-foreground">{inv.invoice_date}</p>
                        </div>
                        <span className="font-semibold text-foreground">${inv.amount.toFixed(2)}</span>
                      </button>
                    ))}
                  </div>
                </Card>
              )}

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
                    <div><Label>Card Number</Label><Input placeholder="1234 5678 9012 3456" value={cardNumber} onChange={e => setCardNumber(e.target.value)} /></div>
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
                <Button className="w-full mt-6" onClick={handlePayment} disabled={isProcessing || !selectedInvoice}>
                  {isProcessing ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Processing...</> : `Pay $${payAmount.toFixed(2)}`}
                </Button>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="history">
          <div className="space-y-3">
            {invoices.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground shadow-card">No transactions yet.</Card>
            ) : invoices.map(tx => (
              <Card key={tx.id} className="p-4 shadow-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Receipt className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">{tx.invoice_date} {tx.payment_method && `• ${tx.payment_method}`}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={tx.status === 'paid' ? 'default' : tx.status === 'pending' ? 'secondary' : 'outline'}>{tx.status}</Badge>
                    <span className="font-semibold text-foreground">${tx.amount.toFixed(2)}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="invoices">
          <div className="space-y-3">
            {invoices.filter(t => t.status === 'paid').length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground shadow-card">No paid invoices yet.</Card>
            ) : invoices.filter(t => t.status === 'paid').map(tx => (
              <Card key={tx.id} className="p-4 shadow-card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{tx.description}</p>
                    <p className="text-xs text-muted-foreground">Invoice #{tx.id.slice(0, 8)} • {tx.invoice_date}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-foreground">${tx.amount.toFixed(2)}</span>
                    <Button variant="outline" size="sm" onClick={() => toast({ title: 'Preparing PDF…' })}>
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
