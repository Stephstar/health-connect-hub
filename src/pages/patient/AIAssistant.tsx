import React, { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Brain, Send, AlertTriangle, CheckCircle2, Activity } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ChatMsg {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  urgency?: 'low' | 'moderate' | 'high';
}

export default function AIAssistant() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: '0',
      role: 'assistant',
      content: "Hello! I'm your AI Health Assistant. I can help you assess symptoms, share health information, and recommend when to see a doctor.\n\nPlease describe your symptoms.\n\n*This is not medical advice. Book an appointment for a proper evaluation.*",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      urgency: 'low',
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isTyping) return;
    const userMsg: ChatMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput('');
    setIsTyping(true);

    try {
      const conversation = next.filter(m => m.id !== '0').map(m => ({ role: m.role, content: m.content }));
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: { messages: conversation },
      });
      if (error || !data) throw error || new Error('No response');
      if (data.error) throw new Error(data.error);
      const aiMsg: ChatMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.content,
        urgency: data.urgency,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to reach AI assistant';
      toast({ title: 'AI assistant error', description: message, variant: 'destructive' });
    } finally {
      setIsTyping(false);
    }
  };

  const urgencyBadge = (urgency?: string) => {
    if (!urgency) return null;
    const config = {
      low: { label: 'Low Urgency', className: 'bg-success/10 text-success' },
      moderate: { label: 'Moderate', className: 'bg-warning/10 text-warning' },
      high: { label: 'High Urgency', className: 'bg-destructive/10 text-destructive' },
    } as const;
    const c = config[urgency as keyof typeof config];
    if (!c) return null;
    return <Badge className={c.className}>{c.label}</Badge>;
  };

  return (
    <DashboardLayout role="patient" title="AI Health Assistant">
      <div className="flex flex-col h-[calc(100vh-12rem)]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          {[
            { icon: Activity, title: 'Symptom Checker', desc: 'Describe symptoms for assessment', color: 'text-primary bg-primary/10' },
            { icon: CheckCircle2, title: 'Health Tips', desc: 'Personalized recommendations', color: 'text-success bg-success/10' },
            { icon: AlertTriangle, title: 'Emergency Guide', desc: 'Know when to seek urgent care', color: 'text-destructive bg-destructive/10' },
          ].map(card => (
            <Card key={card.title} className="p-4 shadow-card flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg ${card.color} flex items-center justify-center`}>
                <card.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{card.title}</p>
                <p className="text-xs text-muted-foreground">{card.desc}</p>
              </div>
            </Card>
          ))}
        </div>

        <Card className="flex-1 flex flex-col shadow-card overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-[80%]">
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-2 mb-1">
                      <Brain className="h-4 w-4 text-primary" />
                      <span className="text-xs font-medium text-primary">AI Assistant</span>
                      {urgencyBadge(msg.urgency)}
                    </div>
                  )}
                  <div className={`rounded-2xl px-4 py-3 ${msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-muted rounded-bl-md'}`}>
                    <div className="text-sm whitespace-pre-line">{msg.content}</div>
                    <p className={`text-[10px] mt-1 ${msg.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{msg.timestamp}</p>
                  </div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Brain className="h-4 w-4 text-primary" />
                <div className="flex gap-1">
                  <span className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-xs">AI is analyzing...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="border-t p-3 flex gap-2">
            <Input
              placeholder="Describe your symptoms..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              disabled={isTyping}
            />
            <Button size="icon" onClick={sendMessage} disabled={!input.trim() || isTyping}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
