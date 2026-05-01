import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import { setPrototypeAccount } from '@/lib/dreams/account';

export const runtime = 'nodejs';

const Body = z.object({
  fingerprint: z.string().min(4).max(256),
  email: z.string().min(3).max(254),
  displayName: z.string().max(80).optional(),
});

function fpHashOf(fingerprint: string): string {
  return createHash('sha256').update(fingerprint).digest('hex').slice(0, 16);
}

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  try {
    const account = await setPrototypeAccount(fpHashOf(parsed.data.fingerprint), {
      email: parsed.data.email,
      displayName: parsed.data.displayName,
    });
    return NextResponse.json({ ok: true, account }, {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch (err) {
    if (err instanceof Error && err.message === 'invalid_email') {
      return NextResponse.json({ error: 'invalid_email' }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : 'unknown';
    console.error('profile claim failed', message);
    return NextResponse.json({ error: 'claim_failed' }, { status: 500 });
  }
}
