import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createHash } from 'node:crypto';
import { getDream } from '@/lib/dreams/repo';

/**
 * POST /api/dream/[id]/enriched
 *
 * Body: { fingerprint: string }
 *
 * Returns the full enriched-dream text for a past dream so the user can
 * launch interpretation on it from /journal or /profile. Owner-only —
 * the request's fingerprint must hash to the dream's stored fpHash
 * (same gate as /api/dream/[id]/visibility).
 *
 * - 200 { enrichedDream } — owner; dream has the text persisted.
 * - 403 { error: 'forbidden' } — wrong fingerprint.
 * - 404 { error: 'not_found' } — dream missing OR predates enrichedDream
 *       persistence (old records have no enrichedDream field).
 *
 * Uses POST (not GET) so the fingerprint never appears in URLs/logs.
 */

const Body = z.object({
  fingerprint: z.string().min(4),
});

function fpHashOf(fingerprint: string): string {
  return createHash('sha256').update(fingerprint).digest('hex').slice(0, 16);
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'bad body' }, { status: 400 });
  }
  const dream = await getDream(id);
  if (!dream) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  if (dream.fpHash !== fpHashOf(parsed.data.fingerprint)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  if (!dream.enrichedDream) {
    // Pre-fix records: dream exists but text wasn't persisted.
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  return NextResponse.json({ enrichedDream: dream.enrichedDream });
}
