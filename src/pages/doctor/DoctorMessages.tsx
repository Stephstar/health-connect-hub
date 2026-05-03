import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Send, Search, Phone, Video, Plus, X, Image, FileText, Mic, MicOff, File
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Conversation { id: string; name: string; lastMessage: string; time: string; unread: number; }
interface Msg { id: string; sender: 'me' | 'them'; content: string; time: string; }

export default function DoctorMessages() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvo, setActiveConvo] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showConvos, setShowConvos] = useState(true);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [uploading, setUploading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
      const content = last.content;
      const display = content.startsWith('[') ? content.replace(/^\[(.+?)\]\(.+\)$/, '$1') : content.substring(0, 50);
      return { id, name: nameMap.get(id) || 'Unknown', lastMessage: display, time: new Date(last.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), unread: c.unread };
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
      const res = await supabase.from('messages').select('id, sender_id, recipient_id, content, is_read, created_at')
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${otherId}),and(sender_id.eq.${otherId},recipient_id.eq.${user.id})`)
        .order('created_at', { ascending: true }).limit(100);
      data = res.data || [];
    } else {
      data = data.filter(m => (m.sender_id === otherId || m.recipient_id === otherId)).reverse();
    }
    setMessages(data.map((m: any) => ({ id: m.id, sender: m.sender_id === user.id ? 'me' : 'them', content: m.content, time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) })));
    await supabase.from('messages').update({ is_read: true }).eq('recipient_id', user.id).eq('sender_id', otherId).eq('is_read', false);
    setConversations(prev => prev.map(c => c.id === otherId ? { ...c, unread: 0 } : c));
  };

  const sendMsg = async (content?: string) => {
    const text = content || newMessage.trim();
    if (!text || !activeConvo || !user) return;
    const { data } = await supabase.from('messages').insert({ sender_id: user.id, recipient_id: activeConvo, content: text }).select().single();
    if (data) {
      setMessages(prev => [...prev, { id: data.id, sender: 'me', content: data.content, time: new Date(data.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
      const display = text.startsWith('[') ? text.replace(/^\[(.+?)\]\(.+\)$/, '$1') : text.substring(0, 50);
      setConversations(prev => prev.map(c => c.id === activeConvo ? { ...c, lastMessage: display, time: 'now' } : c));
    }
    if (!content) setNewMessage('');
  };

  const uploadFile = async (file: globalThis.File, type: string) => {
    if (!user || !activeConvo) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'bin';
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('message-attachments').upload(path, file);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('message-attachments').getPublicUrl(path);
      const label = type === 'voice' ? '🎤 Voice message' : type === 'image' ? `📷 ${file.name}` : `📎 ${file.name}`;
      await sendMsg(`[${label}](${urlData.publicUrl})`);
      toast({ title: 'File sent' });
    } catch (err) {
      toast({ title: 'Upload failed', variant: 'destructive' });
    } finally { setUploading(false); setShowAttachMenu(false); }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file, type);
    e.target.value = '';
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      recorder.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = () => { const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' }); uploadFile(new globalThis.File([blob], `voice_${Date.now()}.webm`, { type: 'audio/webm' }), 'voice'); stream.getTracks().forEach(t => t.stop()); };
      recorder.start();
      setIsRecording(true); setRecordingTime(0);
      recordingIntervalRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch { toast({ title: 'Microphone access denied', variant: 'destructive' }); }
  };

  const stopRecording = () => { mediaRecorderRef.current?.stop(); setIsRecording(false); if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current); };
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const activeConversation = conversations.find(c => c.id === activeConvo);
  const filteredConvos = conversations.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const renderContent = (content: string, isMe: boolean) => {
    const m = content.match(/^\[(.+?)\]\((.+?)\)$/);
    if (m) {
      const [, label, url] = m;
      if (label.startsWith('🎤')) return <div className="flex items-center gap-2"><Mic className="h-4 w-4" /><audio controls className="h-8 max-w-[200px]" src={url} /></div>;
      if (label.startsWith('📷')) return <img src={url} alt="Shared" className="max-w-[200px] rounded-lg" />;
      return <a href={url} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 underline text-sm ${isMe ? 'text-primary-foreground' : 'text-primary'}`}><File className="h-4 w-4" />{label.replace('📎 ', '')}</a>;
    }
    return <p className="text-sm">{content}</p>;
  };

  return (
    <DashboardLayout role="doctor" title="Messages">
      <input ref={fileInputRef} type="file" className="hidden" onChange={e => handleFileSelect(e, 'file')} />
      <input ref={imageInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={e => handleFileSelect(e, 'image')} />
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
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toast({ title: 'Voice call started' })}><Phone className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toast({ title: 'Video call started' })}><Video className="h-4 w-4" /></Button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${msg.sender === 'me' ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-muted text-foreground rounded-bl-md'}`}>
                      {renderContent(msg.content, msg.sender === 'me')}
                      <p className={`text-[10px] mt-1 ${msg.sender === 'me' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{msg.time}</p>
                    </div>
                  </div>
                ))}
                <div ref={endRef} />
              </div>
              <div className="border-t p-3">
                {isRecording ? (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 flex-1 bg-destructive/10 rounded-full px-4 py-2">
                      <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
                      <span className="text-sm text-destructive font-medium">Recording {formatTime(recordingTime)}</span>
                    </div>
                    <Button size="icon" variant="destructive" className="h-10 w-10 rounded-full" onClick={stopRecording}><MicOff className="h-4 w-4" /></Button>
                  </div>
                ) : (
                  <div className="flex gap-2 items-center">
                    <div className="relative">
                      <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0" onClick={() => setShowAttachMenu(!showAttachMenu)}>
                        {showAttachMenu ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                      </Button>
                      {showAttachMenu && (
                        <div className="absolute bottom-12 left-0 bg-card border rounded-xl shadow-lg p-2 flex gap-1 z-10">
                          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => imageInputRef.current?.click()}><Image className="h-4 w-4 text-success" /></Button>
                          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => fileInputRef.current?.click()}><FileText className="h-4 w-4 text-primary" /></Button>
                          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => { setShowAttachMenu(false); startRecording(); }}><Mic className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      )}
                    </div>
                    <Input placeholder="Type a message..." value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMsg()} className="flex-1" disabled={uploading} />
                    {newMessage.trim() ? (
                      <Button size="icon" className="h-10 w-10 shrink-0" onClick={() => sendMsg()} disabled={uploading}><Send className="h-4 w-4" /></Button>
                    ) : (
                      <Button size="icon" variant="ghost" className="h-10 w-10 shrink-0" onClick={startRecording}><Mic className="h-4 w-4" /></Button>
                    )}
                  </div>
                )}
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
