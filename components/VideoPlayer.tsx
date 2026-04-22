'use client';

import { useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

export function VideoPlayer({ src }: { src: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  return (
    <div className="relative overflow-hidden rounded-3xl bg-black">
      <video
        ref={ref}
        src={src}
        autoPlay loop playsInline muted={muted}
        className="h-full w-full object-cover"
      />
      <button
        onClick={() => setMuted(m => !m)}
        className="absolute bottom-3 right-3 rounded-full bg-black/60 p-2 text-white backdrop-blur"
        aria-label={muted ? 'Unmute' : 'Mute'}
      >
        {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
      </button>
    </div>
  );
}
