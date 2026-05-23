import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getDream } from '@/lib/dreams/repo';

export const runtime = 'nodejs';

const Query = z.object({
  fingerprint: z.string().min(4).max(256),
});

interface Params {
  params: Promise<{ id: string }>;
}

const PROTOTYPE_ARCHIVE_ALIASES_BY_CODE: Record<string, string[]> = {
  '4966': ['00636e4cb910e492'],
};

function fpHashOf(fingerprint: string): string {
  return createHash('sha256').update(fingerprint).digest('hex').slice(0, 16);
}

function dreamerCode(fpHash: string): string {
  const n = parseInt(fpHash.slice(0, 8), 16) % 10_000;
  return String(n).padStart(4, '0');
}

export async function GET(req: NextRequest, { params }: Params) {
  const parsed = Query.safeParse({
    fingerprint: req.nextUrl.searchParams.get('fingerprint') ?? '',
  });
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_query' }, { status: 400 });
  }

  const { id } = await params;
  const dream = await getDream(id);
  if (!dream) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const fpHash = fpHashOf(parsed.data.fingerprint);
  const allowedFpHashes = new Set([
    fpHash,
    ...(PROTOTYPE_ARCHIVE_ALIASES_BY_CODE[dreamerCode(fpHash)] ?? []),
  ]);

  if (!allowedFpHashes.has(dream.fpHash)) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    dream: {
      id: dream.id,
      createdAt: dream.createdAt,
      format: dream.format,
      styleId: dream.styleId,
      styleName: dream.styleName,
      blurb: dream.blurb,
      dreamType: dream.dreamType ?? 'normal',
      symbols: dream.symbols ?? [],
      generation: dream.generation,
      metrics: dream.metrics,
      moderation: dream.moderation,
      isPublic: dream.isPublic,
      handle: dream.handle,
    },
  }, {
    headers: { 'Cache-Control': 'private, no-store' },
  });
}
