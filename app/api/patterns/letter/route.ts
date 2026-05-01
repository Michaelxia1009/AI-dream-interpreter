import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createHash } from 'node:crypto';
import { getUserDreamIds } from '@/lib/dreams/user-index';
import { getDream } from '@/lib/dreams/repo';
import { aggregatePatterns } from '@/lib/dreams/patterns';
import { isoWeekKey } from '@/lib/dreams/iso-week';
import { getOrGenerateWeeklyLetter } from '@/lib/ai/weeklyLetter';
import type { DreamRecord } from '@/lib/dreams/types';

/**
 * GET /api/patterns/letter?fingerprint=...&days=30&force=1
 *
 * Returns a single short LLM-generated reflection on the user's week.
 * Split from /api/patterns so the main aggregation can paint instantly
 * while this slower call streams in.
 *
 * `force=1` — bypass the 14-day cache and regenerate (used by the
 * "Regenerate" affordance on /patterns).
 */

export const runtime = 'nodejs';
export const maxDuration = 60;

const Query = z.object({
  fingerprint: z.string().min(4).max(256),
  days: z.coerce.number().int().min(1).max(60).optional(),
  force: z.coerce.number().optional(),
});

function fpHashOf(fingerprint: string): string {
  return createHash('sha256').update(fingerprint).digest('hex').slice(0, 16);
}

export async function GET(req: NextRequest) {
  const params = {
    fingerprint: req.nextUrl.searchParams.get('fingerprint') ?? '',
    days: req.nextUrl.searchParams.get('days') ?? undefined,
    force: req.nextUrl.searchParams.get('force') ?? undefined,
  };
  const parsed = Query.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_query' }, { status: 400 });
  }

  const fpHash = fpHashOf(parsed.data.fingerprint);
  const windowDays = parsed.data.days ?? 30;
  const nowMs = Date.now();
  const sinceMs = nowMs - windowDays * 24 * 60 * 60 * 1000;
  const force = parsed.data.force === 1;

  try {
    const ids = await getUserDreamIds(fpHash, { sinceMs, untilMs: nowMs, limit: 200 });
    const records = ids.length === 0
      ? []
      : (await Promise.all(ids.map(id => getDream(id)))).filter(
          (d): d is DreamRecord => d != null,
        );
    const aggregation = aggregatePatterns(records, { windowDays, nowMs });
    const recentBlurbs = aggregation.recent.map(r => r.blurb);

    const letter = await getOrGenerateWeeklyLetter(
      fpHash,
      isoWeekKey(),
      aggregation,
      recentBlurbs,
      { force },
    );

    return NextResponse.json({
      ok: true,
      isoWeek: isoWeekKey(),
      letter,
    }, {
      headers: {
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown';
    console.error('weekly letter fetch failed', message);
    return NextResponse.json(
      { error: 'letter_failed', detail: message },
      { status: 500 },
    );
  }
}
