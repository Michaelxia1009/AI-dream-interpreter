import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { v4 as uuid } from 'uuid';
import JSZip from 'jszip';
import { buildRateLimitKey, checkAndConsume } from '@/lib/ratelimit';
import { getStyleById } from '@/lib/styles';
import { buildCarouselPrompts } from '@/lib/ai/scenePrompt';
import { generateImages } from '@/lib/providers/images';
import { uploadArtifact } from '@/lib/providers/blob';

export const maxDuration = 300;

const Body = z.object({
  enrichedDream: z.string().min(10),
  styleId: z.string(),
  fingerprint: z.string().min(4),
});

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'bad body' }, { status: 400 });

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? req.headers.get('x-real-ip') ?? '0.0.0.0';
  const ua = req.headers.get('user-agent') ?? '';
  const key = buildRateLimitKey(ip, ua, parsed.data.fingerprint);
  const rl = await checkAndConsume(key);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'rate_limited', resetAt: rl.resetAt },
      { status: 429 },
    );
  }

  const style = getStyleById(parsed.data.styleId);
  if (!style) return NextResponse.json({ error: 'unknown style' }, { status: 400 });

  try {
    const prompts = await buildCarouselPrompts(parsed.data.enrichedDream, style);
    const images = await generateImages(prompts);

    const zip = new JSZip();
    images.forEach((img, i) => zip.file(`dream-${i + 1}.jpg`, img));
    const zipBuffer = Buffer.from(await zip.generateAsync({ type: 'nodebuffer' }));

    const id = uuid();
    const zipUrl = await uploadArtifact(
      `carousels/${id}.zip`,
      zipBuffer,
      'application/zip',
    );

    // upload each image individually for in-browser carousel display
    const imageUrls = await Promise.all(
      images.map((img, i) =>
        uploadArtifact(`carousels/${id}/image-${i + 1}.jpg`, img, 'image/jpeg'),
      ),
    );

    return NextResponse.json({
      id,
      kind: 'carousel',
      zipUrl,
      imageUrls,
      remaining: rl.remaining,
    });
  } catch (err: any) {
    console.error('carousel gen failed', err?.message, err?.responseBody || err?.cause?.message || '');
    return NextResponse.json({ error: 'generation_failed', detail: err?.message }, { status: 500 });
  }
}
