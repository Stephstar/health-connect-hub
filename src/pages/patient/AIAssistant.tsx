import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Brain, Send, Loader2, AlertTriangle, CheckCircle2, Activity } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';

interface ChatMsg {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  urgency?: 'low' | 'moderate' | 'high';
  suggestions?: string[];
}

const AI_RESPONSES: Record<string, { content: string; urgency: 'low' | 'moderate' | 'high'; suggestions: string[] }> = {
  headache: { content: 'Based on your symptom of headache, this could be related to several conditions including tension headaches, migraines, or dehydration. \n\n**Recommended actions:**\n- Stay hydrated and rest\n- Take over-the-counter pain relief if needed\n- Monitor if symptoms persist beyond 24 hours\n\nIf you experience sudden severe headache, vision changes, or neck stiffness, please seek immediate medical attention.', urgency: 'low', suggestions: ['Book appointment with neurologist', 'View headache diary tips'] },
  chest: { content: '⚠️ **Chest pain requires careful evaluation.**\n\nChest pain can have many causes ranging from muscle strain to cardiac issues.\n\n**Important:** If you are experiencing:\n- Crushing or squeezing chest pain\n- Pain radiating to arm, jaw, or back\n- Shortness of breath\n- Dizziness or sweating\n\n**Please call emergency services immediately.**\n\nFor mild, non-acute chest discomfort, I recommend scheduling an urgent appointment with a cardiologist.', urgency: 'high', suggestions: ['Call Emergency Services', 'Book urgent cardiology appointment'] },
  fever: { content: 'A fever is your body\'s natural response to infection.\n\n**For adults with fever:**\n- Temperature below 101°F (38.3°C): Rest, stay hydrated, monitor\n- Temperature 101-103°F: Consider OTC fever reducers, rest\n- Temperature above 103°F: Consult a doctor\n\n**Seek medical attention if fever:**\n- Lasts more than 3 days\n- Is accompanied by severe symptoms\n- Occurs with rash or confusion', urgency: 'moderate', suggestions: ['Book same-day appointment', 'View fever management guide'] },
  default: { content: 'Thank you for sharing your symptoms. Based on what you\'ve described, I recommend:\n\n1. **Monitor your symptoms** for the next 24-48 hours\n2. **Stay hydrated** and get adequate rest\n3. **Document any changes** in symptoms\n\nIf symptoms worsen or new symptoms appear, please don\'t hesitate to book an appointment with a healthcare provider.\n\nWould you like me to help you find a suitable doctor?', urgency: 'low', suggestions: ['Find a doctor', 'Book general checkup'] },
};

export default function AIAssistant() {
  const [messages, setMessages] = useState<ChatMsg[]>([
    { id: '0', role: 'assistant', content: 'Hello! I\'m your AI Health Assistant. I can help you assess symptoms, provide health information, and recommend when to see a doctor.\n\nPlease describe your symptoms and I\'ll do my best to help. **Note:** This is not a substitute for professional medical advice.', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getResponse = (text: string) => {
    const lower = text.toLowerCase();
    if (lower.includes('headache') || lower.includes('head')) return AI_RESPONSES.headache;
    if (lower.includes('chest') || lower.includes('heart')) return AI_RESPONSES.chest;
    if (lower.includes('fever') || lower.includes('temperature') || lower.includes('hot')) return AI_RESPONSES.fever;
    return AI_RESPONSES.default;
  };

  const sendMessage = () => {
    if (!input.trim()) return;
    const userMsg: ChatMsg = { id: Date.now().toString(), role: 'user', content: input, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const response = getResponse(userMsg.content);
      const aiMsg: ChatMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.content,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        urgency: response.urgency,
        suggestions: response.suggestions,
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1500 + Math.random() * 1000);
  };

  const urgencyBadge = (urgency?: string) => {
    if (!urgency) return null;
    const config = {
      low: { label: 'Low Urgency', className: 'bg-success/10 text-success' },
      moderate: { label: 'Moderate', className: 'bg-warning/10 text-warning' },
      high: { label: 'High Urgency', className: 'bg-destructive/10 text-destructive' },
    };
    const c = config[urgency as keyof typeof config];
    return <Badge className={c.className}>{c.label}</Badge>;
  };

  return (
    <DashboardLayout role="patient" title="AI Health Assistant">
      <div className="flex flex-col h-[calc(100vh-12rem)]">
        {/* Health Insights Cards */}
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

        {/* Chat Area */}
        <Card className="flex-1 flex flex-col shadow-card overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] ${msg.role === 'user' ? '' : ''}`}>
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
                  {msg.suggestions && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {msg.suggestions.map(s => (
                        <Button key={s} variant="outline" size="sm" className="text-xs h-7" onClick={() => { setInput(s); }}>{s}</Button>
                      ))}
                    </div>
                  )}
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
