import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import { shareDreamToCircle } from '@/lib/dreams/circles';

export const runtime = 'nodejs';

const Body = z.object({
  fingerprint: z.string().min(4).max(256),
  dreamId: z.string().min(4).max(120),
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
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }
  const dream = await shareDreamToCircle(id, parsed.data.dreamId, fpHashOf(parsed.data.fingerprint));
  if (!dream) {
    return NextResponse.json({ error: 'share_failed' }, { status: 403 });
  }
  return NextResponse.json({ ok: true, dream });
}
