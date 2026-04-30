import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { v4 as uuid } from 'uuid';
import { createHash } from 'node:crypto';
import JSZip from 'jszip';
import { buildRateLimitKey, checkAndConsume } from '@/lib/ratelimit';
import { getStyleById } from '@/lib/styles';
import { buildCarouselPrompts } from '@/lib/ai/scenePrompt';
import { generateImages } from '@/lib/providers/images';
import { uploadArtifact } from '@/lib/providers/blob';
import { persistDream } from '@/lib/dreams/repo';
import { addDreamToBoards } from '@/lib/dreams/leaderboard';
import { getHandleForFpHash } from '@/lib/dreams/handle';
import { isoWeekKey } from '@/lib/dreams/iso-week';
import type { DreamRecord } from '@/lib/dreams/types';

export const maxDuration = 300;

const MetricBody = z.object({
  score: z.number(),
  oneLiner: z.string(),
});

const ScoreBody = z.object({
  metrics: z.object({
    weirdness: MetricBody,
    imagination: MetricBody,
    emotionalIntensity: MetricBody,
    vividness: MetricBody,
  }),
  blurb: z.string(),
  moderation: z.object({ ok: z.boolean(), flags: z.array(z.string()) }),
});

const Body = z.object({
  enrichedDream: z.string().min(10),
  styleId: z.string(),
  fingerprint: z.string().min(4),
  score: ScoreBody.optional(),
  isPublic: z.boolean().optional().default(true),
});

function fpHashOf(fingerprint: string): string {
  return createHash('sha256').update(fingerprint).digest('hex').slice(0, 16);
}

function clampScore(m: { score: number; oneLiner: string }) {
  return {
    score: Math.max(1, Math.min(10, Math.round(m.score))),
    oneLiner: m.oneLiner.slice(0, 80),
  };
}

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

    // Persist the dream (best-effort)
    let isPublic = parsed.data.isPublic ?? true;
    let handle: string | null = null;
    if (parsed.data.score) {
      if (!parsed.data.score.moderation.ok) {
        isPublic = false;
      }
      try {
        const fpHash = fpHashOf(parsed.data.fingerprint);
        handle = await getHandleForFpHash(fpHash);
        const record: DreamRecord = {
          id,
          createdAt: Date.now(),
          isoWeek: isoWeekKey(),
          format: 'carousel',
          styleId: style.id,
          styleName: style.name,
          metrics: {
            weirdness: clampScore(parsed.data.score.metrics.weirdness),
            imagination: clampScore(parsed.data.score.metrics.imagination),
            emotionalIntensity: clampScore(parsed.data.score.metrics.emotionalIntensity),
            vividness: clampScore(parsed.data.score.metrics.vividness),
          },
          generation: {
            kind: 'carousel',
            imageUrls,
            zipUrl,
          },
          fpHash,
          handle,
          isPublic,
          moderation: parsed.data.score.moderation,
          blurb: parsed.data.score.blurb.slice(0, 80),
        };
        await persistDream(record);
        if (isPublic) {
          await addDreamToBoards(record);
        }
      } catch (persistErr) {
        console.error('persistDream failed (non-fatal)', persistErr);
      }
    }

    return NextResponse.json({
      id,
      kind: 'carousel',
      zipUrl,
      imageUrls,
      remaining: rl.remaining,
      isPublic,
      handle,
    });
  } catch (err: any) {
    console.error('carousel gen failed', err?.message, err?.responseBody || err?.cause?.message || '');
    return NextResponse.json({ error: 'generation_failed', detail: err?.message }, { status: 500 });
  }
}
