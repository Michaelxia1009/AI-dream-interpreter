import { getRedis } from '@/lib/redis';
import { getDream } from './repo';

/**
 * Per-user dream index — a Redis sorted set of dream ids scored by
 * `createdAt` (ms epoch). Powers /patterns and (eventually) any
 * "your dream history" view.
 *
 * Key: `user:{fpHash}:dreams`
 * Score: createdAt ms (so ZRANGE BY SCORE gives time windows naturally,
 *        and ZREVRANGE returns newest-first).
 *
 * TTL: 90 days. Long enough that "the last 30 days" is always available,
 * but short enough that ghost data doesn't pile up forever. Reset on every
 * write so an active dreamer's history never expires while they're active.
 */

const USER_INDEX_TTL_SECONDS = 90 * 24 * 60 * 60;

export function userIndexKey(fpHash: string): string {
  return `user:${fpHash}:dreams`;
}

/**
 * Add (or refresh) a dream id in the user's index. ZADD sets the score
 * idempotently, so re-calling with the same id is safe.
 */
export async function addDreamToUserIndex(
  fpHash: string,
  dreamId: string,
  createdAt: number,
): Promise<void> {
  const redis = getRedis();
  const key = userIndexKey(fpHash);
  await redis.zadd(key, { score: createdAt, member: dreamId });
  await redis.expire(key, USER_INDEX_TTL_SECONDS);
}

/**
 * Remove a dream from the user's index (used when a dream is deleted).
 * Safe on a missing key/member.
 */
export async function removeDreamFromUserIndex(
  fpHash: string,
  dreamId: string,
): Promise<void> {
  const redis = getRedis();
  await redis.zrem(userIndexKey(fpHash), dreamId);
}

interface ListOpts {
  /** Lower bound on createdAt (inclusive). Defaults to -Infinity (no bound). */
  sinceMs?: number;
  /** Upper bound on createdAt (inclusive). Defaults to +Infinity (now). */
  untilMs?: number;
  /** Max ids returned. Default 200 — enough for /patterns over 30 days. */
  limit?: number;
}

/**
 * Return dream ids for `fpHash`, newest-first, optionally bounded by a
 * time window. Returns an empty array if the user has no dreams.
 */
export async function getUserDreamIds(
  fpHash: string,
  opts: ListOpts = {},
): Promise<string[]> {
  const redis = getRedis();
  const key = userIndexKey(fpHash);

  const min = opts.sinceMs ?? '-inf';
  const max = opts.untilMs ?? '+inf';
  const limit = opts.limit ?? 200;

  // ZRANGE BYSCORE (REV) — Upstash exposes this as zrange with options.
  // We pass `byScore: true` + `rev: true` to get newest-first within range.
  // Min/max swap when rev is true (Redis convention: max comes first).
  const ids = await redis.zrange(key, max, min, {
    byScore: true,
    rev: true,
    offset: 0,
    count: limit,
  }) as string[];
  return ids ?? [];
}

/**
 * Light migration helper for users who generated dreams before the user index
 * existed. Scans recent `dream:*` records, finds records owned by `fpHash`, and
 * backfills the sorted set. Bounded so profile loads stay predictable.
 */
export async function backfillUserDreamIndex(
  fpHash: string,
  opts: { scanLimit?: number } = {},
): Promise<string[]> {
  const redis = getRedis();
  const found = new Set<string>();
  let cursor = '0';
  let scanned = 0;
  const scanLimit = opts.scanLimit ?? 500;

  do {
    const [nextCursor, keys] = await redis.scan(cursor, {
      match: 'dream:*',
      count: 100,
    });
    cursor = String(nextCursor);
    scanned += keys.length;

    await Promise.all(keys.map(async key => {
      const id = key.replace(/^dream:/, '');
      const dream = await getDream(id);
      if (!dream || dream.fpHash !== fpHash) return;
      found.add(id);
      await addDreamToUserIndex(fpHash, id, dream.createdAt);
    }));
  } while (cursor !== '0' && scanned < scanLimit);

  return [...found];
}
