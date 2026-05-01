import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import { createCircle, listCirclesForUser } from '@/lib/dreams/circles';

export const runtime = 'nodejs';

const CreateBody = z.object({
  fingerprint: z.string().min(4).max(256),
  name: z.string().min(2).max(48),
  description: z.string().max(160).optional(),
});

const Query = z.object({
  fingerprint: z.string().min(4).max(256),
});

function fpHashOf(fingerprint: string): string {
  return createHash('sha256').update(fingerprint).digest('hex').slice(0, 16);
}

export async function GET(req: NextRequest) {
  const parsed = Query.safeParse({
    fingerprint: req.nextUrl.searchParams.get('fingerprint') ?? '',
  });
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_query' }, { status: 400 });
  }
  const circles = await listCirclesForUser(fpHashOf(parsed.data.fingerprint));
  return NextResponse.json({ ok: true, circles }, {
    headers: { 'Cache-Control': 'private, no-store' },
  });
}

export async function POST(req: NextRequest) {
  const parsed = CreateBody.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }
  const circle = await createCircle({
    name: parsed.data.name,
    description: parsed.data.description,
    fpHash: fpHashOf(parsed.data.fingerprint),
  });
  return NextResponse.json({ ok: true, circle });
}
