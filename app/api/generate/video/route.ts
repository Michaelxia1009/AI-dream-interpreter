import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { v4 as uuid } from 'uuid';
import { buildRateLimitKey, checkAndConsume } from '@/lib/ratelimit';
import { getStyleById } from '@/lib/styles';
import { buildVideoScenePrompt } from '@/lib/ai/scenePrompt';
import { buildNarrationScript } from '@/lib/ai/narration';
import { generateVideo } from '@/lib/providers/video';
import { synthesizeNarration } from '@/lib/providers/tts';
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

    return NextResponse.json({
      id,
      kind: 'video',
      videoUrl,
      audioUrl,
      narrationText: narration,
      remaining: rl.remaining,
    });
  } catch (err) {
    console.error('video gen failed', err);
    return NextResponse.json({ error: 'generation_failed' }, { status: 500 });
  }
}
