import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { Sparkles } from 'lucide-react';
import { getDream } from '@/lib/dreams/repo';
import { ReportCard } from '@/components/ReportCard';
import { DreamGenerationViewer } from '@/components/DreamGenerationViewer';
import { ShareButton } from '@/components/ShareButton';
import type { ScoreResult } from '@/lib/state';
import { PageShell, GlassPanel, Button } from '@/components/ui';

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
    <PageShell chrome="share" topPadClassName="pt-6">
      {/* Byline */}
      <header className="flex items-center justify-between text-xs">
        <Button as="link" href="/" variant="secondary" size="sm" className="uppercase tracking-[0.18em]">
          ✦ Dreamweaver
        </Button>
        <Button as="link" href="/leaderboard" variant="secondary" size="sm">
          🏆 Leaderboard
        </Button>
      </header>

      {/* Media frame */}
      <div className="relative mt-4">
        <div className="media-halo overflow-hidden rounded-3xl">
          <div className="aspect-[9/16] w-full sm:aspect-video">
            <DreamGenerationViewer generation={dream.generation} />
          </div>
        </div>
        {/* Watermark */}
        <div className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-background/60 px-2.5 py-1 text-[10px] font-medium tracking-[0.15em] text-foreground/80 backdrop-blur">
          <Sparkles className="h-3 w-3" />
          <span>DREAMWEAVER</span>
        </div>
      </div>

      {/* Byline + blurb */}
      <GlassPanel radius="3xl" size="sm" className="mt-4">
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          {dream.handle} · {dream.styleName}
        </div>
        <p className="mt-1 font-serif text-lg leading-snug">
          &ldquo;{dream.blurb}&rdquo;
        </p>
      </GlassPanel>

      {/* Report card */}
      <div className="mt-4">
        <ReportCard score={score} />
      </div>

      {/* CTAs */}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <ShareButton
          url={shareUrl}
          title={`${dream.handle} dreamed something wild ✦`}
          text={dream.blurb}
          className="aurora-cta flex-1 inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold tracking-wide"
          label="Share this dream"
        />
        <Button as="link" href="/" variant="secondary" size="lg" className="flex-1">
          Make your own dream →
        </Button>
      </div>

      <footer className="pb-2 pt-2 text-center text-[11px] text-muted-foreground/70">
        Top dreams refresh every Monday at 00:00 UTC.
      </footer>
    </PageShell>
  );
}
