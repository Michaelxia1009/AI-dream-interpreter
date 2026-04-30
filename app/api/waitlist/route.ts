import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getRedis } from '@/lib/redis';

/**
 * POST /api/waitlist  → { email }
 *
 * Stores the email in two Redis keys:
 *   • waitlist:emails       (RPUSH list, ordered by signup time)
 *   • waitlist:emails:set   (SADD set, dedup so the same address isn't queued twice)
 *
 * Returns 200 { ok:true, alreadyOnList? } so duplicate signups still feel
 * successful to the user.
 */

const Body = z.object({
  email: z.string().trim().email('Enter a valid email address').max(254),
});

export async function POST(req: NextRequest) {
  let parsed: z.infer<typeof Body>;
  try {
    parsed = Body.parse(await req.json());
  } catch (err) {
    const reason =
      err instanceof z.ZodError
        ? err.issues[0]?.message ?? 'Invalid email'
        : 'Invalid request body';
    return NextResponse.json({ ok: false, error: reason }, { status: 400 });
  }

  const email = parsed.email.toLowerCase();
  const redis = getRedis();

  // SADD returns 0 if the element was already a member of the set.
  const added = await redis.sadd('waitlist:emails:set', email);
  let alreadyOnList = false;
  if (added === 0) {
    alreadyOnList = true;
  } else {
    await redis.rpush(
      'waitlist:emails',
      JSON.stringify({ email, ts: Date.now() }),
    );
  }

  return NextResponse.json({ ok: true, alreadyOnList });
}
