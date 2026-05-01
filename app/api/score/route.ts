import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { scoreDream } from '@/lib/ai/score';

const Body = z.object({ enrichedDream: z.string().min(10).max(10_000) });

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 });
  }
  try {
    const result = await scoreDream(parsed.data.enrichedDream);
    return NextResponse.json(result);
  } catch (err) {
    const detail = err instanceof Error ? err.message : 'Unknown error';
    const cause = err instanceof Error && err.cause instanceof Error ? err.cause.message : '';
    console.error('Score error:', detail, cause);
    return NextResponse.json({ error: 'scoring failed', detail }, { status: 500 });
  }
}
