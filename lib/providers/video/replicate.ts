import Replicate from 'replicate';

let replicate: Replicate | null = null;

function getClient() {
  if (!replicate) {
    replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN! });
  }
  return replicate;
}

export function compactInput(input: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  );
}

export async function runReplicateModel(
  model: `${string}/${string}`,
  input: Record<string, unknown>,
): Promise<Buffer> {
  const output = await getClient().run(model, { input });
  const url = extractOutputUrl(output);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`video fetch failed: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

function extractOutputUrl(output: unknown): string {
  if (typeof output === 'string') return output;

  if (Array.isArray(output)) {
    for (const item of output) {
      try {
        return extractOutputUrl(item);
      } catch {
        // Keep scanning; Replicate models sometimes return arrays with metadata.
      }
    }
  }

  if (output && typeof output === 'object') {
    const maybeUrl = (output as { url?: unknown }).url;
    if (typeof maybeUrl === 'function') {
      const url = maybeUrl.call(output);
      if (typeof url === 'string') return url;
      if (url instanceof URL) return url.toString();
    }
    if (typeof maybeUrl === 'string') return maybeUrl;

    for (const key of ['video', 'output', 'file']) {
      const value = (output as Record<string, unknown>)[key];
      if (typeof value === 'string') return value;
      if (value && typeof value === 'object') {
        try {
          return extractOutputUrl(value);
        } catch {
          // Try the next likely field.
        }
      }
    }
  }

  throw new Error(`Unexpected Replicate output format: ${typeof output}`);
}
