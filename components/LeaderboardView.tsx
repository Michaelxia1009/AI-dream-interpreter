'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MetricTab } from './MetricTab';
import { LeaderboardCard } from './LeaderboardCard';
import type { LeaderboardEntry, LeaderboardMetric } from '@/lib/dreams/types';

const METRICS: { id: LeaderboardMetric; tab: string; cardLabel: string }[] = [
  { id: 'weirdness', tab: 'Weirdest',       cardLabel: 'Weird' },
  { id: 'vivid',     tab: 'Most Vivid',     cardLabel: 'Vivid' },
  { id: 'emotional', tab: 'Most Emotional', cardLabel: 'Emo'  },
];

interface InitialBoard {
  metric: LeaderboardMetric;
  isoWeek: string;
  isoWeekRange: string;
  msUntilReset: number;
  entries: LeaderboardEntry[];
}

interface Props {
  initial: InitialBoard;
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return '0s';
  const totalSec = Math.floor(ms / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function LeaderboardView({ initial }: Props) {
  const [active, setActive] = useState<LeaderboardMetric>(initial.metric);
  const [boards, setBoards] = useState<Record<LeaderboardMetric, LeaderboardEntry[]>>({
    weirdness: initial.metric === 'weirdness' ? initial.entries : [],
    vivid:     initial.metric === 'vivid'     ? initial.entries : [],
    emotional: initial.metric === 'emotional' ? initial.entries : [],
  });
  const [loaded, setLoaded] = useState<Record<LeaderboardMetric, boolean>>({
    weirdness: initial.metric === 'weirdness',
    vivid:     initial.metric === 'vivid',
    emotional: initial.metric === 'emotional',
  });
  const [resetMs, setResetMs] = useState(initial.msUntilReset);

  // Tick the countdown once a minute (no need for second-precision)
  useEffect(() => {
    const start = Date.now();
    const baseRemaining = initial.msUntilReset;
    const t = setInterval(() => {
      setResetMs(Math.max(0, baseRemaining - (Date.now() - start)));
    }, 60_000);
    return () => clearInterval(t);
  }, [initial.msUntilReset]);

  // Lazy-fetch the other two boards once on mount so tab-switch is instant.
  useEffect(() => {
    METRICS.forEach(m => {
      if (loaded[m.id]) return;
      fetch(`/api/leaderboard?metric=${m.id}`)
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (!data?.entries) return;
          setBoards(b => ({ ...b, [m.id]: data.entries as LeaderboardEntry[] }));
          setLoaded(l => ({ ...l, [m.id]: true }));
        })
        .catch(() => { /* swallow */ });
    });
    // run once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const entries = boards[active];
  const metricMeta = METRICS.find(m => m.id === active)!;

  return (
    <main className="aurora-bg min-h-dvh px-4 py-6 sm:px-6">
      {/* Header */}
      <header className="mx-auto flex max-w-2xl flex-col gap-3">
        <div className="flex items-center justify-between text-xs">
          <Link href="/" className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/30 px-3 py-1 uppercase tracking-[0.18em] text-muted-foreground backdrop-blur">
            ← ✦ Dreamweaver
          </Link>
          <span className="text-muted-foreground">↻ Resets in {formatCountdown(resetMs)}</span>
        </div>

        <h1 className="font-serif text-4xl leading-tight tracking-tight sm:text-5xl">
          Top dreams · <span className="aurora-text">this week</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          {initial.isoWeekRange} (UTC) — refreshed live as new dreams are scored.
        </p>

        {/* Metric tabs */}
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {METRICS.map(m => (
            <MetricTab
              key={m.id}
              id={m.id}
              label={m.tab}
              active={m.id === active}
              onSelect={setActive}
            />
          ))}
        </div>
      </header>

      {/* List */}
      <section className="mx-auto mt-5 flex max-w-2xl flex-col gap-2">
        {entries.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border/60 bg-card/30 px-6 py-10 text-center">
            <p className="font-serif text-xl">Nothing here yet.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Be the first dreamer this week →
            </p>
            <Link
              href="/"
              className="aurora-cta mt-4 inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold tracking-wide"
            >
              Tell us your dream &rarr;
            </Link>
          </div>
        ) : (
          entries.map(e => (
            <LeaderboardCard key={e.id} entry={e} metricLabel={metricMeta.cardLabel} />
          ))
        )}
      </section>

      <footer className="mx-auto mt-8 max-w-2xl pb-4 text-center text-[11px] text-muted-foreground/70">
        Boards reset Monday 00:00 UTC. Top 20 per category.
      </footer>
    </main>
  );
}
