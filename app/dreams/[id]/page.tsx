'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CalendarDays, Loader2, Lock, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { DreamGenerationViewer } from '@/components/DreamGenerationViewer';
import { InterpretChat } from '@/components/InterpretChat';
import { ReportCard } from '@/components/ReportCard';
import { getFingerprint } from '@/lib/fingerprint';
import type { ScoreResult } from '@/lib/state';
import {
  cacheDreamDetailPreview,
  readCachedDreamDetail,
  type CachedDreamDetail,
} from '@/lib/dreams/detail-cache';
import { PageShell, GlassPanel, Button } from '@/components/ui';

type DreamType = 'normal' | 'nightmare' | 'recurring' | 'prophetic';

type DreamDetail = CachedDreamDetail & {
  id: string;
  createdAt: number;
  format: 'video' | 'carousel';
  styleId?: string;
  styleName: string;
  blurb: string;
  dreamText: string;
  dreamType: DreamType;
  symbols: string[];
  generation:
    | { kind: 'carousel'; imageUrls: string[]; zipUrl?: string }
    | { kind: 'video'; videoUrl: string; audioUrl: string; narrationText?: string };
  metrics: ScoreResult['metrics'];
  moderation: ScoreResult['moderation'];
  isPublic: boolean;
  handle: string;
};

function formatDate(ms: number): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(ms));
}

function formatLabel(format: 'video' | 'carousel'): string {
  return format === 'carousel' ? 'image series' : 'video';
}

export default function DreamDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const dreamId = params.id;
  const [dream, setDream] = useState<DreamDetail | null>(() => readCachedDreamDetail(dreamId));
  const [loading, setLoading] = useState(() => !readCachedDreamDetail(dreamId));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const fingerprint = await getFingerprint();
        if (cancelled) return;
        const res = await fetch(`/api/dreams/${encodeURIComponent(dreamId)}?fingerprint=${encodeURIComponent(fingerprint)}`, {
          cache: 'no-store',
        });
        if (!res.ok) throw new Error(res.status === 404 ? 'Dream not found.' : 'Could not load this dream.');
        const data = await res.json() as { dream: DreamDetail };
        if (!cancelled) {
          setDream(data.dream);
          cacheDreamDetailPreview(data.dream);
        }
      } catch (err) {
        console.error(err);
        toast.error(err instanceof Error ? err.message : 'Could not load this dream.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dreamId]);

  if (loading) {
    return (
      <PageShell>
        <div className="grid flex-1 place-items-center">
          <span className="inline-flex items-center gap-3 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Opening dream...
          </span>
        </div>
      </PageShell>
    );
  }

  if (!dream) {
    return (
      <PageShell>
        <div className="grid flex-1 place-items-center text-center">
          <div>
            <h1 className="text-h1">Dream unavailable</h1>
            <Button as="link" href="/journal" size="lg" className="mt-5">
              Back to journal
            </Button>
          </div>
        </div>
      </PageShell>
    );
  }

  const score: ScoreResult = {
    metrics: dream.metrics,
    matchedStyleIds: [],
    blurb: dream.blurb,
    moderation: dream.moderation,
  };

  return (
    <PageShell topPadClassName="pt-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Button type="button" variant="secondary" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {!dream.isPublic && <Lock className="h-3.5 w-3.5" />}
          <span>{dream.isPublic ? 'Public dream' : 'Private dream'}</span>
        </div>
      </div>

      <div className="relative">
        <div className="media-halo overflow-hidden rounded-3xl">
          <div className="aspect-[9/16] w-full sm:aspect-video">
            <DreamGenerationViewer generation={dream.generation} />
          </div>
        </div>
        <div className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-background/60 px-2.5 py-1 text-[10px] font-medium tracking-[0.15em] text-foreground/80 backdrop-blur">
          <Sparkles className="h-3 w-3" />
          <span>DREAMWEAVER</span>
        </div>
      </div>

      <GlassPanel radius="3xl" size="sm" className="mt-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" />
            {formatDate(dream.createdAt)}
          </span>
          <span>{dream.styleName}</span>
          <span>{formatLabel(dream.format)}</span>
        </div>
        <p className="mt-2 font-serif text-lg leading-snug">
          &ldquo;{dream.blurb}&rdquo;
        </p>
        {dream.symbols.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {dream.symbols.map(symbol => (
              <span key={symbol} className="rounded-full bg-secondary px-2 py-1 text-[11px] text-muted-foreground">
                {symbol}
              </span>
            ))}
          </div>
        )}
      </GlassPanel>

      <div className="mt-4">
        <ReportCard score={score} />
      </div>

      <section className="mt-10">
        <div className="mb-5">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Interpret</p>
          <h2 className="mt-2 text-h2">Ask about this dream</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            A private reading space for the symbols, feelings, and story preserved in this archive.
          </p>
        </div>
        <InterpretChat key={dream.id} dream={dream.dreamText || dream.blurb} />
      </section>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <Button as="link" href="/journal" variant="secondary" size="lg" className="flex-1">
          Journal
        </Button>
        <Button as="link" href="/profile" variant="secondary" size="lg" className="flex-1">
          Profile archive
        </Button>
        {dream.isPublic && (
          <Button as="link" href={`/d/${dream.id}`} size="lg" className="flex-1">
            Public share page
          </Button>
        )}
      </div>
    </PageShell>
  );
}
