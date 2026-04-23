import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';
import { createHash } from 'node:crypto';

const DAILY_LIMIT = 5;

let _ratelimit: Ratelimit | null = null;

function getRatelimit(): Ratelimit {
  if (_ratelimit) return _ratelimit;
  const redis = Redis.fromEnv();
  _ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.fixedWindow(DAILY_LIMIT, '24 h'),
    prefix: 'dream-rl',
    analytics: false,
  });
  return _ratelimit;
}

export function buildRateLimitKey(
  ip: string,
  userAgent: string,
  fingerprint: string,
): string {
  const raw = `${ip}|${userAgent}|${fingerprint}`;
  const hash = createHash('sha256').update(raw).digest('hex').slice(0, 16);
  return `rl:${hash}`;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export async function checkAndConsume(
  key: string,
): Promise<RateLimitResult> {
  const rl = getRatelimit();
  const { success, remaining, reset } = await rl.limit(key);
  return { allowed: success, remaining, resetAt: reset };
}

export async function peek(key: string): Promise<RateLimitResult> {
  const redis = Redis.fromEnv();
  const count = (await redis.get<number>(`dream-rl:${key}`)) ?? 0;
  const ttl = await redis.pttl(`dream-rl:${key}`);
  return {
    allowed: count < DAILY_LIMIT,
    remaining: Math.max(0, DAILY_LIMIT - count),
    resetAt: Date.now() + (ttl > 0 ? ttl : 24 * 60 * 60 * 1000),
  };
}

export const DAILY_GENERATION_LIMIT = DAILY_LIMIT;
