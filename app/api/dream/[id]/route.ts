import { NextRequest, NextResponse } from 'next/server';
import { getDream, touchDream } from '@/lib/dreams/repo';

/**
 * GET /api/dream/[id]
 * Returns the public-safe view of a dream record. Used by:
 *   - the SSR /d/[id] page
 *   - the /result/[id] page when the user re-opens a dream they own
 *
 * Returns 404 for missing or private dreams. We do NOT differentiate
 * "private" from "not found" in the response — that prevents handle
 * enumeration attacks against opted-out dreams.
 */
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const dream = await getDream(id);
  if (!dream) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  if (!dream.isPublic) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  // Refresh TTL on view (popular dreams stay alive)
  touchDream(id).catch(() => { /* best-effort */ });

  // Strip server-only fields. fpHash never leaves the server.
  const { fpHash, ...publicView } = dream;
  void fpHash;
  return NextResponse.json(publicView, {
    headers: {
      // Allow the browser/edge to cache for a minute — opt-out propagation
      // window is intentional (see plan §UX/Public dream page).
      'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=60',
    },
  });
}
