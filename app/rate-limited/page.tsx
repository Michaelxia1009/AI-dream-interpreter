'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getFingerprint } from '@/lib/fingerprint';

export default function RateLimitedPage() {
  const [msLeft, setMsLeft] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const fp = await getFingerprint();
      const res = await fetch(`/api/quota?fp=${encodeURIComponent(fp)}`);
      if (res.ok) {
        const d = await res.json();
        setMsLeft(Math.max(0, d.resetAt - Date.now()));
      }
    })();
  }, []);

  useEffect(() => {
    if (msLeft === null) return;
    const t = setInterval(() => setMsLeft(v => (v !== null ? Math.max(0, v - 1000) : v)), 1000);
    return () => clearInterval(t);
  }, [msLeft]);

  const hrs = msLeft !== null ? Math.floor(msLeft / 3_600_000) : 0;
  const mins = msLeft !== null ? Math.floor((msLeft % 3_600_000) / 60_000) : 0;

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="font-serif text-3xl">You&apos;ve dreamed 3 times today.</h1>
      <p className="text-zinc-400">
        {msLeft !== null
          ? `Come back in ${hrs}h ${mins}m.`
          : 'Come back tomorrow for more.'}
      </p>
      <Link href="/" className="rounded-full border border-zinc-700 px-6 py-3">Back to start</Link>
    </main>
  );
}
