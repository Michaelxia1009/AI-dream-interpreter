import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { rerollStyles } from '@/lib/ai/score';

const Body = z.object({
  enrichedDream: z.string(),
  exclude: z.array(z.string()).default([]),
});

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'bad body' }, { status: 400 });
  try {
    const ids = await rerollStyles(parsed.data.enrichedDream, parsed.data.exclude);
    return NextResponse.json({ matchedStyleIds: ids });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'reroll failed' }, { status: 500 });
  }
}
