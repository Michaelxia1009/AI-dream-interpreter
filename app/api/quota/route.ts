import { NextRequest, NextResponse } from 'next/server';
import { buildRateLimitKey, peek, DAILY_GENERATION_LIMIT } from '@/lib/ratelimit';

export async function GET(req: NextRequest) {
  const fp = req.nextUrl.searchParams.get('fp') ?? 'no-fp';
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    '0.0.0.0';
  const ua = req.headers.get('user-agent') ?? '';
  const key = buildRateLimitKey(ip, ua, fp);
  const result = await peek(key);
  return NextResponse.json({
    limit: DAILY_GENERATION_LIMIT,
    remaining: result.remaining,
    resetAt: result.resetAt,
  });
}
