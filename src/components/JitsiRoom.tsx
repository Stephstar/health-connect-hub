import React from 'react';
import { JitsiMeeting } from '@jitsi/react-sdk';

interface JitsiRoomProps {
  appointmentId: string;
  displayName: string;
  email?: string;
  onJoin?: () => void;
  onLeave?: (duration: number) => void;
}

export default function JitsiRoom({ appointmentId, displayName, email, onJoin, onLeave }: JitsiRoomProps) {
  const roomName = `hch-${appointmentId}`;
  const joinedAtRef = React.useRef<number | null>(null);

  return (
    <div className="w-full h-full bg-black">
      <JitsiMeeting
        domain="meet.jit.si"
        roomName={roomName}
        userInfo={{ displayName, email: email || '' }}
        configOverwrite={{
          prejoinPageEnabled: false,
          disableModeratorIndicator: false,
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          enableWelcomePage: false,
          disableDeepLinking: true,
        }}
        interfaceConfigOverwrite={{
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          MOBILE_APP_PROMO: false,
        }}
        onApiReady={(api) => {
          api.addEventListener('videoConferenceJoined', () => {
            joinedAtRef.current = Date.now();
            onJoin?.();
          });
          api.addEventListener('videoConferenceLeft', () => {
            const dur = joinedAtRef.current ? Math.round((Date.now() - joinedAtRef.current) / 1000) : 0;
            onLeave?.(dur);
          });
        }}
        getIFrameRef={(iframe) => {
          iframe.style.height = '100%';
          iframe.style.width = '100%';
          iframe.style.border = '0';
        }}
      />
    </div>
  );
}
