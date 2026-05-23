import type { DreamRecord } from './types';

/**
 * /patterns aggregations — pure functions over a list of DreamRecords.
 *
 * Kept here (not in the API route) so they can be unit-tested without
 * Redis, and so the same functions can later power an embedded weekly-essay
 * prompt without round-tripping back through the API layer.
 */

export interface MoodSummary {
  /** Mean of `weirdness.score`, 0-10. NaN if no dreams. */
  avgWeirdness: number;
  avgImagination: number;
  avgEmotionalIntensity: number;
  avgVividness: number;
  /** Total dreams in the window. */
  count: number;
}

export interface SymbolHit {
  symbol: string;
  count: number;
}

export interface DayBin {
  /** YYYY-MM-DD in UTC. */
  date: string;
  count: number;
  /** Average weirdness for that day's dreams (NaN if 0). Used to color the strip. */
  avgWeirdness: number;
}

export interface RecentCard {
  id: string;
  createdAt: number;
  blurb: string;
  styleName: string;
  format: 'video' | 'carousel';
  thumbnailUrl: string | null;
  videoUrl: string | null;
  dreamType: 'normal' | 'nightmare' | 'recurring' | 'prophetic';
  symbols: string[];
  weirdness: number;
}

export interface PatternsAggregation {
  windowDays: number;
  windowStartMs: number;
  windowEndMs: number;
  mood: MoodSummary;
  symbols: SymbolHit[];     // top 24, count desc, then alpha
  timeline: DayBin[];       // every day in the window, oldest → newest
  recent: RecentCard[];     // newest 8
  totalDreams: number;
}

const UTC_DAY_MS = 24 * 60 * 60 * 1000;

/** YYYY-MM-DD in UTC, no Intl dependency. */
function utcDayKey(ms: number): string {
  const d = new Date(ms);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function avg(nums: number[]): number {
  if (nums.length === 0) return Number.NaN;
  let total = 0;
  for (const n of nums) total += n;
  return total / nums.length;
}

function thumbnailFor(d: DreamRecord): string | null {
  if (d.generation.kind === 'carousel') return d.generation.imageUrls[0] ?? null;
  return null;
}

function videoUrlFor(d: DreamRecord): string | null {
  if (d.generation.kind === 'video') return d.generation.videoUrl;
  return null;
}

export function aggregatePatterns(
  dreams: DreamRecord[],
  opts: { windowDays?: number; nowMs?: number } = {},
): PatternsAggregation {
  const windowDays = Math.max(1, Math.min(90, opts.windowDays ?? 30));
  const nowMs = opts.nowMs ?? Date.now();
  const windowEndMs = nowMs;
  const windowStartMs = nowMs - windowDays * UTC_DAY_MS;

  const inWindow = dreams.filter(
    d => d.createdAt >= windowStartMs && d.createdAt <= windowEndMs,
  );

  // ── mood ────────────────────────────────────────────────────────
  const mood: MoodSummary = {
    avgWeirdness:          avg(inWindow.map(d => d.metrics.weirdness.score)),
    avgImagination:        avg(inWindow.map(d => d.metrics.imagination.score)),
    avgEmotionalIntensity: avg(inWindow.map(d => d.metrics.emotionalIntensity.score)),
    avgVividness:          avg(inWindow.map(d => d.metrics.vividness.score)),
    count: inWindow.length,
  };

  // ── symbols ─────────────────────────────────────────────────────
  const symbolCounts = new Map<string, number>();
  for (const d of inWindow) {
    if (!d.symbols) continue;
    for (const s of d.symbols) {
      symbolCounts.set(s, (symbolCounts.get(s) ?? 0) + 1);
    }
  }
  const symbols: SymbolHit[] = [...symbolCounts.entries()]
    .map(([symbol, count]) => ({ symbol, count }))
    .sort((a, b) => (b.count - a.count) || a.symbol.localeCompare(b.symbol))
    .slice(0, 24);

  // ── timeline ────────────────────────────────────────────────────
  // Pre-seed every day in the window so the strip renders gaps as zero-bars.
  const dayBuckets = new Map<string, { count: number; weirdScores: number[] }>();
  for (let t = windowStartMs; t <= windowEndMs; t += UTC_DAY_MS) {
    dayBuckets.set(utcDayKey(t), { count: 0, weirdScores: [] });
  }
  for (const d of inWindow) {
    const key = utcDayKey(d.createdAt);
    const bucket = dayBuckets.get(key);
    if (!bucket) continue;
    bucket.count += 1;
    bucket.weirdScores.push(d.metrics.weirdness.score);
  }
  const timeline: DayBin[] = [...dayBuckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, b]) => ({
      date,
      count: b.count,
      avgWeirdness: avg(b.weirdScores),
    }));

  // ── recent ──────────────────────────────────────────────────────
  const recent: RecentCard[] = [...inWindow]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 8)
    .map(d => ({
      id: d.id,
      createdAt: d.createdAt,
      blurb: d.blurb,
      styleName: d.styleName,
      format: d.format,
      thumbnailUrl: thumbnailFor(d),
      videoUrl: videoUrlFor(d),
      dreamType: d.dreamType ?? 'normal',
      symbols: d.symbols ?? [],
      weirdness: d.metrics.weirdness.score,
    }));

  return {
    windowDays,
    windowStartMs,
    windowEndMs,
    mood,
    symbols,
    timeline,
    recent,
    totalDreams: inWindow.length,
  };
}
