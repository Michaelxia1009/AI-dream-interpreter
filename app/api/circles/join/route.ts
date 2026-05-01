import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import { joinCircleByInvite } from '@/lib/dreams/circles';

export const runtime = 'nodejs';

const Body = z.object({
  fingerprint: z.string().min(4).max(256),
  inviteCode: z.string().min(4).max(24),
});

function fpHashOf(fingerprint: string): string {
  return createHash('sha256').update(fingerprint).digest('hex').slice(0, 16);
}

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }
  const circle = await joinCircleByInvite(parsed.data.inviteCode, fpHashOf(parsed.data.fingerprint));
  if (!circle) {
    return NextResponse.json({ error: 'invite_not_found' }, { status: 404 });
  }
  return NextResponse.json({ ok: true, circle });
}
