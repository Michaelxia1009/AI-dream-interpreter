import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { v4 as uuid } from 'uuid';
import { createHash } from 'node:crypto';
import { buildRateLimitKey, checkAndConsume } from '@/lib/ratelimit';
import { getStyleById } from '@/lib/styles';
import { buildVideoScenePrompt } from '@/lib/ai/scenePrompt';
import {
  DEFAULT_ASPECT_RATIO,
  DEFAULT_DURATION_SECONDS,
  DEFAULT_RESOLUTION,
  selectVideoProvider,
} from '@/lib/providers/video';
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
  /** If true, dream is persisted but NOT added to leaderboard. Defaults to true (public). */
  isPublic: z.boolean().optional().default(true),
});

function fpHashOf(fingerprint: string): string {
  return createHash('sha256').update(fingerprint).digest('hex').slice(0, 16);
}

type TimingKey =
  | 'scenePromptMs'
  | 'videoMs'
  | 'uploadMs'
  | 'totalMs';

type Timings = Partial<Record<TimingKey, number>>;

async function timeStage<T>(
  timings: Timings,
  key: TimingKey,
  fn: () => Promise<T>,
): Promise<T> {
  const start = performance.now();
  const label = `video:${key}:${Math.random().toString(36).slice(2)}`;
  console.time(label);
  try {
    return await fn();
  } finally {
    timings[key] = Math.round(performance.now() - start);
    console.timeEnd(label);
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
  const debug = req.nextUrl.searchParams.get('debug') === '1';
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

  const provider = selectVideoProvider({
    requestedId: req.nextUrl.searchParams.get('provider'),
    allowRequestOverride: debug,
    durationSeconds: DEFAULT_DURATION_SECONDS,
  });

  try {
    const scenePrompt = await timeStage(
      timings,
      'scenePromptMs',
      () => buildVideoScenePrompt(parsed.data.enrichedDream, style),
    );
    const videoBuf = await timeStage(timings, 'videoMs', () => provider.generate(scenePrompt, {
      durationSeconds: DEFAULT_DURATION_SECONDS,
      resolution: DEFAULT_RESOLUTION,
      aspectRatio: DEFAULT_ASPECT_RATIO,
    }));

    const id = uuid();
    const videoUrl = await timeStage(
      timings,
      'uploadMs',
      () => uploadArtifact(`videos/${id}/video.mp4`, videoBuf, 'video/mp4'),
    );

    // Persist the dream (best-effort — don't block the response on persistence errors)
    let isPublic = parsed.data.isPublic ?? true;
    let handle: string | null = null;
    if (parsed.data.score) {
      // Force private if moderation flagged it
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
          format: 'video',
          styleId: style.id,
          styleName: style.name,
          metrics: {
            weirdness: clampScore(parsed.data.score.metrics.weirdness),
            imagination: clampScore(parsed.data.score.metrics.imagination),
            emotionalIntensity: clampScore(parsed.data.score.metrics.emotionalIntensity),
            vividness: clampScore(parsed.data.score.metrics.vividness),
          },
          generation: {
            kind: 'video',
            videoUrl,
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
    timings.totalMs = Math.round(performance.now() - totalStart);

    return NextResponse.json({
      id,
      kind: 'video',
      videoUrl,
      remaining: rl.remaining,
      isPublic,
      handle,
      ...(debug ? {
        _provider: {
          id: provider.id,
          modelLabel: provider.modelLabel,
        },
        _timings: timings,
      } : {}),
    });
  } catch (err) {
    timings.totalMs = Math.round(performance.now() - totalStart);
    const detail = sanitizeErrorDetail(err);
    console.error('video gen failed', {
      provider: provider.id,
      modelLabel: provider.modelLabel,
      timings,
      detail,
    }, err);
    return NextResponse.json({
      error: 'generation_failed',
      detail,
      ...(debug ? {
        _provider: {
          id: provider.id,
          modelLabel: provider.modelLabel,
        },
        _timings: timings,
      } : {}),
    }, { status: 500 });
  }
}

function clampScore(m: { score: number; oneLiner: string }) {
  return {
    score: Math.max(1, Math.min(10, Math.round(m.score))),
    oneLiner: m.oneLiner.slice(0, 80),
  };
}

/**
 * Same defensive normaliser as the carousel route — keep the behaviour identical
 * so a dream's `symbols` field is shape-stable across formats.
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
