import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { Sparkles } from 'lucide-react';
import { getDream } from '@/lib/dreams/repo';
import { ReportCard } from '@/components/ReportCard';
import { VideoPlayer } from '@/components/VideoPlayer';
import { Carousel } from '@/components/Carousel';
import { ShareButton } from '@/components/ShareButton';
import type { ScoreResult } from '@/lib/state';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

interface Params { params: Promise<{ id: string }> }

async function loadPublicDream(id: string) {
  const dream = await getDream(id);
  if (!dream || !dream.isPublic) return null;
  return dream;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const dream = await loadPublicDream(id);
  if (!dream) {
    return {
      title: 'Dream not found · Dreamweaver',
      description: 'This dream is no longer available.',
    };
  }
  const title = `${dream.handle} dreamed: ${dream.blurb}`;
  const description = `${dream.blurb} · Weirdness ${dream.metrics.weirdness.score}/10 · Made with Dreamweaver`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

async function buildShareUrl(id: string): Promise<string> {
  const h = await headers();
  const proto = h.get('x-forwarded-proto') ?? 'https';
  const host = h.get('host') ?? 'dreamweaver.app';
  return `${proto}://${host}/d/${id}`;
}

export default async function PublicDreamPage({ params }: Params) {
  const { id } = await params;
  const dream = await loadPublicDream(id);
  if (!dream) notFound();

  const shareUrl = await buildShareUrl(id);

  // Build a ScoreResult-shaped object the existing ReportCard expects.
  const score: ScoreResult = {
    metrics: dream.metrics,
    matchedStyleIds: [],
    blurb: dream.blurb,
    moderation: dream.moderation,
  };

  return (
    <main className="aurora-bg flex min-h-dvh flex-col gap-4 px-4 py-6">
      {/* Byline */}
      <header className="flex items-center justify-between text-xs">
        <Link href="/" className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/30 px-3 py-1 uppercase tracking-[0.18em] text-muted-foreground backdrop-blur">
          ✦ Dreamweaver
        </Link>
        <Link
          href="/leaderboard"
          className="rounded-full border border-border/60 bg-background/30 px-3 py-1 text-muted-foreground backdrop-blur transition hover:text-foreground"
        >
          🏆 Leaderboard
        </Link>
      </header>

      {/* Media frame */}
      <div className="relative">
        <div className="media-halo overflow-hidden rounded-3xl">
          {dream.generation.kind === 'video' ? (
            <div className="aspect-[9/16] w-full sm:aspect-video">
              <VideoPlayer src={dream.generation.videoUrl} />
            </div>
          ) : (
            <div className="aspect-[9/16] w-full sm:aspect-video">
              <Carousel urls={dream.generation.imageUrls} />
            </div>
          )}
        </div>
        {/* Watermark */}
        <div className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-background/60 px-2.5 py-1 text-[10px] font-medium tracking-[0.15em] text-foreground/80 backdrop-blur">
          <Sparkles className="h-3 w-3" />
          <span>DREAMWEAVER</span>
        </div>
      </div>

      {/* Byline + blurb */}
      <section className="rounded-3xl border border-border/40 bg-card/40 px-4 py-3 backdrop-blur">
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          {dream.handle} · {dream.styleName}
        </div>
        <p className="mt-1 font-serif text-lg leading-snug">
          “{dream.blurb}”
        </p>
      </section>

      {/* Report card */}
      <ReportCard score={score} />

      {/* CTAs */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <ShareButton
          url={shareUrl}
          title={`${dream.handle} dreamed something wild ✦`}
          text={dream.blurb}
          className="aurora-cta flex-1 inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold tracking-wide"
          label="Share this dream"
        />
        <Link
          href="/"
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-border bg-card/60 px-5 py-3 text-sm font-medium text-muted-foreground transition hover:text-foreground hover:border-ring/60"
        >
          Make your own dream →
        </Link>
      </div>

      <footer className="pb-2 pt-2 text-center text-[11px] text-muted-foreground/70">
        Top dreams refresh every Monday at 00:00 UTC.
      </footer>
    </main>
  );
}
