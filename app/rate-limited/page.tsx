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
    <main className="aurora-bg flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="font-serif text-3xl">
        You&apos;ve dreamed <span className="aurora-text">3 times</span> today.
      </h1>
      <p className="text-muted-foreground">
        {msLeft !== null
          ? `Come back in ${hrs}h ${mins}m.`
          : 'Come back tomorrow for more.'}
      </p>
      <Link
        href="/"
        className="rounded-full border border-border px-6 py-3 text-sm text-muted-foreground transition hover:text-foreground hover:border-ring/60"
      >
        Back to start
      </Link>
    </main>
  );
}
