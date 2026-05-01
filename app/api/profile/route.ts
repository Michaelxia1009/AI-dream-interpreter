import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import { getHandleForFpHash } from '@/lib/dreams/handle';
import { backfillUserDreamIndex, getUserDreamIds } from '@/lib/dreams/user-index';
import { getDream } from '@/lib/dreams/repo';
import { aggregatePatterns } from '@/lib/dreams/patterns';
import type { DreamRecord } from '@/lib/dreams/types';

export const runtime = 'nodejs';

const Query = z.object({
  fingerprint: z.string().min(4).max(256),
});

function fpHashOf(fingerprint: string): string {
  return createHash('sha256').update(fingerprint).digest('hex').slice(0, 16);
}

function dreamerCode(fpHash: string): string {
  const n = parseInt(fpHash.slice(0, 8), 16) % 10_000;
  return String(n).padStart(4, '0');
}

function thumbnailFor(dream: DreamRecord): string | null {
  if (dream.generation.kind === 'carousel') return dream.generation.imageUrls[0] ?? null;
  return null;
}

function profileDream(dream: DreamRecord) {
  return {
    id: dream.id,
    createdAt: dream.createdAt,
    blurb: dream.blurb,
    format: dream.format,
    styleName: dream.styleName,
    thumbnailUrl: thumbnailFor(dream),
    metrics: dream.metrics,
    symbols: dream.symbols ?? [],
    isPublic: dream.isPublic,
  };
}

function summaryText(records: DreamRecord[]) {
  if (records.length < 3) {
    return 'Record at least 3 dreams and the profile will begin summarizing your recurring symbols and mood.';
  }
  const agg = aggregatePatterns(records, { windowDays: 90 });
  const topSymbols = agg.symbols.slice(0, 3).map(s => s.symbol);
  const mood = agg.mood;
  const strongest = [
    ['weirdness', mood.avgWeirdness],
    ['imagination', mood.avgImagination],
    ['emotional intensity', mood.avgEmotionalIntensity],
    ['vividness', mood.avgVividness],
  ].sort((a, b) => Number(b[1]) - Number(a[1]))[0];
  const symbolLine = topSymbols.length
    ? `Your strongest recurring images are ${topSymbols.join(', ')}.`
    : 'Your recurring symbols are still forming.';
  return `${symbolLine} Across ${records.length} recorded dreams, ${strongest[0]} is currently the loudest signal.`;
}

export async function GET(req: NextRequest) {
  const parsed = Query.safeParse({
    fingerprint: req.nextUrl.searchParams.get('fingerprint') ?? '',
  });
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_query' }, { status: 400 });
  }

  const fpHash = fpHashOf(parsed.data.fingerprint);
  await backfillUserDreamIndex(fpHash);
  const ids = await getUserDreamIds(fpHash, { limit: 100 });
  const records = (await Promise.all(ids.map(id => getDream(id))))
    .filter((d): d is DreamRecord => d != null && d.fpHash === fpHash)
    .sort((a, b) => b.createdAt - a.createdAt);
  const patterns = aggregatePatterns(records, { windowDays: 90 });
  const handle = await getHandleForFpHash(fpHash);
  const firstDreamAt = records.length ? records[records.length - 1].createdAt : null;
  const lastDreamAt = records.length ? records[0].createdAt : null;

  return NextResponse.json({
    ok: true,
    profile: {
      fpHash,
      handle,
      dreamerCode: dreamerCode(fpHash),
      totalDreams: records.length,
      firstDreamAt,
      lastDreamAt,
      patternsUnlocked: records.length >= 3,
      patternSummary: summaryText(records),
      patterns,
      dreams: records.map(profileDream),
    },
  }, {
    headers: { 'Cache-Control': 'private, no-store' },
  });
}
