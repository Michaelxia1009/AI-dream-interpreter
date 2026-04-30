import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getLeaderboard, LEADERBOARD_PAGE_SIZE } from '@/lib/dreams/leaderboard';
import { isoWeekKey, formatIsoWeekRange, msUntilNextIsoWeek } from '@/lib/dreams/iso-week';
import type { LeaderboardMetric } from '@/lib/dreams/types';

/**
 * GET /api/leaderboard?metric=weirdness|vivid|emotional&limit=20
 *
 * Returns this week's top dreams for the requested metric.
 */

const MetricParam = z.enum(['weirdness', 'vivid', 'emotional']);

export async function GET(req: NextRequest) {
  const metricRaw = req.nextUrl.searchParams.get('metric') ?? 'weirdness';
  const parsedMetric = MetricParam.safeParse(metricRaw);
  if (!parsedMetric.success) {
    return NextResponse.json({ error: 'invalid metric' }, { status: 400 });
  }
  const metric: LeaderboardMetric = parsedMetric.data;

  const limitRaw = req.nextUrl.searchParams.get('limit');
  const limit = limitRaw
    ? Math.min(LEADERBOARD_PAGE_SIZE, Math.max(1, parseInt(limitRaw, 10) || LEADERBOARD_PAGE_SIZE))
    : LEADERBOARD_PAGE_SIZE;

  try {
    const entries = await getLeaderboard(metric, { limit });
    const isoWeek = isoWeekKey();
    return NextResponse.json({
      metric,
      isoWeek,
      isoWeekRange: formatIsoWeekRange(),
      msUntilReset: msUntilNextIsoWeek(),
      entries,
    }, {
      headers: {
        // Cache for 30s — newly-published dreams should appear quickly.
        'Cache-Control': 'public, max-age=30, s-maxage=30, stale-while-revalidate=60',
      },
    });
  } catch (err: any) {
    console.error('leaderboard fetch failed', err);
    return NextResponse.json(
      { error: 'leaderboard_failed', detail: err?.message },
      { status: 500 },
    );
  }
}
