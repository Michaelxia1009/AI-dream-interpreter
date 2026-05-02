'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingScene } from '@/components/LoadingScene';
import { PageShell } from '@/components/ui';
import { useDream, type GenerationResult } from '@/lib/state';
import { getFingerprint } from '@/lib/fingerprint';
import { toast } from 'sonner';

async function readGenerationError(res: Response): Promise<string> {
  const fallback = `generation failed (${res.status})`;
  const contentType = res.headers.get('content-type') ?? '';

  try {
    if (contentType.includes('application/json')) {
      const payload = await res.json() as {
        detail?: unknown;
        error?: unknown;
        message?: unknown;
      };
      const detail = payload.detail ?? payload.message ?? payload.error;
      return typeof detail === 'string' && detail.trim() ? detail : fallback;
    }

    const text = await res.text();
    if (res.status === 504 || text.includes('FUNCTION_INVOCATION_TIMEOUT')) {
      return 'generation timed out before the server finished';
    }
    return text.trim().slice(0, 180) || fallback;
  } catch {
    return fallback;
  }
}

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
        if (!res.ok) throw new Error(await readGenerationError(res));
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
        const detail = err instanceof Error ? err.message : '';
        toast.error(detail ? `The dream escaped us: ${detail}` : 'The dream escaped us. Try again?');
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
