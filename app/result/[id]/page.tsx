'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Download, Sparkles, UsersRound } from 'lucide-react';
import { VideoPlayer } from '@/components/VideoPlayer';
import { Carousel } from '@/components/Carousel';
import { ReportCard } from '@/components/ReportCard';
import { ShareButton } from '@/components/ShareButton';
import { PrivacyToggle } from '@/components/PrivacyToggle';
import { HandleEditor } from '@/components/HandleEditor';
import { useDream } from '@/lib/state';
import { muxVideoWithAudio } from '@/lib/mux/clientMux';
import { toast } from 'sonner';
import { PageShell, GlassPanel, Button } from '@/components/ui';

export default function ResultPage() {
  const router = useRouter();
  const { session, isHydrated, update, reset } = useDream();
  const [muxedUrl, setMuxedUrl] = useState<string | null>(null);
  const [muxFallbackAudioUrl, setMuxFallbackAudioUrl] = useState<string | null>(null);
  const [muxing, setMuxing] = useState(false);

  useEffect(() => {
    if (!isHydrated) return;
    const gen = session.generation;
    if (!gen || !session.score) { router.replace('/'); return; }
    if (gen.kind === 'video') {
      (async () => {
        setMuxing(true);
        try {
          const blob = await muxVideoWithAudio(gen.videoUrl, gen.audioUrl);
          setMuxedUrl(URL.createObjectURL(blob));
          setMuxFallbackAudioUrl(null);
        } catch (err) {
          console.error(err);
          setMuxedUrl(gen.videoUrl);
          setMuxFallbackAudioUrl(gen.audioUrl);
          toast.warning('Playing narration separately for this video.');
        } finally { setMuxing(false); }
      })();
    }
  }, [isHydrated, session.generation, session.score, router]);

  const dreamId = session.generation?.id ?? '';
  const moderated = session.score?.moderation && !session.score.moderation.ok;
  const shareUrl = useMemo(() => {
    if (!dreamId || typeof window === 'undefined') return '';
    return `${window.location.origin}/d/${dreamId}`;
  }, [dreamId]);

  if (!session.generation || !session.score) return null;

  async function download() {
    const gen = session.generation;
    if (!gen) return;
    if (gen.kind === 'video') {
      triggerDownload(muxedUrl ?? gen.videoUrl, `dream-${gen.id}.mp4`);
      if (muxFallbackAudioUrl) {
        triggerDownload(muxFallbackAudioUrl, `dream-${gen.id}-narration.mp3`);
        toast.success('Saved video and narration separately.');
        return;
      }
    } else {
      triggerDownload(gen.zipUrl, `dream-${gen.id}.zip`);
    }
    toast.success('Saved! Ready to share ✨');
  }

  function newDream() { reset(); router.push('/'); }

  const canShare = session.isPublic && !moderated;

  return (
    <PageShell topPadClassName="pt-6">
      {/* Media frame — gradient halo */}
      <div className="relative">
        <div className="media-halo overflow-hidden rounded-3xl">
          <div className="aspect-[9/16] w-full sm:aspect-video">
            {session.generation.kind === 'video' ? (
              muxing ? (
                <div className="h-full w-full animate-pulse bg-card" />
              ) : (
                <VideoPlayer
                  src={muxedUrl ?? session.generation.videoUrl}
                  audioSrc={muxFallbackAudioUrl ?? undefined}
                />
              )
            ) : (
              <Carousel urls={session.generation.imageUrls} />
            )}
          </div>
        </div>
        {/* Watermark */}
        <div className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-background/60 px-2.5 py-1 text-[10px] font-medium tracking-[0.15em] text-foreground/80 backdrop-blur">
          <Sparkles className="h-3 w-3" />
          <span>DREAMWEAVER</span>
        </div>
      </div>

      {/* Privacy + handle row */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <PrivacyToggle
          dreamId={dreamId}
          isPublic={session.isPublic}
          moderated={moderated}
          onChange={next => update({ isPublic: next })}
        />
        {session.handle && (
          <HandleEditor
            dreamId={dreamId}
            handle={session.handle}
            onChange={next => update({ handle: next })}
            disabled={!session.isPublic}
          />
        )}
      </div>

      {/* Share-link preview */}
      {canShare && shareUrl && (
        <div className="mt-3 flex items-center gap-2 truncate rounded-2xl border border-border/40 bg-card/30 px-3 py-2 text-[12px] text-muted-foreground">
          <span className="shrink-0">Public link:</span>
          <a
            href={shareUrl}
            target="_blank"
            rel="noopener"
            className="truncate text-foreground/85 underline-offset-4 hover:underline"
          >
            {shareUrl.replace(/^https?:\/\//, '')}
          </a>
        </div>
      )}

      {/* Report card */}
      <div className="mt-3">
        <ReportCard score={session.score} />
      </div>

      {/* Actions */}
      <div className="mt-3 flex gap-3">
        <Button
          onClick={download}
          disabled={muxing}
          size="lg"
          className="flex-1 py-4"
        >
          <Download className="h-4 w-4" />
          Save & Share
        </Button>
        <ShareButton
          url={canShare ? shareUrl : ''}
          title="My dream, visualised ✦"
          text="I turned my dream into a cinematic short. Made with Dreamweaver."
          iconOnly
          disabled={!canShare || muxing || !shareUrl}
          label="Share dream link"
        />
        <Button
          variant="secondary"
          size="lg"
          onClick={newDream}
          className="py-4"
        >
          + New
        </Button>
      </div>

      {/* Soft secondary CTA — chat with the dream you just made. */}
      {session.enrichedDream && (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <GlassPanel as={Link} href="/interpret" size="sm" className="flex items-center justify-between gap-3 transition hover:border-ring/60">
            <span className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent" aria-hidden />
              <span className="font-medium">Interpret this dream</span>
            </span>
            <span className="text-muted-foreground">→</span>
          </GlassPanel>
          <GlassPanel as={Link} href="/circles" size="sm" className="flex items-center justify-between gap-3 transition hover:border-ring/60">
            <span className="flex items-center gap-2">
              <UsersRound className="h-4 w-4 text-accent" aria-hidden />
              <span className="font-medium">Share to a circle</span>
            </span>
            <span className="text-muted-foreground">→</span>
          </GlassPanel>
        </div>
      )}
    </PageShell>
  );
}

function triggerDownload(href: string, filename: string) {
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  a.click();
}
