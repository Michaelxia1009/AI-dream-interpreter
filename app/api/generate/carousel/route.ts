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
import { addDreamToUserIndex } from '@/lib/dreams/user-index';
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
  symbols: z.array(z.string()).optional(),
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

/**
 * Defensive normalisation in case the scoring caller forwarded raw model output.
 * The score pipeline already sanitises, but symbol tags are persisted forever
 * (well, 60 days) so we belt-and-braces clean them here too.
 */
function sanitizeSymbolsForPersist(raw: string[] | undefined): string[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of raw) {
    if (typeof item !== 'string') continue;
    const cleaned = item.toLowerCase().trim().replace(/[^a-z\-]/g, '').replace(/^-+|-+$/g, '').slice(0, 24);
    if (cleaned.length < 2 || seen.has(cleaned)) continue;
    seen.add(cleaned);
    out.push(cleaned);
    if (out.length >= 8) break;
  }
  return out.length ? out : undefined;
}

function dreamTypeFromEnrichedDream(text: string): DreamRecord['dreamType'] {
  const match = text.match(/^DREAM TYPE:\s*(normal|nightmare|recurring|prophetic)$/m);
  return match?.[1] as DreamRecord['dreamType'] | undefined;
}

type TimingKey = 'promptMs' | 'imageMs' | 'zipMs' | 'uploadMs' | 'totalMs';
type Timings = Partial<Record<TimingKey, number>>;

async function timeStage<T>(
  timings: Timings,
  key: TimingKey,
  fn: () => Promise<T>,
): Promise<T> {
  const start = performance.now();
  try {
    return await fn();
  } finally {
    timings[key] = Math.round(performance.now() - start);
  }
}

function sanitizeErrorDetail(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err || 'unknown');
  return raw
    .replace(/r8_[A-Za-z0-9_-]+/g, '[redacted-token]')
    .replace(/sk_[A-Za-z0-9_-]+/g, '[redacted-key]')
    .slice(0, 240);
}

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'bad body' }, { status: 400 });
  const timings: Timings = {};
  const totalStart = performance.now();

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
    const prompts = await timeStage(timings, 'promptMs', () =>
      buildCarouselPrompts(parsed.data.enrichedDream, style),
    );
    const images = await timeStage(timings, 'imageMs', () => generateImages(prompts));

    const zip = new JSZip();
    images.forEach((img, i) => zip.file(`dream-${i + 1}.jpg`, img));
    const zipBuffer = await timeStage(timings, 'zipMs', async () =>
      Buffer.from(await zip.generateAsync({ type: 'nodebuffer' })),
    );

    const id = uuid();
    const [zipUrl, imageUrls] = await timeStage(
      timings,
      'uploadMs',
      () => Promise.all([
        uploadArtifact(`carousels/${id}.zip`, zipBuffer, 'application/zip'),
        Promise.all(
          images.map((img, i) =>
            uploadArtifact(`carousels/${id}/image-${i + 1}.jpg`, img, 'image/jpeg'),
          ),
        ),
      ]),
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
        const createdAt = Date.now();
        const record: DreamRecord = {
          id,
          createdAt,
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
          dreamType: dreamTypeFromEnrichedDream(parsed.data.enrichedDream),
          symbols: sanitizeSymbolsForPersist(parsed.data.score.symbols),
        };
        await persistDream(record);
        // Index for /patterns regardless of public/private — Patterns is private to the dreamer.
        await addDreamToUserIndex(fpHash, id, createdAt);
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
  } catch (err) {
    timings.totalMs = Math.round(performance.now() - totalStart);
    const message = sanitizeErrorDetail(err);
    const cause = err instanceof Error && err.cause instanceof Error ? err.cause.message : '';
    console.error('carousel gen failed', { detail: message, cause, timings }, err);
    return NextResponse.json({ error: 'generation_failed', detail: message }, { status: 500 });
  }
}
