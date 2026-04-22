import Replicate from 'replicate';

let _replicate: Replicate | null = null;
function getClient() {
  if (!_replicate) _replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN! });
  return _replicate;
}

export async function generateVideo(prompt: string): Promise<Buffer> {
  const output = await getClient().run(
    'minimax/video-01-live',
    {
      input: {
        prompt,
        prompt_optimizer: true,
      },
    },
  );
  const url = typeof output === 'string'
    ? output
    : Array.isArray(output)
      ? output[0]
      : (output as unknown as string);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`video fetch failed: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}
