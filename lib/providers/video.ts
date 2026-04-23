import Replicate from 'replicate';

let _replicate: Replicate | null = null;
function getClient() {
  if (!_replicate) _replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN! });
  return _replicate;
}

export async function generateVideo(prompt: string): Promise<Buffer> {
  const output = await getClient().run(
    'minimax/hailuo-2.3',
    {
      input: {
        prompt,
        duration: 10,
        resolution: '768p',
        prompt_optimizer: true,
      },
    },
  );

  // Replicate SDK v1.4+ returns FileOutput objects with a .url() method,
  // or may return a string URL depending on the model.
  let url: string;
  if (output && typeof output === 'object' && 'url' in output && typeof (output as { url: () => string }).url === 'function') {
    url = (output as { url: () => string }).url();
  } else if (typeof output === 'string') {
    url = output;
  } else {
    throw new Error(`Unexpected Replicate output format: ${typeof output}`);
  }

  const res = await fetch(url);
  if (!res.ok) throw new Error(`video fetch failed: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}
