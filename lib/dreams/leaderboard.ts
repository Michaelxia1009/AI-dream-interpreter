import { getRedis } from '@/lib/redis';
import type { DreamRecord, LeaderboardMetric, LeaderboardEntry } from './types';
import { isoWeekKey } from './iso-week';
import { getDream, leaderboardKeysForDream } from './repo';

/**
 * 8-day TTL for sorted-set keys — covers a full ISO week plus a buffer day.
 * Matches `dream:{id}` so a dream and its leaderboard entries expire together.
 */
const LB_TTL_SECONDS = 8 * 24 * 60 * 60;

/** Top-20 dreams per board (display limit). */
export const LEADERBOARD_PAGE_SIZE = 20;

/**
 * Sorted-set scoring trick: store `metric*1e6 + (1e10 - createdAt/1000)` so:
 *   • higher metric scores rank first
 *   • among equal metrics, NEWER dreams rank first (deterministic tiebreak)
 *
 * The 1e6 multiplier gives plenty of headroom (max metric=10 → 10_000_000;
 * the 1e10 base for the time term is ~10x larger than current epoch seconds
 * (~1.78e9) so it never overflows the metric bucket).
 */
function computeRank(metricScore: number, createdAtMs: number): number {
  const reverseSeconds = 1e10 - Math.floor(createdAtMs / 1000);
  return metricScore * 1e6 + reverseSeconds;
}

export function leaderboardKey(metric: LeaderboardMetric, isoWeek: string): string {
  return `lb:${metric}:${isoWeek}`;
}

/**
 * Adds a dream to all three weekly boards. Idempotent — calling twice for
 * the same id silently overwrites the previous score.
 *
 * NOTE: We do NOT enforce "1 entry per fingerprint per board per week" here
 * because a single fp can legitimately publish up to 5 dreams/day (existing
 * rate limit) and each is its own entry. Leaderboard fairness is handled by
 * the rate limit (caps volume) + opt-out (lets users curate).
 */
export async function addDreamToBoards(dream: DreamRecord): Promise<void> {
  if (!dream.isPublic) return;
  if (!dream.moderation.ok) return;

  const redis = getRedis();
  const week = dream.isoWeek;

  const metrics: Array<[LeaderboardMetric, number]> = [
    ['weirdness', dream.metrics.weirdness.score],
    ['vivid',     dream.metrics.vividness.score],
    ['emotional', dream.metrics.emotionalIntensity.score],
  ];

  // Fire-and-await in parallel.
  await Promise.all(metrics.map(async ([m, score]) => {
    const key = leaderboardKey(m, week);
    const rank = computeRank(score, dream.createdAt);
    await redis.zadd(key, { score: rank, member: dream.id });
    await redis.expire(key, LB_TTL_SECONDS);
  }));
}

/**
 * Removes a dream from every leaderboard week it might have been added to.
 * Conservative: removes from the dream's recorded `isoWeek` plus any other
 * weeks the caller passes in `extraWeeks`.
 */
export async function removeDreamFromBoards(
  dreamId: string,
  weeks: string[],
): Promise<void> {
  const redis = getRedis();
  const metrics: LeaderboardMetric[] = ['weirdness', 'vivid', 'emotional'];
  const ops: Array<Promise<unknown>> = [];
  for (const w of weeks) {
    for (const m of metrics) {
      ops.push(redis.zrem(leaderboardKey(m, w), dreamId));
    }
  }
  await Promise.all(ops);
}

/**
 * Returns the top N dream IDs for a given metric in the current ISO week
 * (or a specified week). Highest rank first.
 */
export async function topDreamIds(
  metric: LeaderboardMetric,
  opts: { isoWeek?: string; limit?: number } = {},
): Promise<string[]> {
  const week = opts.isoWeek ?? isoWeekKey();
  const limit = opts.limit ?? LEADERBOARD_PAGE_SIZE;
  const redis = getRedis();
  const key = leaderboardKey(metric, week);
  const ids = await redis.zrange<string[]>(key, 0, limit - 1, { rev: true });
  return Array.isArray(ids) ? ids : [];
}

function metricScoreFor(dream: DreamRecord, metric: LeaderboardMetric): number {
  switch (metric) {
    case 'weirdness': return dream.metrics.weirdness.score;
    case 'vivid':     return dream.metrics.vividness.score;
    case 'emotional': return dream.metrics.emotionalIntensity.score;
  }
}

function thumbnailUrlFor(dream: DreamRecord): string | null {
  if (dream.generation.kind === 'carousel') {
    return dream.generation.imageUrls[0] ?? null;
  }
  // Video has no still poster yet — return null and let UI render a play-icon placeholder.
  return null;
}

/**
 * Resolves the top-N dreams for a metric into `LeaderboardEntry` cards.
 * Filters out dreams that disappeared mid-fetch (TTL expiry, opt-out race).
 * Repairs the leaderboard set by removing tombstoned entries.
 */
export async function getLeaderboard(
  metric: LeaderboardMetric,
  opts: { isoWeek?: string; limit?: number } = {},
): Promise<LeaderboardEntry[]> {
  const ids = await topDreamIds(metric, opts);
  if (ids.length === 0) return [];

  const records = await Promise.all(ids.map(id => getDream(id)));

  // Self-heal: drop missing/private dreams from this week's set so they don't
  // reappear in subsequent calls.
  const tombstones: string[] = [];
  const out: LeaderboardEntry[] = [];
  records.forEach((dream, i) => {
    if (!dream || !dream.isPublic) {
      tombstones.push(ids[i]);
      return;
    }
    out.push({
      id: dream.id,
      rank: out.length + 1,
      handle: dream.handle,
      blurb: dream.blurb,
      styleId: dream.styleId,
      styleName: dream.styleName,
      format: dream.format,
      thumbnailUrl: thumbnailUrlFor(dream),
      metricScore: metricScoreFor(dream, metric),
      createdAt: dream.createdAt,
    });
  });

  if (tombstones.length > 0) {
    const redis = getRedis();
    const week = opts.isoWeek ?? isoWeekKey();
    redis.zrem(leaderboardKey(metric, week), ...tombstones).catch(() => { /* best-effort */ });
  }

  return out;
}

/**
 * Convenience helper: returns all the leaderboard set keys that might
 * contain `dream` (for hard-delete on opt-out).
 */
export function allBoardKeysForDream(dream: Pick<DreamRecord, 'isoWeek'>): string[] {
  return leaderboardKeysForDream(dream);
}
