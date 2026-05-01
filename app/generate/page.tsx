'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingScene } from '@/components/LoadingScene';
import { PageShell } from '@/components/ui';
import { useDream, type GenerationResult } from '@/lib/state';
import { getFingerprint } from '@/lib/fingerprint';
import { toast } from 'sonner';

export default function GeneratePage() {
  const router = useRouter();
  const { session, isHydrated, update } = useDream();
  const started = useRef(false);

  useEffect(() => {
    if (!isHydrated) return;
    if (started.current) return;
    started.current = true;

    if (!session.enrichedDream || !session.format || !session.styleId || !session.score) {
      router.replace('/capture');
      return;
    }

    (async () => {
      try {
        const fp = await getFingerprint();
        const endpoint = session.format === 'video'
          ? '/api/generate/video'
          : '/api/generate/carousel';
        // Send the score so the server can persist the dream record + index into leaderboards.
        // `symbols` is optional — when present it powers /patterns symbol-cloud aggregation.
        const score = session.score && {
          metrics: session.score.metrics,
          blurb: session.score.blurb,
          moderation: session.score.moderation,
          symbols: session.score.symbols,
        };
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            enrichedDream: session.enrichedDream,
            styleId: session.styleId,
            fingerprint: fp,
            score,
            isPublic: session.isPublic,
          }),
        });
        if (res.status === 429) {
          router.replace('/rate-limited');
          return;
        }
        if (!res.ok) throw new Error('generation failed');
        const data: GenerationResult & { isPublic?: boolean; handle?: string | null } =
          await res.json();
        // Pull off the persistence-side fields, keep just the GenerationResult shape in state.
        const { isPublic, handle, ...gen } = data;
        update({
          generation: gen as GenerationResult,
          ...(typeof isPublic === 'boolean' ? { isPublic } : {}),
          ...(typeof handle === 'string' ? { handle } : {}),
        });
        router.replace(`/result/${data.id}`);
      } catch (err) {
        console.error(err);
        toast.error('The dream escaped us. Try again?');
        router.replace('/style');
      }
    })();
  }, [session, isHydrated, router, update]);

  return (
    <PageShell>
      <LoadingScene />
    </PageShell>
  );
}
