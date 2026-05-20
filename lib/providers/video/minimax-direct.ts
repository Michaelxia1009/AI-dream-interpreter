import {
  DEFAULT_DURATION_SECONDS,
  type VideoGenOpts,
  type VideoProvider,
} from './types';

/**
 * Direct-API MiniMax video provider (Hailuo 2.3) — used as the fallback
 * when the primary Replicate-backed video provider fails. Uses the user's
 * MINIMAX_API_KEY, not the REPLICATE_API_TOKEN, so a Replicate outage
 * doesn't take both providers down at once.
 *
 * MiniMax video is asynchronous: submit a generation task, poll for
 * completion, then download the file. This adapter returns the raw MP4
 * buffer so the caller can upload it to Vercel Blob like any other
 * provider's output.
 *
 * Reference: https://platform.minimaxi.com/document/video_generation
 */

const BASE_URL = 'https://api.minimax.io/v1';
const MODEL = 'MiniMax-Hailuo-2.3';

const POLL_INTERVAL_MS = 5_000;
const POLL_MAX_ATTEMPTS = 30;             // 30 * 5s = 150s wall-clock max wait

export const minimaxDirectProvider: VideoProvider = {
  id: 'minimax-direct',
  modelLabel: 'MiniMax Hailuo 2.3 (direct API)',
  supportsDuration: seconds => seconds >= 5 && seconds <= 10,
  generate: (scenePrompt, opts) => generateMiniMaxVideo(scenePrompt, opts ?? {}),
};

function getApiKey(): string {
  const key = process.env.MINIMAX_API_KEY;
  if (!key) throw new Error('MINIMAX_API_KEY is not set');
  return key;
}

async function generateMiniMaxVideo(
  prompt: string,
  opts: VideoGenOpts,
): Promise<Buffer> {
  const apiKey = getApiKey();
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };

  // 1. Submit
  const submitRes = await fetch(`${BASE_URL}/video_generation`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: MODEL,
      prompt,
      duration: opts.durationSeconds ?? DEFAULT_DURATION_SECONDS,
      resolution: opts.resolution === '1080p' ? '1080P' : '768P',
      prompt_optimizer: true,
    }),
  });
  if (!submitRes.ok) {
    throw new Error(`minimax submit failed: ${submitRes.status} ${(await submitRes.text()).slice(0, 200)}`);
  }
  const submitJson = await submitRes.json();
  const taskId = submitJson?.task_id;
  if (!taskId) {
    throw new Error(`minimax submit returned no task_id: ${JSON.stringify(submitJson).slice(0, 200)}`);
  }

  // 2. Poll
  let fileId: string | undefined;
  for (let attempt = 0; attempt < POLL_MAX_ATTEMPTS; attempt++) {
    await sleep(POLL_INTERVAL_MS);
    const pollRes = await fetch(
      `${BASE_URL}/query/video_generation?task_id=${encodeURIComponent(taskId)}`,
      { headers: { Authorization: `Bearer ${apiKey}` } },
    );
    if (!pollRes.ok) continue;
    const pollJson = await pollRes.json();
    const status = pollJson?.status;
    if (status === 'Success') {
      fileId = pollJson?.file_id;
      break;
    }
    if (status === 'Fail') {
      throw new Error(`minimax task failed: ${JSON.stringify(pollJson).slice(0, 200)}`);
    }
    // 'Queueing' | 'Preparing' | 'Processing' — keep polling.
  }
  if (!fileId) {
    throw new Error(`minimax task did not finish within ${(POLL_INTERVAL_MS * POLL_MAX_ATTEMPTS) / 1000}s`);
  }

  // 3. Retrieve download URL
  const fileRes = await fetch(
    `${BASE_URL}/files/retrieve?file_id=${encodeURIComponent(fileId)}`,
    { headers: { Authorization: `Bearer ${apiKey}` } },
  );
  if (!fileRes.ok) {
    throw new Error(`minimax file retrieve failed: ${fileRes.status}`);
  }
  const fileJson = await fileRes.json();
  const downloadUrl: string | undefined = fileJson?.file?.download_url;
  if (!downloadUrl) {
    throw new Error('minimax file response had no download_url');
  }

  // 4. Download MP4
  const dl = await fetch(downloadUrl);
  if (!dl.ok) {
    throw new Error(`minimax mp4 fetch failed: ${dl.status}`);
  }
  return Buffer.from(await dl.arrayBuffer());
}

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}
