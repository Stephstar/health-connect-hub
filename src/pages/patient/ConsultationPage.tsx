import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, VideoIcon, VideoOff, Monitor, Phone, MessageSquare, Paperclip, Send, X, Maximize2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

export default function ConsultationPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { id: '1', sender: 'doctor', content: 'Hello! How are you feeling today?', time: '10:01 AM' },
  ]);
  const [newMsg, setNewMsg] = useState('');
  const [callDuration, setCallDuration] = useState('12:34');

  const sendChat = () => {
    if (!newMsg.trim()) return;
    setChatMessages(prev => [...prev, { id: Date.now().toString(), sender: 'patient', content: newMsg, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    setNewMsg('');
    setTimeout(() => {
      setChatMessages(prev => [...prev, { id: (Date.now() + 1).toString(), sender: 'doctor', content: 'I understand. Let me take a closer look at your symptoms.', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    }, 2000);
  };

  const endCall = () => {
    toast({ title: 'Consultation ended', description: 'Thank you for your visit.' });
    navigate('/patient/dashboard');
  };

  return (
    <div className="h-screen bg-foreground flex flex-col">
      {/* Top bar */}
      <div className="h-14 flex items-center justify-between px-4 bg-foreground/90">
        <div className="flex items-center gap-3">
          <Badge className="bg-success text-success-foreground">● Live</Badge>
          <span className="text-sm text-primary-foreground/80 font-medium">Dr. Michael Chen • Cardiology</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-primary-foreground/60 font-mono">{callDuration}</span>
          <Button variant="ghost" size="icon" className="text-primary-foreground/60 hover:text-primary-foreground" onClick={() => setShowChat(!showChat)}>
            <MessageSquare className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-primary-foreground/60 hover:text-primary-foreground">
            <Maximize2 className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Video Area */}
      <div className="flex-1 flex">
        <div className={`flex-1 relative ${showChat ? '' : ''}`}>
          {/* Doctor Video (main) */}
          <div className="absolute inset-0 bg-gradient-to-br from-muted/20 to-muted/10 flex items-center justify-center">
            <div className="text-center">
              <div className="h-32 w-32 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl font-bold text-primary-foreground/60">MC</span>
              </div>
              <p className="text-primary-foreground/60 text-lg font-medium">Dr. Michael Chen</p>
              <p className="text-primary-foreground/40 text-sm">Cardiology Consultation</p>
            </div>
          </div>

          {/* Patient Video (PiP) */}
          <div className="absolute bottom-4 right-4 w-48 h-36 rounded-xl bg-muted/30 border border-primary-foreground/10 flex items-center justify-center overflow-hidden">
            {isCameraOn ? (
              <div className="text-center">
                <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-1">
                  <span className="text-sm font-bold text-primary-foreground/60">You</span>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <VideoOff className="h-6 w-6 text-primary-foreground/40 mx-auto mb-1" />
                <p className="text-xs text-primary-foreground/40">Camera off</p>
              </div>
            )}
          </div>
        </div>

        {/* Chat Sidebar */}
        {showChat && (
          <div className="w-80 border-l border-primary-foreground/10 flex flex-col bg-foreground/95">
            <div className="h-12 border-b border-primary-foreground/10 flex items-center justify-between px-4">
              <span className="text-sm font-medium text-primary-foreground/80">Chat</span>
              <button onClick={() => setShowChat(false)}><X className="h-4 w-4 text-primary-foreground/40" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {chatMessages.map(msg => (
                <div key={msg.id} className={`flex ${msg.sender === 'patient' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-xl px-3 py-2 ${msg.sender === 'patient' ? 'bg-primary text-primary-foreground' : 'bg-primary-foreground/10 text-primary-foreground/80'}`}>
                    <p className="text-xs">{msg.content}</p>
                    <p className="text-[10px] mt-1 opacity-50">{msg.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-primary-foreground/10 p-2 flex gap-2">
              <button className="text-primary-foreground/40 hover:text-primary-foreground/60"><Paperclip className="h-4 w-4" /></button>
              <input
                className="flex-1 bg-primary-foreground/5 rounded-lg px-3 py-1.5 text-xs text-primary-foreground/80 placeholder:text-primary-foreground/30 outline-none"
                placeholder="Type a message..."
                value={newMsg}
                onChange={e => setNewMsg(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendChat()}
              />
              <button onClick={sendChat} className="text-primary"><Send className="h-4 w-4" /></button>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="h-20 flex items-center justify-center gap-4 bg-foreground/95 border-t border-primary-foreground/10">
        <Button
          variant="ghost"
          size="icon"
          className={`h-12 w-12 rounded-full ${isMuted ? 'bg-destructive text-destructive-foreground' : 'bg-primary-foreground/10 text-primary-foreground/80 hover:bg-primary-foreground/20'}`}
          onClick={() => setIsMuted(!isMuted)}
        >
          {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={`h-12 w-12 rounded-full ${!isCameraOn ? 'bg-destructive text-destructive-foreground' : 'bg-primary-foreground/10 text-primary-foreground/80 hover:bg-primary-foreground/20'}`}
          onClick={() => setIsCameraOn(!isCameraOn)}
        >
          {isCameraOn ? <VideoIcon className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={`h-12 w-12 rounded-full ${isScreenSharing ? 'bg-primary text-primary-foreground' : 'bg-primary-foreground/10 text-primary-foreground/80 hover:bg-primary-foreground/20'}`}
          onClick={() => { setIsScreenSharing(!isScreenSharing); toast({ title: isScreenSharing ? 'Screen sharing stopped' : 'Screen sharing started' }); }}
        >
          <Monitor className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-14 w-14 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
          onClick={endCall}
        >
          <Phone className="h-6 w-6 rotate-[135deg]" />
        </Button>
      </div>
    </div>
  );
}
