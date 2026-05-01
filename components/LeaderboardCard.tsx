'use client';

import Link from 'next/link';
import { Sparkles, Film } from 'lucide-react';
import type { LeaderboardEntry } from '@/lib/dreams/types';
import { GlassPanel } from '@/components/ui';

interface Props {
  entry: LeaderboardEntry;
  metricLabel: string;
}

export function LeaderboardCard({ entry, metricLabel }: Props) {
  return (
    <GlassPanel
      as={Link}
      href={`/d/${entry.id}`}
      size="sm"
      className="group flex items-center gap-3 px-3 py-2 transition hover:border-ring/60 hover:bg-card/60"
    >
      {/* Rank */}
      <div className="w-7 shrink-0 text-center font-display text-xl tabular-nums text-muted-foreground/80">
        {entry.rank}
      </div>

      {/* Thumbnail */}
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-zinc-900/60 ring-1 ring-border/50">
        {entry.thumbnailUrl ? (
          // Generated Blob URLs are final display assets.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={entry.thumbnailUrl}
            alt=""
            className="h-full w-full object-cover transition group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground/70">
            <Film className="h-5 w-5" />
          </div>
        )}
      </div>

      {/* Body */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-[13px] font-medium text-foreground">
            {entry.handle}
          </span>
          <span className="shrink-0 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            {entry.styleName}
          </span>
        </div>
        <p className="truncate font-display text-[13px] italic text-foreground/80">
          “{entry.blurb}”
        </p>
      </div>

      {/* Metric badge */}
      <div className="shrink-0 text-right">
        <div className="flex items-baseline justify-end gap-1">
          <span className="aurora-text font-display text-2xl leading-none tabular-nums">
            {entry.metricScore}
          </span>
          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            /10
          </span>
        </div>
        <div className="mt-0.5 flex items-center justify-end gap-1 text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
          <Sparkles className="h-2.5 w-2.5" />
          {metricLabel}
        </div>
      </div>
    </GlassPanel>
  );
}
