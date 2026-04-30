import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { v4 as uuid } from 'uuid';
import { createHash } from 'node:crypto';
import { buildRateLimitKey, checkAndConsume } from '@/lib/ratelimit';
import { getStyleById } from '@/lib/styles';
import { buildVideoScenePrompt } from '@/lib/ai/scenePrompt';
import { buildNarrationScript } from '@/lib/ai/narration';
import { generateVideo } from '@/lib/providers/video';
import { synthesizeNarration } from '@/lib/providers/tts';
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
  /** If true, dream is persisted but NOT added to leaderboard. Defaults to true (public). */
  isPublic: z.boolean().optional().default(true),
});

function fpHashOf(fingerprint: string): string {
  return createHash('sha256').update(fingerprint).digest('hex').slice(0, 16);
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
    const [scenePrompt, narration] = await Promise.all([
      buildVideoScenePrompt(parsed.data.enrichedDream, style),
      buildNarrationScript(parsed.data.enrichedDream, style),
    ]);
    const [videoBuf, audioBuf] = await Promise.all([
      generateVideo(scenePrompt),
      synthesizeNarration(narration, style.narratorVoiceId),
    ]);

    const id = uuid();
    const [videoUrl, audioUrl] = await Promise.all([
      uploadArtifact(`videos/${id}/video.mp4`, videoBuf, 'video/mp4'),
      uploadArtifact(`videos/${id}/audio.mp3`, audioBuf, 'audio/mpeg'),
    ]);

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
        const record: DreamRecord = {
          id,
          createdAt: Date.now(),
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
            audioUrl,
            narrationText: narration,
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
      kind: 'video',
      videoUrl,
      audioUrl,
      narrationText: narration,
      remaining: rl.remaining,
      isPublic,
      handle,
    });
  } catch (err) {
    console.error('video gen failed', err);
    return NextResponse.json({ error: 'generation_failed' }, { status: 500 });
  }
}

function clampScore(m: { score: number; oneLiner: string }) {
  return {
    score: Math.max(1, Math.min(10, Math.round(m.score))),
    oneLiner: m.oneLiner.slice(0, 80),
  };
}
