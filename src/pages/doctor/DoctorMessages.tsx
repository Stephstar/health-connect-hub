import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Send, Paperclip, Search, Phone, Video, MoreVertical } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';

interface Conversation { id: string; name: string; lastMessage: string; time: string; unread: number; online: boolean; }
interface Msg { id: string; sender: 'me' | 'them'; content: string; time: string; }

const CONVERSATIONS: Conversation[] = [
  { id: '1', name: 'Sarah Johnson', lastMessage: 'Thank you doctor!', time: '2:30 PM', unread: 2, online: true },
  { id: '2', name: 'James Owusu', lastMessage: 'My blood sugar was 120 this morning.', time: '1:15 PM', unread: 1, online: false },
  { id: '3', name: 'Grace Mensah', lastMessage: 'When should I take the medication?', time: 'Yesterday', unread: 0, online: true },
  { id: '4', name: 'Kofi Agyeman', lastMessage: 'See you at the appointment.', time: 'Mar 22', unread: 0, online: false },
];

const MESSAGES: Record<string, Msg[]> = {
  '1': [
    { id: '1', sender: 'them', content: 'Hi Dr. Chen, I wanted to ask about my test results.', time: '2:15 PM' },
    { id: '2', sender: 'me', content: 'Hi Sarah! Your results look great. Everything is within normal range.', time: '2:20 PM' },
    { id: '3', sender: 'them', content: 'That\'s great news! Thank you doctor!', time: '2:30 PM' },
  ],
  '2': [
    { id: '1', sender: 'them', content: 'Good morning doctor, my blood sugar was 120 this morning.', time: '1:00 PM' },
    { id: '2', sender: 'me', content: 'That\'s a good reading, James. Keep monitoring and maintaining your diet.', time: '1:10 PM' },
    { id: '3', sender: 'them', content: 'Will do. Thanks for the guidance.', time: '1:15 PM' },
  ],
  '3': [
    { id: '1', sender: 'them', content: 'When should I take the medication?', time: '10:00 AM' },
    { id: '2', sender: 'me', content: 'Take it twice daily — morning and evening, with food.', time: '10:30 AM' },
  ],
  '4': [
    { id: '1', sender: 'me', content: 'Your appointment is confirmed for March 28th at 9 AM.', time: '9:00 AM' },
    { id: '2', sender: 'them', content: 'See you at the appointment. Thanks!', time: '9:15 AM' },
  ],
};

export default function DoctorMessages() {
  const [activeConvo, setActiveConvo] = useState('1');
  const [messages, setMessages] = useState<Record<string, Msg[]>>(MESSAGES);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showConvos, setShowConvos] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, activeConvo]);

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    const msg: Msg = { id: Date.now().toString(), sender: 'me', content: newMessage, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setMessages(prev => ({ ...prev, [activeConvo]: [...(prev[activeConvo] || []), msg] }));
    setNewMessage('');
    setTimeout(() => {
      const reply: Msg = { id: (Date.now() + 1).toString(), sender: 'them', content: 'Thank you, doctor. I appreciate your help.', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
      setMessages(prev => ({ ...prev, [activeConvo]: [...(prev[activeConvo] || []), reply] }));
    }, 2000);
  };

  const activeConversation = CONVERSATIONS.find(c => c.id === activeConvo);
  const filteredConvos = CONVERSATIONS.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <DashboardLayout role="doctor" title="Messages">
      <div className="flex h-[calc(100vh-12rem)] rounded-xl overflow-hidden border bg-card shadow-card">
        <div className={`w-full md:w-80 border-r flex flex-col ${!showConvos && 'hidden md:flex'}`}>
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search patients..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 h-9" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredConvos.map(c => (
              <button key={c.id} onClick={() => { setActiveConvo(c.id); setShowConvos(false); }}
                className={`w-full p-3 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left ${activeConvo === c.id ? 'bg-primary/5' : ''}`}>
                <div className="relative">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">{c.name.split(' ').map(n => n[0]).join('')}</div>
                  {c.online && <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-success border-2 border-card" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between"><span className="text-sm font-medium text-foreground truncate">{c.name}</span><span className="text-xs text-muted-foreground">{c.time}</span></div>
                  <p className="text-xs text-muted-foreground truncate">{c.lastMessage}</p>
                </div>
                {c.unread > 0 && <Badge className="h-5 w-5 p-0 flex items-center justify-center text-[10px]">{c.unread}</Badge>}
              </button>
            ))}
          </div>
        </div>

        <div className={`flex-1 flex flex-col ${showConvos && 'hidden md:flex'}`}>
          {activeConversation && (
            <>
              <div className="h-14 border-b flex items-center justify-between px-4">
                <div className="flex items-center gap-3">
                  <button className="md:hidden text-muted-foreground" onClick={() => setShowConvos(true)}>←</button>
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">{activeConversation.name.split(' ').map(n => n[0]).join('')}</div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{activeConversation.name}</p>
                    <p className="text-xs text-muted-foreground">{activeConversation.online ? 'Online' : 'Offline'}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8"><Phone className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8"><Video className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {(messages[activeConvo] || []).map(msg => (
                  <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${msg.sender === 'me' ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-muted text-foreground rounded-bl-md'}`}>
                      <p className="text-sm">{msg.content}</p>
                      <p className={`text-[10px] mt-1 ${msg.sender === 'me' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{msg.time}</p>
                    </div>
                  </div>
                ))}
                <div ref={endRef} />
              </div>
              <div className="border-t p-3 flex gap-2">
                <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0"><Paperclip className="h-4 w-4" /></Button>
                <Input placeholder="Type a message..." value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} className="flex-1" />
                <Button size="icon" className="h-10 w-10 shrink-0" onClick={sendMessage} disabled={!newMessage.trim()}><Send className="h-4 w-4" /></Button>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
