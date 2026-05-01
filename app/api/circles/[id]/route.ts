import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import { getCircleDetail, getRecentOwnDreams } from '@/lib/dreams/circles';

export const runtime = 'nodejs';

const Query = z.object({
  fingerprint: z.string().min(4).max(256),
});

function fpHashOf(fingerprint: string): string {
  return createHash('sha256').update(fingerprint).digest('hex').slice(0, 16);
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const parsed = Query.safeParse({
    fingerprint: req.nextUrl.searchParams.get('fingerprint') ?? '',
  });
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_query' }, { status: 400 });
  }
  const fpHash = fpHashOf(parsed.data.fingerprint);
  const detail = await getCircleDetail(id, fpHash);
  if (!detail) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  const recentDreams = detail.isMember ? await getRecentOwnDreams(fpHash) : [];
  return NextResponse.json({ ok: true, circle: detail, recentDreams }, {
    headers: { 'Cache-Control': 'private, no-store' },
  });
}
