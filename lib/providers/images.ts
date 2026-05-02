import Replicate from 'replicate';

const IMAGE_MODEL = 'black-forest-labs/flux-1.1-pro';
const IMAGE_REQUEST_SPACING_MS = 1200;
const RATE_LIMIT_RETRY_DELAYS_MS = [15_000, 30_000, 45_000];

let _replicate: Replicate | null = null;
function getClient() {
  if (!_replicate) _replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN! });
  return _replicate;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isReplicateRateLimitError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err ?? '');
  return message.includes('status 429')
    || message.includes('Too Many Requests')
    || message.includes('Request was throttled');
}

function rateLimitError(err: unknown): Error {
  return new Error(
    'Replicate image generation is rate-limited right now. Please wait about a minute and try again.',
    { cause: err },
  );
}

async function generateImageOnce(prompt: string): Promise<Buffer> {
  const output = await getClient().run(
    IMAGE_MODEL,
    {
      input: {
        prompt,
        aspect_ratio: '9:16',
        output_format: 'jpg',
        output_quality: 90,
        safety_tolerance: 5,
      },
    },
  );
  // Replicate SDK v1.4+ returns FileOutput objects with a .url() method
  let url: string;
  const val = Array.isArray(output) ? output[0] : output;
  if (val && typeof val === 'object' && 'url' in val && typeof (val as { url: () => string }).url === 'function') {
    url = (val as { url: () => string }).url();
  } else if (typeof val === 'string') {
    url = val;
  } else {
    throw new Error(`Unexpected Replicate output format: ${typeof val}`);
  }

  const res = await fetch(url);
  if (!res.ok) throw new Error(`image fetch failed: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

export async function generateImage(prompt: string): Promise<Buffer> {
  for (let attempt = 0; attempt <= RATE_LIMIT_RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      return await generateImageOnce(prompt);
    } catch (err) {
      if (!isReplicateRateLimitError(err)) throw err;
      const retryDelay = RATE_LIMIT_RETRY_DELAYS_MS[attempt];
      if (retryDelay === undefined) throw rateLimitError(err);
      console.warn('Replicate image generation throttled; retrying after backoff', {
        model: IMAGE_MODEL,
        attempt: attempt + 1,
        retryDelayMs: retryDelay,
      });
      await sleep(retryDelay);
    }
  }

  throw rateLimitError(new Error('unreachable retry state'));
}

export async function generateImages(prompts: string[]): Promise<Buffer[]> {
  const images: Buffer[] = [];
  for (const [index, prompt] of prompts.entries()) {
    if (index > 0) await sleep(IMAGE_REQUEST_SPACING_MS);
    images.push(await generateImage(prompt));
  }
  return images;
}
