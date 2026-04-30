import { getRedis } from '@/lib/redis';
import type { DreamRecord, LeaderboardMetric } from './types';

/**
 * Dream repository — persistence layer for `dream:{id}` records.
 * Storage shape: a single Redis string key holding the serialised JSON
 * record (we use a string, not a hash, so we can atomically GET/SET the
 * full record without N round-trips).
 *
 * TTL: 8 days, reset on every successful read (so popular dreams stay alive
 * through the leaderboard cycle, but cold dreams age out).
 */

const DREAM_TTL_SECONDS = 8 * 24 * 60 * 60;

export function dreamKey(id: string): string {
  return `dream:${id}`;
}

/**
 * Returns the leaderboard keys that this dream should be a member of
 * (one per metric for its isoWeek).
 */
export function leaderboardKeysForDream(dream: Pick<DreamRecord, 'isoWeek'>): string[] {
  const metrics: LeaderboardMetric[] = ['weirdness', 'vivid', 'emotional'];
  return metrics.map(m => `lb:${m}:${dream.isoWeek}`);
}

/**
 * Writes the canonical dream record. Caller is responsible for adding
 * to leaderboards via `addDreamToBoards()` (kept separate so that
 * private dreams can be persisted without indexing).
 */
export async function persistDream(dream: DreamRecord): Promise<void> {
  const redis = getRedis();
  await redis.set(dreamKey(dream.id), JSON.stringify(dream), {
    ex: DREAM_TTL_SECONDS,
  });
}

/**
 * Reads a dream record by id. Returns null if missing/expired.
 * Does NOT refresh the TTL — call `touchDream()` for that.
 */
export async function getDream(id: string): Promise<DreamRecord | null> {
  const redis = getRedis();
  // Upstash auto-deserialises JSON if `Content-Type: application/json` was
  // sent on the SET; otherwise it returns the raw string. Handle both.
  const raw = await redis.get<DreamRecord | string>(dreamKey(id));
  if (raw == null) return null;
  if (typeof raw === 'string') {
    try { return JSON.parse(raw) as DreamRecord; }
    catch { return null; }
  }
  return raw;
}

/**
 * Resets the TTL on a dream key. Safe to call on a missing key (no-op).
 */
export async function touchDream(id: string): Promise<void> {
  const redis = getRedis();
  await redis.expire(dreamKey(id), DREAM_TTL_SECONDS);
}

/**
 * Updates an existing dream record in place. Reads, mutates, writes —
 * no transaction; race window is acceptable because the only callers
 * (handle update, visibility flip) are user-initiated and infrequent.
 *
 * Returns the updated record, or null if the dream doesn't exist.
 */
export async function updateDream(
  id: string,
  patch: Partial<DreamRecord>,
): Promise<DreamRecord | null> {
  const existing = await getDream(id);
  if (!existing) return null;
  const next: DreamRecord = { ...existing, ...patch };
  await persistDream(next);
  return next;
}

/**
 * Hard-deletes the dream record. Caller is responsible for ZREM-ing
 * leaderboard entries via `removeDreamFromBoards()`.
 */
export async function deleteDream(id: string): Promise<void> {
  const redis = getRedis();
  await redis.del(dreamKey(id));
}
