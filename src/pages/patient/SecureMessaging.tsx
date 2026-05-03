import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Send, Paperclip, Search, Phone, Video, MoreVertical,
  Image, FileText, Mic, MicOff, Plus, UserPlus, X, File, Play, Pause
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Contact {
  id: string;
  name: string;
  avatar: string;
  specialty?: string;
  isOnline?: boolean;
}

export default function SecureMessaging() {
  const { user } = useAuth();
  const { messages, sendMessage, doctors } = useApp();
  const { toast } = useToast();
  const [activeContactId, setActiveContactId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showConvos, setShowConvos] = useState(true);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [showNewChat, setShowNewChat] = useState(false);
  const [doctorSearch, setDoctorSearch] = useState('');
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!user) return;
    const ids = new Set<string>();
    messages.forEach(m => {
      const other = m.senderId === user.id ? m.recipientId : m.senderId;
      ids.add(other);
    });
    if (ids.size === 0) { setContacts([]); return; }
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

  const startNewChat = (doctorUserId: string, doctorName: string, specialty?: string) => {
    if (!contacts.find(c => c.id === doctorUserId)) {
      setContacts(prev => [{ id: doctorUserId, name: doctorName, avatar: '', specialty }, ...prev]);
    }
    setActiveContactId(doctorUserId);
    setShowNewChat(false);
    setShowConvos(false);
  };

  const uploadFile = async (file: globalThis.File, type: string) => {
    if (!user || !activeContactId) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'bin';
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('message-attachments').upload(path, file);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('message-attachments').getPublicUrl(path);
      const label = type === 'voice' ? '🎤 Voice message' : type === 'image' ? `📷 ${file.name}` : `📎 ${file.name}`;
      // Send as a message with attachment metadata in content
      const attachmentContent = `[${label}](${urlData.publicUrl})`;
      await sendMessage(activeContactId, attachmentContent);
      toast({ title: 'File sent' });
    } catch (err) {
      toast({ title: 'Upload failed', description: err instanceof Error ? err.message : 'Error', variant: 'destructive' });
    } finally {
      setUploading(false);
      setShowAttachMenu(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file, type);
    e.target.value = '';
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const file = new globalThis.File([blob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });
        uploadFile(file, 'voice');
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingIntervalRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch {
      toast({ title: 'Microphone access denied', variant: 'destructive' });
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const filteredContacts = contacts.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const activeContact = contacts.find(c => c.id === activeContactId);
  const availableDoctors = doctors.filter(d => d.userId && d.name.toLowerCase().includes(doctorSearch.toLowerCase()));

  const renderMessageContent = (content: string, isMe: boolean) => {
    const linkMatch = content.match(/^\[(.+?)\]\((.+?)\)$/);
    if (linkMatch) {
      const [, label, url] = linkMatch;
      if (label.startsWith('🎤')) {
        return (
          <div className="flex items-center gap-2">
            <Mic className="h-4 w-4 shrink-0" />
            <audio controls className="h-8 max-w-[200px]" src={url} />
          </div>
        );
      }
      if (label.startsWith('📷')) {
        return <img src={url} alt="Shared image" className="max-w-[200px] rounded-lg" />;
      }
      return (
        <a href={url} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 underline text-sm ${isMe ? 'text-primary-foreground' : 'text-primary'}`}>
          <File className="h-4 w-4 shrink-0" />
          {label.replace('📎 ', '')}
        </a>
      );
    }
    return <p className="text-sm whitespace-pre-line">{content}</p>;
  };

  return (
    <DashboardLayout role={user?.role === 'doctor' ? 'doctor' : 'patient'} title="Messages">
      <input ref={fileInputRef} type="file" className="hidden" onChange={e => handleFileSelect(e, 'file')} />
      <input ref={imageInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={e => handleFileSelect(e, 'image')} />

      <div className="flex h-[calc(100vh-12rem)] rounded-xl overflow-hidden border bg-card shadow-card">
        <div className={`w-full md:w-80 border-r flex flex-col ${!showConvos && 'hidden md:flex'}`}>
          <div className="p-3 border-b flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 h-9" />
            </div>
            {user?.role === 'patient' && (
              <Dialog open={showNewChat} onOpenChange={setShowNewChat}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0"><UserPlus className="h-4 w-4" /></Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Start a new conversation</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Search doctors..." value={doctorSearch} onChange={e => setDoctorSearch(e.target.value)} className="pl-9" />
                    </div>
                    <div className="max-h-64 overflow-y-auto space-y-1">
                      {availableDoctors.map(d => (
                        <button key={d.id} onClick={() => startNewChat(d.userId!, d.name, d.specialty)}
                          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                            {d.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{d.name}</p>
                            <p className="text-xs text-muted-foreground">{d.specialty} • ${d.price}/visit</p>
                          </div>
                          <Badge variant="secondary" className="ml-auto text-[10px]">Online</Badge>
                        </button>
                      ))}
                      {availableDoctors.length === 0 && <p className="text-center text-sm text-muted-foreground py-4">No doctors found.</p>}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredContacts.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                {user?.role === 'patient' ? 'No conversations yet. Tap + to message a doctor.' : 'No conversations yet.'}
              </div>
            ) : filteredContacts.map(c => {
              const lastMsg = messages.find(m => (m.senderId === c.id && m.recipientId === user?.id) || (m.senderId === user?.id && m.recipientId === c.id));
              const lastContent = lastMsg?.content || (c.specialty ? `${c.specialty} • Tap to chat` : 'Tap to chat');
              const displayContent = lastContent.startsWith('[') ? lastContent.replace(/^\[(.+?)\]\(.+\)$/, '$1') : lastContent;
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
                    <p className="text-xs text-muted-foreground truncate">{displayContent}</p>
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
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toast({ title: 'Voice call started' })}><Phone className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toast({ title: 'Video call started' })}><Video className="h-4 w-4" /></Button>
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
                        {renderMessageContent(msg.content, isMe)}
                        <p className={`text-[10px] mt-1 ${isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <div className="border-t p-3">
                {isRecording ? (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 flex-1 bg-destructive/10 rounded-full px-4 py-2">
                      <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
                      <span className="text-sm text-destructive font-medium">Recording {formatTime(recordingTime)}</span>
                    </div>
                    <Button size="icon" variant="destructive" className="h-10 w-10 rounded-full" onClick={stopRecording}>
                      <MicOff className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2 items-center">
                    <div className="relative">
                      <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0" onClick={() => setShowAttachMenu(!showAttachMenu)}>
                        {showAttachMenu ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                      </Button>
                      {showAttachMenu && (
                        <div className="absolute bottom-12 left-0 bg-card border rounded-xl shadow-lg p-2 flex gap-1 z-10">
                          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => imageInputRef.current?.click()} title="Photo/Video">
                            <Image className="h-4 w-4 text-success" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => fileInputRef.current?.click()} title="Document">
                            <FileText className="h-4 w-4 text-primary" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => { setShowAttachMenu(false); startRecording(); }} title="Voice">
                            <Mic className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSend()}
                      className="flex-1"
                      disabled={uploading}
                    />
                    {newMessage.trim() ? (
                      <Button size="icon" className="h-10 w-10 shrink-0" onClick={handleSend} disabled={uploading}>
                        <Send className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button size="icon" variant="ghost" className="h-10 w-10 shrink-0" onClick={startRecording}>
                        <Mic className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-sm text-muted-foreground gap-3">
              <MessageSquareIcon className="h-12 w-12 text-muted-foreground/30" />
              <p>Select a conversation to start messaging.</p>
              {user?.role === 'patient' && (
                <Button variant="outline" size="sm" onClick={() => setShowNewChat(true)}>
                  <UserPlus className="h-4 w-4 mr-2" /> Message a Doctor
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

function MessageSquareIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
