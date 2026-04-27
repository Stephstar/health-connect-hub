import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Send, Paperclip, Search, Phone, Video, MoreVertical } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface Contact {
  id: string;          // user_id of the other party
  name: string;
  avatar: string;
  specialty?: string;
}

export default function SecureMessaging() {
  const { user } = useAuth();
  const { messages, sendMessage, doctors } = useApp();
  const [activeContactId, setActiveContactId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showConvos, setShowConvos] = useState(true);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Build contact list from messages and from doctors (for patients to start chats)
  useEffect(() => {
    if (!user) return;
    const ids = new Set<string>();
    messages.forEach(m => {
      const other = m.senderId === user.id ? m.recipientId : m.senderId;
      ids.add(other);
    });
    if (user.role === 'patient') {
      // Also surface doctors as potential contacts
      doctors.forEach(d => { if (d.userId) ids.add(d.userId); });
    }
    if (ids.size === 0) {
      setContacts([]);
      return;
    }
    supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', Array.from(ids))
      .then(({ data }) => {
        if (!data) return;
        const list: Contact[] = data.map(p => {
          const matchingDoctor = doctors.find(d => d.userId === p.id);
          return {
            id: p.id,
            name: p.full_name || 'Unknown',
            avatar: p.avatar_url || '',
            specialty: matchingDoctor?.specialty,
          };
        });
        setContacts(list);
        if (!activeContactId && list.length > 0) setActiveContactId(list[0].id);
      });
  }, [messages, doctors, user, activeContactId]);

  const conversation = useMemo(() => {
    if (!user || !activeContactId) return [];
    return messages
      .filter(m => (m.senderId === activeContactId && m.recipientId === user.id) || (m.senderId === user.id && m.recipientId === activeContactId))
      .slice()
      .reverse();
  }, [messages, user, activeContactId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  const handleSend = async () => {
    if (!newMessage.trim() || !activeContactId) return;
    await sendMessage(activeContactId, newMessage.trim());
    setNewMessage('');
  };

  const filteredContacts = contacts.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const activeContact = contacts.find(c => c.id === activeContactId);

  return (
    <DashboardLayout role={user?.role === 'doctor' ? 'doctor' : 'patient'} title="Messages">
      <div className="flex h-[calc(100vh-12rem)] rounded-xl overflow-hidden border bg-card shadow-card">
        <div className={`w-full md:w-80 border-r flex flex-col ${!showConvos && 'hidden md:flex'}`}>
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search conversations..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 h-9" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredContacts.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">No conversations yet.</div>
            ) : filteredContacts.map(c => {
              const lastMsg = messages.find(m => (m.senderId === c.id && m.recipientId === user?.id) || (m.senderId === user?.id && m.recipientId === c.id));
              return (
                <button
                  key={c.id}
                  onClick={() => { setActiveContactId(c.id); setShowConvos(false); }}
                  className={`w-full p-3 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left ${activeContactId === c.id ? 'bg-primary/5' : ''}`}
                >
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                    {c.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{lastMsg?.content || (c.specialty ? `${c.specialty} • Tap to start chat` : 'Tap to start chat')}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className={`flex-1 flex flex-col ${showConvos && 'hidden md:flex'}`}>
          {activeContact ? (
            <>
              <div className="h-14 border-b flex items-center justify-between px-4">
                <div className="flex items-center gap-3">
                  <button className="md:hidden text-muted-foreground" onClick={() => setShowConvos(true)}>←</button>
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                    {activeContact.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{activeContact.name}</p>
                    {activeContact.specialty && <p className="text-xs text-muted-foreground">{activeContact.specialty}</p>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8"><Phone className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8"><Video className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {conversation.length === 0 ? (
                  <div className="text-center text-sm text-muted-foreground mt-12">No messages yet. Send the first one below.</div>
                ) : conversation.map(msg => {
                  const isMe = msg.senderId === user?.id;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${isMe ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-muted text-foreground rounded-bl-md'}`}>
                        <p className="text-sm">{msg.content}</p>
                        <p className={`text-[10px] mt-1 ${isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <div className="border-t p-3 flex gap-2">
                <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0"><Paperclip className="h-4 w-4" /></Button>
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  className="flex-1"
                />
                <Button size="icon" className="h-10 w-10 shrink-0" onClick={handleSend} disabled={!newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">Select a conversation to start messaging.</div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

// Badge currently unused but kept for future read-status indicator
void Badge;
