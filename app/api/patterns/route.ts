import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createHash } from 'node:crypto';
import { getUserDreamIds } from '@/lib/dreams/user-index';
import { getDream } from '@/lib/dreams/repo';
import { aggregatePatterns } from '@/lib/dreams/patterns';
import { isoWeekKey, formatIsoWeekRange } from '@/lib/dreams/iso-week';
import type { DreamRecord } from '@/lib/dreams/types';

/**
 * GET /api/patterns?fingerprint=...&days=30
 *
 * Reads the requesting user's dream history (via fingerprint hash → user
 * sorted-set index), aggregates mood/symbol/timeline counts, and returns
 * a structured payload for the /patterns page.
 *
 * Privacy note: we accept the fingerprint as a *query param* not a body —
 * it's a side-effect-free GET, and the server only ever sees the SHA-256
 * prefix in storage. The raw fingerprint is NOT logged.
 */

export const runtime = 'nodejs';

const Query = z.object({
  fingerprint: z.string().min(4).max(256),
  days: z.coerce.number().int().min(1).max(60).optional(),
});

function fpHashOf(fingerprint: string): string {
  return createHash('sha256').update(fingerprint).digest('hex').slice(0, 16);
}

export async function GET(req: NextRequest) {
  const params = {
    fingerprint: req.nextUrl.searchParams.get('fingerprint') ?? '',
    days: req.nextUrl.searchParams.get('days') ?? undefined,
  };
  const parsed = Query.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_query' }, { status: 400 });
  }

  const fpHash = fpHashOf(parsed.data.fingerprint);
  const windowDays = parsed.data.days ?? 30;
  const nowMs = Date.now();
  const sinceMs = nowMs - windowDays * 24 * 60 * 60 * 1000;

  try {
    const ids = await getUserDreamIds(fpHash, { sinceMs, untilMs: nowMs, limit: 200 });
    const records = ids.length === 0
      ? []
      : (await Promise.all(ids.map(id => getDream(id)))).filter(
          (d): d is DreamRecord => d != null,
        );

    const aggregation = aggregatePatterns(records, { windowDays, nowMs });

    return NextResponse.json({
      ok: true,
      fpHash,                     // safe to expose: it's the public-key half
      isoWeek: isoWeekKey(),
      isoWeekRange: formatIsoWeekRange(),
      ...aggregation,
    }, {
      headers: {
        // Patterns is per-user — never cache in shared caches.
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown';
    console.error('patterns fetch failed', message);
    return NextResponse.json(
      { error: 'patterns_failed', detail: message },
      { status: 500 },
    );
  }
}
