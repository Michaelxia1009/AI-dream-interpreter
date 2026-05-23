import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import { getHandleForFpHash } from '@/lib/dreams/handle';
import { backfillUserDreamIndex, getUserDreamIds } from '@/lib/dreams/user-index';
import { getDream } from '@/lib/dreams/repo';
import { aggregatePatterns } from '@/lib/dreams/patterns';
import { getPrototypeAccount, publicAccountState } from '@/lib/dreams/account';
import { computeStreakInfo } from '@/lib/dreams/streak';
import { dreamTextForInterpretation } from '@/lib/dreams/interpretation-text';
import { buildRateLimitKey, DAILY_GENERATION_LIMIT, peek } from '@/lib/ratelimit';
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

function dreamerCodeFromHandle(handle: string, fpHash: string): string {
  return handle.match(/^Dreamer #(\d{4})$/)?.[1] ?? dreamerCode(fpHash);
}

const PROTOTYPE_ARCHIVE_ALIASES_BY_CODE: Record<string, string[]> = {
  // Local prototype migration: the in-app browser profile currently resolves
  // to Dreamer #4966, while the user's generated leaderboard archive lives
  // under Dreamer #0063.
  '4966': ['00636e4cb910e492'],
};

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
    styleId: dream.styleId,
    styleName: dream.styleName,
    dreamText: dreamTextForInterpretation(dream),
    thumbnailUrl: thumbnailFor(dream),
    videoUrl: dream.generation.kind === 'video' ? dream.generation.videoUrl : null,
    dreamType: dream.dreamType ?? 'normal',
    generation: dream.generation,
    metrics: dream.metrics,
    moderation: dream.moderation,
    symbols: dream.symbols ?? [],
    isPublic: dream.isPublic,
    handle: dream.handle,
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
  const aliasFpHashes = PROTOTYPE_ARCHIVE_ALIASES_BY_CODE[dreamerCode(fpHash)] ?? [];
  const archiveFpHashes = [fpHash, ...aliasFpHashes];
  const archiveFpHashSet = new Set(archiveFpHashes);
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    '0.0.0.0';
  const ua = req.headers.get('user-agent') ?? '';
  await Promise.all(archiveFpHashes.map(hash => backfillUserDreamIndex(hash)));
  const ids = [...new Set((await Promise.all(
    archiveFpHashes.map(hash => getUserDreamIds(hash, { limit: 100 })),
  )).flat())];
  const records = (await Promise.all(ids.map(id => getDream(id))))
    .filter((d): d is DreamRecord => d != null && archiveFpHashSet.has(d.fpHash))
    .sort((a, b) => b.createdAt - a.createdAt);
  const profileFpHash = records.some(d => d.fpHash === fpHash)
    ? fpHash
    : aliasFpHashes[0] ?? fpHash;
  const patterns = aggregatePatterns(records, { windowDays: 90 });
  const [storedHandle, account, usage] = await Promise.all([
    getHandleForFpHash(profileFpHash),
    getPrototypeAccount(fpHash),
    peek(buildRateLimitKey(ip, ua, parsed.data.fingerprint)),
  ]);
  const archiveHandle = records.find(d => d.fpHash === profileFpHash)?.handle;
  const handle = archiveHandle ?? storedHandle;
  const firstDreamAt = records.length ? records[records.length - 1].createdAt : null;
  const lastDreamAt = records.length ? records[0].createdAt : null;
  const publicDreams = records.filter(d => d.isPublic).length;

  return NextResponse.json({
    ok: true,
    profile: {
      fpHash: profileFpHash,
      handle,
      dreamerCode: dreamerCodeFromHandle(handle, profileFpHash),
      totalDreams: records.length,
      publicDreams,
      firstDreamAt,
      lastDreamAt,
      patternsUnlocked: records.length >= 3,
      patternSummary: summaryText(records),
      patterns,
      account: publicAccountState(account),
      streak: computeStreakInfo(records),
      usage: {
        limit: DAILY_GENERATION_LIMIT,
        remaining: usage.remaining,
        resetAt: usage.resetAt,
      },
      dreams: records.map(profileDream),
    },
  }, {
    headers: { 'Cache-Control': 'private, no-store' },
  });
}
