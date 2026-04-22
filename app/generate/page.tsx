'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingScene } from '@/components/LoadingScene';
import { useDream, type GenerationResult } from '@/lib/state';
import { getFingerprint } from '@/lib/fingerprint';
import { toast } from 'sonner';

export default function GeneratePage() {
  const router = useRouter();
  const { session, update } = useDream();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    if (!session.enrichedDream || !session.format || !session.styleId) {
      router.replace('/capture');
      return;
    }

    (async () => {
      try {
        const fp = await getFingerprint();
        const endpoint = session.format === 'video'
          ? '/api/generate/video'
          : '/api/generate/carousel';
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            enrichedDream: session.enrichedDream,
            styleId: session.styleId,
            fingerprint: fp,
          }),
        });
        if (res.status === 429) {
          router.replace('/rate-limited');
          return;
        }
        if (!res.ok) throw new Error('generation failed');
        const data: GenerationResult = await res.json();
        update({ generation: data });
        router.replace(`/result/${data.id}`);
      } catch (err) {
        console.error(err);
        toast.error('The dream escaped us. Try again?');
        router.replace('/style');
      }
    })();
  }, [session, router, update]);

  return <LoadingScene />;
}
