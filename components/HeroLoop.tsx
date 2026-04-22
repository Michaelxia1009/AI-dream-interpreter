'use client';

import { useEffect, useRef } from 'react';

export function HeroLoop() {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => { ref.current?.play().catch(() => {}); }, []);
  return (
    <video
      ref={ref}
      src="/sample-dream.mp4"
      muted
      loop
      playsInline
      autoPlay
      aria-hidden
      className="absolute inset-0 h-full w-full object-cover opacity-60"
    />
  );
}
