'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, Share2, Sparkles } from 'lucide-react';
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
    toast.success('Saved! Ready to share ✨');
  }

  async function share() {
    const gen = session.generation;
    if (!gen) return;
    const url = gen.kind === 'video' ? (muxedUrl ?? gen.videoUrl) : gen.zipUrl;
    try {
      if (navigator.share && navigator.canShare?.({ url })) {
        await navigator.share({
          title: 'My Dream, visualized ✦',
          text: 'I turned my dream into a cinematic short. Made with Dreamweaver.',
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard');
      }
    } catch {
      // user cancelled share — no-op
    }
  }

  function newDream() { reset(); router.push('/'); }

  return (
    <main className="aurora-bg flex h-dvh flex-col gap-4 px-4 py-6 overflow-hidden">
      {/* Media frame — gradient halo */}
      <div className="flex-1 min-h-0 relative">
        <div className="media-halo h-full w-full rounded-3xl overflow-hidden">
          {session.generation.kind === 'video' ? (
            muxing ? (
              <div className="h-full w-full animate-pulse bg-card" />
            ) : (
              <VideoPlayer src={muxedUrl ?? session.generation.videoUrl} />
            )
          ) : (
            <Carousel urls={session.generation.imageUrls} />
          )}
        </div>
        {/* Watermark */}
        <div className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-background/60 px-2.5 py-1 text-[10px] font-medium tracking-[0.15em] text-foreground/80 backdrop-blur">
          <Sparkles className="h-3 w-3" />
          <span>DREAMWEAVER</span>
        </div>
      </div>

      {/* Report card — promoted to hero */}
      <ReportCard score={session.score} />

      {/* Actions */}
      <div className="flex gap-3 shrink-0">
        <button
          onClick={download}
          disabled={muxing}
          className="aurora-cta flex-1 rounded-full px-5 py-4 text-sm font-semibold tracking-wide disabled:cursor-not-allowed"
        >
          <span className="inline-flex items-center justify-center gap-2">
            <Download className="h-4 w-4" />
            Save & Share
          </span>
        </button>
        <button
          onClick={share}
          aria-label="Copy share link"
          className="rounded-full border border-border bg-card p-4 text-muted-foreground transition hover:text-foreground hover:border-ring/60"
        >
          <Share2 className="h-5 w-5" />
        </button>
        <button
          onClick={newDream}
          className="rounded-full border border-border px-5 py-4 text-sm font-medium text-muted-foreground transition hover:text-foreground hover:border-ring/60"
        >
          + New
        </button>
      </div>
    </main>
  );
}
