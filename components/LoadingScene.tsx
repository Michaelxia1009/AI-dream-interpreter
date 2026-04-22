'use client';

import { useEffect, useState } from 'react';

const MESSAGES = [
  'Whispering to the dream-weaver...',
  'Stirring the subconscious...',
  'Painting with starlight...',
  'Asking the dream if it remembers...',
  'Letting the narrator find their voice...',
  'Arranging the impossible in the correct order...',
  'Calling back the shapes that got away...',
  'Rendering something you barely remember...',
];

export function LoadingScene() {
  const [i, setI] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const m = setInterval(() => setI(v => (v + 1) % MESSAGES.length), 3000);
    const e = setInterval(() => setElapsed(v => v + 1), 1000);
    return () => { clearInterval(m); clearInterval(e); };
  }, []);

  return (
    <div className="aurora-bg relative flex min-h-dvh items-center justify-center overflow-hidden">
      {/* Slow breathing glow */}
      <div
        className="absolute inset-0 animate-pulse"
        style={{
          background:
            'radial-gradient(ellipse at 30% 30%, var(--dw-glow-soft) 0%, transparent 60%),' +
            'radial-gradient(ellipse at 70% 70%, var(--dw-glow) 0%, transparent 65%)',
        }}
      />
      <div className="relative z-10 max-w-xs text-center">
        {/* Aurora ring spinner */}
        <div className="relative mx-auto mb-8 h-20 w-20">
          <div
            className="absolute inset-0 rounded-full opacity-80 animate-spin"
            style={{ background: 'var(--dw-halo)', animationDuration: '3s' }}
          />
          <div className="absolute inset-[3px] rounded-full bg-background" />
          <div
            className="absolute inset-0 rounded-full mix-blend-screen blur-md opacity-60"
            style={{ background: 'var(--dw-halo)' }}
          />
        </div>
        <p className="font-serif text-2xl leading-snug">{MESSAGES[i]}</p>
        <p className="mt-4 text-xs text-muted-foreground tabular-nums">{elapsed}s</p>
      </div>
    </div>
  );
}
