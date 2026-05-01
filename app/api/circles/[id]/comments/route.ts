import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import { addCircleComment } from '@/lib/dreams/circles';

export const runtime = 'nodejs';

const Body = z.object({
  fingerprint: z.string().min(4).max(256),
  dreamId: z.string().min(4).max(120),
  content: z.string().max(280).optional(),
  emoji: z.string().max(8).nullable().optional(),
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
  const comment = await addCircleComment({
    circleId: id,
    dreamId: parsed.data.dreamId,
    fpHash: fpHashOf(parsed.data.fingerprint),
    content: parsed.data.content,
    emoji: parsed.data.emoji,
  });
  if (!comment) {
    return NextResponse.json({ error: 'comment_failed' }, { status: 403 });
  }
  return NextResponse.json({ ok: true, comment });
}
