import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createHash } from 'node:crypto';
import { getDream, deleteDream, updateDream } from '@/lib/dreams/repo';
import { removeDreamFromBoards, addDreamToBoards } from '@/lib/dreams/leaderboard';

/**
 * PATCH /api/dream/[id]/visibility
 *
 * Body: { fingerprint: string, isPublic?: boolean, handle?: string }
 *
 * Authorisation: the request must come from the same fingerprint as the dream's owner.
 * We compare sha256(fingerprint).slice(0,16) against the stored fpHash.
 *
 * - isPublic=false → DESTRUCTIVE: deletes the dream record + all leaderboard entries.
 * - isPublic=true  → re-publishes the dream (rare path; only valid if the dream still exists,
 *   i.e. it was never destructively opted out).
 * - handle (string) → updates the byline handle on this dream + re-indexes leaderboard rows.
 *
 * Returns 404 if the dream doesn't exist, 403 if the fingerprint doesn't match.
 */

const Body = z.object({
  fingerprint: z.string().min(4),
  isPublic: z.boolean().optional(),
  handle: z.string().min(1).max(40).optional(),
});

function fpHashOf(fingerprint: string): string {
  return createHash('sha256').update(fingerprint).digest('hex').slice(0, 16);
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'bad body' }, { status: 400 });
  }
  const { fingerprint, isPublic, handle } = parsed.data;

  const existing = await getDream(id);
  if (!existing) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  if (existing.fpHash !== fpHashOf(fingerprint)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  // Hard-delete path
  if (isPublic === false) {
    await removeDreamFromBoards(id, [existing.isoWeek]);
    await deleteDream(id);
    return NextResponse.json({ ok: true, deleted: true });
  }

  // Mutating handle and/or re-publishing
  const patch: Partial<typeof existing> = {};
  if (typeof handle === 'string' && handle.trim()) {
    patch.handle = handle.trim().slice(0, 40);
  }
  if (isPublic === true) {
    patch.isPublic = true;
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ ok: true, dream: { ...existing, fpHash: undefined } });
  }
  const updated = await updateDream(id, patch);
  if (!updated) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  // Re-index on the leaderboard (ZADD is idempotent — safe even if not changed).
  if (updated.isPublic && updated.moderation.ok) {
    await addDreamToBoards(updated);
  }
  const { fpHash, ...publicView } = updated;
  void fpHash;
  return NextResponse.json({ ok: true, dream: publicView });
}
