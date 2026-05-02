import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Send, Paperclip, Search, Phone, Video, MoreVertical } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface Conversation { id: string; name: string; lastMessage: string; time: string; unread: number; }
interface Msg { id: string; sender: 'me' | 'them'; content: string; time: string; }

export default function DoctorMessages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvo, setActiveConvo] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showConvos, setShowConvos] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (user) loadConversations(); }, [user]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const loadConversations = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('messages')
      .select('id, sender_id, recipient_id, content, is_read, created_at')
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .limit(200);
    if (!data) return;

    // Group by other party
    const convoMap = new Map<string, { msgs: typeof data; unread: number }>();
    data.forEach(m => {
      const otherId = m.sender_id === user.id ? m.recipient_id : m.sender_id;
      if (!convoMap.has(otherId)) convoMap.set(otherId, { msgs: [], unread: 0 });
      const c = convoMap.get(otherId)!;
      c.msgs.push(m);
      if (!m.is_read && m.recipient_id === user.id) c.unread++;
    });

    const otherIds = [...convoMap.keys()];
    if (otherIds.length === 0) return;
    const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', otherIds);
    const nameMap = new Map((profiles || []).map(p => [p.id, p.full_name]));

    const convos: Conversation[] = otherIds.map(id => {
      const c = convoMap.get(id)!;
      const last = c.msgs[0];
      return {
        id,
        name: nameMap.get(id) || 'Unknown',
        lastMessage: last.content.substring(0, 50),
        time: new Date(last.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        unread: c.unread,
      };
    });
    setConversations(convos);
    if (!activeConvo && convos.length > 0) selectConvo(convos[0].id, data);
  };

  const selectConvo = async (otherId: string, allMsgs?: any[]) => {
    setActiveConvo(otherId);
    setShowConvos(false);
    if (!user) return;

    let data = allMsgs;
    if (!data) {
      const res = await supabase
        .from('messages')
        .select('id, sender_id, recipient_id, content, is_read, created_at')
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${otherId}),and(sender_id.eq.${otherId},recipient_id.eq.${user.id})`)
        .order('created_at', { ascending: true })
        .limit(100);
      data = res.data || [];
    } else {
      data = data.filter(m => (m.sender_id === otherId || m.recipient_id === otherId)).reverse();
    }

    setMessages(data.map((m: any) => ({
      id: m.id,
      sender: m.sender_id === user.id ? 'me' : 'them',
      content: m.content,
      time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    })));

    // Mark unread as read
    await supabase.from('messages').update({ is_read: true }).eq('recipient_id', user.id).eq('sender_id', otherId).eq('is_read', false);
    setConversations(prev => prev.map(c => c.id === otherId ? { ...c, unread: 0 } : c));
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConvo || !user) return;
    const { data } = await supabase
      .from('messages')
      .insert({ sender_id: user.id, recipient_id: activeConvo, content: newMessage })
      .select()
      .single();
    if (data) {
      setMessages(prev => [...prev, {
        id: data.id,
        sender: 'me',
        content: data.content,
        time: new Date(data.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
      setConversations(prev => prev.map(c => c.id === activeConvo ? { ...c, lastMessage: newMessage.substring(0, 50), time: 'now' } : c));
    }
    setNewMessage('');
  };

  const activeConversation = conversations.find(c => c.id === activeConvo);
  const filteredConvos = conversations.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

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
              <button key={c.id} onClick={() => selectConvo(c.id)}
                className={`w-full p-3 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left ${activeConvo === c.id ? 'bg-primary/5' : ''}`}>
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">{c.name.split(' ').map(n => n[0]).join('')}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between"><span className="text-sm font-medium text-foreground truncate">{c.name}</span><span className="text-xs text-muted-foreground">{c.time}</span></div>
                  <p className="text-xs text-muted-foreground truncate">{c.lastMessage}</p>
                </div>
                {c.unread > 0 && <Badge className="h-5 w-5 p-0 flex items-center justify-center text-[10px]">{c.unread}</Badge>}
              </button>
            ))}
            {filteredConvos.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">No conversations yet</p>}
          </div>
        </div>

        <div className={`flex-1 flex flex-col ${showConvos && 'hidden md:flex'}`}>
          {activeConversation ? (
            <>
              <div className="h-14 border-b flex items-center justify-between px-4">
                <div className="flex items-center gap-3">
                  <button className="md:hidden text-muted-foreground" onClick={() => setShowConvos(true)}>←</button>
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">{activeConversation.name.split(' ').map(n => n[0]).join('')}</div>
                  <p className="text-sm font-medium text-foreground">{activeConversation.name}</p>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map(msg => (
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
                <Input placeholder="Type a message..." value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} className="flex-1" />
                <Button size="icon" className="h-10 w-10 shrink-0" onClick={sendMessage} disabled={!newMessage.trim()}><Send className="h-4 w-4" /></Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">Select a conversation</div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
