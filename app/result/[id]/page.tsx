'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { VideoPlayer } from '@/components/VideoPlayer';
import { Carousel } from '@/components/Carousel';
import { ReportCard } from '@/components/ReportCard';
import { useDream } from '@/lib/state';
import { muxVideoWithAudio } from '@/lib/mux/clientMux';
import { toast } from 'sonner';

export default function ResultPage() {
  const router = useRouter();
  const { session, reset } = useDream();
  const [muxedUrl, setMuxedUrl] = useState<string | null>(null);
  const [muxing, setMuxing] = useState(false);

  useEffect(() => {
    const gen = session.generation;
    if (!gen || !session.score) { router.replace('/'); return; }
    if (gen.kind === 'video') {
      setMuxing(true);
      (async () => {
        try {
          const blob = await muxVideoWithAudio(gen.videoUrl, gen.audioUrl);
          setMuxedUrl(URL.createObjectURL(blob));
        } catch (err) {
          console.error(err);
          toast.error('Could not combine video and audio. Downloading silent version.');
          setMuxedUrl(gen.videoUrl);
        } finally { setMuxing(false); }
      })();
    }
  }, [session.generation, session.score, router]);

  if (!session.generation || !session.score) return null;

  async function download() {
    const gen = session.generation;
    if (!gen) return;
    const a = document.createElement('a');
    if (gen.kind === 'video') {
      a.href = muxedUrl ?? gen.videoUrl;
      a.download = `dream-${gen.id}.mp4`;
    } else {
      a.href = gen.zipUrl;
      a.download = `dream-${gen.id}.zip`;
    }
    a.click();
  }

  function newDream() { reset(); router.push('/'); }

  return (
    <main className="flex h-dvh flex-col gap-4 px-4 py-6 overflow-hidden">
      {/* Media — constrained to fit with everything else on screen */}
      <div className="flex-1 min-h-0">
        {session.generation.kind === 'video' ? (
          muxing ? (
            <div className="h-full animate-pulse rounded-2xl bg-zinc-900" />
          ) : (
            <VideoPlayer src={muxedUrl ?? session.generation.videoUrl} />
          )
        ) : (
          <Carousel urls={session.generation.imageUrls} />
        )}
      </div>

      {/* Report card — compact */}
      <ReportCard score={session.score} />

      {/* Actions */}
      <div className="flex gap-3 shrink-0">
        <button
          onClick={download}
          disabled={muxing}
          className="flex-1 rounded-full bg-white px-5 py-3 text-sm font-medium text-black disabled:opacity-50"
        >
          Download
        </button>
        <button
          onClick={newDream}
          className="flex-1 rounded-full border border-zinc-700 px-5 py-3 text-sm font-medium"
        >
          + New Dream
        </button>
      </div>
    </main>
  );
}
