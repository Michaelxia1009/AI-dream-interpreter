import Replicate from 'replicate';

let _replicate: Replicate | null = null;
function getClient() {
  if (!_replicate) _replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN! });
  return _replicate;
}

export async function generateImage(prompt: string): Promise<Buffer> {
  const output = await getClient().run(
    'black-forest-labs/flux-1.1-pro',
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
  const url = Array.isArray(output) ? output[0] : (output as unknown as string);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`image fetch failed: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

export async function generateImages(prompts: string[]): Promise<Buffer[]> {
  return Promise.all(prompts.map(generateImage));
}
