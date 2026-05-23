'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FormatCard } from '@/components/FormatCard';
import { PageShell, PageHeader } from '@/components/ui';
import { useDream } from '@/lib/state';
import { getFingerprint } from '@/lib/fingerprint';

export default function FormatPage() {
  const router = useRouter();
  const { session, isHydrated, update } = useDream();
  const [remaining, setRemaining] = useState<number | null>(null);
  const [limit, setLimit] = useState<number | null>(null);

  useEffect(() => {
    if (!isHydrated) return;
    if (!session.enrichedDream) { router.replace('/capture'); return; }
    (async () => {
      const fp = await getFingerprint();
      const res = await fetch(`/api/quota?fp=${encodeURIComponent(fp)}`);
      if (res.ok) {
        const d = await res.json();
        setRemaining(d.remaining);
        setLimit(d.limit);
      }
    })();
  }, [session.enrichedDream, isHydrated, router]);

  function pick(format: 'video' | 'carousel') {
    update({ format });
    router.push('/style');
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="Format"
        title="Pick a format"
        subtitle={
          remaining !== null
            ? `${remaining} of ${limit ?? 5} generations left today`
            : 'Checking your quota...'
        }
      />
      <div className="mt-8 grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
        <FormatCard
          icon="&#127916;"
          title="9s Cinematic Video"
          description="A short cinematic scene, narrated in a voice matched to your style."
          onSelect={() => pick('video')}
        />
        <FormatCard
          icon="&#128444;"
          title="5-Image Dream Series"
          description="Five dreamlike stills that unfold like a visual sequence."
          onSelect={() => pick('carousel')}
        />
      </div>
    </PageShell>
  );
}
