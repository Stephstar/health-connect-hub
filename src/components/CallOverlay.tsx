import React, { useState, useEffect, useCallback } from 'react';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CallOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  contactName: string;
  contactInitials: string;
  callType: 'voice' | 'video';
}

type CallState = 'ringing' | 'connected' | 'ended';

export default function CallOverlay({ isOpen, onClose, contactName, contactInitials, callType }: CallOverlayProps) {
  const [state, setState] = useState<CallState>('ringing');
  const [elapsed, setElapsed] = useState(0);
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);

  useEffect(() => {
    if (!isOpen) { setState('ringing'); setElapsed(0); setMuted(false); setVideoOff(false); return; }
    const t = setTimeout(() => setState('connected'), 2500);
    return () => clearTimeout(t);
  }, [isOpen]);

  useEffect(() => {
    if (state !== 'connected') return;
    const i = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(i);
  }, [state]);

  const hangUp = useCallback(() => { setState('ended'); setTimeout(onClose, 800); }, [onClose]);

  const fmt = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="flex flex-col items-center gap-6 text-white max-w-sm w-full px-6">
        {/* Avatar */}
        <div className={`h-24 w-24 rounded-full flex items-center justify-center text-3xl font-bold ${state === 'ringing' ? 'bg-primary/30 animate-pulse' : state === 'connected' ? 'bg-primary/40' : 'bg-muted/30'}`}>
          {contactInitials}
        </div>

        <div className="text-center">
          <p className="text-xl font-semibold">{contactName}</p>
          <p className="text-sm text-white/60 mt-1">
            {state === 'ringing' && (callType === 'video' ? 'Video calling…' : 'Calling…')}
            {state === 'connected' && fmt(elapsed)}
            {state === 'ended' && 'Call ended'}
          </p>
        </div>

        {/* Controls */}
        {state !== 'ended' && (
          <div className="flex items-center gap-4 mt-4">
            <Button variant="ghost" size="icon" className={`h-14 w-14 rounded-full border border-white/20 ${muted ? 'bg-white/20' : ''}`} onClick={() => setMuted(m => !m)}>
              {muted ? <MicOff className="h-5 w-5 text-white" /> : <Mic className="h-5 w-5 text-white" />}
            </Button>
            {callType === 'video' && (
              <Button variant="ghost" size="icon" className={`h-14 w-14 rounded-full border border-white/20 ${videoOff ? 'bg-white/20' : ''}`} onClick={() => setVideoOff(v => !v)}>
                {videoOff ? <VideoOff className="h-5 w-5 text-white" /> : <Video className="h-5 w-5 text-white" />}
              </Button>
            )}
            <Button size="icon" className="h-16 w-16 rounded-full bg-destructive hover:bg-destructive/90" onClick={hangUp}>
              <PhoneOff className="h-6 w-6 text-white" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
