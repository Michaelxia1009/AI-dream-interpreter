'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { useDream } from '@/lib/state';
import { InterpretChat } from '@/components/InterpretChat';
import { PageShell, PageHeader, Button } from '@/components/ui';
import { getFingerprint } from '@/lib/fingerprint';

/**
 * `/interpret` — open-ended chat over a dream.
 *
 * Two ways the dream gets loaded:
 *   1) Default: the in-session `enrichedDream` from `useDream()`. This is
 *      the immediate-post-generation path.
 *   2) `?id=<dreamId>`: fetch the persisted enrichedDream from
 *      `/api/dream/[id]/enriched` (owner-only, fingerprint-gated). This
 *      powers "Interpret" CTAs on /journal and /profile dream cards.
 *
 * The chat is otherwise client-only; the API stays stateless.
 */
export default function InterpretPage() {
  return (
    <Suspense fallback={<InterpretShell loading />}>
      <InterpretPageInner />
    </Suspense>
  );
}

function InterpretPageInner() {
  const searchParams = useSearchParams();
  const requestedId = searchParams.get('id');
  const { session, update } = useDream();
  const [dream, setDream] = useState<string>(session.enrichedDream ?? '');
  const [loading, setLoading] = useState<boolean>(Boolean(requestedId));

  useEffect(() => {
    if (!requestedId) {
      // Default path — use whatever's in session.
      setDream(session.enrichedDream ?? '');
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const fp = await getFingerprint();
        const res = await fetch(`/api/dream/${requestedId}/enriched`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ fingerprint: fp }),
        });
        if (cancelled) return;
        if (res.ok) {
          const data = (await res.json()) as { enrichedDream: string };
          setDream(data.enrichedDream);
          update({ enrichedDream: data.enrichedDream });
        } else if (res.status === 403) {
          toast.error('You can only interpret your own dreams.');
          setDream('');
        } else if (res.status === 404) {
          toast.error(
            "This dream's text isn't saved — older dreams (made before " +
              'interpret support shipped) can\'t be reopened here.',
          );
          setDream('');
        } else {
          toast.error('Could not load that dream. Try again.');
          setDream('');
        }
      } catch (err) {
        if (!cancelled) {
          console.error(err);
          toast.error('Could not load that dream. Try again.');
          setDream('');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedId]);

  return <InterpretShell loading={loading} dream={dream} />;
}

function InterpretShell({ loading, dream }: { loading: boolean; dream?: string }) {
  return (
    <PageShell width="narrow">
      <PageHeader
        eyebrow="Interpret"
        title={<>Read your dream <span className="aurora-text">closely.</span></>}
        subtitle="Three lenses, three voices. Pick one or weave between them — your dream is the only ground truth."
        className="mb-8"
      />

      {loading ? (
        <div className="rounded-3xl border border-border/40 bg-card/30 p-8 text-center text-sm text-muted-foreground">
          Loading dream…
        </div>
      ) : (
        <InterpretChat dream={dream ?? ''} />
      )}

      <div className="mt-10 flex flex-wrap items-center gap-3 text-sm">
        <Button variant="secondary" size="sm" as="link" href="/capture">
          &larr; New dream
        </Button>
        <Button variant="secondary" size="sm" as="link" href="/leaderboard">
          Gallery &rarr;
        </Button>
      </div>
    </PageShell>
  );
}
