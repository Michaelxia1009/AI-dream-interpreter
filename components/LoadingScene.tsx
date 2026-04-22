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
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-zinc-950">
      <div className="absolute inset-0 animate-pulse bg-[radial-gradient(ellipse_at_center,_rgba(139,92,246,0.25)_0%,_transparent_60%)]" />
      <div className="relative z-10 max-w-xs text-center">
        <div className="mx-auto mb-8 h-16 w-16 animate-spin rounded-full border-2 border-zinc-700 border-t-white" />
        <p className="font-serif text-2xl leading-snug">{MESSAGES[i]}</p>
        <p className="mt-4 text-xs text-zinc-500">{elapsed}s</p>
      </div>
    </div>
  );
}
