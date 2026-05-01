import { getRedis } from '@/lib/redis';
import { validateHandle } from './moderation';

/**
 * Handle storage — sticky per-fingerprint custom handle.
 *   key:  `handle:{fpHash}`  (fpHash is the 16-char prefix already used by the rate limiter)
 *   ttl:  30 days, refreshed on every write
 */

const HANDLE_TTL_SECONDS = 30 * 24 * 60 * 60;

/**
 * Deterministic auto-handle from a fingerprint hash.
 * 16-char hex → stable numeric badge, e.g. "Dreamer #0063".
 */
export function autoHandleFromFpHash(fpHash: string): string {
  const n = parseInt(fpHash.slice(0, 8), 16) % 10_000;
  return `Dreamer #${String(n).padStart(4, '0')}`;
}

/**
 * Looks up a custom (sticky) handle for the given fingerprint hash.
 * Returns the auto-handle if no custom one is set.
 */
export async function getHandleForFpHash(fpHash: string): Promise<string> {
  const redis = getRedis();
  const stored = await redis.get<string>(`handle:${fpHash}`);
  if (typeof stored === 'string' && stored.trim().length > 0) {
    return stored.trim();
  }
  return autoHandleFromFpHash(fpHash);
}

export interface SetHandleResult {
  ok: boolean;
  handle: string;
  reason?: string;
}

/**
 * Sets a sticky custom handle for the fingerprint. Validates first;
 * on failure returns `{ ok: false, reason, handle: <auto> }`.
 */
export async function setHandleForFpHash(
  fpHash: string,
  rawHandle: string,
): Promise<SetHandleResult> {
  const validation = validateHandle(rawHandle);
  if (!validation.ok) {
    return {
      ok: false,
      handle: autoHandleFromFpHash(fpHash),
      reason: validation.reason,
    };
  }
  const handle = rawHandle.trim();
  const redis = getRedis();
  await redis.set(`handle:${fpHash}`, handle, { ex: HANDLE_TTL_SECONDS });
  return { ok: true, handle };
}

/**
 * Removes a sticky handle (used when the user opts out of all dreams).
 * Best-effort — never throws.
 */
export async function clearHandleForFpHash(fpHash: string): Promise<void> {
  try {
    await getRedis().del(`handle:${fpHash}`);
  } catch {
    /* swallow */
  }
}
