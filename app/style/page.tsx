'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { StyleCard } from '@/components/StyleCard';
import { STYLES, getStyleById } from '@/lib/styles';
import { useDream } from '@/lib/state';
import { toast } from 'sonner';

export default function StylePage() {
  const router = useRouter();
  const { session, update } = useDream();
  const [ids, setIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session.enrichedDream || !session.format) { router.replace('/capture'); return; }
    (async () => {
      setLoading(true);
      try {
        if (!session.score) {
          const res = await fetch('/api/score', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ enrichedDream: session.enrichedDream }),
          });
          if (!res.ok) throw new Error('score failed');
          const data = await res.json();
          update({ score: data });
          setIds(data.matchedStyleIds);
        } else {
          setIds(session.score.matchedStyleIds);
        }
      } catch (err) {
        console.error(err);
        toast.error('Could not match styles. Showing defaults.');
        setIds(STYLES.slice(0, 3).map(s => s.id));
      } finally {
        setLoading(false);
      }
    })();
  }, [session.enrichedDream, session.format, session.score, router, update]);

  async function shuffle() {
    setLoading(true);
    try {
      const res = await fetch('/api/styles/alternates', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ enrichedDream: session.enrichedDream, exclude: ids }),
      });
      const data = await res.json();
      setIds(data.matchedStyleIds);
    } catch { toast.error('Shuffle failed.'); }
    finally { setLoading(false); }
  }

  function pick(id: string) {
    update({ styleId: id });
    router.push('/generate');
  }

  const styles = ids.map(id => getStyleById(id)!).filter(Boolean);

  return (
    <main className="aurora-bg flex min-h-dvh flex-col px-6 py-10">
      <h1 className="font-serif text-3xl">Pick a style</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        We picked 3 that fit your dream. Tap one.
      </p>
      <div className="mt-8 flex flex-col gap-3">
        {loading
          ? [1, 2, 3].map(i => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-card" />
            ))
          : styles.map(s => (
              <StyleCard key={s.id} style={s} showNarrator={session.format === 'video'} onSelect={() => pick(s.id)} />
            ))}
      </div>
      <button
        onClick={shuffle}
        disabled={loading}
        className="mt-6 self-center text-sm text-muted-foreground underline-offset-4 hover:underline disabled:opacity-50"
      >
        Show different styles
      </button>
    </main>
  );
}
