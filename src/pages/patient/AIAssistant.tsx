import React, { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Brain, Send, AlertTriangle, CheckCircle2, Activity, Info } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';

interface Section {
  title: string;
  content: string;
  icon: 'info' | 'warning' | 'success' | 'alert';
}

interface ChatMsg {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  urgency?: 'low' | 'moderate' | 'high';
  sections?: Section[];
  shouldBookAppointment?: boolean;
  keywords?: string[];
}

const urgencyConfig = {
  low: { 
    label: 'Low Urgency', 
    className: 'bg-success/15 text-success border border-success/30',
    bgClass: 'bg-success/5'
  },
  moderate: { 
    label: '⚠️ Moderate', 
    className: 'bg-warning/15 text-warning border border-warning/30',
    bgClass: 'bg-warning/5'
  },
  high: { 
    label: '🚨 High Urgency', 
    className: 'bg-destructive/15 text-destructive border border-destructive/30',
    bgClass: 'bg-destructive/5'
  },
};

function MessageSections({ sections, urgency }: { sections?: Section[], urgency?: string }) {
  if (!sections?.length) return null;
  
  const iconMap = {
    info: <Info className="h-4 w-4" />,
    warning: <AlertTriangle className="h-4 w-4" />,
    success: <CheckCircle2 className="h-4 w-4" />,
    alert: <AlertCircle className="h-4 w-4" />,
  };

  return (
    <div className="space-y-3 mt-3">
      {sections.map((section, idx) => (
        <div key={idx} className={`p-3 rounded-lg border ${urgency === 'high' && section.icon === 'alert' ? 'border-destructive/40 bg-destructive/5' : 'border-primary/20 bg-primary/5'}`}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-primary">{iconMap[section.icon]}</span>
            <span className="text-sm font-semibold text-foreground">{section.title}</span>
          </div>
          <p className="text-sm text-foreground/80 leading-relaxed">{section.content}</p>
        </div>
      ))}
    </div>
  );
}

export default function AIAssistant() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: '0',
      role: 'assistant',
      content: "Hello! I'm your **AI Health Assistant**. I can help you:\n\n- 🩺 Assess your symptoms\n- 💡 Share health tips & information\n- ⚠️ Recommend when to see a doctor\n\nPlease describe what you're experiencing, and I'll provide personalized guidance.",
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
        sections: data.sections,
        shouldBookAppointment: data.shouldBookAppointment,
        keywords: data.keywords,
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

  const quickPrompts = [
    "I have a headache",
    "I feel tired all the time",
    "I have a sore throat",
    "When should I see a doctor?",
  ];

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
                <div className="max-w-[85%]">
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <Brain className="h-4 w-4 text-primary" />
                        <span className="text-xs font-semibold text-primary">AI Health Assistant</span>
                      </div>
                      {msg.urgency && (
                        <Badge className={urgencyConfig[msg.urgency].className}>
                          {urgencyConfig[msg.urgency].label}
                        </Badge>
                      )}
                    </div>
                  )}
                  
                  <div className={`rounded-2xl px-4 py-3 ${
                    msg.role === 'user' 
                      ? 'bg-primary text-primary-foreground rounded-br-md' 
                      : `bg-card border border-border rounded-bl-md ${msg.urgency ? urgencyConfig[msg.urgency].bgClass : ''}`
                  }`}>
                    {msg.role === 'assistant' ? (
                      <div>
                        <div className="text-sm prose prose-sm dark:prose-invert max-w-none [&>p]:mb-2 [&>ul]:mb-2 [&>ol]:mb-2 [&>blockquote]:border-l-2 [&>blockquote]:border-primary/30 [&>blockquote]:pl-3">
                          <ReactMarkdown>{msg.content.split('---')[0]}</ReactMarkdown>
                        </div>
                        
                        {/* Render structured sections */}
                        <MessageSections sections={msg.sections} urgency={msg.urgency} />
                        
                        {/* Book appointment CTA */}
                        {msg.shouldBookAppointment && (
                          <div className="mt-4 p-3 rounded-lg bg-primary/10 border border-primary/30">
                            <p className="text-sm font-medium text-primary mb-2">📋 Next Step</p>
                            <button className="text-sm text-primary font-semibold hover:underline">
                              Book an Appointment →
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm whitespace-pre-line">{msg.content}</div>
                    )}
                    
                    <p className={`text-[10px] mt-2 ${msg.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                      {msg.timestamp}
                    </p>
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

          {/* Quick prompts */}
          {messages.length <= 1 && (
            <div className="px-4 pb-2 flex flex-wrap gap-2">
              {quickPrompts.map(p => (
                <button key={p} onClick={() => { setInput(p); }} className="text-xs px-3 py-1.5 rounded-full border border-primary/20 text-primary hover:bg-primary/5 transition-colors">
                  {p}
                </button>
              ))}
            </div>
          )}

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
