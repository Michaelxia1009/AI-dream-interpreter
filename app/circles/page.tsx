'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, UsersRound } from 'lucide-react';
import { getFingerprint } from '@/lib/fingerprint';
import { CircleCard, type CircleSummary } from '@/components/circles/CircleCard';
import { CircleCreateDialog } from '@/components/circles/CircleCreateDialog';
import { CircleJoinDialog } from '@/components/circles/CircleJoinDialog';
import { toast } from 'sonner';

export default function CirclesPage() {
  const [fingerprint, setFingerprint] = useState<string | null>(null);
  const [circles, setCircles] = useState<CircleSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  async function load(fp: string) {
    const res = await fetch(`/api/circles?fingerprint=${encodeURIComponent(fp)}`, {
      cache: 'no-store',
    });
    if (!res.ok) throw new Error('circles failed');
    const data = await res.json() as { circles: CircleSummary[] };
    setCircles(data.circles);
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const fp = await getFingerprint();
        if (cancelled) return;
        setFingerprint(fp);
        await load(fp);
      } catch (err) {
        console.error(err);
        toast.error('Could not load your circles.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function create(name: string, description: string) {
    if (!fingerprint) return;
    setBusy(true);
    try {
      const res = await fetch('/api/circles', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ fingerprint, name, description }),
      });
      if (!res.ok) throw new Error('create failed');
      await load(fingerprint);
      toast.success('Circle created.');
    } catch (err) {
      console.error(err);
      toast.error('Could not create that circle.');
    } finally {
      setBusy(false);
    }
  }

  async function join(inviteCode: string) {
    if (!fingerprint) return;
    setBusy(true);
    try {
      const res = await fetch('/api/circles/join', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ fingerprint, inviteCode }),
      });
      if (!res.ok) throw new Error('join failed');
      await load(fingerprint);
      toast.success('Joined circle.');
    } catch (err) {
      console.error(err);
      toast.error('Invite code not found.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="aurora-bg min-h-dvh px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Circles</p>
            <h1 className="mt-2 font-serif text-5xl leading-tight tracking-tight">
              Private dream groups.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Create invite-only spaces where dreams can be shared with a few people, not the whole gallery.
            </p>
          </div>
          <div className="flex gap-2">
            <CircleJoinDialog busy={busy} onJoin={join} />
            <CircleCreateDialog busy={busy} onCreate={create} />
          </div>
        </header>

        {loading ? (
          <div className="grid min-h-[40vh] place-items-center text-muted-foreground">
            <span className="inline-flex items-center gap-3">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading circles...
            </span>
          </div>
        ) : circles.length === 0 ? (
          <section className="surface-glass rounded-2xl p-8 text-center">
            <UsersRound className="mx-auto h-8 w-8 text-muted-foreground" />
            <h2 className="mt-4 font-serif text-3xl tracking-tight">No circles yet</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Make one for close friends, a writing group, or anyone you trust with the strange little movies your mind makes at night.
            </p>
            <Link href="/capture" className="mt-6 inline-flex rounded-full border border-border px-5 py-3 text-sm text-muted-foreground hover:text-foreground">
              Capture a dream first
            </Link>
          </section>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {circles.map(circle => (
              <CircleCard key={circle.id} circle={circle} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
