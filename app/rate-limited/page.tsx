'use client';

import { useEffect, useState } from 'react';
import { PageShell, Button } from '@/components/ui';
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
    <PageShell className="items-center justify-center text-center">
      <h1 className="text-h2">
        You&apos;ve dreamed <span className="aurora-text">3 times</span> today.
      </h1>
      <p className="mt-6 text-muted-foreground">
        {msLeft !== null
          ? `Come back in ${hrs}h ${mins}m.`
          : 'Come back tomorrow for more.'}
      </p>
      <Button variant="secondary" size="lg" as="link" href="/" className="mt-6">
        Back to start
      </Button>
    </PageShell>
  );
}
