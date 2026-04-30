import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createHash } from 'node:crypto';
import { setHandleForFpHash, getHandleForFpHash, autoHandleFromFpHash } from '@/lib/dreams/handle';
import { validateHandle } from '@/lib/dreams/moderation';

/**
 * GET  /api/handle?fp=…  → { handle, isCustom }
 * PUT  /api/handle       → { handle } body, sets sticky custom handle
 */

const PutBody = z.object({
  fingerprint: z.string().min(4),
  handle: z.string().min(1).max(40),
});

function fpHashOf(fingerprint: string): string {
  return createHash('sha256').update(fingerprint).digest('hex').slice(0, 16);
}

export async function GET(req: NextRequest) {
  const fp = req.nextUrl.searchParams.get('fp');
  if (!fp || fp.length < 4) {
    return NextResponse.json({ error: 'missing fp' }, { status: 400 });
  }
  const fpHash = fpHashOf(fp);
  const handle = await getHandleForFpHash(fpHash);
  const auto = autoHandleFromFpHash(fpHash);
  return NextResponse.json({
    handle,
    auto,
    isCustom: handle !== auto,
  });
}

export async function PUT(req: NextRequest) {
  const parsed = PutBody.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'bad body' }, { status: 400 });
  }
  const { fingerprint, handle } = parsed.data;

  // Server-side validation (mirrors client-side check; can't be bypassed).
  const v = validateHandle(handle);
  if (!v.ok) {
    return NextResponse.json({ error: 'invalid_handle', reason: v.reason }, { status: 400 });
  }

  const fpHash = fpHashOf(fingerprint);
  const result = await setHandleForFpHash(fpHash, handle);
  if (!result.ok) {
    return NextResponse.json({ error: 'invalid_handle', reason: result.reason }, { status: 400 });
  }
  return NextResponse.json({ ok: true, handle: result.handle });
}
