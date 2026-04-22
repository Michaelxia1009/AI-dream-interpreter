'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FormatCard } from '@/components/FormatCard';
import { useDream } from '@/lib/state';
import { getFingerprint } from '@/lib/fingerprint';

export default function FormatPage() {
  const router = useRouter();
  const { session, update } = useDream();
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!session.enrichedDream) { router.replace('/capture'); return; }
    (async () => {
      const fp = await getFingerprint();
      const res = await fetch(`/api/quota?fp=${encodeURIComponent(fp)}`);
      if (res.ok) { const d = await res.json(); setRemaining(d.remaining); }
    })();
  }, [session.enrichedDream, router]);

  function pick(format: 'video' | 'carousel') {
    update({ format });
    router.push('/style');
  }

  return (
    <main className="flex min-h-dvh flex-col px-6 py-10">
      <h1 className="font-serif text-3xl">Pick a format</h1>
      <p className="mt-2 text-sm text-zinc-400">
        {remaining !== null ? `${remaining} of 3 dreams left today` : 'Checking your quota...'}
      </p>
      <div className="mt-8 grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
        <FormatCard
          icon="&#127916;"
          title="10s Narrated Video"
          description="A short cinematic scene, narrated in a voice matched to your style."
          onSelect={() => pick('video')}
        />
        <FormatCard
          icon="&#128444;"
          title="Image Carousel"
          description="A sequence of dreamlike images to swipe through."
          onSelect={() => pick('carousel')}
        />
      </div>
    </main>
  );
}
